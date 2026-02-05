'use client';

/**
 * ShopReviews Component
 * Displays reviews for a shop with rating statistics, sorting, and review creation
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Flag, MoreVertical, PenLine, LogIn, Calendar } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import { fetchShopReviews, getShopRatingStats } from '@/lib/api/reviews';
import { hasCompletedReservation } from '@/lib/api/reservations';
import type { ReviewSortOption } from '@/types/reviews';
import ReportReviewDialog from './ReportReviewDialog';
import ReviewForm from './ReviewForm';

interface ShopReviewsProps {
  shopId: string;
}

/**
 * Empty State Illustration SVG Component
 * A warm, inviting illustration for when there are no reviews
 */
function EmptyReviewsIllustration() {
  return (
    <svg
      width="180"
      height="140"
      viewBox="0 0 180 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-4"
      aria-hidden="true"
    >
      {/* Background decorative elements */}
      <circle cx="90" cy="70" r="60" fill="#F3F4F6" />
      <circle cx="90" cy="70" r="45" fill="#E5E7EB" />

      {/* Speech bubble with stars */}
      <path
        d="M60 45C60 39.4772 64.4772 35 70 35H110C115.523 35 120 39.4772 120 45V75C120 80.5228 115.523 85 110 85H95L90 95L85 85H70C64.4772 85 60 80.5228 60 75V45Z"
        fill="white"
        stroke="#D1D5DB"
        strokeWidth="2"
      />

      {/* Three stars inside the bubble */}
      <path
        d="M75 55L76.5 58.5L80 59L77.5 61.5L78 65L75 63.5L72 65L72.5 61.5L70 59L73.5 58.5L75 55Z"
        fill="#FCD34D"
      />
      <path
        d="M90 50L92 55L97 55.5L93.5 59L94.5 64L90 61.5L85.5 64L86.5 59L83 55.5L88 55L90 50Z"
        fill="#FBBF24"
      />
      <path
        d="M105 55L106.5 58.5L110 59L107.5 61.5L108 65L105 63.5L102 65L102.5 61.5L100 59L103.5 58.5L105 55Z"
        fill="#FCD34D"
      />

      {/* Pen/pencil at the bottom */}
      <rect
        x="78"
        y="100"
        width="24"
        height="6"
        rx="2"
        fill="#9CA3AF"
        transform="rotate(-10 78 100)"
      />
      <polygon
        points="75,108 72,115 78,112"
        fill="#6B7280"
        transform="rotate(-10 75 112)"
      />

      {/* Small decorative dots */}
      <circle cx="45" cy="50" r="3" fill="#FCD34D" opacity="0.6" />
      <circle cx="135" cy="60" r="4" fill="#FCD34D" opacity="0.5" />
      <circle cx="50" cy="90" r="2" fill="#D1D5DB" />
      <circle cx="130" cy="95" r="3" fill="#D1D5DB" />
    </svg>
  );
}

