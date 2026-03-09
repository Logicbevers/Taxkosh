import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { rateLimit, injectSecurityHeaders } from "@/lib/middleware-utils";

// Routes that require authentication
const protectedRoutes = ["/dashboard"];
// Routes only for unauthenticated users
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const isAuthenticated = !!req.auth;
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1";

    // Rate limiting for sensitive routes
    if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/documents/upload")) {
        const { success } = rateLimit(ip, 5, 60000); // 5 requests per minute
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

        // RBAC Enforcement
        if (pathname.startsWith("/dashboard/admin")) {
            const adminRoles = ["ADMIN", "TAX_EXECUTIVE", "SENIOR_REVIEWER"];
            if (!adminRoles.includes(userRole as string)) {
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
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
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    const res = NextResponse.next();
    return injectSecurityHeaders(res);
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
    ],
};
