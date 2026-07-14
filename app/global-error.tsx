"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Root-level error boundary — catches errors thrown in the root layout itself
 * (where the normal app/error.tsx can't render). Reports to Sentry (no-op when
 * Sentry isn't configured) and shows a minimal, self-contained fallback.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    fontFamily: "system-ui, sans-serif",
                    textAlign: "center",
                    padding: "1rem",
                }}
            >
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Something went wrong</h1>
                <p style={{ color: "#6b7280", maxWidth: "28rem" }}>
                    An unexpected error occurred. Please try again or contact support if the
                    problem persists.
                </p>
                {error.digest && (
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Error ID: {error.digest}</p>
                )}
                <button
                    onClick={reset}
                    style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem 1.5rem",
                        background: "#1a6b52",
                        color: "#fff",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                    }}
                >
                    Try again
                </button>
            </body>
        </html>
    );
}
