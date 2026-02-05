'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPointBalance, calculateEarnAmount } from '@/lib/api/points';
import { useAuth } from '@/hooks/useAuth';

interface PointUseSelectorProps {
  totalPrice: number;
  onPointsChange: (points: number) => void;
  className?: string;
}

export function PointUseSelector({
  totalPrice,
  onPointsChange,
  className = '',
}: PointUseSelectorProps) {
  const { user } = useAuth();
  const [usePoints, setUsePoints] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const prevUsePoints = useRef(0);

  const { data: balance } = useQuery({
    queryKey: ['pointBalance', user?.id],
    queryFn: () => fetchPointBalance(user!.id),
    enabled: !!user,
  });

  const earnCalculation = calculateEarnAmount(totalPrice - usePoints);
  const finalPrice = totalPrice - usePoints;

  useEffect(() => {
    onPointsChange(usePoints);
  }, [usePoints, onPointsChange]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setError('');

    const numValue = parseInt(value.replace(/,/g, ''), 10);

    if (isNaN(numValue) || numValue < 0) {
      setUsePoints(0);
      return;
    }

    if (!balance) return;

    if (numValue > balance.available) {
      setError(`사용 가능한 포인트는 ${balance.available.toLocaleString()}P 입니다.`);
      return;
    }

    if (numValue > totalPrice) {
      setError('결제 금액보다 많은 포인트를 사용할 수 없습니다.');
      return;
    }

    setUsePoints(numValue);
  };

  const handleUseAll = () => {
    if (!balance) return;
    const maxUse = Math.min(balance.available, totalPrice);
    setUsePoints(maxUse);
    setInputValue(maxUse.toLocaleString());
    setError('');
    if (maxUse > 0 && maxUse !== prevUsePoints.current) {
      prevUsePoints.current = maxUse;
      toast.success(`${maxUse.toLocaleString()}P 포인트가 적용되었습니다`);
    }
  };

  const handleReset = () => {
    const hadPoints = usePoints > 0;
    setUsePoints(0);
    setInputValue('');
    setError('');
    prevUsePoints.current = 0;
    if (hadPoints) {
      toast.info('포인트 사용이 취소되었습니다');
    }
  };

  if (!balance || balance.available === 0) {
    return (
      <div className={`p-4 rounded-xl bg-gray-50 border border-gray-200 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Coins className="w-5 h-5" />
          <span className="text-sm">사용 가능한 포인트가 없습니다</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
              <Coins className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <span className="font-semibold text-gray-900">포인트 사용</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">보유 포인트</div>
            <div className="text-lg font-bold text-amber-600">
              {balance.available.toLocaleString()}P
            </div>
          </div>
        </div>

        {/* 입력 필드 */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="사용할 포인트를 입력하세요"
              className={`w-full px-4 py-3 pr-12 rounded-xl border-2
                ${error ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-white'}
                focus:outline-none focus:ring-2 focus:ring-amber-400
                text-lg font-semibold transition-all`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-600 font-semibold">
              P
            </span>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1.5 text-sm text-red-600"
              >
                <Info className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 버튼 그룹 */}
          <div className="flex gap-2">
            <button
              onClick={handleUseAll}
              className="flex-1 px-4 py-2.5 rounded-lg bg-amber-100 hover:bg-amber-200
                text-amber-900 font-medium transition-colors active:scale-95"
            >
              전액 사용
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200
                text-gray-700 font-medium transition-colors active:scale-95"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 결제 요약 */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3" role="region" aria-label="결제 금액 요약">
        {/* 스크린 리더용 실시간 알림 */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {usePoints > 0
            ? `${usePoints.toLocaleString()}P 포인트 사용, 최종 결제 금액 ${finalPrice.toLocaleString()}원`
            : ''}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">주문 금액</span>
          <span className="font-semibold text-gray-900">
            {totalPrice.toLocaleString()}원
          </span>
        </div>

        <AnimatePresence>
          {usePoints > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-amber-600">포인트 사용</span>
              <span className="font-semibold text-amber-600">
                -{usePoints.toLocaleString()}원
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">최종 결제 금액</span>
            <span className="text-2xl font-bold text-blue-600" aria-label={`최종 결제 금액 ${finalPrice.toLocaleString()}원`}>
              {finalPrice.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 적립 예정 포인트 */}
        {earnCalculation.amount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-3 border-t border-gray-200"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <Sparkles className="w-4.5 h-4.5 text-green-600" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium">
                  예상 적립 포인트
                </span>
                <span className="text-base font-bold text-green-600">
                  +{earnCalculation.amount.toLocaleString()}P
                </span>
              </div>
            </div>
            <div className="mt-1.5 text-xs text-gray-500 text-center">
              {earnCalculation.description}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
