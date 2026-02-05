'use client';

import { ChatRoomWithShop, ChatRoomWithCustomer, SenderType } from '@/types/chat';
import { formatRoomTime, truncatePreview } from '@/lib/api/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MessageCircle, Store } from 'lucide-react';

// =========================
// Chat Room Item for Customer
// =========================

interface CustomerChatRoomItemProps {
  room: ChatRoomWithShop;
  onClick: () => void;
  isActive?: boolean;
}

export function CustomerChatRoomItem({
  room,
  onClick,
  isActive = false,
}: CustomerChatRoomItemProps) {
  const shopImage = room.shop?.images?.[0];
  const shopName = room.shop?.name || '알 수 없는 샵';
  const hasUnread = room.customer_unread_count > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors',
        'border-b border-gray-100',
        isActive && 'bg-blue-50 hover:bg-blue-50',
        hasUnread && 'bg-blue-50/50'
      )}
    >
      {/* Shop Avatar */}
      <Avatar className="h-12 w-12 shrink-0">
        {shopImage ? (
          <AvatarImage src={shopImage} alt={shopName} />
        ) : (
          <AvatarFallback className="bg-gray-200">
            <Store className="h-6 w-6 text-gray-500" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-medium truncate', hasUnread && 'font-semibold')}>
            {shopName}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {formatRoomTime(room.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
            )}
          >
            {room.last_message_preview || '대화를 시작해보세요'}
          </p>
          {hasUnread && (
            <Badge variant="default" className="shrink-0 h-5 min-w-[20px] px-1.5 text-xs">
              {room.customer_unread_count > 99 ? '99+' : room.customer_unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

// =========================
// Chat Room Item for Partner
// =========================

interface PartnerChatRoomItemProps {
  room: ChatRoomWithCustomer;
  onClick: () => void;
  isActive?: boolean;
}

export function PartnerChatRoomItem({
  room,
  onClick,
  isActive = false,
}: PartnerChatRoomItemProps) {
  const customerName = room.customer?.nickname || '고객';
  const hasUnread = room.shop_unread_count > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors',
        'border-b border-gray-100',
        isActive && 'bg-blue-50 hover:bg-blue-50',
        hasUnread && 'bg-blue-50/50'
      )}
    >
      {/* Customer Avatar */}
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarFallback className="bg-blue-100 text-blue-600">
          {customerName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-medium truncate', hasUnread && 'font-semibold')}>
            {customerName}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {formatRoomTime(room.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
            )}
          >
            {room.last_message_preview || '대화를 시작해보세요'}
          </p>
          {hasUnread && (
            <Badge variant="default" className="shrink-0 h-5 min-w-[20px] px-1.5 text-xs">
              {room.shop_unread_count > 99 ? '99+' : room.shop_unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

// =========================
// Chat Room List Component
// =========================

interface ChatRoomListProps {
  rooms: (ChatRoomWithShop | ChatRoomWithCustomer)[];
  userType: SenderType;
  onRoomClick: (roomId: string) => void;
  activeRoomId?: string;
  isLoading?: boolean;
}

export function ChatRoomList({
  rooms,
  userType,
  onRoomClick,
  activeRoomId,
  isLoading = false,
}: ChatRoomListProps) {
  if (isLoading) {
    return <ChatRoomListSkeleton />;
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm text-center">
          {userType === 'customer'
            ? '아직 상담 내역이 없습니다.'
            : '아직 문의가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {rooms.map((room) =>
        userType === 'customer' ? (
          <CustomerChatRoomItem
            key={room.id}
            room={room as ChatRoomWithShop}
            onClick={() => onRoomClick(room.id)}
            isActive={room.id === activeRoomId}
          />
        ) : (
          <PartnerChatRoomItem
            key={room.id}
            room={room as ChatRoomWithCustomer}
            onClick={() => onRoomClick(room.id)}
            isActive={room.id === activeRoomId}
          />
        )
      )}
    </div>
  );
}

// =========================
// Loading Skeleton
// =========================

export function ChatRoomListSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full max-w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
