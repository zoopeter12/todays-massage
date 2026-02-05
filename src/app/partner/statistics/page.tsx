'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Users, Calendar, Store as StoreIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesChart from '@/components/partner/SalesChart';
import { fetchSalesStats, fetchCourseStats, fetchHourlyStats } from '@/lib/api/settlements';
import { fetchShopById } from '@/lib/api/shops';
import { getPartnerShop } from '@/lib/api/partner';

export default function StatisticsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Resolve the partner's shop dynamically
  const { data: partnerShop, isLoading: partnerShopLoading } = useQuery({
    queryKey: ['partner-shop'],
    queryFn: getPartnerShop,
  });

  const shopId = partnerShop?.id;

  const { data: salesStats, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-stats', shopId, period],
    queryFn: () => fetchSalesStats(shopId!, period),
    enabled: !!shopId,
  });

  const { data: courseStats, isLoading: courseLoading } = useQuery({
    queryKey: ['course-stats', shopId],
    queryFn: () => fetchCourseStats(shopId!),
    enabled: !!shopId,
  });

  const { data: hourlyStats, isLoading: hourlyLoading } = useQuery({
    queryKey: ['hourly-stats', shopId],
    queryFn: () => fetchHourlyStats(shopId!),
    enabled: !!shopId,
  });

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => fetchShopById(shopId!),
    enabled: !!shopId,
  });

  // Calculate KPIs
  const currentData = salesStats?.[period] || [];
  const totalSales = currentData.reduce((sum, item) => sum + item.amount, 0);
  const totalCount = currentData.reduce((sum, item) => sum + item.count, 0);
  const avgOrderValue = totalCount > 0 ? totalSales / totalCount : 0;

  // Calculate conversion rate
  const conversionRate = useMemo(() => {
    if (!shop) return null;
    const totalViews = shop?.view_count || 0;
    const totalReservations = totalCount;

    if (totalViews === 0) return null;

    return ((totalReservations / totalViews) * 100).toFixed(1);
  }, [shop, totalCount]);

  // Format hourly data for chart
  const hourlyChartData = hourlyStats?.map((stat) => ({
    hour: `${stat.hour}시`,
    count: stat.count,
  })) || [];

  // Get data based on selected period
  const chartData = currentData.map((item: { amount: number; count: number; date?: string; week?: string; month?: string }) => {
    if (period === 'daily' && 'date' in item) {
      return {
        date: new Date(item.date!).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        amount: item.amount,
        count: item.count,
      };
    } else if (period === 'weekly' && 'week' in item) {
      return {
        date: `${new Date(item.week!).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 주`,
        amount: item.amount,
        count: item.count,
      };
    } else if ('month' in item) {
      return {
        date: new Date(item.month + '-01').toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }),
        amount: item.amount,
        count: item.count,
      };
    }
    return { date: '', amount: item.amount, count: item.count };
  });

  // Show message if partner has no registered shop
  if (!partnerShopLoading && !partnerShop) {
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
                매출 통계를 이용하려면 먼저 가게를 등록해주세요.
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
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">매출 통계</h1>
        <p className="text-gray-500 mt-1">데이터 기반으로 매장을 분석하세요</p>
      </div>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
        <TabsList>
          <TabsTrigger value="daily">일별</TabsTrigger>
          <TabsTrigger value="weekly">주별</TabsTrigger>
          <TabsTrigger value="monthly">월별</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              총 매출
            </CardDescription>
            <CardTitle className="text-2xl">
              {totalSales.toLocaleString()}원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {period === 'daily' ? '최근 30일' : period === 'weekly' ? '최근 12주' : '최근 12개월'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              예약 건수
            </CardDescription>
            <CardTitle className="text-2xl">
              {totalCount.toLocaleString()}건
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              확정된 예약
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              평균 객단가
            </CardDescription>
            <CardTitle className="text-2xl">
              {avgOrderValue.toLocaleString()}원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              건당 평균 금액
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              예약 전환율
            </CardDescription>
            <CardTitle className="text-2xl">
              {shopLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : conversionRate !== null ? (
                `${conversionRate}%`
              ) : (
                <span className="text-lg text-gray-400">데이터 없음</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              방문 대비 예약
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>매출 추이</CardTitle>
          <CardDescription>
            {period === 'daily' ? '일별' : period === 'weekly' ? '주별' : '월별'} 매출 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <SalesChart
              data={chartData}
              type="line"
              dataKey="amount"
              xKey="date"
              height={300}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>코스별 매출 비중</CardTitle>
            <CardDescription>최근 3개월 기준</CardDescription>
          </CardHeader>
          <CardContent>
            {courseLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <SalesChart
                data={courseStats || []}
                type="pie"
                dataKey="amount"
                nameKey="name"
                height={300}
              />
            )}
          </CardContent>
        </Card>

        {/* Hourly Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>시간대별 예약 분포</CardTitle>
            <CardDescription>최근 30일 기준</CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <SalesChart
                data={hourlyChartData}
                type="bar"
                dataKey="count"
                xKey="hour"
                height={300}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>인사이트</CardTitle>
          <CardDescription>데이터 기반 추천 사항</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">가장 인기 있는 시간대</p>
              <p className="text-sm text-blue-700 mt-1">
                {hourlyStats && hourlyStats.length > 0
                  ? `${hourlyStats.reduce((max, stat) => stat.count > max.count ? stat : max).hour}시에 예약이 가장 많습니다. 이 시간대에 프로모션을 진행하면 효과적입니다.`
                  : '데이터 수집 중입니다.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">높은 매출 코스</p>
              <p className="text-sm text-green-700 mt-1">
                {courseStats && courseStats.length > 0
                  ? `${courseStats[0].name} 코스가 가장 많은 매출을 기록했습니다.`
                  : '데이터 수집 중입니다.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Users className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">예약 전환율 향상 팁</p>
              <p className="text-sm text-purple-700 mt-1">
                {conversionRate !== null && parseFloat(conversionRate) >= 70
                  ? `현재 ${conversionRate}%의 높은 전환율을 유지하고 있습니다. 빠른 응답과 친절한 상담을 계속 유지하세요.`
                  : conversionRate !== null
                  ? `현재 전환율은 ${conversionRate}%입니다. 매장 사진 업데이트와 빠른 응답으로 전환율을 높여보세요.`
                  : '충분한 데이터가 쌓이면 맞춤형 전환율 개선 팁을 제공해드립니다.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
