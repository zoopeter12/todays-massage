'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Store,
  MapPin,
  Phone,
  Eye,
  Check,
  X,
  Ban,
  Star,
  Crown,
  Image as ImageIcon,
  ChevronDown,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { PaginationControls, usePagination } from '@/components/admin/pagination-controls';
import { useToast } from '@/hooks/use-toast';
import { updateShopTier } from '@/lib/api/shops';
import type { Shop, ShopStatus } from '@/types/supabase';

interface AdminShopData extends Shop {
  owner_name?: string;
  owner_phone?: string;
  reservation_count?: number;
  average_rating?: number;
}

type ShopStatusFilter = 'all' | ShopStatus;
type ShopTier = 'basic' | 'premium' | 'vip';

export default function AdminShopsPage() {
  const { toast } = useToast();
  const [shops, setShops] = useState<AdminShopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShopStatusFilter>('all');
  const [selectedShop, setSelectedShop] = useState<AdminShopData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isTierOpen, setIsTierOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTier, setSelectedTier] = useState<ShopTier>('basic');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  });

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Pagination state
  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  } = usePagination(10);

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShops((data as AdminShopData[]) ?? []);

      // Calculate stats
      const allShops = data ?? [];
      setStats({
        total: allShops.length,
        pending: allShops.filter((s) => s.status === 'pending').length,
        approved: allShops.filter((s) => s.status === 'approved').length,
        rejected: allShops.filter((s) => s.status === 'rejected').length,
        suspended: allShops.filter((s) => s.status === 'suspended').length,
      });
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredShops = shops.filter((shop) => {
    // Status filter
    if (statusFilter !== 'all' && shop.status !== statusFilter) {
      return false;
    }
    // Search filter
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      shop.name.toLowerCase().includes(search) ||
      shop.address?.toLowerCase().includes(search) ||
      shop.tel?.toLowerCase().includes(search)
    );
  });

  // Pagination calculations
  const totalItems = filteredShops.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedShops = filteredShops.slice(startIndex, startIndex + pageSize);

  // Reset page and selection when filter changes
  useEffect(() => {
    resetPage();
    setSelectedIds(new Set());
  }, [searchTerm, statusFilter]);

  // Bulk selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedShops.map((shop) => shop.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  }, [paginatedShops]);

  const handleSelectOne = useCallback((shopId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(shopId);
      } else {
        next.delete(shopId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = paginatedShops.length > 0 && paginatedShops.every((shop) => selectedIds.has(shop.id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  // Bulk action handlers
  async function handleBulkApprove() {
    if (selectedIds.size === 0) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          status: 'approved',
          is_open: true,
          rejection_reason: null,
          rejected_at: null,
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: '일괄 승인 완료',
        description: `${selectedIds.size}개 매장이 승인되었습니다.`,
      });

      clearSelection();
      fetchShops();
    } catch (error) {
      console.error('Failed to bulk approve shops:', error);
      toast({
        title: '일괄 승인 실패',
        description: '매장 승인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkReject() {
    if (selectedIds.size === 0 || !bulkRejectReason) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          status: 'rejected',
          is_open: false,
          rejection_reason: bulkRejectReason,
          rejected_at: new Date().toISOString(),
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: '일괄 반려 완료',
        description: `${selectedIds.size}개 매장이 반려되었습니다.`,
      });

      setIsBulkRejectOpen(false);
      setBulkRejectReason('');
      clearSelection();
      fetchShops();
    } catch (error) {
      console.error('Failed to bulk reject shops:', error);
      toast({
        title: '일괄 반려 실패',
        description: '매장 반려 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: '일괄 삭제 완료',
        description: `${selectedIds.size}개 매장이 삭제되었습니다.`,
      });

      setIsBulkDeleteOpen(false);
      clearSelection();
      fetchShops();
    } catch (error) {
      console.error('Failed to bulk delete shops:', error);
      toast({
        title: '일괄 삭제 실패',
        description: '매장 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  }

  function getStatusBadge(status: ShopStatus) {
    const statusMap: Record<ShopStatus, { label: string; className: string }> = {
      pending: { label: '승인대기', className: 'bg-amber-100 text-amber-800' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-800' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-800' },
      suspended: { label: '정지됨', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  function getTierBadge(tier: ShopTier = 'basic') {
    const tierMap: Record<ShopTier, { label: string; className: string; icon: React.ReactNode }> = {
      basic: { label: '기본', className: 'bg-gray-100 text-gray-800', icon: null },
      premium: { label: '프리미엄', className: 'bg-violet-100 text-violet-800', icon: <Star className="h-3 w-3 mr-1" /> },
      vip: { label: 'VIP', className: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white', icon: <Crown className="h-3 w-3 mr-1" /> },
    };
    const config = tierMap[tier];
    return (
      <Badge className={config.className}>
        {config.icon}
        {config.label}
      </Badge>
    );
  }

  async function handleApprove(shopId: string) {
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          status: 'approved',
          is_open: true,
          rejection_reason: null,
          rejected_at: null,
        })
        .eq('id', shopId);

      if (error) throw error;

      fetchShops();
      toast({
        title: '승인 완료',
        description: '매장이 승인되었습니다.',
      });
    } catch (error) {
      console.error('Failed to approve shop:', error);
      toast({
        title: '승인 실패',
        description: '매장 승인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  }

  async function handleReject() {
    if (!selectedShop || !rejectReason) return;

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          status: 'rejected',
          is_open: false,
          rejection_reason: rejectReason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', selectedShop.id);

      if (error) throw error;

      setIsRejectOpen(false);
      setRejectReason('');
      setSelectedShop(null);
      fetchShops();
      toast({
        title: '반려 완료',
        description: '매장이 반려되었습니다.',
      });
    } catch (error) {
      console.error('Failed to reject shop:', error);
      toast({
        title: '반려 실패',
        description: '매장 반려 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  }

  async function handleSuspend(shopId: string) {
    if (!confirm('정말 이 매장을 정지하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          status: 'suspended',
          is_open: false,
        })
        .eq('id', shopId);

      if (error) throw error;

      fetchShops();
      toast({
        title: '정지 완료',
        description: '매장이 정지되었습니다.',
      });
    } catch (error) {
      console.error('Failed to suspend shop:', error);
      toast({
        title: '정지 실패',
        description: '매장 정지 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  }

  async function handleTierChange() {
    if (!selectedShop) return;

    try {
      const result = await updateShopTier(selectedShop.id, selectedTier);

      if (result.success) {
        // 성공 토스트 표시
        toast({
          title: '등급 변경 완료',
          description: `${selectedShop.name} 매장의 등급이 ${getTierLabel(selectedTier)}로 변경되었습니다.`,
        });

        // 목록 새로고침
        await fetchShops();

        // 다이얼로그 닫기
        setIsTierOpen(false);
        setSelectedShop(null);
      } else {
        throw new Error(result.error || '등급 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to change tier:', error);
      toast({
        title: '등급 변경 실패',
        description: error instanceof Error ? error.message : '등급 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  }

  function getTierLabel(tier: ShopTier): string {
    const labels: Record<ShopTier, string> = {
      basic: '기본',
      premium: '프리미엄',
      vip: 'VIP',
    };
    return labels[tier];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">매장관리</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-gray-100">
              <Store className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 매장</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <Store className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">승인 대기</p>
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">운영중</p>
              <p className="text-xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">휴업/정지</p>
              <p className="text-xl font-bold text-red-600">{stats.suspended}</p>
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
                placeholder="매장명, 주소, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ShopStatusFilter)} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="pending">대기({stats.pending})</TabsTrigger>
                <TabsTrigger value="approved">승인({stats.approved})</TabsTrigger>
                <TabsTrigger value="rejected">반려({stats.rejected})</TabsTrigger>
                <TabsTrigger value="suspended">정지({stats.suspended})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-none shadow-md bg-violet-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-violet-100 text-violet-800">
                  {selectedIds.size}개 선택됨
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  선택 초기화
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={bulkActionLoading}>
                      일괄 작업
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleBulkApprove}
                      className="text-green-600 focus:text-green-700 focus:bg-green-50 cursor-pointer"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      일괄 승인
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsBulkRejectOpen(true)}
                      className="text-orange-600 focus:text-orange-700 focus:bg-orange-50 cursor-pointer"
                    >
                      <X className="mr-2 h-4 w-4" />
                      일괄 반려
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsBulkDeleteOpen(true)}
                      className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      일괄 삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shops Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 매장이 없습니다.'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) {
                            (el as HTMLButtonElement).dataset.state = isIndeterminate ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked');
                          }
                        }}
                        onCheckedChange={handleSelectAll}
                        aria-label="전체 선택"
                      />
                    </TableHead>
                    <TableHead>매장정보</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedShops.map((shop) => (
                    <TableRow key={shop.id} className={selectedIds.has(shop.id) ? 'bg-violet-50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(shop.id)}
                          onCheckedChange={(checked) => handleSelectOne(shop.id, !!checked)}
                          aria-label={`${shop.name} 선택`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {shop.images && shop.images.length > 0 ? (
                              <img
                                src={shop.images[0]}
                                alt={shop.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{shop.name}</p>
                            <p className="text-xs text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {shop.address || '주소 없음'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shop.category || '미지정'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{shop.tel || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(shop.status)}
                          {shop.status === 'rejected' && shop.rejection_reason && (
                            <span className="text-xs text-red-600 truncate max-w-[150px]" title={shop.rejection_reason}>
                              {shop.rejection_reason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{shop.view_count.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        {new Date(shop.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedShop(shop);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(shop.status === 'pending' || shop.status === 'rejected') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(shop.id)}
                              title="승인"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {shop.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => {
                                setSelectedShop(shop);
                                setIsRejectOpen(true);
                              }}
                              title="반려"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                            onClick={() => {
                              setSelectedShop(shop);
                              setIsTierOpen(true);
                            }}
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                          {shop.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleSuspend(shop.id)}
                              title="정지"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Shop Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>매장 상세정보</DialogTitle>
          </DialogHeader>
          {selectedShop && (
            <div className="space-y-4">
              {/* Shop Image */}
              <div className="w-full h-40 rounded-lg bg-gray-100 overflow-hidden">
                {selectedShop.images && selectedShop.images.length > 0 ? (
                  <img
                    src={selectedShop.images[0]}
                    alt={selectedShop.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedShop.name}</h3>
                  <p className="text-sm text-gray-500">{selectedShop.category || '카테고리 미지정'}</p>
                </div>
                {getStatusBadge(selectedShop.status)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{selectedShop.address || '주소 없음'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedShop.tel || '연락처 없음'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span>조회수: {selectedShop.view_count.toLocaleString()}회</span>
                </div>
              </div>

              {/* Rejection Info */}
              {selectedShop.status === 'rejected' && selectedShop.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">반려 사유</p>
                  <p className="text-sm text-red-700">{selectedShop.rejection_reason}</p>
                  {selectedShop.rejected_at && (
                    <p className="text-xs text-red-500 mt-2">
                      반려일시: {new Date(selectedShop.rejected_at).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              )}

              {selectedShop.images && selectedShop.images.length > 1 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">추가 이미지</p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedShop.images.slice(1).map((img, idx) => (
                      <div key={idx} className="aspect-square rounded overflow-hidden">
                        <img src={img} alt={`${selectedShop.name} ${idx + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
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

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>매장 반려</DialogTitle>
            <DialogDescription>
              {selectedShop?.name} 매장을 반려하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">반려 사유</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="반려 사유를 입력하세요"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason}
            >
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Change Dialog */}
      <Dialog open={isTierOpen} onOpenChange={setIsTierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>매장 등급 변경</DialogTitle>
            <DialogDescription>
              {selectedShop?.name} 매장의 등급을 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">등급 선택</label>
              <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as ShopTier)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">기본</SelectItem>
                  <SelectItem value="premium">프리미엄 (상위 노출)</SelectItem>
                  <SelectItem value="vip">VIP (최상위 노출 + 추가 혜택)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-1">등급별 혜택</p>
              <ul className="space-y-1 text-xs">
                <li>- 기본: 일반 노출</li>
                <li>- 프리미엄: 검색 상위 노출, 배지 표시</li>
                <li>- VIP: 최상위 노출, 특별 배지, 광고 지원</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTierOpen(false)}>
              취소
            </Button>
            <Button onClick={handleTierChange}>변경</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={isBulkRejectOpen} onOpenChange={setIsBulkRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일괄 반려</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.size}개 매장을 일괄 반려합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">반려 사유</label>
              <Textarea
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                placeholder="반려 사유를 입력하세요 (모든 선택된 매장에 동일하게 적용됩니다)"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                선택된 모든 매장에 동일한 반려 사유가 적용됩니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkRejectOpen(false);
                setBulkRejectReason('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkReject}
              disabled={!bulkRejectReason || bulkActionLoading}
            >
              {bulkActionLoading ? '처리 중...' : '일괄 반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일괄 삭제 확인</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.size}개 매장을 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    이 작업은 되돌릴 수 없습니다!
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    선택한 매장과 관련된 모든 데이터(코스, 예약 등)가 함께 삭제될 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? '삭제 중...' : `${selectedIds.size}개 매장 삭제`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
