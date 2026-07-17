import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { rateLimit, injectSecurityHeaders } from "@/lib/middleware-utils";

// Routes that require authentication
const protectedRoutes = ["/dashboard"];
// Routes only for unauthenticated users
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/resend-verification"];

/**
 * Per-IP budget (requests/minute) for endpoints that have no guard of their own.
 * Returns null when a request needs no limit here.
 *
 * Only POSTs are limited. GET /api/auth/session is deliberately exempt: SessionProvider
 * polls it on every page load and window focus — several times per mount — so budgeting
 * it would 429 ordinary users out of their own session.
 *
 * Endpoints intentionally absent because they already self-limit — adding them here
 * double-counts against the same Upstash key and silently halves the real budget:
 *   /api/register        → 5/hour   (register/route.ts)
 *   /api/forgot-password → 5/15min  (forgot-password/route.ts)
 *   /api/auth/phone/send-otp → per-user OTP window (send-otp/route.ts)
 */
function rateLimitBucket(pathname: string, method: string): { scope: string; limit: number } | null {
    if (method !== "POST") return null;

    // next-auth posts credentials to /api/auth/callback/<provider>. Nothing else guards
    // this, so it was the one genuinely open door to password guessing.
    if (pathname.startsWith("/api/auth/callback") || pathname.startsWith("/api/auth/signin")) {
        return { scope: "signin", limit: 5 };
    }
    // Guesses a reset token; the route does not throttle.
    if (pathname === "/api/reset-password") return { scope: "reset-password", limit: 5 };
    // One upload per required document, plus re-uploads — the old 5/min would have
    // 429'd a normal 4-document checkout the moment someone replaced a file.
    if (pathname === "/api/documents/upload") return { scope: "upload", limit: 20 };

    return null;
}

export default auth(async (req) => {
    const { pathname } = req.nextUrl;
    const isAuthenticated = !!req.auth;
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1";

    // Rate limiting for sensitive routes
    const bucket = rateLimitBucket(pathname, req.method);
    if (bucket) {
        const { success } = await rateLimit(ip, bucket.limit, 60000, bucket.scope);
        if (!success) {
            return new NextResponse("Too many requests. Please try again later.", { status: 429 });
        }
    }

    // Auth logic
    if (protectedRoutes.some((r) => pathname.startsWith(r))) {
        if (!isAuthenticated) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        const userRole = req.auth?.user?.role;

        // RBAC Enforcement - Strictly ADMIN for MVP ops
        if (pathname.startsWith("/dashboard/admin") && userRole !== "ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        if (pathname.startsWith("/dashboard/business") && userRole !== "BUSINESS" && userRole !== "ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        if (pathname.startsWith("/dashboard/individual") && userRole !== "INDIVIDUAL" && userRole !== "ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        if (pathname.startsWith("/dashboard/ca") && userRole !== "CA" && userRole !== "ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
    }

    if (authRoutes.some((r) => pathname.startsWith(r))) {
        if (isAuthenticated) {
            // Already signed in — send them to the browsable home page, not the dashboard.
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    const res = NextResponse.next();
    return injectSecurityHeaders(res);
});

export const config = {
    matcher: [
        // Page routes. The leading `api` in this negative lookahead excludes every API
        // route, which is what silently disabled the rate limiter above — it was dead
        // code. The entries below opt the abusable endpoints back in; everything else
        // under /api stays out, so normal API traffic pays no middleware cost.
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
        "/api/auth/:path*",
        "/api/documents/upload",
        "/api/reset-password",
    ],
};
