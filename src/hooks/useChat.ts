'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  ChatRoom,
  ChatRoomWithShop,
  ChatRoomWithCustomer,
  ChatMessage,
  SenderType,
} from '@/types/chat';
import {
  fetchChatMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToRoomMessages,
  subscribeToMessageUpdates,
  unsubscribeChannel,
  getOrCreateChatRoom,
  fetchChatRoomWithShop,
  fetchChatRoomWithCustomer,
} from '@/lib/api/chat';

interface UseChatOptions {
  roomId: string;
  userId: string;
  userType: SenderType;
  autoMarkAsRead?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  room: ChatRoomWithShop | ChatRoomWithCustomer | null;
  hasMore: boolean;
  sendChatMessage: (content: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: () => Promise<void>;
}

/**
 * Custom hook for real-time chat functionality
 */
export function useChat({
  roomId,
  userId,
  userType,
  autoMarkAsRead = true,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<ChatRoomWithShop | ChatRoomWithCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const updateChannelRef = useRef<RealtimeChannel | null>(null);

  // Load initial messages and room data
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch room details
        const roomData =
          userType === 'customer'
            ? await fetchChatRoomWithShop(roomId)
            : await fetchChatRoomWithCustomer(roomId);

        if (!roomData) {
          setError('채팅방을 찾을 수 없습니다.');
          return;
        }

        setRoom(roomData);

        // Fetch initial messages
        const initialMessages = await fetchChatMessages(roomId, 50);
        setMessages(initialMessages);
        setHasMore(initialMessages.length >= 50);

        // Auto mark as read
        if (autoMarkAsRead) {
          await markMessagesAsRead(roomId, userType);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
        setError('채팅을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [roomId, userType, autoMarkAsRead]);

  // Subscribe to realtime messages
  useEffect(() => {
    // Subscribe to new messages
    messageChannelRef.current = subscribeToRoomMessages(roomId, (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      // Auto mark as read if message is from the other party
      if (autoMarkAsRead && newMessage.sender_type !== userType) {
        markMessagesAsRead(roomId, userType).catch(console.error);
      }
    });

    // Subscribe to message updates (read receipts)
    updateChannelRef.current = subscribeToMessageUpdates(roomId, (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
      );
    });

    return () => {
      if (messageChannelRef.current) {
        unsubscribeChannel(messageChannelRef.current);
      }
      if (updateChannelRef.current) {
        unsubscribeChannel(updateChannelRef.current);
      }
    };
  }, [roomId, userType, autoMarkAsRead]);

  // Send a new message
  const sendChatMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      try {
        setIsSending(true);
        setError(null);

        const newMessage = await sendMessage(roomId, userId, userType, content.trim());

        // Optimistically add message (will be deduplicated by realtime)
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      } catch (err) {
        console.error('Failed to send message:', err);
        setError('메시지 전송에 실패했습니다.');
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [roomId, userId, userType, isSending]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoading || messages.length === 0) return;

    try {
      setIsLoading(true);
      const oldestMessage = messages[0];
      const olderMessages = await fetchChatMessages(roomId, 50, oldestMessage.created_at);

      if (olderMessages.length < 50) {
        setHasMore(false);
      }

      setMessages((prev) => [...olderMessages, ...prev]);
    } catch (err) {
      console.error('Failed to load more messages:', err);
      setError('이전 메시지를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, hasMore, isLoading, messages]);

  // Manual mark as read
  const markAsRead = useCallback(async () => {
    try {
      await markMessagesAsRead(roomId, userType);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [roomId, userType]);

  return {
    messages,
    isLoading,
    isSending,
    error,
    room,
    hasMore,
    sendChatMessage,
    loadMoreMessages,
    markAsRead,
  };
}

// =========================
// Hook for Chat Room List
// =========================

interface UseChatRoomsOptions {
  userId: string;
  userType: SenderType;
  shopId?: string; // Required for partner view
}

interface UseChatRoomsReturn {
  rooms: (ChatRoomWithShop | ChatRoomWithCustomer)[];
  isLoading: boolean;
  error: string | null;
  totalUnread: number;
  refresh: () => Promise<void>;
}

export function useChatRooms({
  userId,
  userType,
  shopId,
}: UseChatRoomsOptions): UseChatRoomsReturn {
  const [rooms, setRooms] = useState<(ChatRoomWithShop | ChatRoomWithCustomer)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { fetchCustomerChatRooms, fetchShopChatRooms, getCustomerTotalUnreadCount, getShopTotalUnreadCount } =
        await import('@/lib/api/chat');

      if (userType === 'customer') {
        const [roomsData, unreadCount] = await Promise.all([
          fetchCustomerChatRooms(userId),
          getCustomerTotalUnreadCount(userId),
        ]);
        setRooms(roomsData);
        setTotalUnread(unreadCount);
      } else if (shopId) {
        const [roomsData, unreadCount] = await Promise.all([
          fetchShopChatRooms(shopId),
          getShopTotalUnreadCount(shopId),
        ]);
        setRooms(roomsData);
        setTotalUnread(unreadCount);
      }
    } catch (err: any) {
      console.error('Failed to load chat rooms:', err);
      // Handle table not found error gracefully
      if (err?.code === 'PGRST205' || err?.message?.includes('chat_rooms')) {
        setRooms([]);
        setTotalUnread(0);
        // Don't show error to user - just show empty state
      } else {
        setError('채팅 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType, shopId]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Subscribe to room updates
  useEffect(() => {
    const { subscribeToCustomerRooms, subscribeToShopRooms, unsubscribeChannel } =
      require('@/lib/api/chat');

    if (userType === 'customer') {
      channelRef.current = subscribeToCustomerRooms(userId, () => {
        loadRooms();
      });
    } else if (shopId) {
      channelRef.current = subscribeToShopRooms(shopId, () => {
        loadRooms();
      });
    }

    return () => {
      if (channelRef.current) {
        unsubscribeChannel(channelRef.current);
      }
    };
  }, [userId, userType, shopId, loadRooms]);

  return {
    rooms,
    isLoading,
    error,
    totalUnread,
    refresh: loadRooms,
  };
}

// =========================
// Hook for Creating/Getting Room
// =========================

interface UseCreateRoomOptions {
  customerId: string;
  shopId: string;
}

interface UseCreateRoomReturn {
  room: ChatRoom | null;
  isLoading: boolean;
  error: string | null;
  createRoom: () => Promise<ChatRoom | null>;
}

export function useCreateRoom({
  customerId,
  shopId,
}: UseCreateRoomOptions): UseCreateRoomReturn {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newRoom = await getOrCreateChatRoom(customerId, shopId);
      setRoom(newRoom);
      return newRoom;
    } catch (err) {
      console.error('Failed to create chat room:', err);
      setError('채팅방을 생성하는데 실패했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [customerId, shopId]);

  return {
    room,
    isLoading,
    error,
    createRoom,
  };
}
