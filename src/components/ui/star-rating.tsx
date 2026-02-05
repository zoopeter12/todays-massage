'use client';

/**
 * StarRating Component
 * Reusable star rating display and input component
 */

import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  /**
   * Current rating value (0-5)
   */
  rating: number;

  /**
   * Size variant
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Whether the rating is interactive (clickable)
   */
  interactive?: boolean;

  /**
   * Callback when rating changes (interactive mode only)
   */
  onRatingChange?: (rating: number) => void;

  /**
   * Show rating number next to stars
   */
  showValue?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Star color (filled state)
   */
  color?: string;

  /**
   * Empty star color
   */
  emptyColor?: string;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const gapMap = {
  xs: 'gap-0.5',
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1',
  xl: 'gap-1.5',
};

const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function StarRating({
  rating,
  size = 'md',
  interactive = false,
  onRatingChange,
  showValue = false,
  className,
  color = 'text-yellow-400',
  emptyColor = 'text-gray-200',
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (starValue: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className={cn('flex items-center', gapMap[size], className)}>
      <div className={cn('flex', gapMap[size])}>
        {stars.map((star) => {
          const isSelected = star <= Math.round(rating);
          const StarComponent = interactive ? motion.button : 'div';

          return (
            <StarComponent
              key={star}
              {...(interactive && {
                type: 'button',
                whileHover: { scale: 1.2 },
                whileTap: { scale: 0.9 },
                onClick: () => handleClick(star),
              })}
              className={cn(
                'transition-all',
                interactive && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded'
              )}
              aria-label={`${star}점`}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  isSelected ? `fill-current ${color}` : `fill-current ${emptyColor}`,
                  isSelected ? color : emptyColor
                )}
              />
            </StarComponent>
          );
        })}
      </div>

      {showValue && (
        <span className={cn('font-medium text-gray-700', textSizeMap[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/**
 * Interactive Star Rating Input Component
 */
export interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

export function StarRatingInput({
  value,
  onChange,
  size = 'lg',
  showLabel = true,
  disabled = false,
  className,
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const displayRating = hoverRating || value;

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5:
        return '최고예요!';
      case 4:
        return '좋아요!';
      case 3:
        return '보통이에요';
      case 2:
        return '별로예요';
      case 1:
        return '최악이에요';
      default:
        return '별점을 선택해주세요';
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.2 } : {}}
              whileTap={!disabled ? { scale: 0.9 } : {}}
              onClick={() => !disabled && onChange(star)}
              onMouseEnter={() => !disabled && setHoverRating(star)}
              onMouseLeave={() => !disabled && setHoverRating(0)}
              className={cn(
                'focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded transition-all',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                )}
              />
            </motion.button>
          ))}
        </div>

        {showLabel && displayRating > 0 && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium text-gray-700"
          >
            {getRatingLabel(displayRating)}
          </motion.span>
        )}
      </div>
    </div>
  );
}

import * as React from 'react';
