import { NextResponse } from "next/server";

/**
 * Rate limiter with two backends:
 *  - Upstash Redis (REST, edge-safe) when UPSTASH_REDIS_REST_URL/TOKEN are set —
 *    limits are then GLOBAL across all serverless instances.
 *  - In-memory Map otherwise (dev / before Upstash is configured) — limits are
 *    per-instance only, which is fine at low traffic.
 *
 * On Redis errors we FAIL OPEN: a rate-limiter outage must never take auth or
 * uploads down with it.
 */
const cache = new Map<string, { count: number; expires: number }>();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

type RateLimitResult = { success: boolean; remaining: number };

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
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

async function upstashRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    // Fixed-window counter: INCR the key, set its expiry only on first hit.
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify([
            ["INCR", key],
            ["PEXPIRE", key, windowMs, "NX"],
        ]),
        // Rate limiting must be fast — don't let a slow Redis stall requests.
        signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const data = (await res.json()) as { result: number }[];
    const count = Number(data[0]?.result ?? 0);
    return { success: count <= limit, remaining: Math.max(0, limit - count) };
}

export async function rateLimit(
    ip: string,
    limit: number = 10,
    windowMs: number = 60000,
    scope: string = "global"
): Promise<RateLimitResult> {
    const key = `rl:${scope}:${ip}`;

    if (UPSTASH_URL && UPSTASH_TOKEN) {
        try {
            return await upstashRateLimit(key, limit, windowMs);
        } catch (err) {
            console.error("Rate limiter (Upstash) failed — failing open:", err);
            return { success: true, remaining: limit };
        }
    }
    return memoryRateLimit(key, limit, windowMs);
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
