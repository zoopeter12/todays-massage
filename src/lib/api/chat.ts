import { supabase } from '@/lib/supabase/client';
import {
  ChatRoom,
  ChatRoomWithDetails,
  ChatRoomWithShop,
  ChatRoomWithCustomer,
  ChatMessage,
  ChatMessageInsert,
  SenderType,
} from '@/types/chat';
import { RealtimeChannel } from '@supabase/supabase-js';

// =========================
// Room Management
// =========================

/**
 * Get or create a chat room between customer and shop
 * Returns existing room if one exists, otherwise creates a new one
 */
export async function getOrCreateChatRoom(
  customerId: string,
  shopId: string
): Promise<ChatRoom> {
  // First, try to find existing room
  const { data: existingRoom, error: findError } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('customer_id', customerId)
    .eq('shop_id', shopId)
    .single();

  if (existingRoom) {
    return existingRoom;
  }

  // Room doesn't exist, create a new one
  if (findError && findError.code === 'PGRST116') {
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert({
        customer_id: customerId,
        shop_id: shopId,
      })
      .select('*')
      .single();

    if (createError) throw createError;
    return newRoom;
  }

  throw findError;
}

/**
 * Fetch chat room by ID with shop details (for customer view)
 */
export async function fetchChatRoomWithShop(
  roomId: string
): Promise<ChatRoomWithShop | null> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*, shop:shops(*)')
    .eq('id', roomId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Fetch chat room by ID with customer details (for partner view)
 */
export async function fetchChatRoomWithCustomer(
  roomId: string
): Promise<ChatRoomWithCustomer | null> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*, customer:profiles(*)')
    .eq('id', roomId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Fetch all chat rooms for a customer (with shop details)
 */
export async function fetchCustomerChatRooms(
  customerId: string
): Promise<ChatRoomWithShop[]> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*, shop:shops(*)')
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  // Handle table not found gracefully
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('chat_rooms')) {
      console.warn('Chat rooms table not found');
      return [];
    }
    throw error;
  }
  return data || [];
}

/**
 * Fetch all chat rooms for a shop (with customer details)
 */
export async function fetchShopChatRooms(
  shopId: string
): Promise<ChatRoomWithCustomer[]> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*, customer:profiles(*)')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  // Handle table not found gracefully
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('chat_rooms')) {
      console.warn('Chat rooms table not found');
      return [];
    }
    throw error;
  }
  return data || [];
}

/**
 * Get total unread count for a customer across all rooms
 */
export async function getCustomerTotalUnreadCount(
  customerId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('customer_unread_count')
    .eq('customer_id', customerId)
    .eq('is_active', true);

  // Handle table not found gracefully
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('chat_rooms')) {
      return 0;
    }
    throw error;
  }

  return (data || []).reduce(
    (sum, room) => sum + (room.customer_unread_count || 0),
    0
  );
}

/**
 * Get total unread count for a shop across all rooms
 */
export async function getShopTotalUnreadCount(shopId: string): Promise<number> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('shop_unread_count')
    .eq('shop_id', shopId)
    .eq('is_active', true);

  // Handle table not found gracefully
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('chat_rooms')) {
      return 0;
    }
    throw error;
  }

  return (data || []).reduce(
    (sum, room) => sum + (room.shop_unread_count || 0),
    0
  );
}

// =========================
// Message Management
// =========================

/**
 * Fetch messages for a chat room with pagination
 */
export async function fetchChatMessages(
  roomId: string,
  limit: number = 50,
  beforeTimestamp?: string
): Promise<ChatMessage[]> {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (beforeTimestamp) {
    query = query.lt('created_at', beforeTimestamp);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Return in chronological order (oldest first)
  return (data || []).reverse();
}

/**
 * Send a new message
 */
export async function sendMessage(
  roomId: string,
  senderId: string,
  senderType: SenderType,
  content: string,
  messageType: 'text' | 'image' | 'system' = 'text'
): Promise<ChatMessage> {
  const messageData: ChatMessageInsert = {
    room_id: roomId,
    sender_id: senderId,
    sender_type: senderType,
    content,
    message_type: messageType,
  };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messageData)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all messages in a room as read for a specific reader
 */
export async function markMessagesAsRead(
  roomId: string,
  readerType: SenderType
): Promise<void> {
  const { error } = await supabase.rpc('mark_messages_as_read', {
    p_room_id: roomId,
    p_reader_type: readerType,
  });

  // Fallback if RPC doesn't exist
  if (error) {
    console.warn('RPC not available, using fallback:', error);

    // Mark messages as read manually
    await supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('is_read', false)
      .neq('sender_type', readerType);

    // Reset unread count
    const updateField =
      readerType === 'customer'
        ? { customer_unread_count: 0, customer_last_read_at: new Date().toISOString() }
        : { shop_unread_count: 0, shop_last_read_at: new Date().toISOString() };

    await supabase.from('chat_rooms').update(updateField).eq('id', roomId);
  }
}

// =========================
// Realtime Subscriptions
// =========================

/**
 * Subscribe to new messages in a specific room
 */
export function subscribeToRoomMessages(
  roomId: string,
  onMessage: (message: ChatMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`room-messages:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to message read status updates in a room
 */
export function subscribeToMessageUpdates(
  roomId: string,
  onUpdate: (message: ChatMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`room-message-updates:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onUpdate(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to chat room list updates for a customer
 */
export function subscribeToCustomerRooms(
  customerId: string,
  onUpdate: (room: ChatRoom) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`customer-rooms:${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_rooms',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        onUpdate(payload.new as ChatRoom);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to chat room list updates for a shop
 */
export function subscribeToShopRooms(
  shopId: string,
  onUpdate: (room: ChatRoom) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`shop-rooms:${shopId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_rooms',
        filter: `shop_id=eq.${shopId}`,
      },
      (payload) => {
        onUpdate(payload.new as ChatRoom);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a realtime channel
 */
export function unsubscribeChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

// =========================
// Utility Functions
// =========================

/**
 * Format message timestamp for display
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format room last message time for list display
 */
export function formatRoomTime(timestamp: string | null): string {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '어제';
  }

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate message preview text
 */
export function truncatePreview(text: string | null, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
