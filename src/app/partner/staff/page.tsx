'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Plus, Pencil, Trash2, User, Store as StoreIcon, Calendar as CalendarIcon, Star, Clock, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StarRating } from '@/components/ui/star-rating';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  fetchStaff,
  fetchStaffWithStats,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffActive,
  upsertStaffSchedule,
  fetchStaffSchedule,
  fetchStaffReviews,
  CreateStaffData,
  UpdateStaffData,
  CreateScheduleData,
} from '@/lib/api/staff';
import { getPartnerShop } from '@/lib/api/partner';
import { Staff, StaffWithStats, StaffSchedule, StaffReview, SPECIALTY_OPTIONS, DAYS_OF_WEEK, DAY_LABELS } from '@/types/staff';

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState<StaffWithStats | null>(null);
  const [selectedStaffForReview, setSelectedStaffForReview] = useState<StaffWithStats | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    photo: '',
    specialties: [] as string[],
  });
  const [scheduleFormData, setScheduleFormData] = useState<{
    day_off: string[];
    work_start: string;
    work_end: string;
    temp_off_dates: Date[];
  }>({
    day_off: [],
    work_start: '09:00',
    work_end: '18:00',
    temp_off_dates: [],
  });

  // Resolve the partner's shop dynamically
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['partner-shop'],
    queryFn: getPartnerShop,
  });

  const { data: staffList = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff-with-stats', shop?.id],
    queryFn: () => fetchStaffWithStats(shop!.id),
    enabled: !!shop?.id,
  });

  const { data: selectedStaffReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['staff-reviews', selectedStaffForReview?.id],
    queryFn: () => fetchStaffReviews(selectedStaffForReview!.id),
    enabled: !!selectedStaffForReview?.id && isReviewDialogOpen,
  });

  const isLoading = shopLoading || staffLoading;

  const createMutation = useMutation({
    mutationFn: (data: CreateStaffData) => createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-with-stats', shop?.id] });
      toast.success('관리사가 등록되었습니다.');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('관리사 등록에 실패했습니다.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffData }) =>
      updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-with-stats', shop?.id] });
      toast.success('관리사 정보가 수정되었습니다.');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('관리사 정보 수정에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-with-stats', shop?.id] });
      toast.success('관리사가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('관리사 삭제에 실패했습니다.');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleStaffActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-with-stats', shop?.id] });
      toast.success('관리사 상태가 변경되었습니다.');
    },
    onError: () => {
      toast.error('관리사 상태 변경에 실패했습니다.');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: CreateScheduleData) => upsertStaffSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-with-stats', shop?.id] });
      toast.success('일정이 저장되었습니다.');
      handleCloseScheduleDialog();
    },
    onError: () => {
      toast.error('일정 저장에 실패했습니다.');
    },
  });

  const handleOpenDialog = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        photo: staff.photo || '',
        specialties: staff.specialties,
      });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', photo: '', specialties: [] });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStaff(null);
    setFormData({ name: '', photo: '', specialties: [] });
  };

  const handleOpenScheduleDialog = (staff: StaffWithStats) => {
    setSelectedStaffForSchedule(staff);
    if (staff.schedule) {
      setScheduleFormData({
        day_off: staff.schedule.day_off || [],
        work_start: staff.schedule.work_start || '09:00',
        work_end: staff.schedule.work_end || '18:00',
        temp_off_dates: (staff.schedule.temp_off_dates || []).map(d => new Date(d)),
      });
    } else {
      setScheduleFormData({
        day_off: [],
        work_start: '09:00',
        work_end: '18:00',
        temp_off_dates: [],
      });
    }
    setIsScheduleDialogOpen(true);
  };

  const handleCloseScheduleDialog = () => {
    setIsScheduleDialogOpen(false);
    setSelectedStaffForSchedule(null);
    setScheduleFormData({
      day_off: [],
      work_start: '09:00',
      work_end: '18:00',
      temp_off_dates: [],
    });
  };

  const handleOpenReviewDialog = (staff: StaffWithStats) => {
    setSelectedStaffForReview(staff);
    setIsReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setIsReviewDialogOpen(false);
    setSelectedStaffForReview(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }

    if (formData.specialties.length === 0) {
      toast.error('최소 하나의 전문분야를 선택해주세요.');
      return;
    }

    if (editingStaff) {
      updateMutation.mutate({
        id: editingStaff.id,
        data: {
          name: formData.name,
          photo: formData.photo || null,
          specialties: formData.specialties,
        },
      });
    } else {
      if (!shop?.id) return;
      createMutation.mutate({
        shop_id: shop.id,
        name: formData.name,
        photo: formData.photo || null,
        specialties: formData.specialties,
      });
    }
  };

  const handleScheduleSubmit = () => {
    if (!selectedStaffForSchedule) return;

    scheduleMutation.mutate({
      staff_id: selectedStaffForSchedule.id,
      day_off: scheduleFormData.day_off,
      work_start: scheduleFormData.work_start,
      work_end: scheduleFormData.work_end,
      temp_off_dates: scheduleFormData.temp_off_dates.map(d => format(d, 'yyyy-MM-dd')),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const toggleDayOff = (day: string) => {
    setScheduleFormData((prev) => ({
      ...prev,
      day_off: prev.day_off.includes(day)
        ? prev.day_off.filter((d) => d !== day)
        : [...prev.day_off, day],
    }));
  };

  const handleTempOffDateSelect = (dates: Date[] | undefined) => {
    setScheduleFormData((prev) => ({
      ...prev,
      temp_off_dates: dates || [],
    }));
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
                관리사 관리를 이용하려면 먼저 가게를 등록해주세요.
                <br />
                관리자에게 문의하시면 가게 등록을 도와드립니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리사 관리</h1>
            <p className="text-gray-600 mt-2">매장의 관리사를 등록하고 관리하세요.</p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            관리사 추가
          </Button>
        </div>

        {staffList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <User className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                등록된 관리사가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">첫 관리사를 등록해보세요.</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-5 h-5 mr-2" />
                관리사 추가
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList.map((staff, index) => (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {staff.photo ? (
                          <Image
                            src={staff.photo}
                            alt={staff.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{staff.name}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {staff.is_active ? '활성' : '비활성'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={staff.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({
                            id: staff.id,
                            isActive: checked,
                          })
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Rating and Reviews */}
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <StarRating rating={staff.average_rating} size="sm" showValue />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleOpenReviewDialog(staff)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          리뷰 {staff.review_count}개
                        </Button>
                      </div>

                      {/* Schedule Summary */}
                      {staff.schedule && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Clock className="w-4 h-4" />
                            <span>
                              {staff.schedule.work_start} - {staff.schedule.work_end}
                            </span>
                          </div>
                          {staff.schedule.day_off.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              휴무: {staff.schedule.day_off.map(d => DAY_LABELS[d as keyof typeof DAY_LABELS]?.slice(0, 1)).join(', ')}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">전문분야</p>
                        <div className="flex flex-wrap gap-2">
                          {staff.specialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenScheduleDialog(staff)}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          일정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(staff)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(staff.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Staff Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? '관리사 수정' : '관리사 추가'}
            </DialogTitle>
            <DialogDescription>
              관리사의 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">사진 URL</Label>
              <Input
                id="photo"
                placeholder="https://example.com/photo.jpg"
                value={formData.photo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, photo: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>전문분야 *</Label>
              <div className="grid grid-cols-2 gap-2">
                {SPECIALTY_OPTIONS.map((specialty) => (
                  <Button
                    key={specialty}
                    type="button"
                    variant={
                      formData.specialties.includes(specialty)
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => toggleSpecialty(specialty)}
                  >
                    {specialty}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? '처리중...'
                : editingStaff
                ? '수정'
                : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedStaffForSchedule?.name} 일정 관리
            </DialogTitle>
            <DialogDescription>
              근무 시간과 휴무일을 설정하세요.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="work-hours" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="work-hours">근무시간</TabsTrigger>
              <TabsTrigger value="day-off">정기휴무</TabsTrigger>
              <TabsTrigger value="temp-off">임시휴무</TabsTrigger>
            </TabsList>

            <TabsContent value="work-hours" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_start">시작 시간</Label>
                  <Input
                    id="work_start"
                    type="time"
                    value={scheduleFormData.work_start}
                    onChange={(e) =>
                      setScheduleFormData((prev) => ({
                        ...prev,
                        work_start: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_end">종료 시간</Label>
                  <Input
                    id="work_end"
                    type="time"
                    value={scheduleFormData.work_end}
                    onChange={(e) =>
                      setScheduleFormData((prev) => ({
                        ...prev,
                        work_end: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                현재 설정: {scheduleFormData.work_start} ~ {scheduleFormData.work_end}
              </p>
            </TabsContent>

            <TabsContent value="day-off" className="space-y-4 pt-4">
              <Label>정기 휴무일 선택</Label>
              <div className="grid grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={day}
                      checked={scheduleFormData.day_off.includes(day)}
                      onCheckedChange={() => toggleDayOff(day)}
                    />
                    <label
                      htmlFor={day}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {DAY_LABELS[day]}
                    </label>
                  </div>
                ))}
              </div>
              {scheduleFormData.day_off.length > 0 && (
                <p className="text-sm text-gray-500">
                  선택된 휴무일: {scheduleFormData.day_off.map(d => DAY_LABELS[d as keyof typeof DAY_LABELS]).join(', ')}
                </p>
              )}
            </TabsContent>

            <TabsContent value="temp-off" className="space-y-4 pt-4">
              <Label>임시 휴무일 선택</Label>
              <div className="flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={scheduleFormData.temp_off_dates}
                  onSelect={handleTempOffDateSelect}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </div>
              {scheduleFormData.temp_off_dates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">선택된 임시 휴무일:</p>
                  <div className="flex flex-wrap gap-2">
                    {scheduleFormData.temp_off_dates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date) => (
                        <Badge
                          key={date.toISOString()}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                            setScheduleFormData((prev) => ({
                              ...prev,
                              temp_off_dates: prev.temp_off_dates.filter(
                                (d) => d.getTime() !== date.getTime()
                              ),
                            }))
                          }
                        >
                          {format(date, 'M월 d일 (E)', { locale: ko })}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseScheduleDialog}>
              취소
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              disabled={scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? '저장중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reviews Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedStaffForReview?.name} 리뷰
            </DialogTitle>
            <DialogDescription>
              고객들의 평가와 리뷰를 확인하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Rating Summary */}
            {selectedStaffForReview && (
              <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {selectedStaffForReview.average_rating.toFixed(1)}
                  </p>
                  <StarRating rating={selectedStaffForReview.average_rating} size="md" />
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedStaffForReview.review_count}개의 리뷰
                  </p>
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedStaffReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>아직 리뷰가 없습니다.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  <AnimatePresence>
                    {selectedStaffReviews.map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-white border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {review.customer_name}
                          </span>
                          <StarRating rating={review.rating} size="xs" />
                        </div>
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(review.created_at), 'yyyy.MM.dd', { locale: ko })}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReviewDialog}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
