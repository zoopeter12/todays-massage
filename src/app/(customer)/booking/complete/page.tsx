'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { getReservationById } from '@/lib/api/reservations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookingCompletePage() {
  return (
    <Suspense fallback={<BookingCompleteSkeleton />}>
      <BookingCompleteContent />
    </Suspense>
  );
}

function BookingCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('id');

  const { data: reservation, isLoading, error } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () => getReservationById(reservationId!),
    enabled: !!reservationId,
  });

  useEffect(() => {
    if (!reservationId) {
      router.push('/');
    }
  }, [reservationId, router]);

  if (isLoading) {
    return <BookingCompleteSkeleton />;
  }

  if (error || !reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg text-muted-foreground mb-4">
          예약 정보를 찾을 수 없습니다
        </p>
        <Link href="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const reservationDate = new Date(reservation.date);
  const statusLabel = {
    pending: '확인 대기',
    confirmed: '예약 확정',
    cancelled: '예약 취소',
    completed: '이용 완료',
  }[reservation.status] || reservation.status;

  const statusVariant = {
    pending: 'secondary',
    confirmed: 'default',
    cancelled: 'destructive',
    completed: 'outline',
  }[reservation.status] as 'default' | 'secondary' | 'destructive' | 'outline';

  return (
    <div className="min-h-screen pb-20 bg-muted/30">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Success Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            </motion.div>

            <div>
              <h1 className="text-2xl font-bold mb-2">예약이 완료되었습니다</h1>
              <p className="text-muted-foreground">
                샵에서 곧 확인 연락을 드릴 예정입니다
              </p>
            </div>
          </div>

          {/* Reservation Details Card */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">예약 정보</h2>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>

              <Separator />

              {/* Shop Info */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">샵 이름</p>
                <p className="font-medium text-lg">{reservation.shop?.name || '샵 정보 없음'}</p>
              </div>

              {/* Course Info */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">코스</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{reservation.course?.name || '코스 정보 없음'}</p>
                  <Badge variant="outline">{reservation.course?.duration || 0}분</Badge>
                </div>
              </div>

              <Separator />

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">예약 날짜</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {format(reservationDate, 'MM월 dd일 (EEE)', { locale: ko })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">예약 시간</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{reservation.time}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              {reservation.shop?.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">주소</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{reservation.shop.address}</p>
                  </div>
                </div>
              )}

              {reservation.shop?.tel && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">전화번호</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${reservation.shop.tel}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {reservation.shop.tel}
                    </a>
                  </div>
                </div>
              )}

              <Separator />

              {/* Price */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">결제 금액</p>
                <div className="flex items-baseline gap-2">
                  {reservation.course?.price_discount ? (
                    <>
                      <p className="text-sm line-through text-muted-foreground">
                        {(reservation.course?.price_original ?? 0).toLocaleString()}원
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {reservation.course.price_discount.toLocaleString()}원
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold">
                      {(reservation.course?.price_original ?? 0).toLocaleString()}원
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notice Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">예약 안내</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>예약 확정은 샵에서 확인 후 완료됩니다</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>예약 취소는 예약 시간 3시간 전까지 가능합니다</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>예약 시간 10분 전까지 도착해주세요</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>문의사항은 샵으로 직접 연락주세요</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Link href={`/shops/${reservation.shop?.id || ''}`} className="w-full">
              <Button variant="outline" className="w-full">
                샵 상세보기
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button className="w-full">홈으로</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BookingCompleteSkeleton() {
  return (
    <div className="min-h-screen pb-20 bg-muted/30">
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Separator />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
