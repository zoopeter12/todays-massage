'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useChatRooms } from '@/hooks/useChat';
import { ChatRoomList, ChatListHeader } from '@/components/chat';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Customer Chat Room List Page
 * Lists all chat rooms for the logged-in customer
 */
export default function CustomerChatListPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Get current user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        // Redirect to login if not authenticated
        router.push('/login?redirect=/chat');
      }
      setIsAuthLoading(false);
    }
    getUser();
  }, [router]);

  // Fetch chat rooms
  const { rooms, isLoading, error, totalUnread } = useChatRooms({
    userId: userId || '',
    userType: 'customer',
  });

  const handleRoomClick = (roomId: string) => {
    // Find the room to get shopId
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      router.push(`/chat/${room.shop_id}`);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-14 border-b flex items-center px-4">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="p-4 space-y-4">
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

  if (!userId) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      <ChatListHeader title="상담 내역" totalUnread={totalUnread} />

      {error ? (
        <div className="p-8 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <ChatRoomList
          rooms={rooms}
          userType="customer"
          onRoomClick={handleRoomClick}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
