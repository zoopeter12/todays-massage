'use client';

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <div className="max-w-md px-4 py-16 text-center">
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-red-200 dark:bg-red-800 p-6">
                <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-300" />
              </div>
            </div>

            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              Critical Error
            </h1>

            <p className="mb-8 text-lg text-gray-700 dark:text-gray-300">
              A critical error has occurred. Please refresh the page.
            </p>

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 rounded-lg border border-red-300 bg-white p-4 text-left dark:border-red-700 dark:bg-red-950">
                <p className="mb-2 font-semibold text-sm text-red-900 dark:text-red-200">
                  Error Details (Development):
                </p>
                <p className="text-xs text-red-800 dark:text-red-300 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-red-700 dark:text-red-400">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
