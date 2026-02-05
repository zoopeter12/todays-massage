/**
 * Review System Helper Functions
 * Utility functions for working with reviews
 */

import type { Review, ShopRatingStats } from '@/types/reviews';

/**
 * Format review date in human-readable Korean format
 */
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes <= 1 ? '방금 전' : `${diffMinutes}분 전`;
    }
    return `${diffHours}시간 전`;
  }
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get rating label in Korean
 */
export function getRatingLabel(rating: number): string {
  switch (rating) {
    case 5:
      return '최고예요';
    case 4:
      return '좋아요';
    case 3:
      return '보통이에요';
    case 2:
      return '별로예요';
    case 1:
      return '최악이에요';
    default:
      return '';
  }
}

/**
 * Get rating color based on score
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-blue-600';
  if (rating >= 2.5) return 'text-yellow-600';
  if (rating >= 1.5) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get rating badge variant
 */
export function getRatingBadgeVariant(rating: number): 'default' | 'secondary' | 'destructive' {
  if (rating >= 4) return 'default';
  if (rating >= 3) return 'secondary';
  return 'destructive';
}

/**
 * Calculate rating percentage
 */
export function getRatingPercentage(stats: ShopRatingStats, rating: 1 | 2 | 3 | 4 | 5): number {
  if (stats.totalReviews === 0) return 0;
  const count = stats.ratingDistribution[rating];
  return Math.round((count / stats.totalReviews) * 100);
}

/**
 * Get review sentiment
 */
export function getReviewSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive';
  if (rating >= 3) return 'neutral';
  return 'negative';
}

/**
 * Sort reviews by different criteria
 */
