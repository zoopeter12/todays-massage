'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  Download,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import {
  fetchAllSettlements,
  completeSettlement,
  type AdminSettlementData,
  type SettlementStats,
} from '@/lib/api/settlements';
import { exportToExcel } from '@/lib/utils/export';

type SettlementStatus = 'all' | 'pending' | 'completed';

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<AdminSettlementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SettlementStatus>('all');
  const [selectedSettlement, setSelectedSettlement] = useState<AdminSettlementData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<SettlementStats>({
    totalSales: 0,
    totalFee: 0,
    pendingAmount: 0,
    completedAmount: 0,
  });

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const { settlements: data, stats: statsData } = await fetchAllSettlements(statusFilter);
      setSettlements(data);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const filteredSettlements = settlements.filter((settlement) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return settlement.shop_name?.toLowerCase().includes(search);
  });

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '정산 대기', className: 'bg-amber-100 text-amber-800' },
      processing: { label: '처리 중', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '정산 완료', className: 'bg-green-100 text-green-800' },
      failed: { label: '실패', className: 'bg-red-100 text-red-800' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  async function handleProcess() {
    if (!selectedSettlement) return;

    setProcessing(true);
    try {
      const success = await completeSettlement(selectedSettlement.id);

      if (success) {
        alert(`${selectedSettlement.shop_name} 매장에 ${selectedSettlement.net_amount.toLocaleString()}원을 정산했습니다.`);
        setIsProcessOpen(false);
        setSelectedSettlement(null);
        loadSettlements();
      } else {
        alert('정산 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to process settlement:', error);
      alert('정산 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function handleExport() {
    const columns = [
      { header: '정산 ID', key: 'id', width: 20 },
      { header: '매장명', key: 'shop_name', width: 20 },
      { header: '정산 기간', key: 'period', width: 25 },
      { header: '총 매출', key: 'total_sales', width: 15 },
      { header: '수수료', key: 'fee', width: 12 },
      { header: '정산 금액', key: 'settlement_amount', width: 15 },
      { header: '상태', key: 'status', width: 10 },
      { header: '정산일', key: 'settled_at', width: 20 },
      { header: '은행명', key: 'bank_name', width: 15 },
      { header: '계좌번호', key: 'bank_account', width: 20 },
      { header: '예금주', key: 'account_holder', width: 15 },
    ];

    const exportData = filteredSettlements.map(s => ({
      id: s.id,
      shop_name: s.shop_name || '',
      period: `${s.period_start} ~ ${s.period_end}`,
      total_sales: `${s.total_sales.toLocaleString()}원`,
      fee: `${s.platform_fee.toLocaleString()}원`,
      settlement_amount: `${s.net_amount.toLocaleString()}원`,
      status: s.status === 'pending' ? '정산 대기' : s.status === 'processing' ? '처리 중' : s.status === 'completed' ? '정산 완료' : '실패',
      settled_at: s.paid_at ? new Date(s.paid_at).toLocaleString('ko-KR') : '-',
      bank_name: s.bank_name || '',
      bank_account: s.bank_account || '',
      account_holder: s.account_holder || '',
    }));

    const today = new Date().toISOString().split('T')[0];
    exportToExcel(exportData, columns, `정산내역_${today}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">정산관리</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          내역 다운로드
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 매출</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalSales.toLocaleString()}원</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-br from-violet-500 to-pink-500 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/20">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/80">플랫폼 수수료</p>
              <p className="text-xl font-bold">{stats.totalFee.toLocaleString()}원</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">정산 대기</p>
              <p className="text-xl font-bold text-amber-600">{stats.pendingAmount.toLocaleString()}원</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">정산 완료</p>
              <p className="text-xl font-bold text-green-600">{stats.completedAmount.toLocaleString()}원</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="매장명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as SettlementStatus)} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="pending">대기</TabsTrigger>
                <TabsTrigger value="completed">완료</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '정산 내역이 없습니다.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>매장</TableHead>
                  <TableHead>정산 기간</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                  <TableHead className="text-right">수수료(10%)</TableHead>
                  <TableHead className="text-right">정산금</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{settlement.shop_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {settlement.period_start} ~ {settlement.period_end}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {settlement.total_sales.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right text-violet-600">
                      -{settlement.platform_fee.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {settlement.net_amount.toLocaleString()}원
                    </TableCell>
                    <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSettlement(settlement);
                            setIsDetailOpen(true);
                          }}
                        >
                          상세
                        </Button>
                        {settlement.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setIsProcessOpen(true);
                            }}
                          >
                            정산
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Settlement Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>정산 상세정보</DialogTitle>
          </DialogHeader>
          {selectedSettlement && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedSettlement.shop_name}</h3>
                {getStatusBadge(selectedSettlement.status)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>정산 기간: {selectedSettlement.period_start} ~ {selectedSettlement.period_end}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{selectedSettlement.bank_name} {selectedSettlement.bank_account}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span>예금주: {selectedSettlement.account_holder}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">총 매출</span>
                  <span className="font-medium">{selectedSettlement.total_sales.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">플랫폼 수수료 (10%)</span>
                  <span className="font-medium text-violet-600">-{selectedSettlement.platform_fee.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-base border-t pt-2">
                  <span className="font-semibold">정산금</span>
                  <span className="font-bold text-lg">{selectedSettlement.net_amount.toLocaleString()}원</span>
                </div>
              </div>

              {selectedSettlement.paid_at && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  정산 완료: {new Date(selectedSettlement.paid_at).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Settlement Dialog */}
      <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정산 처리</DialogTitle>
            <DialogDescription>
              {selectedSettlement?.shop_name} 매장에 정산금을 지급하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          {selectedSettlement && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">정산금</span>
                  <span className="font-bold text-lg">{selectedSettlement.net_amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">입금 계좌</span>
                  <span>{selectedSettlement.bank_name} {selectedSettlement.bank_account}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">예금주</span>
                  <span>{selectedSettlement.account_holder}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessOpen(false)} disabled={processing}>
              취소
            </Button>
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? '처리 중...' : '정산 처리'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
