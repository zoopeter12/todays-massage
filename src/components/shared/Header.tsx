"use client";

import Link from "next/link";
import { Bell, Search, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { isAuthenticated, isLoading, profile } = useAuth();

  // 프로필 이니셜 계산 (번호 끝 4자리 또는 닉네임 첫글자)
  const getInitials = () => {
    // 전화번호가 있으면 끝 4자리 표시
    if (profile?.phone) {
      const cleaned = profile.phone.replace(/\D/g, '');
      if (cleaned.length >= 4) {
        return cleaned.slice(-4);
      }
    }
    // 닉네임이 있으면 첫글자
    if (profile?.nickname) {
      return profile.nickname.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between px-4 h-14 max-w-screen-sm mx-auto">
        {/* 로고 영역 */}
        <Link href="/">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              오늘의마사지
            </h1>
          </motion.div>
        </Link>

        {/* 액션 버튼 영역 */}
        <div className="flex items-center gap-1">
          {/* 검색 버튼 - 항상 표시 */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="검색"
            asChild
          >
            <Link href="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          {isLoading ? (
            // 로딩 중일 때 스켈레톤 표시
            <div className="flex items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
            </div>
          ) : isAuthenticated ? (
            // 로그인 상태
            <>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-600 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="알림"
                asChild
              >
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {/* 알림 뱃지 */}
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 transition-colors"
                aria-label="프로필"
                asChild
              >
                <Link href="/mypage">
                  <Avatar className="h-8 w-8 ring-2 ring-gray-100 hover:ring-primary/30 transition-all">
                    <AvatarImage src={profile?.avatar_url || ""} alt="프로필" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-sm font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </Button>
            </>
          ) : (
            // 비로그인 상태
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-primary hover:bg-primary/10 transition-colors gap-1.5"
              asChild
            >
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span className="text-sm font-medium">로그인</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
