/**
 * Supabase Database Type Definitions
 * Auto-generated from schema: profiles, shops, courses, reservations
 */

// =========================
// Table Row Types
// =========================

export interface Profile {
  id: string;
  role: string;
  nickname: string | null;
  phone: string | null;
  avatar_url: string | null;
  auth_provider: 'phone' | 'google' | 'kakao' | null;
  referral_code: string | null;
  referred_by: string | null;
  referral_count: number;
  status: 'active' | 'suspended' | 'deleted';
  suspension_reason: string | null;
  suspended_until: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
}

import { OperatingHours } from './staff';

export type ShopStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Shop {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  tel: string | null;
  category: string | null;
  images: string[];
  view_count: number;
  is_open: boolean;
  operating_hours: OperatingHours | null;
  owner_id: string | null;
  tier: 'basic' | 'premium' | 'vip';
  tier_changed_at: string | null;
  status: ShopStatus;
  rejection_reason: string | null;
  rejected_at: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_original: number;
  price_discount: number | null;
  duration: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  user_id: string | null;
  shop_id: string;
  course_id: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
}

// =========================
// Insert Types (omit auto-generated fields)
// =========================

export interface ProfileInsert {
  id: string; // must match auth.users id
  role?: string;
  nickname?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  auth_provider?: 'phone' | 'google' | 'kakao' | null;
  referral_code?: string | null;
  referred_by?: string | null;
}

export interface ShopInsert {
  id?: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  tel?: string | null;
  category?: string | null;
  images?: string[];
  view_count?: number;
  is_open?: boolean;
  operating_hours?: OperatingHours | null;
  owner_id?: string | null;
  tier?: 'basic' | 'premium' | 'vip';
  tier_changed_at?: string | null;
  status?: ShopStatus;
  rejection_reason?: string | null;
  rejected_at?: string | null;
}

export interface CourseInsert {
  id?: string;
  shop_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price_original: number;
  price_discount?: number | null;
  duration?: number;
}

export interface ReservationInsert {
  id?: string;
  user_id: string | null;
  shop_id: string;
  course_id: string;
  date: string;
  time: string;
  status?: string;
}

// =========================
// Update Types (all fields optional)
// =========================

export interface ProfileUpdate {
  role?: string;
  nickname?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  auth_provider?: 'phone' | 'google' | 'kakao' | null;
  referral_code?: string | null;
  referred_by?: string | null;
  referral_count?: number;
}

export interface ShopUpdate {
  name?: string;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  tel?: string | null;
  category?: string | null;
  images?: string[];
  view_count?: number;
  is_open?: boolean;
  operating_hours?: OperatingHours | null;
  owner_id?: string | null;
  tier?: 'basic' | 'premium' | 'vip';
  tier_changed_at?: string | null;
  status?: ShopStatus;
  rejection_reason?: string | null;
  rejected_at?: string | null;
}

export interface CourseUpdate {
  shop_id?: string;
  name?: string;
  description?: string | null;
  image_url?: string | null;
  price_original?: number;
  price_discount?: number | null;
  duration?: number;
}

export interface ReservationUpdate {
  date?: string;
  time?: string;
  status?: string;
}

// =========================
// Supabase Database Schema Type
// =========================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      shops: {
        Row: Shop;
        Insert: ShopInsert;
        Update: ShopUpdate;
        Relationships: [
          {
            foreignKeyName: string;
            columns: string[];
            referencedRelation: string;
            referencedColumns: string[];
          }
        ];
      };
      courses: {
        Row: Course;
        Insert: CourseInsert;
        Update: CourseUpdate;
        Relationships: [
          {
            foreignKeyName: string;
            columns: ['shop_id'];
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          }
        ];
      };
      reservations: {
        Row: Reservation;
        Insert: ReservationInsert;
        Update: ReservationUpdate;
        Relationships: [
          {
            foreignKeyName: string;
            columns: ['shop_id'];
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// =========================
// Reservation Status Enum (application-level)
// =========================

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// =========================
// Relations (for joined queries)
// =========================

export interface CourseWithShop extends Course {
  shop: Shop;
}

export interface ReservationWithDetails extends Reservation {
  shop: Shop;
  course: Course;
  user: Profile | null;
}

export interface ShopWithCourses extends Shop {
  courses: Course[];
}

// =========================
// Chat Types (re-export for convenience)
// =========================

export type {
  ChatRoom,
  ChatMessage,
  ChatRoomWithDetails,
  ChatRoomWithShop,
  ChatRoomWithCustomer,
  SenderType,
  MessageType,
} from './chat';
