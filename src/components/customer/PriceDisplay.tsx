'use client';

import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  /** 원가 */
  originalPrice: number;
  /** 할인가 (없으면 할인 없음) */
  discountPrice?: number | null;
  /** 회원 할인가 (선택) */
  memberPrice?: number | null;
  /** 크기: sm (카드), md (기본), lg (상세) */
  size?: 'sm' | 'md' | 'lg';
  /** 배경/테두리 스타일 표시 여부 */
  showContainer?: boolean;
  /** "~" 접미사 표시 여부 (최저가 표시용) */
  showFromSuffix?: boolean;
  /** 추가 className */
  className?: string;
}

/**
 * 가격 표시 컴포넌트
 *
 * 기능:
 * - 할인율 배지 (-20%)
 * - 원가 취소선 스타일 강화
 * - 할인가 강조 (색상, 크기)
 * - 선택적 가격 영역 배경/테두리
 * - 회원 할인가 표시
 */
export function PriceDisplay({
  originalPrice,
  discountPrice,
  memberPrice,
  size = 'md',
  showContainer = false,
  showFromSuffix = false,
  className,
}: PriceDisplayProps) {
  const hasDiscount = discountPrice != null && discountPrice < originalPrice;
  const discountRate = hasDiscount
    ? Math.round(((originalPrice - discountPrice!) / originalPrice) * 100)
    : 0;

  const hasMemberDiscount = memberPrice != null && memberPrice < (discountPrice || originalPrice);
  const memberDiscountRate = hasMemberDiscount
    ? Math.round((((discountPrice || originalPrice) - memberPrice!) / (discountPrice || originalPrice)) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 사이즈별 스타일
  const sizeStyles = {
    sm: {
      badge: 'text-[10px] px-1.5 py-0.5',
      original: 'text-xs',
      discount: 'text-sm font-bold',
      member: 'text-xs',
      memberLabel: 'text-[10px]',
    },
    md: {
      badge: 'text-xs px-2 py-0.5',
      original: 'text-sm',
      discount: 'text-lg font-bold',
      member: 'text-sm',
      memberLabel: 'text-xs',
    },
    lg: {
      badge: 'text-sm px-2.5 py-1',
      original: 'text-base',
      discount: 'text-xl font-bold',
      member: 'text-base',
      memberLabel: 'text-sm',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        'flex flex-col items-end gap-0.5',
        showContainer && 'bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg px-3 py-2 border border-pink-100',
        className
      )}
    >
      {/* 할인율 배지 + 원가 */}
      {hasDiscount && (
        <div className="flex items-center gap-1.5">
          {/* 할인율 배지 */}
          <span
            className={cn(
              'inline-flex items-center rounded-md font-bold',
              'bg-gradient-to-r from-red-500 to-rose-500 text-white',
              'shadow-sm',
              styles.badge
            )}
          >
            -{discountRate}%
          </span>
          {/* 원가 (취소선 강화) */}
          <span
            className={cn(
              'text-slate-400 line-through decoration-slate-400 decoration-2',
              styles.original
            )}
          >
            {formatPrice(originalPrice)}원
          </span>
        </div>
      )}

      {/* 할인가 또는 정가 */}
      <div className="flex items-baseline gap-0.5">
        <span
          className={cn(
            hasDiscount ? 'text-rose-600' : 'text-slate-900',
            styles.discount
          )}
        >
          {formatPrice(discountPrice ?? originalPrice)}원
          {showFromSuffix && '~'}
        </span>
      </div>

      {/* 회원 할인가 */}
      {hasMemberDiscount && (
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className={cn(
              'inline-flex items-center rounded-md font-medium',
              'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
              'px-1.5 py-0.5',
              styles.memberLabel
            )}
          >
            회원
            {memberDiscountRate > 0 && ` -${memberDiscountRate}%`}
          </span>
          <span className={cn('text-violet-600 font-semibold', styles.member)}>
            {formatPrice(memberPrice!)}원
          </span>
        </div>
      )}
    </div>
  );
}

export default PriceDisplay;
