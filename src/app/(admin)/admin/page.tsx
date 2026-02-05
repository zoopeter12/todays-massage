'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Users,
  Store,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import type { DashboardStats, TopShop } from '@/types/admin';

interface RecentReservation {
  id: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
  shops: { name: string } | null;
  courses: { name: string; price_discount: number | null; price_original: number } | null;
  profiles: { nickname: string | null; phone: string | null } | null;
}

interface ReservationWithCourse {
  id: string;
  date: string;
  status: string;
  courses: { price_discount: number | null; price_original: number } | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalShops: 0,
    totalReservations: 0,
    todayReservations: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    pendingShops: 0,
    pendingReports: 0,
    pendingSettlements: 0,
    activeUsers: 0,
  });
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [topShops, setTopShops] = useState<TopShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];

      // Parallel fetch for all data
      const [
        usersResult,
        shopsResult,
        reservationsResult,
        todayReservationsResult,
        recentReservationsResult,
        topShopsResult,
        // Revenue calculations
        allReservationsForRevenue,
        todayReservationsForRevenue,
        // Pending counts
        pendingShopsResult,
        pendingSettlementsResult,
        pendingReportsResult,
      ] = await Promise.all([
        // Basic counts
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('shops').select('*', { count: 'exact', head: true }),
        supabase.from('reservations').select('*', { count: 'exact', head: true }),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('date', today),

        // Recent reservations with details
        supabase
          .from('reservations')
          .select('id, date, time, status, created_at, shops(name), courses(name, price_discount, price_original), profiles(nickname, phone)')
          .order('created_at', { ascending: false })
          .limit(5),

        // Top shops by view count
        supabase
          .from('shops')
          .select('id, name, view_count')
          .order('view_count', { ascending: false })
          .limit(5),

        // All completed/confirmed reservations for total revenue
        supabase
          .from('reservations')
          .select('id, date, status, courses(price_discount, price_original)')
          .in('status', ['confirmed', 'completed']),

        // Today's completed/confirmed reservations for today's revenue
        supabase
          .from('reservations')
          .select('id, date, status, courses(price_discount, price_original)')
          .eq('date', today)
          .in('status', ['confirmed', 'completed']),

        // Pending shops (is_open = false, recently created - within 30 days)
        supabase
          .from('shops')
          .select('*', { count: 'exact', head: true })
          .eq('is_open', false)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

        // Pending settlements (status = 'pending')
        supabase
          .from('settlements')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Pending reports (status = 'pending' or 'reviewing')
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'reviewing']),
      ]);

      // Calculate total revenue from all confirmed/completed reservations
      const allReservations = (allReservationsForRevenue.data as ReservationWithCourse[] | null) ?? [];
      const totalRevenue = allReservations.reduce((sum, r) => {
        const price = r.courses?.price_discount ?? r.courses?.price_original ?? 0;
        return sum + price;
      }, 0);

      // Calculate today's revenue
      const todayReservations = (todayReservationsForRevenue.data as ReservationWithCourse[] | null) ?? [];
      const todayRevenue = todayReservations.reduce((sum, r) => {
        const price = r.courses?.price_discount ?? r.courses?.price_original ?? 0;
        return sum + price;
      }, 0);

      // Calculate active users (users who made reservations in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const activeUsersResult = await supabase
        .from('reservations')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo)
        .not('user_id', 'is', null);

      const uniqueActiveUsers = new Set(
        (activeUsersResult.data ?? []).map((r: { user_id: string | null }) => r.user_id)
      );

      setStats({
        totalUsers: usersResult.count ?? 0,
        totalShops: shopsResult.count ?? 0,
        totalReservations: reservationsResult.count ?? 0,
        todayReservations: todayReservationsResult.count ?? 0,
        totalRevenue,
        todayRevenue,
        pendingShops: pendingShopsResult.count ?? 0,
        pendingReports: pendingReportsResult.count ?? 0,
        pendingSettlements: pendingSettlementsResult.count ?? 0,
        activeUsers: uniqueActiveUsers.size,
      });

      setRecentReservations((recentReservationsResult.data as unknown as RecentReservation[]) ?? []);

      // Calculate top shops with revenue
      const topShopsData = topShopsResult.data ?? [];
      const topShopsWithRevenue = await Promise.all(
        topShopsData.map(async (shop) => {
          const { data: shopReservations } = await supabase
            .from('reservations')
            .select('courses(price_discount, price_original)')
            .eq('shop_id', shop.id)
            .in('status', ['confirmed', 'completed']);

          const shopRevenue = ((shopReservations as ReservationWithCourse[] | null) ?? []).reduce((sum, r) => {
            const price = r.courses?.price_discount ?? r.courses?.price_original ?? 0;
            return sum + price;
          }, 0);

          return {
            id: shop.id,
            name: shop.name,
            reservations: shop.view_count,
            revenue: shopRevenue,
          };
        })
      );

      setTopShops(topShopsWithRevenue);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다. 새로고침을 시도해 주세요.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      confirmed: { label: '확정', variant: 'default' },
      pending: { label: '대기', variant: 'secondary' },
      cancelled: { label: '취소', variant: 'destructive' },
      completed: { label: '완료', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 회원</CardTitle>
            <Users className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              활성 사용자 {stats.activeUsers.toLocaleString()}명
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">등록 매장</CardTitle>
            <Store className="h-5 w-5 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalShops.toLocaleString()}</div>
            {stats.pendingShops > 0 && (
              <p className="text-xs text-amber-600 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" />
                승인 대기 {stats.pendingShops}건
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 예약</CardTitle>
            <Calendar className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalReservations.toLocaleString()}</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              오늘 {stats.todayReservations}건
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-violet-500 to-pink-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">총 매출</CardTitle>
            <DollarSign className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}원</div>
            <p className="text-xs text-white/80 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              오늘 +{stats.todayRevenue.toLocaleString()}원
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      {(stats.pendingShops > 0 || stats.pendingReports > 0 || stats.pendingSettlements > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.pendingShops > 0 && (
            <Link href="/admin/shops">
              <Card className="border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100">
                    <Store className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">매장 승인 대기</p>
                    <p className="text-lg font-bold text-amber-900">{stats.pendingShops}건</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
          {stats.pendingReports > 0 && (
            <Link href="/admin/reports">
              <Card className="border-red-200 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">신고 처리 대기</p>
                    <p className="text-lg font-bold text-red-900">{stats.pendingReports}건</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
          {stats.pendingSettlements > 0 && (
            <Link href="/admin/settlements">
              <Card className="border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">정산 처리 대기</p>
                    <p className="text-lg font-bold text-blue-900">{stats.pendingSettlements}건</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Recent Activity and Top Shops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">최근 예약</CardTitle>
            <Link href="/admin/users" className="text-sm text-violet-600 hover:text-violet-700">
              전체 보기
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReservations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">예약 내역이 없습니다.</p>
              ) : (
                recentReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {reservation.shops?.name ?? '알 수 없음'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reservation.profiles?.nickname ?? reservation.profiles?.phone ?? '게스트'} / {reservation.date} {reservation.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {((reservation.courses?.price_discount ?? reservation.courses?.price_original) ?? 0).toLocaleString()}원
                      </span>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Shops */}
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">인기 매장 TOP 5</CardTitle>
            <Link href="/admin/shops" className="text-sm text-violet-600 hover:text-violet-700">
              전체 보기
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topShops.length === 0 ? (
                <p className="text-center text-gray-500 py-8">등록된 매장이 없습니다.</p>
              ) : (
                topShops.map((shop, index) => (
                  <div
                    key={shop.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                          : index === 2
                          ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{shop.name}</p>
                      <p className="text-xs text-gray-500">조회수 {shop.reservations.toLocaleString()}회</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
