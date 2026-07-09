/**
 * Validates required environment variables at startup.
 * Import this at the top of lib/auth.ts or any server entry point.
 */

const REQUIRED_VARS = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "ENCRYPTION_KEY",
] as const;

const PRODUCTION_REQUIRED_VARS = [
    "RESEND_API_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "AWS_REGION",
    "AWS_S3_BUCKET_NAME",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
] as const;

function validateEnv() {
    const missing: string[] = [];

    for (const key of REQUIRED_VARS) {
        if (!process.env[key]) missing.push(key);
    }

    if (process.env.NODE_ENV === "production") {
        for (const key of PRODUCTION_REQUIRED_VARS) {
            if (!process.env[key]) missing.push(key);
        }
        // Reject placeholder AUTH_SECRET
        if (process.env.AUTH_SECRET?.startsWith("your-secret")) {
            missing.push("AUTH_SECRET (must not be a placeholder)");
        }
        if ((process.env.ENCRYPTION_KEY?.length ?? 0) < 32) {
            missing.push("ENCRYPTION_KEY (must be at least 32 characters)");
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