export default function ShopReviews({ shopId }: ShopReviewsProps) {
  const [sortBy, setSortBy] = useState<ReviewSortOption>('latest');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get current user
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.id) {
        setCurrentUserId(data.session.user.id);
      }
      return data.session;
    },
  });

  // Check if user has a completed reservation at this shop
  const { data: reservationCheck, isLoading: reservationCheckLoading } = useQuery({
    queryKey: ['user-completed-reservation', shopId, currentUserId],
    queryFn: () => hasCompletedReservation(currentUserId!, shopId),
    enabled: !!currentUserId,
  });

  const handleReportClick = (reviewId: string) => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다', {
        description: '리뷰를 신고하려면 로그인해주세요.',
      });
      return;
    }
    setSelectedReviewId(reviewId);
    setReportDialogOpen(true);
  };

  const handleWriteReviewClick = () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다', {
        description: '리뷰를 작성하려면 먼저 로그인해주세요.',
      });
      return;
    }
    if (!reservationCheck?.hasCompleted) {
      toast.error('리뷰 작성 불가', {
        description: '이용 완료된 예약이 있어야 리뷰를 작성할 수 있습니다.',
      });
      return;
    }
    setShowReviewForm(true);
  };

  // Fetch rating statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['shop-rating-stats', shopId],
    queryFn: () => getShopRatingStats(shopId),
  });

  // Fetch reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['shop-reviews', shopId, sortBy],
    queryFn: () => fetchShopReviews(shopId, sortBy),
  });

  const isLoading = statsLoading || reviewsLoading;

  // Render star rating
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeMap[size]} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // Render write review status/button based on user state
  const renderWriteReviewSection = () => {
    // Not logged in
    if (!currentUserId) {
      return (
        <Alert className="border-blue-200 bg-blue-50">
          <LogIn className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">로그인이 필요합니다</AlertTitle>
          <AlertDescription className="text-blue-700">
            리뷰를 작성하려면 먼저 로그인해주세요.
          </AlertDescription>
        </Alert>
      );
    }

    // Loading reservation check
    if (reservationCheckLoading) {
      return (
        <div className="flex items-center justify-center py-3">
          <Skeleton className="h-10 w-40" />
        </div>
      );
    }

    // No completed reservation
    if (!reservationCheck?.hasCompleted) {
      return (
        <Alert className="border-amber-200 bg-amber-50">
          <Calendar className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">이용 완료 후 작성 가능</AlertTitle>
          <AlertDescription className="text-amber-700">
            예약 후 이용을 완료하시면 리뷰를 작성하실 수 있습니다.
          </AlertDescription>
        </Alert>
      );
    }

    // Can write review
    return (
      <Button
        onClick={handleWriteReviewClick}
        className="w-full sm:w-auto"
        size="lg"
      >
        <PenLine className="w-4 h-4 mr-2" />
        리뷰 작성하기
      </Button>
    );
  };

  if (isLoading) {
    return <ReviewsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Write Review Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">나의 방문 후기</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                솔직한 리뷰로 다른 고객들에게 도움을 주세요
              </p>
            </div>
            {renderWriteReviewSection()}
          </div>
        </CardContent>
      </Card>

      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">고객 평가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Average Rating */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="mt-1">{renderStars(Math.round(stats.averageRating), 'md')}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {stats.totalReviews}개 리뷰
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5];
                  const percentage = stats.totalReviews > 0
                    ? (count / stats.totalReviews) * 100
                    : 0;

                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 w-12">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{rating}</span>
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: rating * 0.1 }}
                          className="h-full bg-yellow-400"
                        />
                      </div>
                      <div className="w-8 text-sm text-gray-500 text-right">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review List Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          리뷰 {reviews?.length || 0}개
        </h3>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as ReviewSortOption)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">최신순</SelectItem>
            <SelectItem value="highest">평점 높은순</SelectItem>
            <SelectItem value="lowest">평점 낮은순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review List */}
      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    {/* User Info & Rating */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {review.user?.nickname || '익명'}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {formatDate(review.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating, 'sm')}
                        {/* Report Menu - Only show for other users' reviews */}
                        {currentUserId && currentUserId !== review.user_id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleReportClick(review.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                신고하기
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {/* Review Comment */}
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {review.comment}
                    </p>

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {review.images.map((image, idx) => (
                          <Image
                            key={idx}
                            src={image}
                            alt={`리뷰 이미지 ${idx + 1}`}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-lg"
                            unoptimized
                          />
                        ))}
                      </div>
                    )}

                    {/* Owner Reply */}
                    {review.owner_reply && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              사장님 답변
                            </span>
                            {review.owner_replied_at && (
                              <span className="text-xs text-gray-500">
                                {formatDate(review.owner_replied_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {review.owner_reply}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State with Illustration */
        <Card>
          <CardContent className="py-12 text-center">
            <EmptyReviewsIllustration />
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              아직 리뷰가 없습니다
            </h4>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              이 매장을 이용해보셨나요?{' '}
              <br className="sm:hidden" />
              첫 번째 리뷰를 남겨 다른 고객들에게 도움을 주세요!
            </p>
            {currentUserId && reservationCheck?.hasCompleted ? (
              <Button
                onClick={handleWriteReviewClick}
                size="lg"
                className="gap-2"
              >
                <PenLine className="w-4 h-4" />
                첫 리뷰 작성하기
              </Button>
            ) : currentUserId ? (
              <p className="text-sm text-gray-400">
                예약 후 이용을 완료하시면 리뷰를 작성하실 수 있습니다.
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                로그인 후 리뷰를 작성해보세요.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Dialog */}
      {selectedReviewId && currentUserId && (
        <ReportReviewDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reviewId={selectedReviewId}
          userId={currentUserId}
        />
      )}

      {/* Review Form Dialog */}
      {currentUserId && reservationCheck?.hasCompleted && (
        <ReviewForm
          shopId={shopId}
          userId={currentUserId}
          reservationId={reservationCheck.reservationId}
          trigger={
            <span className="hidden">
              {/* Hidden trigger - form is opened via state */}
            </span>
          }
          onSuccess={() => setShowReviewForm(false)}
        />
      )}

      {/* Controlled Review Form */}
      {showReviewForm && currentUserId && reservationCheck?.hasCompleted && (
        <ReviewFormControlled
          shopId={shopId}
          userId={currentUserId}
          reservationId={reservationCheck.reservationId}
          open={showReviewForm}
          onOpenChange={setShowReviewForm}
        />
      )}
    </div>
  );
}

/**
 * Controlled Review Form Component
 * Wraps ReviewForm with external open/close state control
 */
function ReviewFormControlled({
  shopId,
  userId,
  reservationId,
  open,
  onOpenChange,
}: {
  shopId: string;
  userId: string;
  reservationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ReviewForm
      shopId={shopId}
      userId={userId}
      reservationId={reservationId}
      trigger={
        <Button
          className="hidden"
          ref={(el) => {
            // Auto-click the trigger when component mounts if open is true
            if (el && open) {
              el.click();
            }
          }}
        >
          Open
        </Button>
      }
      onSuccess={() => onOpenChange(false)}
    />
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Write Review Section Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-5 w-28 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Skeleton className="h-12 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
            <div className="flex-1 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-2 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
