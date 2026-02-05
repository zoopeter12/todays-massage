'use client';

/**
 * ReviewForm Component
 * Dialog-based form for creating a review
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createReview } from '@/lib/api/reviews';
import type { ReviewInsert } from '@/types/reviews';

interface ReviewFormProps {
  shopId: string;
  userId: string;
  reservationId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function ReviewForm({
  shopId,
  userId,
  reservationId,
  trigger,
  onSuccess,
}: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const queryClient = useQueryClient();

  // Create review mutation
  const createMutation = useMutation({
    mutationFn: (data: ReviewInsert) => createReview(data),
    onSuccess: () => {
      // Invalidate queries to refresh the review list
      queryClient.invalidateQueries({ queryKey: ['shop-reviews', shopId] });
      queryClient.invalidateQueries({ queryKey: ['shop-rating-stats', shopId] });

      toast.success('리뷰가 작성되었습니다');
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`리뷰 작성 실패: ${error.message}`);
    },
  });

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('별점을 선택해주세요');
      return;
    }

    if (!comment.trim()) {
      toast.error('리뷰 내용을 입력해주세요');
      return;
    }

    if (comment.length < 10) {
      toast.error('리뷰는 최소 10자 이상 작성해주세요');
      return;
    }

    createMutation.mutate({
      shop_id: shopId,
      user_id: userId,
      reservation_id: reservationId || null,
      rating,
      comment: comment.trim(),
      images: [],
    });
  };

  const renderStarInput = () => {
    const displayRating = hoverRating || rating;

    return (
      <div className="flex items-center gap-6">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
            >
              <Star
                className={`w-10 h-10 transition-all ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            </motion.button>
          ))}
        </div>

        {rating > 0 && (
          <div className="text-sm text-gray-600">
            {rating === 5 && '최고예요!'}
            {rating === 4 && '좋아요!'}
            {rating === 3 && '보통이에요'}
            {rating === 2 && '별로예요'}
            {rating === 1 && '최악이에요'}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" className="w-full">
            <Star className="w-4 h-4 mr-2" />
            리뷰 작성
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>리뷰 작성</DialogTitle>
          <DialogDescription>
            방문하신 매장은 어떠셨나요? 솔직한 후기를 남겨주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Star Rating Input */}
          <div className="space-y-3">
            <Label>별점</Label>
            {renderStarInput()}
          </div>

          {/* Comment Input */}
          <div className="space-y-3">
            <Label htmlFor="comment">
              리뷰 내용
              <span className="text-xs text-gray-500 ml-2">
                (최소 10자)
              </span>
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="매장 이용 경험을 자세히 공유해주세요.&#10;다른 고객들에게 큰 도움이 됩니다."
              rows={6}
              maxLength={500}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || rating === 0 || !comment.trim()}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <>작성 중...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  작성 완료
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
