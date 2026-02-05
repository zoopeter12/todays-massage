'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShopWithCourses } from '@/types/supabase';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Clock, ChevronRight, Loader2, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { PriceDisplay } from '@/components/customer/PriceDisplay';

interface MapSearchDrawerProps {
  shops: ShopWithCourses[];
  isLoading: boolean;
  hasValidBounds?: boolean; // Flag to indicate if we have valid map bounds
}

export function MapSearchDrawer({ shops, isLoading, hasValidBounds = true }: MapSearchDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Track if user has manually closed the drawer
  const userClosedRef = useRef(false);
  // Track if initial auto-open has occurred
  const initialOpenDoneRef = useRef(false);

  // Auto-open drawer ONLY on initial load (once)
  useEffect(() => {
    // Only auto-open once when first valid data is loaded
    if (hasValidBounds && !isLoading && !initialOpenDoneRef.current && !userClosedRef.current) {
      setOpen(true);
      initialOpenDoneRef.current = true;
    }
  }, [hasValidBounds, isLoading]);

  // Handle drawer open/close changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // If user is closing the drawer, mark it as user-closed
    if (!newOpen) {
      userClosedRef.current = true;
    }
  };

  // Handle floating button click to open drawer
  const handleFloatingButtonClick = () => {
    userClosedRef.current = false; // Reset user-closed state when they explicitly open
    setOpen(true);
  };

  const handleShopClick = (shopId: string) => {
    router.push(`/shops/${shopId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${minutes}분`;
  };

  return (
    <>
      {/* Floating button when drawer is closed */}
      <AnimatePresence>
        {!open && hasValidBounds && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Button
              onClick={handleFloatingButtonClick}
              size="lg"
              className="shadow-lg rounded-full px-6 gap-2"
            >
              <List className="w-4 h-4" />
              {shops.length > 0
                ? `주변 매장 ${shops.length}개 보기`
                : '매장 목록 보기'
              }
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[60vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-left">
            주변 매장 {shops.length > 0 && `(${shops.length})`}
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto p-4 space-y-3">
          {!hasValidBounds ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
              <p className="font-medium">위치 확인 중...</p>
              <p className="text-sm mt-1">잠시만 기다려주세요.</p>
            </div>
          ) : isLoading ? (
            <ShopListSkeleton />
          ) : shops.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>이 지역에 매장이 없습니다.</p>
              <p className="text-sm mt-1">지도를 이동하여 다른 지역을 확인해보세요.</p>
            </div>
          ) : (
            shops.map((shop, index) => (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleShopClick(shop.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex gap-3 p-3">
                      {/* Shop Image */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {shop.images && shop.images.length > 0 ? (
                          <Image
                            src={shop.images[0]}
                            alt={shop.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Shop Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {shop.name}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>

                        {/* Category */}
                        {shop.category && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            {shop.category}
                          </Badge>
                        )}

                        {/* Address */}
                        {shop.address && (
                          <div className="flex items-start gap-1 mb-1">
                            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {shop.address}
                            </p>
                          </div>
                        )}

                        {/* Phone */}
                        {shop.tel && (
                          <div className="flex items-center gap-1 mb-1">
                            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <p className="text-xs text-muted-foreground">
                              {shop.tel}
                            </p>
                          </div>
                        )}

                        {/* Courses */}
                        {shop.courses && shop.courses.length > 0 && (
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">
                                {formatDuration(shop.courses[0].duration)}
                              </p>
                              {shop.courses.length > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  외 {shop.courses.length - 1}개
                                </span>
                              )}
                            </div>
                            <PriceDisplay
                              originalPrice={shop.courses[0].price_original}
                              discountPrice={shop.courses[0].price_discount}
                              size="sm"
                              showFromSuffix
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
    </>
  );
}

function ShopListSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex gap-3 p-3">
              <div className="w-20 h-20 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
