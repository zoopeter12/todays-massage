'use client';

/**
 * Example integration of TimeSlotSelector and StaffSelector in a booking flow
 * This shows how to use the components together in BookingDrawer or similar
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Calendar, Clock, User, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { TimeSlotSelector } from './TimeSlotSelector';
import { StaffSelector } from './StaffSelector';

interface Course {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface BookingDrawerExampleProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  selectedCourse: Course | null;
}

export function BookingDrawerExample({
  isOpen,
  onClose,
  shopId,
  selectedCourse,
}: BookingDrawerExampleProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      // Replace with actual booking API call
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) throw new Error('Failed to create booking');
      return response.json();
    },
    onSuccess: () => {
      toast.success('예약이 완료되었습니다!');
      handleClose();
    },
    onError: () => {
      toast.error('예약 중 오류가 발생했습니다.');
    },
  });

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedStaffId(null);
    onClose();
  };

  const handleConfirmBooking = () => {
    if (!selectedCourse || !selectedDate || !selectedTime) {
      toast.error('예약 정보를 모두 입력해주세요.');
      return;
    }

    const bookingData = {
      shop_id: shopId,
      course_id: selectedCourse.id,
      start_time: `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`,
      course_duration: selectedCourse.duration,
      staff_id: selectedStaffId,
      total_price: selectedCourse.price,
      status: 'pending',
    };

    createBookingMutation.mutate(bookingData);
  };

  const canConfirm = selectedDate && selectedTime && selectedCourse;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>예약하기</SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <SheetDescription>
            원하시는 날짜, 시간, 관리사를 선택해주세요.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {selectedCourse && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedCourse.name}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedCourse.duration}분</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      <span>{selectedCourse.price.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {selectedCourse && (
            <>
              <TimeSlotSelector
                shopId={shopId}
                courseDuration={selectedCourse.duration}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
              />

              <Separator />

              <StaffSelector
                shopId={shopId}
                selectedStaffId={selectedStaffId}
                onStaffChange={setSelectedStaffId}
              />

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">예약 요약</h3>
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">코스</span>
                    <span className="font-medium">{selectedCourse.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">날짜</span>
                    <span className="font-medium">
                      {selectedDate
                        ? format(selectedDate, 'PPP', { locale: ko })
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">시간</span>
                    <span className="font-medium">
                      {selectedTime || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">소요 시간</span>
                    <span className="font-medium">{selectedCourse.duration}분</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">관리사</span>
                    <span className="font-medium">
                      {selectedStaffId ? '지정됨' : '지정 안함'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold">총 금액</span>
                    <span className="font-bold text-blue-600">
                      {selectedCourse.price.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={!canConfirm || createBookingMutation.isPending}
                onClick={handleConfirmBooking}
              >
                {createBookingMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>예약 중...</span>
                  </div>
                ) : (
                  '예약 확정'
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
