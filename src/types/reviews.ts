/**
 * Review System Type Definitions
 * Includes reviews, ratings, and statistics types
 */

export interface Review {
  id: string;
  shop_id: string;
  user_id: string;
  reservation_id: string | null;
  rating: number; // 1-5
  comment: string;
  images: string[];
  owner_reply: string | null;
  owner_replied_at: string | null;
  created_at: string;
  user?: {
    nickname: string | null;
  };
}

export interface ReviewInsert {
  id?: string;
  shop_id: string;
  user_id: string;
  reservation_id?: string | null;
  rating: number;
  comment: string;
  images?: string[];
}

export interface ReviewUpdate {
  rating?: number;
  comment?: string;
  images?: string[];
  owner_reply?: string | null;
}

export interface ShopRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export type ReviewSortOption = 'latest' | 'highest' | 'lowest';

// =========================
// Report Types
// =========================

export type ReportReason = 'profanity' | 'false_info' | 'spam' | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export type ReportTargetType = 'shop' | 'review' | 'user' | 'chat';

export interface ReviewReport {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description: string | null;
  evidence_urls: string[];
  status: ReportStatus;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewReportInsert {
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description?: string;
  evidence_urls?: string[];
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  profanity: '욕설/비방',
  false_info: '허위 정보',
  spam: '스팸/광고',
  other: '기타',
};
