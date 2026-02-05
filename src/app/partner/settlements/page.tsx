'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Download, Eye, Store as StoreIcon, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { fetchSettlements, fetchSettlementDetail } from '@/lib/api/settlements';
import { getPartnerShop } from '@/lib/api/partner';
import { exportToExcel } from '@/lib/utils/export';
import { cn } from '@/lib/utils';

export default function SettlementsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last' | 'custom'>('current');
  const [selectedSettlement, setSelectedSettlement] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Calculate date range based on selected period
  const calculatedDateRange = useMemo(() => {
    const now = new Date();

    if (selectedPeriod === 'current') {
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    } else if (selectedPeriod === 'last') {
      const lastMonth = subMonths(now, 1);
      return {
        start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    } else if (selectedPeriod === 'custom' && dateRange?.from && dateRange?.to) {
      return {
        start: format(dateRange.from, 'yyyy-MM-dd'),
        end: format(dateRange.to, 'yyyy-MM-dd'),
      };
    }

    return undefined;
  }, [selectedPeriod, dateRange]);

  // Resolve the partner's shop dynamically
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['partner-shop'],
    queryFn: getPartnerShop,
  });

  const shopId = shop?.id;

  const { data: settlementsData, isLoading: settlementsLoading } = useQuery({
    queryKey: ['settlements', shopId, page, calculatedDateRange],
    queryFn: () => fetchSettlements(shopId!, page, 10, calculatedDateRange),
    enabled: !!shopId,
  });

  const isLoading = shopLoading || settlementsLoading;

  const { data: settlementDetail } = useQuery({
    queryKey: ['settlement-detail', selectedSettlement],
    queryFn: () => fetchSettlementDetail(selectedSettlement!),
    enabled: !!selectedSettlement,
  });

  // Calculate summary
  const summary = settlementsData?.settlements.reduce(
    (acc, settlement) => ({
      totalSales: acc.totalSales + settlement.total_sales,
      totalFee: acc.totalFee + settlement.platform_fee,
      netAmount: acc.netAmount + settlement.net_amount,
    }),
    { totalSales: 0, totalFee: 0, netAmount: 0 }
  ) || { totalSales: 0, totalFee: 0, netAmount: 0 };

  // Excel download handler
  function handleExcelDownload() {
    if (!settlementsData?.settlements.length) return;

    const columns = [
      { header: '정산 기간', key: 'period', width: 30 },
      { header: '총 매출', key: 'total_sales', width: 15 },
      { header: '플랫폼 수수료', key: 'platform_fee', width: 15 },
      { header: '정산액', key: 'net_amount', width: 15 },
      { header: '상태', key: 'status', width: 12 },
      { header: '지급일', key: 'paid_at', width: 15 },
    ];

    const exportData = settlementsData.settlements.map((s) => ({
      period: `${new Date(s.period_start).toLocaleDateString('ko-KR')} ~ ${new Date(s.period_end).toLocaleDateString('ko-KR')}`,
      total_sales: s.total_sales.toLocaleString() + '원',
      platform_fee: s.platform_fee.toLocaleString() + '원',
      net_amount: s.net_amount.toLocaleString() + '원',
      status: s.status === 'completed' ? '정산 완료' : '정산 대기',
      paid_at: s.paid_at ? new Date(s.paid_at).toLocaleDateString('ko-KR') : '-',
    }));

    const today = new Date().toISOString().split('T')[0];
    exportToExcel(exportData, columns, `정산내역_${today}`);
  }

  // Show message if partner has no registered shop
  if (!shopLoading && !shop) {
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
                정산 관리를 이용하려면 먼저 가게를 등록해주세요.
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">정산 관리</h1>
          <p className="text-gray-500 mt-1">매출과 정산 내역을 확인하세요</p>
        </div>
        <Button variant="outline" onClick={handleExcelDownload}>
          <Download className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Period Selection */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedPeriod === 'current' ? 'default' : 'outline'}
          onClick={() => {
            setSelectedPeriod('current');
            setDateRange(undefined);
            setPage(1);
          }}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          이번 달
        </Button>
        <Button
          variant={selectedPeriod === 'last' ? 'default' : 'outline'}
          onClick={() => {
            setSelectedPeriod('last');
            setDateRange(undefined);
            setPage(1);
          }}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          지난 달
        </Button>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
              className={cn(
                'min-w-[200px] justify-start text-left font-normal',
                selectedPeriod === 'custom' && dateRange?.from && dateRange?.to
                  ? ''
                  : selectedPeriod !== 'custom' && 'text-muted-foreground'
              )}
              onClick={() => {
                setSelectedPeriod('custom');
              }}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {selectedPeriod === 'custom' && dateRange?.from && dateRange?.to ? (
                <>
                  {format(dateRange.from, 'yyyy.MM.dd', { locale: ko })} ~{' '}
                  {format(dateRange.to, 'yyyy.MM.dd', { locale: ko })}
                </>
              ) : (
                '직접 선택'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range?.from && range?.to) {
                    setPage(1);
                    setIsCalendarOpen(false);
                  }
                }}
                numberOfMonths={2}
                locale={ko}
              />
              <div className="flex items-center justify-between border-t pt-3">
                <div className="text-sm text-muted-foreground">
                  {dateRange?.from && dateRange?.to ? (
                    <span>
                      {format(dateRange.from, 'yyyy.MM.dd')} ~ {format(dateRange.to, 'yyyy.MM.dd')}
                    </span>
                  ) : dateRange?.from ? (
                    <span>시작일: {format(dateRange.from, 'yyyy.MM.dd')} (종료일 선택)</span>
                  ) : (
                    <span>시작일을 선택해주세요</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange(undefined);
                    }}
                  >
                    초기화
                  </Button>
                  <Button
                    size="sm"
                    disabled={!dateRange?.from || !dateRange?.to}
                    onClick={() => {
                      setPage(1);
                      setIsCalendarOpen(false);
                    }}
                  >
                    적용
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {selectedPeriod === 'custom' && dateRange?.from && dateRange?.to && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              setDateRange(undefined);
              setSelectedPeriod('current');
              setPage(1);
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">기간 선택 초기화</span>
          </Button>
        )}
      </div>

      {/* Selected Period Display */}
      {calculatedDateRange && (
        <div className="text-sm text-muted-foreground">
          조회 기간: {calculatedDateRange.start} ~ {calculatedDateRange.end}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 매출</CardDescription>
            <CardTitle className="text-2xl">
              {summary.totalSales.toLocaleString()}원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {settlementsData?.settlements.length || 0}건의 정산
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>플랫폼 수수료 (10%)</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {summary.totalFee.toLocaleString()}원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              총 매출의 10%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>순수익</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {summary.netAmount.toLocaleString()}원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              수수료 차감 후
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>정산 내역</CardTitle>
          <CardDescription>기간별 정산 내역을 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>정산 기간</TableHead>
                  <TableHead className="text-right">총 매출</TableHead>
                  <TableHead className="text-right">플랫폼 수수료</TableHead>
                  <TableHead className="text-right">정산액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>지급일</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlementsData?.settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-medium">
                      {new Date(settlement.period_start).toLocaleDateString()} ~{' '}
                      {new Date(settlement.period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {settlement.total_sales.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {settlement.platform_fee.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {settlement.net_amount.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          settlement.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {settlement.status === 'completed' ? '정산 완료' : '정산 대기'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {settlement.paid_at
                        ? new Date(settlement.paid_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSettlement(settlement.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              이전
            </Button>
            <span className="text-sm text-gray-600">
              페이지 {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!settlementsData?.settlements.length}
            >
              다음
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settlement Detail Modal */}
      <Dialog open={!!selectedSettlement} onOpenChange={() => setSelectedSettlement(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>정산 상세</DialogTitle>
            <DialogDescription>예약 건별 상세 내역</DialogDescription>
          </DialogHeader>

          {settlementDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">정산 기간</p>
                  <p className="font-medium">
                    {new Date(settlementDetail.period_start).toLocaleDateString()} ~{' '}
                    {new Date(settlementDetail.period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">정산액</p>
                  <p className="font-medium text-green-600">
                    {settlementDetail.net_amount.toLocaleString()}원
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>예약 시간</TableHead>
                    <TableHead>고객</TableHead>
                    <TableHead>코스</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlementDetail.bookings?.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {new Date(booking.start_time).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.customer_name}</p>
                          <p className="text-sm text-gray-500">{booking.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{booking.course?.name}</TableCell>
                      <TableCell className="text-right">
                        {booking.total_price.toLocaleString()}원
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
