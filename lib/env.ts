/**
 * Validates environment variables at startup (imported by lib/prisma.ts, so it
 * runs on every server entry point).
 *
 * Two tiers:
 *  - REQUIRED_VARS are genuinely fatal — the app cannot function without them.
 *  - OPTIONAL_INTEGRATIONS all have graceful fallbacks (Razorpay → demo checkout,
 *    S3 → local-disk storage, Resend → simulated emails), so missing values log
 *    a prominent warning instead of crashing the build/boot. This keeps `next
 *    build` and preview deploys working before third-party keys are wired in.
 */

const REQUIRED_VARS = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "ENCRYPTION_KEY",
] as const;

const OPTIONAL_INTEGRATIONS: Record<string, string[]> = {
    "Email (falls back to simulated sends)": ["RESEND_API_KEY"],
    "Razorpay (falls back to demo checkout)": [
        "RAZORPAY_KEY_ID",
        "RAZORPAY_KEY_SECRET",
        "RAZORPAY_WEBHOOK_SECRET",
    ],
    "S3 (falls back to local-disk storage)": [
        "AWS_REGION",
        "AWS_S3_BUCKET_NAME",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
    ],
};

function validateEnv() {
    const missing: string[] = [];

    for (const key of REQUIRED_VARS) {
        if (!process.env[key]) missing.push(key);
    }

    if (process.env.NODE_ENV === "production") {
        // Reject placeholder secrets — these are fatal misconfigurations.
        if (process.env.AUTH_SECRET?.startsWith("your-secret")) {
            missing.push("AUTH_SECRET (must not be a placeholder)");
        }
        if ((process.env.ENCRYPTION_KEY?.length ?? 0) < 32) {
            missing.push("ENCRYPTION_KEY (must be at least 32 characters)");
        }

        // Optional integrations: warn loudly, never crash.
        for (const [label, keys] of Object.entries(OPTIONAL_INTEGRATIONS)) {
            const absent = keys.filter((k) => !process.env[k]);
            if (absent.length > 0) {
                console.warn(
                    `[env] ${label} not configured — missing: ${absent.join(", ")}`
                );
            }
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing or invalid required environment variables:\n  - ${missing.join("\n  - ")}\n\nSee .env.example for reference.`
        );
    }
}

// Run immediately on module load (server-side only)
if (typeof window === "undefined") {
    validateEnv();
}
