/**
 * TaxKosh Monitoring Wrapper
 *
 * To activate real Sentry error tracking:
 *   1. npm install @sentry/nextjs
 *   2. Run: npx @sentry/wizard@latest -i nextjs
 *   3. Set SENTRY_DSN env var
 *   4. Uncomment the Sentry calls below and remove console fallbacks
 */

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
        if (!this.isProd) {
            console.error("[Dev-Error]", error, context);
            return;
        }
        // TODO: Sentry.captureException(error, { extra: context });
        // Fallback: write to stderr so log aggregation picks it up
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
