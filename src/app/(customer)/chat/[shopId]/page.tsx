'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useChat, useCreateRoom } from '@/hooks/useChat';
import { getOrCreateChatRoom } from '@/lib/api/chat';
import { fetchShopById } from '@/lib/api/shops';
import {
  ChatMessageList,
  ChatMessageListSkeleton,
  ChatInput,
  CustomerChatHeader,
} from '@/components/chat';
import { Shop } from '@/types/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

/**
 * Customer Chat Room Page
 * Real-time chat between customer and shop
 */
export default function CustomerChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.shopId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize: Get user, shop, and create/get room
  useEffect(() => {
    async function initialize() {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/login?redirect=/chat/${shopId}`);
          return;
        }
        setUserId(user.id);

        // Fetch shop details
        const shopData = await fetchShopById(shopId);
        if (!shopData) {
          setInitError('샵을 찾을 수 없습니다.');
          return;
        }
        setShop(shopData);

        // Get or create chat room
        const room = await getOrCreateChatRoom(user.id, shopId);
        setRoomId(room.id);

      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setInitError('채팅을 시작하는데 실패했습니다.');
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();
  }, [shopId, router]);

  // Chat hook - only activate when roomId is available
  const {
    messages,
    isLoading: isMessagesLoading,
    isSending,
    error: chatError,
    hasMore,
    sendChatMessage,
    loadMoreMessages,
  } = useChat({
    roomId: roomId || '',
    userId: userId || '',
    userType: 'customer',
    autoMarkAsRead: true,
  });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleCall = useCallback(() => {
    if (shop?.tel) {
      window.open(`tel:${shop.tel}`);
    }
  }, [shop]);

  const handleSendMessage = useCallback(async (content: string) => {
    try {
      await sendChatMessage(content);
    } catch (error) {
      toast.error('메시지 전송에 실패했습니다.');
    }
  }, [sendChatMessage]);

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header skeleton */}
        <div className="h-14 border-b flex items-center px-4 gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <ChatMessageListSkeleton />
        <div className="h-16 border-t" />
      </div>
    );
  }

  // Error state
  if (initError) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center p-8">
        <p className="text-red-500 text-center mb-4">{initError}</p>
        <button
          onClick={() => router.back()}
          className="text-blue-500 underline"
        >
          돌아가기
        </button>
      </div>
    );
  }

  // Not ready state
  if (!shop || !roomId || !userId) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <CustomerChatHeader
        shop={shop}
        onBack={handleBack}
        onCall={shop.tel ? handleCall : undefined}
      />

      {/* Messages */}
      <ChatMessageList
        messages={messages}
        currentUserId={userId}
        currentUserType="customer"
        isLoading={isMessagesLoading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
      />

      {/* Error banner */}
      {chatError && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm text-center">
          {chatError}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isSending}
        placeholder={`${shop.name}에 문의하기...`}
      />
    </div>
  );
}
