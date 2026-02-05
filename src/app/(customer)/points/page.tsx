'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  Gift,
  CalendarClock,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { fetchPointBalance, fetchPointHistory } from '@/lib/api/points';
import { useAuth } from '@/hooks/useAuth';
import type { PointHistory, PointType } from '@/types/points';

export default function PointsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/points');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['pointBalance', user?.id],
    queryFn: () => fetchPointBalance(user!.id),
    enabled: !!user,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['pointHistory', user?.id, page],
    queryFn: () => fetchPointHistory(user!.id, page, LIMIT),
    enabled: !!user,
  });

  const getTypeConfig = (type: PointType) => {
    switch (type) {
      case 'earn':
        return {
          icon: ArrowUpCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: '적립',
        };
      case 'use':
        return {
          icon: ArrowDownCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: '사용',
        };
      case 'expire':
        return {
          icon: XCircle,
          color: 'text-gray-500',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: '만료',
        };
      case 'bonus':
        return {
          icon: Gift,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          label: '보너스',
        };
      default:
        return {
          icon: Coins,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: '기타',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 인증 로딩 중이거나 비로그인 상태일 때 로딩 스피너 표시
  if (authLoading || !isAuthenticated || balanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">포인트</h1>
          <p className="text-gray-600">적립하고 사용하는 나만의 혜택</p>
        </div>

        {/* 보유 포인트 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="text-white/80 text-sm font-medium">보유 포인트</div>
                <div className="text-4xl font-bold tracking-tight">
                  {balance?.available.toLocaleString() || 0}
                  <span className="text-2xl ml-1">P</span>
                </div>
              </div>
            </div>

            {/* 포인트 통계 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs text-white/80">적립</span>
                </div>
                <div className="text-lg font-bold">
                  {balance?.total_earned.toLocaleString() || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-xs text-white/80">사용</span>
                </div>
                <div className="text-lg font-bold">
                  {balance?.total_used.toLocaleString() || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs text-white/80">만료</span>
                </div>
                <div className="text-lg font-bold">
                  {balance?.total_expired.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 포인트 안내 */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1 text-sm text-blue-900">
            <div className="font-semibold">포인트 적립 혜택</div>
            <ul className="space-y-0.5 text-blue-700">
              <li>예약 완료 시 결제 금액의 5% 자동 적립</li>
              <li>적립된 포인트는 다음 예약 시 사용 가능</li>
              <li>포인트는 적립일로부터 12개월 후 자동 만료</li>
            </ul>
          </div>
        </div>

        {/* 포인트 내역 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">포인트 내역</h2>
            {historyData?.data && historyData.data.length > 0 && (
              <span className="text-sm text-gray-500">
                총 {historyData.data.length}건
              </span>
            )}
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : historyData && historyData.data.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {historyData.data.map((item, index) => {
                  const config = getTypeConfig(item.type);
                  const Icon = config.icon;
                  const isPositive = item.amount > 0;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-2xl border ${config.border} ${config.bg}
                        hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-11 h-11 rounded-xl
                          ${config.bg} border ${config.border}`}
                        >
                          <Icon className={`w-5.5 h-5.5 ${config.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                              ${config.bg} ${config.color} border ${config.border}`}
                            >
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-medium text-gray-900 truncate">
                            {item.description}
                          </div>
                          {item.expired_at && item.type === 'earn' && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                              <CalendarClock className="w-3.5 h-3.5" />
                              <span>
                                {new Date(item.expired_at).toLocaleDateString('ko-KR')} 만료
                              </span>
                            </div>
                          )}
                        </div>

                        <div className={`text-right flex-shrink-0 ${config.color}`}>
                          <div className="text-lg font-bold">
                            {isPositive ? '+' : ''}
                            {item.amount.toLocaleString()}
                          </div>
                          <div className="text-xs opacity-80">P</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* 페이지네이션 */}
              {historyData.hasMore && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="w-full py-3 rounded-xl bg-white border-2 border-gray-200
                    hover:border-amber-300 hover:bg-amber-50 text-gray-700 hover:text-amber-700
                    font-medium transition-all duration-200 active:scale-95"
                >
                  더 보기
                </button>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center space-y-4"
            >
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-gray-100">
                <Sparkles className="w-10 h-10 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="text-lg font-semibold text-gray-900">
                  아직 포인트 내역이 없어요
                </div>
                <div className="text-sm text-gray-600">
                  예약을 완료하고 첫 포인트를 적립해보세요!
                </div>
              </div>
              <button
                onClick={() => router.push('/search')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600
                text-white font-semibold transition-colors active:scale-95"
              >
                예약하러 가기
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
