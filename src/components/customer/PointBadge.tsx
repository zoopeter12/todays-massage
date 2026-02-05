'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Coins } from 'lucide-react';
import { fetchPointBalance } from '@/lib/api/points';
import { useAuth } from '@/hooks/useAuth';

interface PointBadgeProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function PointBadge({ variant = 'default', className = '' }: PointBadgeProps) {
  const router = useRouter();
  const { user } = useAuth();

  const { data: balance } = useQuery({
    queryKey: ['pointBalance', user?.id],
    queryFn: () => fetchPointBalance(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60, // 1분
  });

  if (!balance) return null;

  const formatPoints = (points: number) => {
    if (points >= 10000) {
      return `${(points / 10000).toFixed(1)}만`;
    }
    return points.toLocaleString();
  };

  const handleClick = () => {
    router.push('/points');
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
          bg-amber-50 hover:bg-amber-100 border border-amber-200
          transition-all duration-200 hover:shadow-sm active:scale-95 ${className}`}
      >
        <Coins className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-900">
          {formatPoints(balance.available)}P
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
        bg-gradient-to-br from-amber-50 to-orange-50
        hover:from-amber-100 hover:to-orange-100
        border border-amber-200 hover:border-amber-300
        transition-all duration-200 hover:shadow-md active:scale-95 ${className}`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors">
        <Coins className="w-4.5 h-4.5 text-amber-600" />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-xs text-amber-700 font-medium">내 포인트</span>
        <span className="text-base font-bold text-amber-900">
          {formatPoints(balance.available)}P
        </span>
      </div>
    </button>
  );
}
