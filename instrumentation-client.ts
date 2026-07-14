import * as Sentry from "@sentry/nextjs";

/**
 * Browser Sentry init. Runs early on the client. Graceful: with no
 * NEXT_PUBLIC_SENTRY_DSN set, Sentry stays off and this is a no-op.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
    Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    });
}

// Lets Sentry trace client-side navigations. No-op when not initialized.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
