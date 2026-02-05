'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Store as StoreIcon,
  Power,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  fetchTodayReservations,
  getReservationStats,
  approveReservation,
  rejectReservation,
  subscribeToReservations,
  unsubscribeChannel,
  fetchShop,
  updateShop,
  getPartnerShop,
} from '@/lib/api/partner';
import { ReservationWithDetails, Shop } from '@/types/supabase';

export default function PartnerDashboard() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [todayReservations, setTodayReservations] = useState<ReservationWithDetails[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [noShop, setNoShop] = useState(false);

  // Resolve the partner's shop ID on mount
  useEffect(() => {
    async function resolveShop() {
      const myShop = await getPartnerShop();
      if (myShop) {
        setShopId(myShop.id);
      } else {
        setNoShop(true);
        setIsLoading(false);
      }
    }
    resolveShop();
  }, []);

  // Load data once shopId is resolved
  useEffect(() => {
    if (shopId) {
      loadData(shopId);
    }
  }, [shopId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!shopId) return;

    const channel = subscribeToReservations(shopId, (payload) => {
      loadData(shopId); // Refresh data on any change
      toast.info('새로운 예약 알림', {
        description: '예약 정보가 업데이트되었습니다.',
      });
    });

    return () => {
      unsubscribeChannel(channel);
    };
  }, [shopId]);

  async function loadData(currentShopId: string) {
    try {
      setIsLoading(true);
      const [shopData, reservations, statsData] = await Promise.all([
        fetchShop(currentShopId),
        fetchTodayReservations(currentShopId),
        getReservationStats(currentShopId),
      ]);
      setShop(shopData);
      setTodayReservations(reservations);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('데이터 로드 실패', {
        description: '다시 시도해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(reservationId: string) {
    if (!shopId) return;
    try {
      setIsUpdating(reservationId);
      await approveReservation(reservationId);
      toast.success('예약 승인 완료');
      await loadData(shopId);
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('예약 승인 실패');
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleReject(reservationId: string) {
    if (!shopId) return;
    try {
      setIsUpdating(reservationId);
      await rejectReservation(reservationId);
      toast.success('예약 거절 완료');
      await loadData(shopId);
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('예약 거절 실패');
    } finally {
      setIsUpdating(null);
    }
  }

  async function toggleShopOpen() {
    if (!shop || !shopId) return;
    try {
      const newStatus = !shop.is_open;
      await updateShop(shopId, { is_open: newStatus });
      toast.success(newStatus ? '영업 시작됨' : '영업 종료 처리됨');
      await loadData(shopId);
    } catch (error) {
      console.error('Failed to toggle shop status:', error);
      toast.error('영업 상태 변경 실패');
    }
  }

  const statCards = [
    {
      title: '대기중',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: '확정',
      value: stats.confirmed,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '취소',
      value: stats.cancelled,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: '완료',
      value: stats.completed,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  // Show message if partner has no registered shop
  if (noShop) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                <StoreIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">등록된 가게가 없습니다</h2>
              <p className="text-sm text-gray-500">
                파트너 센터를 이용하려면 먼저 가게를 등록해주세요.
                <br />
                관리자에게 문의하시면 가게 등록을 도와드립니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            {shop?.name || '로딩중...'} 관리 센터
          </p>
        </div>

        {/* Shop Open/Close Toggle */}
        {shop && (
          <Card className="w-fit">
            <CardContent className="flex items-center space-x-3 p-4">
              <Power className={`h-5 w-5 ${shop.is_open ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">영업 상태</span>
                <span className={`text-xs ${shop.is_open ? 'text-green-600' : 'text-gray-500'}`}>
                  {shop.is_open ? '영업중' : '영업종료'}
                </span>
              </div>
              <Switch checked={shop.is_open} onCheckedChange={toggleShopOpen} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">전체 예약 중</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-blue-600" />
            오늘의 예약 ({todayReservations.length})
          </CardTitle>
          <CardDescription>오늘 {new Date().toLocaleDateString('ko-KR')} 예약 목록</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : todayReservations.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">오늘 예약이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayReservations.map((reservation, index) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {reservation.time}
                            </span>
                            <Badge
                              variant={
                                reservation.status === 'confirmed'
                                  ? 'default'
                                  : reservation.status === 'pending'
                                  ? 'secondary'
                                  : reservation.status === 'cancelled'
                                  ? 'destructive'
                                  : 'outline'
                              }
                            >
                              {reservation.status === 'pending'
                                ? '대기중'
                                : reservation.status === 'confirmed'
                                ? '확정'
                                : reservation.status === 'cancelled'
                                ? '취소'
                                : '완료'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-700">
                            {reservation.course?.name || '코스 정보 없음'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            고객: {reservation.user?.nickname || '고객 정보 없음'} •{' '}
                            {reservation.user?.phone || '연락처 없음'}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        {reservation.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(reservation.id)}
                              disabled={isUpdating === reservation.id}
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(reservation.id)}
                              disabled={isUpdating === reservation.id}
                            >
                              거절
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
