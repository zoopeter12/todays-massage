'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { fetchFavorites, toggleFavorite } from '@/lib/api/favorites';
import { supabase } from '@/lib/supabase/client';
import { FavoriteWithShop } from '@/types/favorites';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

export default function FavoritesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => fetchFavorites(userId!),
    enabled: !!userId,
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (shopId: string) => toggleFavorite(shopId),
    onMutate: async (shopId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['favorites', userId] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<FavoriteWithShop[]>(['favorites', userId]);

      // Optimistically update
      queryClient.setQueryData<FavoriteWithShop[]>(
        ['favorites', userId],
        (old) => old?.filter(fav => fav.shop_id !== shopId) || []
      );

      return { previousFavorites };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', userId], context.previousFavorites);
      }
      toast.error('찜 해제 중 오류가 발생했습니다');
      console.error('Remove favorite error:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
      toast.success('찜 목록에서 제거했습니다');
    },
  });

  const handleRemoveFavorite = (shopId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavoriteMutation.mutate(shopId);
  };

  // Loading state
  if (!userId && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center gap-2 px-4 py-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">찜한 샵</h1>
          </div>
        </div>

        {/* Not logged in */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Heart className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg text-muted-foreground mb-2">
            로그인이 필요합니다
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            찜한 샵을 확인하려면 로그인해주세요
          </p>
          <Link href="/login">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">찜한 샵</h1>
          {!isLoading && favorites.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {favorites.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : favorites.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <Heart className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              찜한 샵이 없습니다
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              마음에 드는 샵을 찜해보세요
            </p>
            <Link href="/">
              <Button>샵 둘러보기</Button>
            </Link>
          </motion.div>
        ) : (
          // Favorites list
          <AnimatePresence mode="popLayout">
            {favorites.map((favorite, index) => (
              <motion.div
                key={favorite.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.05 }
                }}
                exit={{
                  opacity: 0,
                  x: -100,
                  transition: { duration: 0.2 }
                }}
              >
                <Link href={`/shops/${favorite.shop_id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Shop Image */}
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {favorite.shop.images && favorite.shop.images.length > 0 ? (
                            <Image
                              src={favorite.shop.images[0]}
                              alt={favorite.shop.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Heart className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        {/* Shop Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-base line-clamp-1">
                              {favorite.shop.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleRemoveFavorite(favorite.shop_id, e)}
                              className="h-8 w-8 flex-shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                              aria-label="찜 해제"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </Button>
                          </div>

                          {favorite.shop.address && (
                            <div className="flex items-start gap-1 mb-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {favorite.shop.address}
                              </p>
                            </div>
                          )}

                          {favorite.shop.tel && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {favorite.shop.tel}
                              </p>
                            </div>
                          )}

                          {!favorite.shop.is_open && (
                            <Badge variant="destructive" className="mt-2">
                              영업 종료
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
