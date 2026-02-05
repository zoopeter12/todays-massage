'use client';

import { cn } from '@/lib/utils';
import { ChatMessage, SenderType } from '@/types/chat';
import { Check, CheckCheck } from 'lucide-react';
import { formatMessageTime } from '@/lib/api/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showReadStatus?: boolean;
}

export function ChatBubble({ message, isOwn, showReadStatus = true }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[75%] rounded-2xl px-4 py-2.5',
          isOwn
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        )}
      >
        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Timestamp and read status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isOwn ? 'text-blue-100' : 'text-gray-400'
            )}
          >
            {formatMessageTime(message.created_at)}
          </span>

          {/* Read status indicator (only for own messages) */}
          {isOwn && showReadStatus && (
            <span className="text-blue-100">
              {message.is_read ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================
// System Message Component
// =========================

interface SystemMessageProps {
  content: string;
  timestamp?: string;
}

export function SystemMessage({ content, timestamp }: SystemMessageProps) {
  return (
    <div className="flex justify-center py-2">
      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full">
        {content}
        {timestamp && (
          <span className="ml-2 text-gray-400">
            {formatMessageTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

// =========================
// Date Separator Component
// =========================

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="px-4 text-xs text-gray-500">{formattedDate}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// =========================
// Typing Indicator Component
// =========================

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
