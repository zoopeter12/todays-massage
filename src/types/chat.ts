/**
 * Chat System Type Definitions
 * Tables: chat_rooms, chat_messages
 */

// =========================
// Enums
// =========================

export type SenderType = 'customer' | 'partner';
export type MessageType = 'text' | 'image' | 'system';

// =========================
// Table Row Types
// =========================

export interface ChatRoom {
  id: string;
  customer_id: string;
  shop_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  customer_last_read_at: string;
  shop_last_read_at: string;
  customer_unread_count: number;
  shop_unread_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: SenderType;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// =========================
// Insert Types
// =========================

export interface ChatRoomInsert {
  id?: string;
  customer_id: string;
  shop_id: string;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  customer_last_read_at?: string;
  shop_last_read_at?: string;
  customer_unread_count?: number;
  shop_unread_count?: number;
  is_active?: boolean;
}

export interface ChatMessageInsert {
  id?: string;
  room_id: string;
  sender_id: string;
  sender_type: SenderType;
  content: string;
  message_type?: MessageType;
  is_read?: boolean;
  read_at?: string | null;
}

// =========================
// Update Types
// =========================

export interface ChatRoomUpdate {
  last_message_at?: string | null;
  last_message_preview?: string | null;
  customer_last_read_at?: string;
  shop_last_read_at?: string;
  customer_unread_count?: number;
  shop_unread_count?: number;
  is_active?: boolean;
}

export interface ChatMessageUpdate {
  is_read?: boolean;
  read_at?: string | null;
}

// =========================
// Relations (for joined queries)
// =========================

import { Profile, Shop } from './supabase';

export interface ChatRoomWithDetails extends ChatRoom {
  customer: Profile;
  shop: Shop;
}

export interface ChatRoomWithShop extends ChatRoom {
  shop: Shop;
}

export interface ChatRoomWithCustomer extends ChatRoom {
  customer: Profile;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender: Profile;
}

// =========================
// Realtime Payload Types
// =========================

export interface RealtimeMessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: ChatMessage | null;
  old: ChatMessage | null;
}

export interface RealtimeRoomPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: ChatRoom | null;
  old: ChatRoom | null;
}

// =========================
// UI State Types
// =========================

export interface ChatState {
  rooms: ChatRoomWithDetails[];
  currentRoom: ChatRoomWithDetails | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

export interface ChatInputState {
  message: string;
  isTyping: boolean;
}
