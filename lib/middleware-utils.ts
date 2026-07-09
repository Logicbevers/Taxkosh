import { NextResponse } from "next/server";

// Simple memory-based rate limiter for demonstration/small scale
// For production, use Redis (e.g. @upstash/ratelimit)
const cache = new Map<string, { count: number; expires: number }>();

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000, scope: string = "global") {
    const now = Date.now();
    const key = `rl:${scope}:${ip}`;

    const record = cache.get(key);

    if (!record || now > record.expires) {
        cache.set(key, { count: 1, expires: now + windowMs });
        return { success: true, remaining: limit - 1 };
    }

    if (record.count >= limit) {
        return { success: false, remaining: 0 };
    }

    record.count += 1;
    return { success: true, remaining: limit - record.count };
}

export function injectSecurityHeaders(res: NextResponse) {
    // HSTS
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    // Prevent Clickjacking
    res.headers.set("X-Frame-Options", "DENY");
    // Prevent MIME sniffing
    res.headers.set("X-Content-Type-Options", "nosniff");
    // Referrer Policy
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    // Next.js App Router requires 'unsafe-inline' for hydration bootstrap and 'unsafe-eval' for
    // dev mode Fast Refresh. To eliminate these, implement a nonce-based CSP via middleware
    // (see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy).
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
        ? "'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com"
        : "'self' 'unsafe-inline' https://checkout.razorpay.com";
    res.headers.set(
        "Content-Security-Policy",
        `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https://lumberjack-metrics.razorpay.com https://api.razorpay.com; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com;`
    );

    return res;
}
