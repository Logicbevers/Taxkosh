/**
 * TaxKosh Monitoring Wrapper
 *
 * Sentry is wired via instrumentation.ts (server/edge) and
 * instrumentation-client.ts (browser). It auto-enables when SENTRY_DSN /
 * NEXT_PUBLIC_SENTRY_DSN are set; otherwise Sentry.* calls are safe no-ops and
 * we keep the structured console fallback below.
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

interface TrackEventProps {
    [key: string]: unknown;
}

class Monitoring {
    private static instance: Monitoring;
    private isProd: boolean;

    private constructor() {
        this.isProd = process.env.NODE_ENV === "production";
    }

    public static getInstance(): Monitoring {
        if (!Monitoring.instance) {
            Monitoring.instance = new Monitoring();
        }
        return Monitoring.instance;
    }

    public trackEvent(eventName: string, properties?: TrackEventProps) {
        if (!this.isProd) {
            console.debug(`[Dev-Analytics] ${eventName}`, properties);
        }
        // TODO: Sentry.addBreadcrumb({ message: eventName, data: properties });
        // TODO: PostHog.capture(eventName, properties);
    }

    public captureException(error: Error, context?: Record<string, unknown>) {
        // Report to Sentry (no-op when DSN is unset).
        Sentry.captureException(error, context ? { extra: context } : undefined);

        if (!this.isProd) {
            console.error("[Dev-Error]", error, context);
            return;
        }
        // Fallback: write to stderr so log aggregation picks it up even if
        // Sentry is off.
        console.error(
            JSON.stringify({
                level: "error",
                message: error.message,
                stack: error.stack,
                context,
                ts: new Date().toISOString(),
            })
        );
    }

    public log(message: string, level: LogLevel = "info", data?: unknown) {
        if (!this.isProd) {
            const prefix = `[Dev-Log] [${level.toUpperCase()}]`;
            if (level === "error") console.error(prefix, message, data);
            else if (level === "warn") console.warn(prefix, message, data);
            else console.log(prefix, message, data);
            return;
        }
        // Structured JSON output — picked up by Vercel/CloudWatch log aggregators
        console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
            JSON.stringify({ level, message, data, ts: new Date().toISOString() })
        );
    }
}

export const monitoring = Monitoring.getInstance();
