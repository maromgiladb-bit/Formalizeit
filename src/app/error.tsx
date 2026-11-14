"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Route-level error boundary. Without this, an uncaught throw anywhere in the
 * app renders Next's unbranded default screen and nothing is reported.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white font-sans flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-4">
          Something went wrong
        </p>
        <h1 className="text-3xl font-extrabold text-ink mb-3">We hit a snag</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          This one is on us, not on you. Try again, and if it keeps happening
          get in touch and we&apos;ll sort it out.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-ink font-semibold rounded-lg transition-colors duration-200 text-sm"
          >
            Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-gray-400">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
