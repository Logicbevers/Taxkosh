import * as Sentry from "@sentry/nextjs";

/**
 * Server + edge Sentry init. Runs once per runtime at boot. Graceful: with no
 * SENTRY_DSN set, Sentry stays completely off and this is a no-op — the app
 * behaves exactly as before.
 */
export async function register() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return;

    if (
        process.env.NEXT_RUNTIME === "nodejs" ||
        process.env.NEXT_RUNTIME === "edge"
    ) {
        Sentry.init({
            dsn,
            // Modest tracing by default; tune once volume is known.
            tracesSampleRate: 0.1,
            environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
        });
    }
}

// Automatically report errors thrown in server components, route handlers, and
// server actions. No-op when Sentry isn't initialized.
export const onRequestError = Sentry.captureRequestError;
