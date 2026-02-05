/**
 * Database Helper Types
 * Helper types for working with Supabase database queries
 */

// Report from database with joined reporter profile
export interface ReportWithReporter {
  id: string;
  reporter_id: string;
  target_type: 'shop' | 'review' | 'user' | 'chat';
  target_id: string;
  reason: string;
  description: string | null;
  evidence_urls: string[] | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reporter: {
    nickname: string | null;
    phone: string | null;
  } | null;
}

// CustomerInquiry from database with joined user profile
export interface CustomerInquiryWithUser {
  id: string;
  user_id: string | null;
  user_name: string;
  user_phone: string;
  category: 'general' | 'reservation' | 'payment' | 'technical' | 'complaint';
  subject: string;
  content: string;
  attachments: string[] | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    nickname: string | null;
    phone: string | null;
  } | null;
}