export function sortReviews(
  reviews: Review[],
  sortBy: 'latest' | 'highest' | 'lowest' | 'helpful'
): Review[] {
  const sorted = [...reviews];

  switch (sortBy) {
    case 'highest':
      return sorted.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    case 'lowest':
      return sorted.sort((a, b) => {
        if (a.rating !== b.rating) return a.rating - b.rating;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    case 'latest':
    default:
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

/**
 * Filter reviews by rating
 */
export function filterReviewsByRating(reviews: Review[], minRating: number): Review[] {
  return reviews.filter((review) => review.rating >= minRating);
}

/**
 * Filter reviews by date range
 */
export function filterReviewsByDate(
  reviews: Review[],
  startDate: Date,
  endDate: Date
): Review[] {
  return reviews.filter((review) => {
    const reviewDate = new Date(review.created_at);
    return reviewDate >= startDate && reviewDate <= endDate;
  });
}

/**
 * Get reviews with owner replies
 */
export function getReviewsWithReplies(reviews: Review[]): Review[] {
  return reviews.filter((review) => review.owner_reply !== null);
}

/**
 * Get reviews without owner replies
 */
export function getReviewsWithoutReplies(reviews: Review[]): Review[] {
  return reviews.filter((review) => review.owner_reply === null);
}

/**
 * Calculate average rating from reviews array
 */
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

/**
 * Calculate rating distribution from reviews array
 */
export function calculateRatingDistribution(reviews: Review[]): ShopRatingStats['ratingDistribution'] {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach((review) => {
    const rating = review.rating as 1 | 2 | 3 | 4 | 5;
    distribution[rating]++;
  });

  return distribution;
}

/**
 * Get rating statistics from reviews array
 */
export function getStatsFromReviews(reviews: Review[]): ShopRatingStats {
  return {
    averageRating: calculateAverageRating(reviews),
    totalReviews: reviews.length,
    ratingDistribution: calculateRatingDistribution(reviews),
  };
}

/**
 * Check if review is recent (within last 7 days)
 */
export function isRecentReview(review: Review): boolean {
  const reviewDate = new Date(review.created_at);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return reviewDate >= weekAgo;
}

/**
 * Get review reply time in hours
 */
export function getReplyTime(review: Review): number | null {
  if (!review.owner_replied_at) return null;

  const created = new Date(review.created_at).getTime();
  const replied = new Date(review.owner_replied_at).getTime();
  const diffMs = replied - created;

  return Math.round(diffMs / (1000 * 60 * 60)); // hours
}

/**
 * Format reply time
 */
export function formatReplyTime(review: Review): string | null {
  const hours = getReplyTime(review);
  if (hours === null) return null;

  if (hours < 1) return '1시간 이내';
  if (hours < 24) return `${hours}시간 이내`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '하루 이내';
  if (days < 7) return `${days}일 이내`;
  const weeks = Math.floor(days / 7);
  return `${weeks}주 이내`;
}

/**
 * Validate review comment
 */
export function validateReviewComment(comment: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = comment.trim();

  if (!trimmed) {
    return { valid: false, error: '리뷰 내용을 입력해주세요' };
  }

  if (trimmed.length < 10) {
    return { valid: false, error: '리뷰는 최소 10자 이상 작성해주세요' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: '리뷰는 최대 500자까지 작성 가능합니다' };
  }

  return { valid: true };
}

/**
 * Validate owner reply
 */
export function validateOwnerReply(reply: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = reply.trim();

  if (!trimmed) {
    return { valid: false, error: '답변 내용을 입력해주세요' };
  }

  if (trimmed.length < 5) {
    return { valid: false, error: '답변은 최소 5자 이상 작성해주세요' };
  }

  if (trimmed.length > 300) {
    return { valid: false, error: '답변은 최대 300자까지 작성 가능합니다' };
  }

  return { valid: true };
}

/**
 * Get review summary statistics
 */
export function getReviewSummary(reviews: Review[]): {
  total: number;
  withReplies: number;
  withoutReplies: number;
  replyRate: number;
  averageRating: number;
  recentReviews: number;
} {
  const withReplies = getReviewsWithReplies(reviews);
  const withoutReplies = getReviewsWithoutReplies(reviews);
  const recentReviews = reviews.filter(isRecentReview);

  return {
    total: reviews.length,
    withReplies: withReplies.length,
    withoutReplies: withoutReplies.length,
    replyRate: reviews.length > 0 ? Math.round((withReplies.length / reviews.length) * 100) : 0,
    averageRating: calculateAverageRating(reviews),
    recentReviews: recentReviews.length,
  };
}

/**
 * Generate review preview text (truncated)
 */
export function getReviewPreview(comment: string, maxLength: number = 100): string {
  if (comment.length <= maxLength) return comment;
  return comment.substring(0, maxLength).trim() + '...';
}

/**
 * Get placeholder text for empty reviews
 */
export function getEmptyReviewsMessage(hasCompletedReservation: boolean): string {
  if (!hasCompletedReservation) {
    return '아직 작성된 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!';
  }
  return '아직 작성된 리뷰가 없습니다.';
}

/**
 * Check if user should be prompted to write a review
 */
export function shouldPromptReview(
  hasCompletedReservation: boolean,
  hasWrittenReview: boolean,
  daysSinceReservation: number
): boolean {
  return hasCompletedReservation && !hasWrittenReview && daysSinceReservation <= 14;
}

/**
 * Export review data as CSV
 */
export function exportReviewsToCSV(reviews: Review[]): string {
  const headers = ['날짜', '별점', '리뷰', '사장님답변', '답변일시'];
  const rows = reviews.map((review) => [
    new Date(review.created_at).toLocaleDateString('ko-KR'),
    review.rating.toString(),
    `"${review.comment.replace(/"/g, '""')}"`,
    review.owner_reply ? `"${review.owner_reply.replace(/"/g, '""')}"` : '',
    review.owner_replied_at
      ? new Date(review.owner_replied_at).toLocaleDateString('ko-KR')
      : '',
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

/**
 * Get review quality score (0-100)
 * Based on length, detail, and other factors
 */
export function getReviewQualityScore(review: Review): number {
  let score = 0;

  // Length score (max 40 points)
  const wordCount = review.comment.split(/\s+/).length;
  score += Math.min(wordCount * 2, 40);

  // Has images (20 points)
  if (review.images && review.images.length > 0) {
    score += 20;
  }

  // Linked to reservation (10 points)
  if (review.reservation_id) {
    score += 10;
  }

  // Received reply (15 points)
  if (review.owner_reply) {
    score += 15;
  }

  // Detailed review bonus (15 points)
  if (review.comment.length > 100) {
    score += 15;
  }

  return Math.min(score, 100);
}
