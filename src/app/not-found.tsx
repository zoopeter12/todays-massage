import Link from "next/link";
import { MapPin, Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-2xl px-4 py-16 text-center">
        <div className="relative mb-8 flex justify-center">
          <div className="relative">
            <MapPin className="h-32 w-32 text-pink-500 opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-bold text-pink-500">?</span>
            </div>
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          페이지를 찾을 수 없습니다
        </h1>

        <p className="mb-8 text-lg text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
          <br />
          주소를 다시 확인해주세요.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/search">
              <Search className="h-4 w-4" />
              검색해보기
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>도움이 필요하신가요?</p>
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
