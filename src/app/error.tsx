'use client';

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-2xl px-4 py-16 text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          문제가 발생했습니다
        </h1>

        <p className="mb-8 text-lg text-muted-foreground">
          일시적인 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-900 dark:bg-red-900/10">
            <p className="mb-2 font-semibold text-sm text-red-900 dark:text-red-300">
              Error Details (Development Only):
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-500">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            size="lg"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            다시 시도
          </Button>

          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>문제가 계속되면</p>
          <p className="mt-1">
            <Link href="/" className="text-pink-500 hover:underline">
              고객센터
            </Link>
            로 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
