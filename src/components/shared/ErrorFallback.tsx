import { ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showHome?: boolean;
  children?: ReactNode;
  error?: Error;
}

export function ErrorFallback({
  title = "문제가 발생했습니다",
  description = "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
  showHome = true,
  children,
  error,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-left dark:border-red-900 dark:bg-red-900/10">
            <p className="mb-1 font-semibold text-xs text-red-900 dark:text-red-300">
              Error Details (Development):
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {children}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              size="default"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              다시 시도
            </Button>
          )}

          {showHome && (
            <Button asChild variant="outline" size="default" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                홈으로
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
