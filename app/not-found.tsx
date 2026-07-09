"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <h2 className="text-2xl font-semibold text-gray-600">Page Not Found</h2>
            <p className="text-gray-500 max-w-md">
                The page you are looking for does not exist or has been moved.
            </p>
            <Link
                href="/dashboard"
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
                Go to Dashboard
            </Link>
        </div>
    );
}
