'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  ChevronLeft,
  Share2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { fetchShopById, incrementShopViewCount } from '@/lib/api/shops';
import { ShopWithCourses } from '@/types/supabase';
import { OperatingHours } from '@/types/staff';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookingDrawer } from '@/components/customer/BookingDrawer';
import { FavoriteButton } from '@/components/customer/FavoriteButton';
import ShopReviews from '@/components/customer/ShopReviews';
import { PriceDisplay } from '@/components/customer/PriceDisplay';
import {
  getTodayHoursSummary,
  getWeeklySchedule,
  formatBreakTime,
  getCurrentShopStatus,
  getStatusText,
  getStatusColorClass,
} from '@/lib/utils/operating-hours-display';

export default function ShopDetailPage() {
  const params = useParams();
  const shopId = params.id as string;
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const { data: shop, isLoading, error } = useQuery<ShopWithCourses | null>({
    queryKey: ['shop', shopId],
    queryFn: () => fetchShopById(shopId),
    enabled: !!shopId,
  });

  // Increment view count on mount
  useEffect(() => {
    if (shopId) {
      incrementShopViewCount(shopId).catch(console.error);
    }
  }, [shopId]);

  const handleBooking = (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsBookingOpen(true);
  };

  if (isLoading) {
    return <ShopDetailSkeleton />;
  }

  if (error || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg text-muted-foreground mb-4">샵을 찾을 수 없습니다</p>
        <Link href="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const selectedCourse = shop.courses.find(c => c.id === selectedCourseId);

  return (
    <>
      <div className="min-h-screen pb-20">
        {/* Header with back button */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
              <FavoriteButton shopId={shopId} />
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative w-full aspect-[16/10] bg-muted">
          {shop.images && shop.images.length > 0 ? (
            <Image
              src={shop.images[0]}
              alt={shop.name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              이미지 없음
            </div>
          )}
        </div>

        {/* Shop Info Header */}
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold">{shop.name}</h1>
              {shop.category && (
                <Badge variant="secondary">{shop.category}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span>조회 {shop.view_count?.toLocaleString() || 0}</span>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[57px] z-30 bg-background border-b">
          <Tabs defaultValue="info" className="w-full">
            <div className="container max-w-2xl mx-auto px-4">
              <TabsList className="w-full grid grid-cols-3 h-12">
                <TabsTrigger value="info">정보</TabsTrigger>
                <TabsTrigger value="courses">코스</TabsTrigger>
                <TabsTrigger value="reviews">리뷰</TabsTrigger>
              </TabsList>
            </div>

            <div className="container max-w-2xl mx-auto px-4 py-6">
              {/* Info Tab */}
              <TabsContent value="info" className="space-y-6 mt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {shop.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">주소</p>
                        <p className="text-muted-foreground">{shop.address}</p>
                      </div>
                    </div>
                  )}

                  <OperatingHoursDisplay operatingHours={shop.operating_hours} />
                </motion.div>
              </TabsContent>

              {/* Courses Tab */}
              <TabsContent value="courses" className="space-y-4 mt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {shop.courses && shop.courses.length > 0 ? (
                    shop.courses.map((course) => (
                      <Card key={course.id} className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg">{course.name}</h3>
                              <Badge variant="outline" className="bg-slate-50">{course.duration}분</Badge>
                            </div>

                            <div className="flex items-end justify-between">
                              <PriceDisplay
                                originalPrice={course.price_original}
                                discountPrice={course.price_discount}
                                size="md"
                                showContainer={!!course.price_discount}
                                className="items-start"
                              />

                              <Button
                                onClick={() => handleBooking(course.id)}
                                size="sm"
                                className="bg-rose-500 hover:bg-rose-600"
                              >
                                예약하기
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      등록된 코스가 없습니다
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-0">
                <ShopReviews shopId={shopId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Booking Drawer */}
      {selectedCourse && (
        <BookingDrawer
          open={isBookingOpen}
          onOpenChange={setIsBookingOpen}
          shop={shop}
          course={selectedCourse}
        />
      )}
    </>
  );
}

function ShopDetailSkeleton() {
  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <Skeleton className="w-full aspect-[16/10]" />

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />

        <div className="space-y-3 pt-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 영업시간 표시 컴포넌트
 * - 오늘 영업시간 요약 표시
 * - 영업 상태 (영업중/휴무/휴게시간) 표시
 * - 클릭 시 주간 영업시간 펼침
 * - 휴게시간 표시
 */
function OperatingHoursDisplay({ operatingHours }: { operatingHours: OperatingHours | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const todaySummary = getTodayHoursSummary(operatingHours);
  const weeklySchedule = getWeeklySchedule(operatingHours);
  const breakTimeText = operatingHours ? formatBreakTime(operatingHours.break_time) : null;
  const status = getCurrentShopStatus(operatingHours);
  const statusText = getStatusText(status);
  const statusColorClass = getStatusColorClass(status);

  return (
    <div className="flex items-start gap-3">
      <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium">영업시간</p>
          {statusText && (
            <span className={`text-sm font-medium ${statusColorClass}`}>
              {statusText}
            </span>
          )}
        </div>

        {/* 오늘 영업시간 요약 및 펼침 버튼 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-full text-left"
        >
          <span>{todaySummary}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 ml-auto" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-auto" />
          )}
        </button>

        {/* 주간 영업시간 상세 */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-1"
          >
            {weeklySchedule.map((day) => (
              <div
                key={day.dayKey}
                className={`flex justify-between text-sm py-1 ${
                  day.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
                } ${day.isClosed ? 'text-red-500' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {day.dayLabel}
                  {day.isToday && (
                    <Badge variant="outline" className="text-xs py-0 px-1">
                      오늘
                    </Badge>
                  )}
                </span>
                <span>{day.hours}</span>
              </div>
            ))}

            {/* 휴게시간 */}
            {breakTimeText && (
              <div className="pt-2 border-t mt-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>휴게시간</span>
                  <span>{breakTimeText}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
