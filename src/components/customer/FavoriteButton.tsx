'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

import { toggleFavorite, checkIsFavorite } from '@/lib/api/favorites';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  shopId: string;
  className?: string;
  showCount?: boolean;
}

export function FavoriteButton({
  shopId,
  className,
  showCount = false
}: FavoriteButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Check if shop is favorited
  const { data: isFavorite = false } = useQuery({
    queryKey: ['favorite', shopId, userId],
    queryFn: () => checkIsFavorite(shopId),
    enabled: !!userId,
  });

  // Toggle favorite mutation
  const toggleMutation = useMutation({
    mutationFn: () => toggleFavorite(shopId),
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['favorite', shopId, userId] });

      // Snapshot previous value
      const previousFavorite = queryClient.getQueryData<boolean>(['favorite', shopId, userId]);

      // Optimistically update
      queryClient.setQueryData<boolean>(['favorite', shopId, userId], !previousFavorite);

      return { previousFavorite };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousFavorite !== undefined) {
        queryClient.setQueryData(['favorite', shopId, userId], context.previousFavorite);
      }
      toast.error('찜하기 처리 중 오류가 발생했습니다');
      console.error('Toggle favorite error:', error);
    },
    onSuccess: ({ isFavorite: newFavoriteState }) => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
      queryClient.invalidateQueries({ queryKey: ['favorite-count', shopId] });

      toast.success(newFavoriteState ? '찜 목록에 추가했습니다' : '찜 목록에서 제거했습니다');
    },
    onSettled: () => {
      // Always refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['favorite', shopId, userId] });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error('로그인이 필요합니다', {
        action: {
          label: '로그인',
          onClick: () => {
            window.location.href = '/login';
          },
        },
      });
      return;
    }

    toggleMutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      className={cn(
        'relative h-10 w-10 rounded-full transition-colors hover:bg-red-50',
        className
      )}
      aria-label={isFavorite ? '찜 해제' : '찜하기'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorite ? 'filled' : 'outline'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            rotate: isFavorite ? [0, -15, 15, -10, 10, 0] : 0
          }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 15,
            rotate: {
              duration: 0.5,
              ease: 'easeInOut'
            }
          }}
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-colors duration-200',
              isFavorite
                ? 'fill-red-500 text-red-500'
                : 'text-gray-400 hover:text-red-500'
            )}
          />
        </motion.div>
      </AnimatePresence>

      {/* Burst particles on favorite */}
      <AnimatePresence>
        {isFavorite && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-red-400"
                initial={{
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 1
                }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 20,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 20,
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 0.4,
                  ease: 'easeOut',
                  delay: 0.1
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Ripple effect on click */}
      {toggleMutation.isPending && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500/20"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </Button>
  );
}
