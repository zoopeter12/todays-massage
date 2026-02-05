'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useChat } from '@/hooks/useChat';
import { fetchChatRoomWithCustomer } from '@/lib/api/chat';
import {
  ChatMessageList,
  ChatMessageListSkeleton,
  ChatInput,
  PartnerChatHeader,
} from '@/components/chat';
import { Profile } from '@/types/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

/**
 * Partner Chat Room Page
 * Real-time chat between partner and customer
 */
export default function PartnerChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize: Get user and room details
  useEffect(() => {
    async function initialize() {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/login?redirect=/partner/chat/${roomId}`);
          return;
        }
        setUserId(user.id);

        // Fetch room with customer details
        const roomData = await fetchChatRoomWithCustomer(roomId);
        if (!roomData) {
          setInitError('채팅방을 찾을 수 없습니다.');
          return;
        }

        setCustomer(roomData.customer);

      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setInitError('채팅을 불러오는데 실패했습니다.');
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();
  }, [roomId, router]);

  // Chat hook
  const {
    messages,
    isLoading: isMessagesLoading,
    isSending,
    error: chatError,
    hasMore,
    sendChatMessage,
    loadMoreMessages,
  } = useChat({
    roomId: roomId,
    userId: userId || '',
    userType: 'partner',
    autoMarkAsRead: true,
  });

  const handleBack = useCallback(() => {
    router.push('/partner/chat');
  }, [router]);

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
            <Skeleton className="h-3 w-32" />
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
          onClick={() => router.push('/partner/chat')}
          className="text-blue-500 underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  // Not ready state
  if (!customer || !userId) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <PartnerChatHeader
        customer={customer}
        onBack={handleBack}
      />

      {/* Messages */}
      <ChatMessageList
        messages={messages}
        currentUserId={userId}
        currentUserType="partner"
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
        placeholder="답변을 입력하세요..."
      />
    </div>
  );
}
