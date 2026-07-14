"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Report to Sentry (no-op when not configured); keep a console trace too.
        Sentry.captureException(error);
        console.error("Unhandled application error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
            <h1 className="text-4xl font-bold text-gray-800">Something went wrong</h1>
            <p className="text-gray-500 max-w-md">
                An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            {error.digest && (
                <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
            )}
            <button
                onClick={reset}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
                Try Again
            </button>
        </div>
    );
}
