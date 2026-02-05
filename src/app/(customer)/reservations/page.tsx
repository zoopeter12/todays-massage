'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { getUserReservations, cancelReservation } from '@/lib/api/reservations';
import { supabase } from '@/lib/supabase/client';
import { ReservationWithDetails, ReservationStatus } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: '확인 대기',
  confirmed: '예약 확정',
  cancelled: '예약 취소',
  completed: '이용 완료',
};

const STATUS_VARIANTS: Record<ReservationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'outline',
};

export default function ReservationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['my-reservations', userId],
    queryFn: () => getUserReservations(userId!),
    enabled: !!userId,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations', userId] });
      toast.success('예약이 취소되었습니다');
    },
    onError: (error) => {
      console.error('Cancel reservation error:', error);
      toast.error('예약 취소에 실패했습니다', {
        description: '잠시 후 다시 시도해주세요.',
      });
    },
  });

  const upcomingReservations = reservations.filter(
    (r) => r.status === 'pending' || r.status === 'confirmed'
  );
  const pastReservations = reservations.filter(
    (r) => r.status === 'completed' || r.status === 'cancelled'
  );

  if (!userId && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg text-muted-foreground mb-4">
          로그인이 필요합니다
        </p>
        <div className="flex gap-3">
          <Link href="/login">
            <Button>로그인하기</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">내 예약</h1>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">
              예정된 예약 ({upcomingReservations.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              지난 예약 ({pastReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-0">
            {isLoading ? (
              <ReservationListSkeleton />
            ) : upcomingReservations.length === 0 ? (
              <EmptyState message="예정된 예약이 없습니다" />
            ) : (
              <ReservationList
                reservations={upcomingReservations}
                onCancel={(id) => cancelMutation.mutate(id)}
                isCancelling={cancelMutation.isPending}
              />
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-0">
            {isLoading ? (
              <ReservationListSkeleton />
            ) : pastReservations.length === 0 ? (
              <EmptyState message="지난 예약이 없습니다" />
            ) : (
              <ReservationList reservations={pastReservations} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ReservationList({
  reservations,
  onCancel,
  isCancelling,
}: {
  reservations: ReservationWithDetails[];
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}) {
  return (
    <div className="space-y-3">
      {reservations.map((reservation, index) => (
        <motion.div
          key={reservation.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href={`/booking/complete?id=${reservation.id}`} className="block cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold">{reservation.shop?.name || '샵 정보 없음'}</h3>
                  <Badge variant={STATUS_VARIANTS[reservation.status as ReservationStatus] || 'secondary'}>
                    {STATUS_LABELS[reservation.status as ReservationStatus] || reservation.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(reservation.date), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{reservation.time}</span>
                  </div>
                  {reservation.shop?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{reservation.shop.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {reservation.course?.name || '코스 정보 없음'} · {reservation.course?.duration || 0}분
                  </span>
                  <span className="font-semibold text-primary">
                    {(reservation.course?.price_discount || reservation.course?.price_original || 0).toLocaleString()}원
                  </span>
                </div>
              </Link>

              {/* Cancel Button - only for pending or confirmed */}
              {onCancel && (reservation.status === 'pending' || reservation.status === 'confirmed') && (
                <div className="mt-3 pt-3 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={isCancelling}
                        aria-busy={isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            취소 처리 중...
                          </>
                        ) : (
                          '예약 취소'
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>예약을 취소하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {reservation.shop?.name} - {reservation.course?.name}
                          <br />
                          {format(new Date(reservation.date), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })} {reservation.time}
                          <br />
                          <br />
                          취소된 예약은 복구할 수 없습니다. 정말 취소하시겠습니까?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>돌아가기</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onCancel(reservation.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          예약 취소
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
      <p className="text-muted-foreground">{message}</p>
      <Link href="/search" className="mt-4 inline-block">
        <Button variant="outline" size="sm">매장 둘러보기</Button>
      </Link>
    </div>
  );
}

function ReservationListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
