import { NextResponse } from "next/server";

// Simple memory-based rate limiter for demonstration/small scale
// For production, use Redis (e.g. @upstash/ratelimit)
const cache = new Map<string, { count: number; expires: number }>();

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
    const now = Date.now();
    const key = `rl:${ip}`;

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
    // Basic CSP (expand as needed for external scripts)
    res.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self';");

    return res;
}
