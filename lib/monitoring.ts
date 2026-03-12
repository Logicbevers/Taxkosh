/**
 * TaxKosh Monitoring & Analytics Wrapper
 * Mocks Sentry and PostHog for Phase 14 Production Readiness.
 */

type LogLevel = "info" | "warn" | "error";

interface TrackEventProps {
    [key: string]: any;
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

    /**
     * Track user events (PostHog-like)
     */
    public trackEvent(eventName: string, properties?: TrackEventProps) {
        if (this.isProd) {
            // Simulated PostHog call
            console.log(`[Analytics] Tracked: ${eventName}`, properties);
        } else {
            console.debug(`[Dev-Analytics] ${eventName}`, properties);
        }
    }

    /**
     * Capture exceptions (Sentry-like)
     */
    public captureException(error: Error, context?: Record<string, any>) {
        const timestamp = new Date().toISOString();
        if (this.isProd) {
            // Simulated Sentry call
            console.error(`[Sentry-Capture] [${timestamp}]`, error.message, context);
        } else {
            console.error(`[Dev-Error] [${timestamp}]`, error, context);
        }
    }

    /**
     * Log breadcrumbs or generic info
     */
    public log(message: string, level: LogLevel = "info", data?: any) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[Log] [${timestamp}] [${level.toUpperCase()}]`;

        switch (level) {
            case "error":
                console.error(prefix, message, data);
                break;
            case "warn":
                console.warn(prefix, message, data);
                break;
            default:
                console.log(prefix, message, data);
        }
    }
}

export const monitoring = Monitoring.getInstance();
