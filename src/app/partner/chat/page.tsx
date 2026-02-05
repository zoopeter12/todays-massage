'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getPartnerShop } from '@/lib/api/partner';
import { useChatRooms } from '@/hooks/useChat';
import { ChatRoomList, ChatListHeader } from '@/components/chat';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Store as StoreIcon, MessageCircle, Search, X } from 'lucide-react';
import { ChatRoomWithCustomer } from '@/types/chat';

/**
 * Partner Chat Room List Page
 * Lists all customer inquiries for the partner's shop
 */
export default function PartnerChatListPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [noShop, setNoShop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user and their shop
  useEffect(() => {
    async function initialize() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login?redirect=/partner/chat');
          return;
        }
        setUserId(user.id);

        // Get partner's shop
        const shop = await getPartnerShop();
        if (shop) {
          setShopId(shop.id);
        } else {
          setNoShop(true);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsAuthLoading(false);
      }
    }
    initialize();
  }, [router]);

  // Fetch chat rooms
  const { rooms, isLoading, error, totalUnread } = useChatRooms({
    userId: userId || '',
    userType: 'partner',
    shopId: shopId || undefined,
  });

  // Filter rooms based on search query (customer name and message preview)
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) {
      return rooms;
    }

    const query = searchQuery.toLowerCase().trim();
    return rooms.filter((room) => {
      const customerRoom = room as ChatRoomWithCustomer;
      const customerName = customerRoom.customer?.nickname || '';
      const messagePreview = room.last_message_preview || '';

      return (
        customerName.toLowerCase().includes(query) ||
        messagePreview.toLowerCase().includes(query)
      );
    });
  }, [rooms, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/partner/chat/${roomId}`);
  };

  const handleBack = () => {
    router.push('/partner');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-14 bg-white border-b flex items-center px-4">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="p-4 space-y-4 bg-white">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No shop registered
  if (noShop) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                <StoreIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">등록된 가게가 없습니다</h2>
              <p className="text-sm text-gray-500">
                채팅 기능을 사용하려면 먼저 가게를 등록해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userId || !shopId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white">
        <ChatListHeader
          title="고객 문의"
          totalUnread={totalUnread}
          onBack={handleBack}
        />

        {/* Search Input */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="고객명 또는 메시지 내용으로 검색"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
              aria-label="채팅방 검색"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                aria-label="검색 초기화"
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs text-gray-500">
              {filteredRooms.length}개의 검색 결과
            </p>
          )}
        </div>
      </div>

      <div className="bg-white mt-2">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : rooms.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm text-center">
              아직 고객 문의가 없습니다.
              <br />
              고객이 문의하면 여기에 표시됩니다.
            </p>
          </div>
        ) : filteredRooms.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm text-center">
              &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
            </p>
            <Button
              variant="link"
              onClick={handleClearSearch}
              className="mt-2 text-sm"
            >
              검색 초기화
            </Button>
          </div>
        ) : (
          <ChatRoomList
            rooms={filteredRooms}
            userType="partner"
            onRoomClick={handleRoomClick}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
