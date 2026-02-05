'use client';

import { useRef, useEffect, useCallback } from 'react';
import { ChatMessage, SenderType } from '@/types/chat';
import { ChatBubble, DateSeparator, SystemMessage } from './ChatBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronUp, MessageCircle } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserType: SenderType;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function ChatMessageList({
  messages,
  currentUserId,
  currentUserType,
  isLoading = false,
  hasMore = false,
  onLoadMore,
}: ChatMessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // New message added
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (onLoadMore && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoading]);

  // Empty state
  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm text-center">
          아직 메시지가 없습니다.
          <br />
          대화를 시작해보세요!
        </p>
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="flex-1 p-4"
    >
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="text-gray-500"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                불러오는 중...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ChevronUp className="h-4 w-4" />
                이전 메시지 보기
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Messages grouped by date */}
      <div className="space-y-4">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <DateSeparator date={date} />
            <div className="space-y-2">
              {dateMessages.map((message) =>
                message.message_type === 'system' ? (
                  <SystemMessage
                    key={message.id}
                    content={message.content}
                    timestamp={message.created_at}
                  />
                ) : (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_type === currentUserType}
                    showReadStatus={message.sender_type === currentUserType}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
}

// =========================
// Helper Functions
// =========================

function groupMessagesByDate(messages: ChatMessage[]): Record<string, ChatMessage[]> {
  return messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);
}

// =========================
// Loading Skeleton
// =========================

export function ChatMessageListSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Date separator skeleton */}
      <div className="flex items-center justify-center py-4">
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Message skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`${i % 2 === 0 ? 'bg-blue-100' : 'bg-gray-100'} rounded-2xl p-3`}
          >
            <Skeleton className={`h-4 w-${[24, 32, 48, 40, 28][i - 1]}`} />
            <Skeleton className="h-3 w-12 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
