'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Star, Tag, UserCircle, X, Store as StoreIcon, Filter, RotateCcw, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  fetchCustomers,
  updateCustomerNote,
  addCustomerTag,
  removeCustomerTag,
} from '@/lib/api/settlements';
import { getPartnerShop } from '@/lib/api/partner';
import type { CustomerNote } from '@/types/settlements';

const TAG_OPTIONS = ['VIP', '단골', '신규', '관심고객', '재방문필요'];

// Filter state interface
interface FilterState {
  tags: string[];
  visitCountMin: number;
  visitCountMax: number;
  lastVisitDays: string; // 'all' | '7' | '30' | '90' | '180'
}

const DEFAULT_FILTERS: FilterState = {
  tags: [],
  visitCountMin: 0,
  visitCountMax: 100,
  lastVisitDays: 'all',
};

const LAST_VISIT_OPTIONS = [
  { value: 'all', label: '전체 기간' },
  { value: '7', label: '최근 7일' },
  { value: '30', label: '최근 30일' },
  { value: '90', label: '최근 90일' },
  { value: '180', label: '최근 6개월' },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerNote | null>(null);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const queryClient = useQueryClient();

  // Resolve the partner's shop dynamically
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['partner-shop'],
    queryFn: getPartnerShop,
  });

  const shopId = shop?.id;

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', shopId],
    queryFn: () => fetchCustomers(shopId!),
    enabled: !!shopId,
  });

  const isLoading = shopLoading || customersLoading;

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCustomerNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('고객 정보가 수정되었습니다');
    },
    onError: () => {
      toast.error('고객 정보 수정에 실패했습니다');
    },
  });

  const addTagMutation = useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: string }) => addCustomerTag(id, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('태그가 추가되었습니다');
    },
    onError: () => {
      toast.error('태그 추가에 실패했습니다');
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: string }) => removeCustomerTag(id, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('태그가 제거되었습니다');
    },
    onError: () => {
      toast.error('태그 제거에 실패했습니다');
    },
  });

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.tags.length > 0 ||
      filters.visitCountMin > 0 ||
      filters.visitCountMax < 100 ||
      filters.lastVisitDays !== 'all'
    );
  }, [filters]);

  // Get active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.tags.length > 0) count++;
    if (filters.visitCountMin > 0 || filters.visitCountMax < 100) count++;
    if (filters.lastVisitDays !== 'all') count++;
    return count;
  }, [filters]);

  // Filter customers based on search and advanced filters
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return customers.filter((customer) => {
      // Search filter
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        customer.customer_name?.toLowerCase().includes(query) ||
        customer.customer_phone.includes(query);

      if (!matchesSearch) return false;

      // Tag filter - if tags selected, customer must have at least one matching tag
      // Also check visit_count based tags for customers without explicit tags
      if (filters.tags.length > 0) {
        const customerTags = [...customer.tags];
        // Add implicit tags based on visit_count
        if (customer.visit_count >= 3 && !customerTags.includes('단골')) {
          customerTags.push('단골');
        }
        if (customer.visit_count === 1 && !customerTags.includes('신규')) {
          customerTags.push('신규');
        }
        if (customer.visit_count >= 5 && !customerTags.includes('VIP')) {
          customerTags.push('VIP');
        }

        const hasMatchingTag = filters.tags.some((tag) => customerTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Visit count filter
      if (
        customer.visit_count < filters.visitCountMin ||
        customer.visit_count > filters.visitCountMax
      ) {
        return false;
      }

      // Last visit date filter
      if (filters.lastVisitDays !== 'all' && customer.last_visit) {
        const daysSinceLastVisit = Math.floor(
          (Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 60 * 60 * 24)
        );
        const maxDays = parseInt(filters.lastVisitDays, 10);
        if (daysSinceLastVisit > maxDays) return false;
      }

      return true;
    });
  }, [customers, searchQuery, filters]);

  // Filter handlers
  const handleTagToggle = (tag: string) => {
    setTempFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const handleVisitCountChange = (value: number[]) => {
    setTempFilters((prev) => ({
      ...prev,
      visitCountMin: value[0],
      visitCountMax: value[1],
    }));
  };

  const handleLastVisitChange = (value: string) => {
    setTempFilters((prev) => ({
      ...prev,
      lastVisitDays: value,
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setTempFilters(DEFAULT_FILTERS);
  };

  const handleClearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setTempFilters(DEFAULT_FILTERS);
  };

  const handleRemoveTagFilter = (tag: string) => {
    const newFilters = {
      ...filters,
      tags: filters.tags.filter((t) => t !== tag),
    };
    setFilters(newFilters);
    setTempFilters(newFilters);
  };

  const handleRemoveVisitCountFilter = () => {
    const newFilters = {
      ...filters,
      visitCountMin: 0,
      visitCountMax: 100,
    };
    setFilters(newFilters);
    setTempFilters(newFilters);
  };

  const handleRemoveLastVisitFilter = () => {
    const newFilters = {
      ...filters,
      lastVisitDays: 'all',
    };
    setFilters(newFilters);
    setTempFilters(newFilters);
  };

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      // Sync temp filters with current filters when opening
      setTempFilters(filters);
    }
    setIsFilterOpen(open);
  };

  // Separate regular and VIP customers
  const vipCustomers = filteredCustomers.filter((c) => c.visit_count >= 3);
  const regularCustomers = filteredCustomers.filter((c) => c.visit_count < 3);

  const handleOpenCustomer = (customer: CustomerNote) => {
    setSelectedCustomer(customer);
    setNotes(customer.notes || '');
    setCustomerName(customer.customer_name || '');
  };

  const handleSaveNotes = () => {
    if (!selectedCustomer) return;
    updateNoteMutation.mutate({
      id: selectedCustomer.id,
      data: { notes, customer_name: customerName },
    });
  };

  const handleAddTag = (tag: string) => {
    if (!selectedCustomer) return;
    addTagMutation.mutate({ id: selectedCustomer.id, tag });
  };

  const handleRemoveTag = (tag: string) => {
    if (!selectedCustomer) return;
    removeTagMutation.mutate({ id: selectedCustomer.id, tag });
  };

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
                고객 관리를 이용하려면 먼저 가게를 등록해주세요.
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
        <h1 className="text-3xl font-bold text-gray-900">고객 관리</h1>
        <p className="text-gray-500 mt-1">고객 정보와 방문 이력을 관리하세요</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="이름 또는 전화번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={handleFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative gap-2">
                <Filter className="w-4 h-4" />
                필터
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600 text-white text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">고급 필터</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-gray-500"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    초기화
                  </Button>
                </div>

                {/* Tag Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    태그별 필터
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TAG_OPTIONS.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-tag-${tag}`}
                          checked={tempFilters.tags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <Label
                          htmlFor={`filter-tag-${tag}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visit Count Range Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    방문 횟수 범위
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={[tempFilters.visitCountMin, tempFilters.visitCountMax]}
                      onValueChange={handleVisitCountChange}
                      min={0}
                      max={100}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{tempFilters.visitCountMin}회</span>
                      <span>{tempFilters.visitCountMax}회{tempFilters.visitCountMax >= 100 ? '+' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Last Visit Date Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    마지막 방문일
                  </Label>
                  <Select
                    value={tempFilters.lastVisitDays}
                    onValueChange={handleLastVisitChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAST_VISIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Apply Button */}
                <Button onClick={handleApplyFilters} className="w-full">
                  필터 적용
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">적용된 필터:</span>
            {filters.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => handleRemoveTagFilter(tag)}
              >
                <Tag className="w-3 h-3" />
                {tag}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            {(filters.visitCountMin > 0 || filters.visitCountMax < 100) && (
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-gray-200"
                onClick={handleRemoveVisitCountFilter}
              >
                <Users className="w-3 h-3" />
                {filters.visitCountMin}-{filters.visitCountMax >= 100 ? '100+' : filters.visitCountMax}회
                <X className="w-3 h-3" />
              </Badge>
            )}
            {filters.lastVisitDays !== 'all' && (
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-gray-200"
                onClick={handleRemoveLastVisitFilter}
              >
                <Calendar className="w-3 h-3" />
                {LAST_VISIT_OPTIONS.find((o) => o.value === filters.lastVisitDays)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-500"
              onClick={handleClearAllFilters}
            >
              전체 해제
            </Button>
          </div>
        )}
      </div>

      {/* VIP Customers */}
      {vipCustomers.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              <CardTitle>단골 고객</CardTitle>
            </div>
            <CardDescription>3회 이상 방문한 소중한 고객님들</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고객 정보</TableHead>
                  <TableHead className="text-center">방문 횟수</TableHead>
                  <TableHead className="text-right">총 결제액</TableHead>
                  <TableHead>마지막 방문</TableHead>
                  <TableHead>태그</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vipCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-yellow-100"
                    onClick={() => handleOpenCustomer(customer)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-yellow-700" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.customer_name || '이름 미등록'}</p>
                          <p className="text-sm text-gray-500">{customer.customer_phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                        {customer.visit_count}회
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {customer.total_spent.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      {customer.last_visit
                        ? new Date(customer.last_visit).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {customer.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{customer.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Regular Customers */}
      <Card>
        <CardHeader>
          <CardTitle>전체 고객</CardTitle>
          <CardDescription>
            총 {filteredCustomers.length}명의 고객
            {hasActiveFilters && customers && ` (전체 ${customers.length}명 중)`}
          </CardDescription>
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
                  <TableHead>고객 정보</TableHead>
                  <TableHead className="text-center">방문 횟수</TableHead>
                  <TableHead className="text-right">총 결제액</TableHead>
                  <TableHead>마지막 방문</TableHead>
                  <TableHead>태그</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleOpenCustomer(customer)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.customer_name || '이름 미등록'}</p>
                          <p className="text-sm text-gray-500">{customer.customer_phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {customer.visit_count}회
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {customer.total_spent.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      {customer.last_visit
                        ? new Date(customer.last_visit).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {customer.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{customer.tags.length - 2}
                          </Badge>
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

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>고객 상세 정보</SheetTitle>
            <SheetDescription>고객 정보를 관리하세요</SheetDescription>
          </SheetHeader>

          {selectedCustomer && (
            <div className="space-y-6 mt-6">
              {/* Customer Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center">
                  <UserCircle className="w-10 h-10 text-blue-700" />
                </div>
                <div className="flex-1">
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="고객 이름"
                    className="font-medium mb-2"
                  />
                  <p className="text-sm text-gray-600">{selectedCustomer.customer_phone}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedCustomer.visit_count}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">방문 횟수</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {(selectedCustomer.total_spent / 10000).toFixed(0)}만
                  </p>
                  <p className="text-sm text-gray-600 mt-1">총 결제액</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedCustomer.last_visit
                      ? Math.floor(
                          (Date.now() - new Date(selectedCustomer.last_visit).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : '-'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">일 전 방문</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  태그 관리
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCustomer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.filter((tag) => !selectedCustomer.tags.includes(tag)).map(
                    (tag) => (
                      <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTag(tag)}
                      >
                        + {tag}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">메모</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="고객에 대한 메모를 입력하세요..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleSaveNotes} className="flex-1">
                  저장
                </Button>
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  취소
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
