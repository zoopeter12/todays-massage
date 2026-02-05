'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  Flame,
  Trophy,
  Coins,
  Calendar,
  Sparkles,
  PartyPopper,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { StreakProgress } from '@/components/attendance/StreakProgress';
import {
  checkAttendance,
  fetchMonthlyAttendance,
  fetchAttendanceStats,
  hasCheckedToday,
} from '@/lib/api/attendance';
import { BASE_ATTENDANCE_POINTS } from '@/types/attendance';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/attendance');
    }
  }, [isAuthenticated, isLoading, router]);
  const queryClient = useQueryClient();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    streakDays: number;
    totalPoints: number;
    bonusPoints: number;
    message: string;
  } | null>(null);

  // 출석 통계 조회
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['attendanceStats', user?.id],
    queryFn: () => fetchAttendanceStats(user!.id),
    enabled: !!user,
  });

  // 월별 출석 현황 조회
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthlyAttendance', user?.id, selectedYear, selectedMonth],
    queryFn: () => fetchMonthlyAttendance(user!.id, selectedYear, selectedMonth),
    enabled: !!user,
  });

  // 오늘 출석 여부 확인
  const { data: isCheckedToday } = useQuery({
    queryKey: ['hasCheckedToday', user?.id],
    queryFn: () => hasCheckedToday(user!.id),
    enabled: !!user,
  });

  // 출석체크 뮤테이션
  const checkMutation = useMutation({
    mutationFn: () => checkAttendance(user!.id),
    onSuccess: (result) => {
      // success가 false인 경우 (테이블 미존재 등) 메시지만 표시
      if (!result.success) {
        alert(result.message);
        return;
      }

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['attendanceStats', user?.id] });
      queryClient.invalidateQueries({
        queryKey: ['monthlyAttendance', user?.id, selectedYear, selectedMonth],
      });
      queryClient.invalidateQueries({ queryKey: ['hasCheckedToday', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pointBalance', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pointHistory', user?.id] });

      // 성공 애니메이션 표시
      if (!result.is_already_checked) {
        setCheckResult({
          streakDays: result.streak_days,
          totalPoints: result.total_points,
          bonusPoints: result.bonus_points,
          message: result.message,
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    },
    onError: (error) => {
      console.warn('출석체크 중 오류 발생:', error);
      alert('출석체크 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    },
  });

  // 월 변경 핸들러
  const handleMonthChange = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  // 출석체크 버튼 클릭 핸들러
  const handleCheckAttendance = () => {
    if (!checkMutation.isPending && !isCheckedToday) {
      checkMutation.mutate();
    }
  };

  // 인증 로딩 중이거나 비로그인 상태일 때 로딩 스피너 표시
  if (isLoading || !isAuthenticated || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white pb-20">
      {/* 성공 오버레이 */}
      <AnimatePresence>
        {showSuccess && checkResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white rounded-3xl p-8 mx-4 text-center shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  출석 완료!
                </h2>
                <p className="text-gray-600 mb-4">
                  {checkResult.streakDays}일 연속 출석 중
                </p>

                <div className="flex items-center justify-center gap-2 text-3xl font-bold text-amber-600">
                  <Coins className="w-8 h-8" />
                  <span>+{checkResult.totalPoints}P</span>
                </div>

                {checkResult.bonusPoints > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold"
                  >
                    <PartyPopper className="w-5 h-5" />
                    연속 출석 보너스 +{checkResult.bonusPoints}P!
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">출석체크</h1>
          <p className="text-gray-600">매일 출석하고 포인트 받아가세요!</p>
        </div>

        {/* 출석체크 버튼 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative flex flex-col items-center space-y-6">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-300" />
              <span className="text-xl font-bold">
                {stats?.current_streak || 0}일 연속 출석 중
              </span>
              <Flame className="w-6 h-6 text-orange-300" />
            </div>

            <Button
              onClick={handleCheckAttendance}
              disabled={isCheckedToday || checkMutation.isPending}
              className={cn(
                'w-full max-w-xs h-16 rounded-2xl text-lg font-bold transition-all duration-300',
                isCheckedToday
                  ? 'bg-white/30 text-white cursor-not-allowed'
                  : 'bg-white text-green-600 hover:bg-green-50 hover:scale-105 active:scale-95 shadow-lg'
              )}
            >
              {checkMutation.isPending ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent" />
              ) : isCheckedToday ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>오늘 출석 완료!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-6 h-6" />
                  <span>출석체크 (+{BASE_ATTENDANCE_POINTS}P)</span>
                </div>
              )}
            </Button>

            {!isCheckedToday && (
              <p className="text-white/80 text-sm">
                지금 출석하면 <span className="font-bold">{BASE_ATTENDANCE_POINTS}P</span> 적립!
              </p>
            )}
          </div>
        </motion.div>

        {/* 연속 출석 보너스 진행 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm"
        >
          <StreakProgress currentStreak={stats?.current_streak || 0} />
        </motion.div>

        {/* 출석 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="p-4 rounded-2xl bg-white border border-gray-200 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-gray-900">
              {stats?.total_days || 0}
            </div>
            <div className="text-xs text-gray-500">총 출석일</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-gray-900">
              {stats?.current_streak || 0}
            </div>
            <div className="text-xs text-gray-500">연속 출석</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-gray-900">
              {stats?.max_streak || 0}
            </div>
            <div className="text-xs text-gray-500">최대 연속</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 text-center">
            <Coins className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold text-gray-900">
              {(stats?.total_points_earned || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">적립 포인트</div>
          </div>
        </motion.div>

        {/* 출석 캘린더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm"
        >
          {monthlyLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent"></div>
            </div>
          ) : (
            <AttendanceCalendar
              year={selectedYear}
              month={selectedMonth}
              attendanceData={monthlyData || []}
              onMonthChange={handleMonthChange}
            />
          )}
        </motion.div>

        {/* 안내 사항 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-blue-50 border border-blue-200"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-blue-900">
              <div className="font-semibold">출석체크 안내</div>
              <ul className="space-y-1 text-blue-700">
                <li>매일 1회 출석체크로 {BASE_ATTENDANCE_POINTS}P 적립</li>
                <li>7일, 14일, 21일, 30일 연속 출석 시 추가 보너스!</li>
                <li>자정(00:00)에 출석 가능 횟수가 초기화됩니다</li>
                <li>적립된 포인트는 예약 시 사용 가능합니다</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
