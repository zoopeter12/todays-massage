/**
 * Admin Type Definitions
 * 관리자 페이지에서 사용하는 타입 정의
 */

// =========================
// User Management Types
// =========================

export interface AdminUser {
  id: string;
  role: 'customer' | 'partner' | 'admin';
  nickname: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_provider: 'phone' | 'google' | 'kakao' | null;
  status: 'active' | 'suspended' | 'withdrawn';
  suspension_reason: string | null;
  suspension_until: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  reservation_count: number;
  total_spent: number;
}

export interface UserSuspension {
  user_id: string;
  reason: string;
  duration_days: number | null; // null = permanent
  suspended_at: string;
  suspended_by: string;
}

// =========================
// Shop Management Types
// =========================

export interface AdminShop {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string | null;
  owner_phone: string | null;
  category: string | null;
  address: string | null;
  tel: string | null;
  lat: number | null;
  lng: number | null;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  tier: 'basic' | 'premium' | 'vip';
  commission_rate: number; // default 10%
  is_open: boolean;
  view_count: number;
  reservation_count: number;
  average_rating: number;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
}

export interface ShopApproval {
  shop_id: string;
  approved: boolean;
  rejection_reason?: string;
  approved_by: string;
}

// =========================
// Settlement Types
// =========================

export interface AdminSettlement {
  id: string;
  shop_id: string;
  shop_name: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_reservations: number;
  commission_rate: number;
  platform_fee: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bank_name: string | null;
  bank_account: string | null;
  account_holder: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface RefundRequest {
  id: string;
  reservation_id: string;
  shop_name: string;
  customer_name: string | null;
  customer_phone: string | null;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
}

// =========================
// Content Management Types
// =========================

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'event' | 'maintenance' | 'policy';
  is_pinned: boolean;
  is_published: boolean;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  view_count: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'reservation' | 'payment' | 'account' | 'partner';
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: 'main' | 'search' | 'detail';
  is_active: boolean;
  start_date: string;
  end_date: string;
  order: number;
  click_count: number;
  created_at: string;
}

export interface Popup {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string;
  show_today_hide: boolean;
  created_at: string;
}

// =========================
// Report Management Types
// =========================

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  target_type: 'shop' | 'review' | 'user' | 'chat';
  target_id: string;
  target_name: string | null;
  reason: string;
  description: string | null;
  evidence_urls: string[];
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface CustomerInquiry {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_phone: string | null;
  category: 'general' | 'reservation' | 'payment' | 'technical' | 'complaint';
  subject: string;
  content: string;
  attachments: string[];
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
}

// =========================
// System Settings Types
// =========================

export interface AdminRole {
  id: string;
  name: string;
  permissions: Permission[];
  created_at: string;
}

export type Permission =
  | 'users.view' | 'users.edit' | 'users.suspend' | 'users.delete'
  | 'shops.view' | 'shops.approve' | 'shops.edit' | 'shops.suspend'
  | 'settlements.view' | 'settlements.process' | 'settlements.edit'
  | 'content.view' | 'content.edit' | 'content.publish'
  | 'reports.view' | 'reports.resolve'
  | 'settings.view' | 'settings.edit'
  | 'admin.full';

export interface AdminLog {
  id: string;
  admin_id: string | null;
  admin_name: string | null;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SystemConfig {
  key: string;
  value: string;
  description: string;
  category: 'general' | 'payment' | 'notification' | 'security';
  updated_at: string;
  updated_by: string | null;
}

export interface SystemSettingRow {
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// =========================
// Dashboard Stats Types
// =========================

export interface DashboardStats {
  totalUsers: number;
  totalShops: number;
  totalReservations: number;
  todayReservations: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingShops: number;
  pendingReports: number;
  pendingSettlements: number;
  activeUsers: number;
}

export interface RevenueChart {
  date: string;
  revenue: number;
  reservations: number;
}

export interface TopShop {
  id: string;
  name: string;
  reservations: number;
  revenue: number;
}
