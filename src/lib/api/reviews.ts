/**
 * Review API Functions
 * Handles all review-related database operations
 */

import { supabase } from '@/lib/supabase/client';
import type {
  Review,
  ReviewInsert,
  ShopRatingStats,
  ReviewSortOption,
  ReviewReport,
  ReviewReportInsert,
} from '@/types/reviews';

/**
 * Fetch reviews for a specific shop
 */
export async function fetchShopReviews(
  shopId: string,
  sortBy: ReviewSortOption = 'latest'
): Promise<Review[]> {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      user:profiles!user_id (
        nickname
      )
    `)
    .eq('shop_id', shopId);

  // Apply sorting
  switch (sortBy) {
    case 'highest':
      query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'lowest':
      query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
      break;
    case 'latest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new review
 */
export async function createReview(reviewData: ReviewInsert): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select(`
      *,
      user:profiles!user_id (
        nickname
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create review: ${error.message}`);
  }

  return data;
}

/**
 * Delete a review (user can only delete their own)
 */
export async function deleteReview(reviewId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete review: ${error.message}`);
  }
}

/**
 * Add owner reply to a review
 */
export async function replyToReview(reviewId: string, reply: string): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      owner_reply: reply,
      owner_replied_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select(`
      *,
      user:profiles!user_id (
        nickname
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to reply to review: ${error.message}`);
  }

  return data;
}

/**
 * Fetch reviews written by a user
 */
export async function fetchMyReviews(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles!user_id (
        nickname
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user reviews: ${error.message}`);
  }

  return data || [];
}

/**
 * Get rating statistics for a shop
 */
export async function getShopRatingStats(shopId: string): Promise<ShopRatingStats> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('shop_id', shopId);

  if (error) {
    throw new Error(`Failed to fetch rating stats: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  // Calculate average rating
  const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / data.length;

  // Calculate rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  data.forEach((review) => {
    const rating = review.rating as 1 | 2 | 3 | 4 | 5;
    ratingDistribution[rating]++;
  });

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: data.length,
    ratingDistribution,
  };
}

/**
 * Check if user can write a review for a shop
 * (User must have a completed reservation)
 */
export async function canUserReview(userId: string, shopId: string): Promise<boolean> {
  // Check if user has a completed reservation
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('id')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .limit(1);

  if (resError) {
    return false;
  }

  if (!reservations || reservations.length === 0) {
    return false;
  }

  // Check if user already reviewed this shop
  const { data: existingReview, error: revError } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .limit(1);

  if (revError) {
    return false;
  }

  return !existingReview || existingReview.length === 0;
}

// =========================
// Report Functions
// =========================

/**
 * Report a review
 */
export async function reportReview(reportData: ReviewReportInsert): Promise<ReviewReport> {
  const { data, error } = await supabase
    .from('reports')
    .insert(reportData)
    .select()
    .single();

  if (error) {
    // Handle duplicate report error
    if (error.code === '23505') {
      throw new Error('이미 신고한 리뷰입니다.');
    }
    throw new Error(`Failed to report review: ${error.message}`);
  }

  return data;
}

/**
 * Check if user has already reported a target
 */
export async function hasUserReported(
  userId: string,
  targetType: 'review' | 'shop' | 'user' | 'chat',
  targetId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .in('status', ['pending', 'reviewing'])
    .limit(1);

  if (error) {
    return false;
  }

  return data && data.length > 0;
}

/**
 * Get reports by user
 */
export async function fetchMyReports(userId: string): Promise<ReviewReport[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  return data || [];
}
