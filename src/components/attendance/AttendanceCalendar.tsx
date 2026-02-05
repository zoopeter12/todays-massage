'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, Check, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { MonthlyAttendance } from '@/types/attendance';

interface AttendanceCalendarProps {
  year: number;
  month: number;
  attendanceData: MonthlyAttendance[];
  onMonthChange: (year: number, month: number) => void;
  className?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function AttendanceCalendar({
  year,
  month,
  attendanceData,
  onMonthChange,
  className,
}: AttendanceCalendarProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 해당 월의 첫째 날과 마지막 날
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // 출석 데이터를 날짜별 Map으로 변환
  const attendanceMap = React.useMemo(() => {
    const map = new Map<string, MonthlyAttendance>();
    attendanceData.forEach((item) => {
      map.set(item.check_date, item);
    });
    return map;
  }, [attendanceData]);

  // 이전 달로 이동
  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  // 다음 달 버튼 비활성화 여부 (미래 달은 볼 수 없음)
  const isNextDisabled =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month >= today.getMonth() + 1);

  // 날짜 셀 렌더링
  const renderDays = () => {
    const days = [];

    // 시작 요일 전 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(
        <div key={`empty-start-${i}`} className="aspect-square p-1" />
      );
    }

    // 날짜 렌더링
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = attendanceMap.get(dateStr);
      const isToday = dateStr === todayStr;
      const isPast = new Date(dateStr) < new Date(todayStr);
      const isFuture = new Date(dateStr) > new Date(todayStr);
      const hasBonus = attendance && attendance.total_points > 10;

      days.push(
        <div
          key={day}
          className={cn(
            'aspect-square p-1 flex flex-col items-center justify-center relative',
            'rounded-lg transition-all duration-200',
            isToday && 'ring-2 ring-amber-400 ring-offset-1',
            attendance && 'bg-gradient-to-br from-green-100 to-emerald-100',
            !attendance && isPast && 'bg-gray-50',
            isFuture && 'opacity-40'
          )}
        >
          <span
            className={cn(
              'text-sm font-medium',
              attendance && 'text-green-700',
              !attendance && isPast && 'text-gray-400',
              isToday && !attendance && 'text-amber-600 font-bold'
            )}
          >
            {day}
          </span>

          {/* 출석 체크 표시 */}
          {attendance && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full',
                  hasBonus
                    ? 'w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 shadow-md'
                    : 'w-6 h-6 bg-green-500'
                )}
              >
                {hasBonus ? (
                  <Gift className="w-4 h-4 text-white" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                )}
              </div>
            </div>
          )}

          {/* 포인트 표시 */}
          {attendance && (
            <span
              className={cn(
                'absolute -bottom-0.5 text-[10px] font-bold',
                hasBonus ? 'text-amber-600' : 'text-green-600'
              )}
            >
              +{attendance.total_points}P
            </span>
          )}
        </div>
      );
    }

    // 마지막 주 채우기
    const remainingDays = 7 - ((startDayOfWeek + daysInMonth) % 7);
    if (remainingDays < 7) {
      for (let i = 0; i < remainingDays; i++) {
        days.push(
          <div key={`empty-end-${i}`} className="aspect-square p-1" />
        );
      }
    }

    return days;
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 헤더: 월 이동 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-9 w-9"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>

        <h3 className="text-lg font-bold text-gray-900">
          {year}년 {month}월
        </h3>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className="h-9 w-9"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              'text-center text-sm font-medium py-2',
              index === 0 && 'text-red-500',
              index === 6 && 'text-blue-500',
              index !== 0 && index !== 6 && 'text-gray-600'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm text-gray-600">출석 완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Gift className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm text-gray-600">보너스 적립</span>
        </div>
      </div>
    </div>
  );
}
