'use client';

import { cn } from '@/lib/utils';
import { Gift, Target } from 'lucide-react';
import { STREAK_MILESTONES } from '@/types/attendance';

interface StreakProgressProps {
  currentStreak: number;
  className?: string;
}

export function StreakProgress({ currentStreak, className }: StreakProgressProps) {
  // 현재 진행 중인 마일스톤 찾기
  const currentMilestoneIndex = STREAK_MILESTONES.findIndex(
    (m) => currentStreak < m.days
  );

  // 다음 마일스톤
  const nextMilestone =
    currentMilestoneIndex >= 0
      ? STREAK_MILESTONES[currentMilestoneIndex]
      : { days: 30, bonus: 300, label: '30일 연속' };

  // 이전 마일스톤 (진행률 계산용)
  const prevMilestone =
    currentMilestoneIndex > 0
      ? STREAK_MILESTONES[currentMilestoneIndex - 1]
      : { days: 0, bonus: 0, label: '시작' };

  // 진행률 계산
  const progressRange = nextMilestone.days - prevMilestone.days;
  const currentProgress = currentStreak - prevMilestone.days;
  const progressPercent = Math.min(100, (currentProgress / progressRange) * 100);

  // 다음 마일스톤까지 남은 일수
  const daysUntilNext = nextMilestone.days - currentStreak;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 연속 출석 보너스 안내 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-gray-900">연속 출석 보너스</span>
        </div>
        {currentStreak > 0 && (
          <span className="text-sm text-gray-600">
            {daysUntilNext}일 후 <span className="font-bold text-amber-600">+{nextMilestone.bonus}P</span>
          </span>
        )}
      </div>

      {/* 진행 바 */}
      <div className="relative">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 마일스톤 마커 */}
        <div className="absolute top-0 left-0 right-0 h-3 flex items-center">
          {STREAK_MILESTONES.map((milestone, index) => {
            const position = ((milestone.days - prevMilestone.days) / progressRange) * 100;
            const isAchieved = currentStreak >= milestone.days;
            const isNext = milestone.days === nextMilestone.days;

            // 현재 범위 밖의 마일스톤은 표시하지 않음
            if (position < 0 || position > 100) return null;

            return (
              <div
                key={milestone.days}
                className="absolute flex flex-col items-center"
                style={{ left: `${Math.min(position, 98)}%` }}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    isAchieved
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400'
                      : isNext
                        ? 'bg-white border-amber-400 shadow-md'
                        : 'bg-white border-gray-300'
                  )}
                >
                  {isAchieved && <Gift className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 마일스톤 레이블 */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        {STREAK_MILESTONES.map((milestone) => {
          const isAchieved = currentStreak >= milestone.days;
          const isNext =
            currentStreak < milestone.days &&
            (STREAK_MILESTONES.findIndex((m) => m.days === milestone.days) === 0 ||
              currentStreak >= STREAK_MILESTONES[STREAK_MILESTONES.findIndex((m) => m.days === milestone.days) - 1].days);

          return (
            <div
              key={milestone.days}
              className={cn(
                'text-center p-2 rounded-lg transition-all',
                isAchieved && 'bg-amber-50 border border-amber-200',
                isNext && 'bg-blue-50 border border-blue-200 ring-1 ring-blue-300',
                !isAchieved && !isNext && 'bg-gray-50'
              )}
            >
              <div
                className={cn(
                  'text-xs font-medium',
                  isAchieved && 'text-amber-700',
                  isNext && 'text-blue-700',
                  !isAchieved && !isNext && 'text-gray-500'
                )}
              >
                {milestone.days}일
              </div>
              <div
                className={cn(
                  'text-sm font-bold',
                  isAchieved && 'text-amber-600',
                  isNext && 'text-blue-600',
                  !isAchieved && !isNext && 'text-gray-400'
                )}
              >
                +{milestone.bonus}P
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
