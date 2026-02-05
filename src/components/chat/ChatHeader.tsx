'use client';

import { ArrowLeft, MoreVertical, Phone, Store } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shop, Profile } from '@/types/supabase';

// =========================
// Customer Chat Header
// =========================

interface CustomerChatHeaderProps {
  shop: Shop;
  onBack: () => void;
  onCall?: () => void;
}

export function CustomerChatHeader({
  shop,
  onBack,
  onCall,
}: CustomerChatHeaderProps) {
  const shopImage = shop.images?.[0];

  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="-ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Shop info */}
        <Avatar className="h-9 w-9 shrink-0">
          {shopImage ? (
            <AvatarImage src={shopImage} alt={shop.name} />
          ) : (
            <AvatarFallback className="bg-gray-200">
              <Store className="h-4 w-4 text-gray-500" />
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{shop.name}</h1>
          {shop.is_open !== undefined && (
            <p className="text-xs text-gray-500">
              {shop.is_open ? '영업중' : '영업종료'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {shop.tel && onCall && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCall}
              className="text-gray-500"
            >
              <Phone className="h-5 w-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>샵 정보 보기</DropdownMenuItem>
              <DropdownMenuItem>예약하기</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                대화 나가기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

// =========================
// Partner Chat Header
// =========================

interface PartnerChatHeaderProps {
  customer: Profile;
  onBack: () => void;
}

export function PartnerChatHeader({
  customer,
  onBack,
}: PartnerChatHeaderProps) {
  const customerName = customer.nickname || '고객';

  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="-ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Customer info */}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            {customerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{customerName}</h1>
          {customer.phone && (
            <p className="text-xs text-gray-500">{customer.phone}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {customer.phone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(`tel:${customer.phone}`)}
              className="text-gray-500"
            >
              <Phone className="h-5 w-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>고객 정보 보기</DropdownMenuItem>
              <DropdownMenuItem>예약 내역 보기</DropdownMenuItem>
              <DropdownMenuItem>고객 메모 작성</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

// =========================
// Chat List Header
// =========================

interface ChatListHeaderProps {
  title: string;
  totalUnread?: number;
  onBack?: () => void;
}

export function ChatListHeader({
  title,
  totalUnread = 0,
  onBack,
}: ChatListHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center h-14 px-4 gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="-ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <h1 className="flex-1 font-semibold text-lg">
          {title}
          {totalUnread > 0 && (
            <span className="ml-2 text-blue-500">({totalUnread})</span>
          )}
        </h1>
      </div>
    </header>
  );
}
