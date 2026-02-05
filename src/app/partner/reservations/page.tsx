'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Filter, Search, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  fetchShopReservations,
  fetchShopCourses,
  approveReservation,
  rejectReservation,
  completeReservation,
  subscribeToReservations,
  unsubscribeChannel,
  getPartnerShopId,
} from '@/lib/api/partner';
import {
  sendReservationConfirmedNotification,
  sendReservationCancelledNotification,
  sendReviewRequestNotification,
} from '@/lib/api/notification';
import { ReservationWithDetails, Course } from '@/types/supabase';
import { Store } from 'lucide-react';

// Filter state interface
interface FilterState {
  dateRange: DateRange | undefined;
  courseId: string | null;
  status: string | null;
}

export default function ReservationsPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [noShop, setNoShop] = useState(false);
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<ReservationWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    courseId: null,
    status: null,
  });
  const [tempFilters, setTempFilters] = useState<FilterState>({
    dateRange: undefined,
    courseId: null,
    status: null,
  });

  // Resolve the partner's shop ID on mount
  useEffect(() => {
    async function resolveShop() {
      const id = await getPartnerShopId();
      if (id) {
        setShopId(id);
      } else {
        setNoShop(true);
        setIsLoading(false);
      }
    }
    resolveShop();
  }, []);

  // Load reservations and courses once shopId is resolved
  useEffect(() => {
    if (shopId) {
      loadReservations(shopId);
      loadCourses(shopId);
    }
  }, [shopId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!shopId) return;

    const channel = subscribeToReservations(shopId, () => {
      loadReservations(shopId);
    });
    return () => {
      unsubscribeChannel(channel);
    };
  }, [shopId]);

  // Filter reservations based on tab, search, and advanced filters
  useEffect(() => {
    let filtered = reservations;

    // Filter by status (from tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter((r) => r.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.user?.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.user?.phone?.includes(searchQuery) ||
          r.course?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.dateRange?.from) {
      const fromDate = new Date(filters.dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((r) => {
        const reservationDate = new Date(r.date);
        return reservationDate >= fromDate;
      });
    }
    if (filters.dateRange?.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => {
        const reservationDate = new Date(r.date);
        return reservationDate <= toDate;
      });
    }

    // Filter by course
    if (filters.courseId) {
      filtered = filtered.filter((r) => r.course_id === filters.courseId);
    }

    // Filter by status (from advanced filter - overrides tab if set)
    if (filters.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    setFilteredReservations(filtered);
  }, [reservations, activeTab, searchQuery, filters]);

  async function loadReservations(currentShopId: string) {
    try {
      setIsLoading(true);
      const data = await fetchShopReservations(currentShopId);
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
      toast.error('예약 목록 로드 실패');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCourses(currentShopId: string) {
    try {
      const data = await fetchShopCourses(currentShopId);
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }

  // Filter helper functions
  function handleApplyFilters() {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  }

  function handleResetFilters() {
    const emptyFilters: FilterState = {
      dateRange: undefined,
      courseId: null,
      status: null,
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setIsFilterOpen(false);
  }

  function removeFilter(filterKey: keyof FilterState) {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: filterKey === 'dateRange' ? undefined : null,
    }));
    setTempFilters((prev) => ({
      ...prev,
      [filterKey]: filterKey === 'dateRange' ? undefined : null,
    }));
  }

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange?.from || filters.dateRange?.to) count++;
    if (filters.courseId) count++;
    if (filters.status) count++;
    return count;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0;

  async function handleApprove(reservationId: string) {
    if (!shopId) return;
    try {
      setIsUpdating(reservationId);
      await approveReservation(reservationId);
      toast.success('예약 승인 완료');

      // 알림 발송 (실패해도 예약 처리는 완료)
      const reservation = reservations.find((r) => r.id === reservationId);
      if (reservation?.user_id) {
        const shopName = reservation.shop?.name || '매장';
        try {
          await sendReservationConfirmedNotification(
            reservation.user_id,
            reservationId,
            shopName,
            reservation.date,
            reservation.time
          );
        } catch (notificationError) {
          console.error('알림 발송 실패:', notificationError);
        }
      }

      await loadReservations(shopId);
    } catch (error) {
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

      // 알림 발송 (실패해도 예약 처리는 완료)
      const reservation = reservations.find((r) => r.id === reservationId);
      if (reservation?.user_id) {
        const shopName = reservation.shop?.name || '매장';
        try {
          await sendReservationCancelledNotification(
            reservation.user_id,
            reservationId,
            shopName,
            '매장 사정으로 예약이 취소되었습니다.'
          );
        } catch (notificationError) {
          console.error('알림 발송 실패:', notificationError);
        }
      }

      await loadReservations(shopId);
    } catch (error) {
      toast.error('예약 거절 실패');
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleComplete(reservationId: string) {
    if (!shopId) return;
    try {
      setIsUpdating(reservationId);
      await completeReservation(reservationId);
      toast.success('서비스 완료 처리');

      // 리뷰 요청 알림 발송 (실패해도 예약 처리는 완료)
      const reservation = reservations.find((r) => r.id === reservationId);
      if (reservation?.user_id && reservation?.shop_id) {
        const shopName = reservation.shop?.name || '매장';
        try {
          await sendReviewRequestNotification(
            reservation.user_id,
            reservation.shop_id,
            shopName
          );
        } catch (notificationError) {
          console.error('알림 발송 실패:', notificationError);
        }
      }

      await loadReservations(shopId);
    } catch (error) {
      toast.error('완료 처리 실패');
    } finally {
      setIsUpdating(null);
    }
  }

  const tabCounts = {
    all: reservations.length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    completed: reservations.filter((r) => r.status === 'completed').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
  };

  // Show message if partner has no registered shop
  if (noShop) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                <Store className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">등록된 가게가 없습니다</h2>
              <p className="text-sm text-gray-500">
                예약을 관리하려면 먼저 가게를 등록해주세요.
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">예약 관리</h1>
        <p className="mt-1 text-sm text-gray-500">전체 예약 내역을 관리합니다</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="고객명, 연락처, 코스명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={(open) => {
              setIsFilterOpen(open);
              if (open) {
                setTempFilters(filters);
              }
            }}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4">
                  <h4 className="font-semibold text-sm mb-4">필터 설정</h4>

                  {/* Date Range Filter */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-xs text-gray-500">날짜 범위</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dateRange?.from ? (
                            tempFilters.dateRange.to ? (
                              <>
                                {format(tempFilters.dateRange.from, 'PPP', { locale: ko })} -{' '}
                                {format(tempFilters.dateRange.to, 'PPP', { locale: ko })}
                              </>
                            ) : (
                              format(tempFilters.dateRange.from, 'PPP', { locale: ko })
                            )
                          ) : (
                            <span className="text-muted-foreground">날짜 선택</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={tempFilters.dateRange}
                          onSelect={(range) =>
                            setTempFilters((prev) => ({ ...prev, dateRange: range }))
                          }
                          numberOfMonths={1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Course Filter */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-xs text-gray-500">코스</Label>
                    <Select
                      value={tempFilters.courseId || ''}
                      onValueChange={(value) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          courseId: value === 'all' ? null : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="전체 코스" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 코스</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-xs text-gray-500">예약 상태</Label>
                    <Select
                      value={tempFilters.status || ''}
                      onValueChange={(value) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          status: value === 'all' ? null : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="전체 상태" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 상태</SelectItem>
                        <SelectItem value="pending">대기중</SelectItem>
                        <SelectItem value="confirmed">확정</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="cancelled">취소</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="my-4" />

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleResetFilters}
                    >
                      초기화
                    </Button>
                    <Button size="sm" className="flex-1" onClick={handleApplyFilters}>
                      적용
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.dateRange?.from && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(filters.dateRange.from, 'MM/dd', { locale: ko })}
                  {filters.dateRange.to && ` - ${format(filters.dateRange.to, 'MM/dd', { locale: ko })}`}
                  <button
                    onClick={() => removeFilter('dateRange')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.courseId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {courses.find((c) => c.id === filters.courseId)?.name || '코스'}
                  <button
                    onClick={() => removeFilter('courseId')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.status === 'pending'
                    ? '대기중'
                    : filters.status === 'confirmed'
                    ? '확정'
                    : filters.status === 'completed'
                    ? '완료'
                    : '취소'}
                  <button
                    onClick={() => removeFilter('status')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={handleResetFilters}
              >
                전체 초기화
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            전체 ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            대기 ({tabCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            확정 ({tabCounts.confirmed})
          </TabsTrigger>
          <TabsTrigger value="completed">
            완료 ({tabCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            취소 ({tabCounts.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm text-gray-500">
                  {searchQuery || hasActiveFilters
                    ? '검색 결과가 없습니다.'
                    : '예약이 없습니다.'}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={handleResetFilters}
                  >
                    필터 초기화
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReservations.map((reservation, index) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Date & Time */}
                          <div className="flex items-center space-x-3">
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-lg font-semibold text-gray-900">
                              {new Date(reservation.date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}{' '}
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

                          {/* Course Info */}
                          <div>
                            <p className="font-medium text-gray-900">
                              {reservation.course?.name || '코스 정보 없음'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {reservation.course?.duration}분 •{' '}
                              {(
                                reservation.course?.price_discount ||
                                reservation.course?.price_original ||
                                0
                              ).toLocaleString()}
                              원
                            </p>
                          </div>

                          {/* Customer Info */}
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-sm font-medium text-gray-900">
                              고객: {reservation.user?.nickname || '정보 없음'}
                            </p>
                            <p className="text-sm text-gray-600">
                              연락처: {reservation.user?.phone || '정보 없음'}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="ml-4 flex flex-col space-y-2">
                          {reservation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
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
                            </>
                          )}
                          {reservation.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleComplete(reservation.id)}
                              disabled={isUpdating === reservation.id}
                            >
                              완료 처리
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
