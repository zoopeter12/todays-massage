'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, CreditCard, LogIn, Coins, Ticket, Check } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createReservation, getAvailableTimeSlots } from '@/lib/api/reservations';
import { supabase } from '@/lib/supabase/client';
import { ShopWithCourses, Course } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { PointUseSelector } from '@/components/customer/PointUseSelector';
import { CouponSelector } from '@/components/customer/CouponSelector';
import { consumePoints, calculateEarnAmount } from '@/lib/api/points';
import { applyCoupon, calculateDiscount } from '@/lib/api/coupons';
import { UserCoupon } from '@/types/coupons';


interface BookingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shop: ShopWithCourses;
  course: Course;
}

type BookingStep = 'date' | 'time' | 'discount' | 'confirm';

interface StepInfo {
  key: BookingStep;
  label: string;
}

const MEMBER_STEPS: StepInfo[] = [
  { key: 'date', label: '날짜' },
  { key: 'time', label: '시간' },
  { key: 'discount', label: '할인' },
  { key: 'confirm', label: '확인' },
];

const GUEST_STEPS: StepInfo[] = [
  { key: 'date', label: '날짜' },
  { key: 'time', label: '시간' },
  { key: 'confirm', label: '확인' },
];

interface StepIndicatorProps {
  steps: StepInfo[];
  currentStep: BookingStep;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <nav
      aria-label="예약 진행 단계"
      className="w-full px-2 py-3"
    >
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <li
              key={step.key}
              className="flex flex-1 items-center"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Step circle and label */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors
                    ${isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary bg-background text-primary'
                        : 'border-muted-foreground/30 bg-background text-muted-foreground/50'
                    }
                  `}
                  aria-label={
                    isCompleted
                      ? `${step.label} 완료`
                      : isCurrent
                        ? `${step.label} 진행 중`
                        : `${step.label} 대기`
                  }
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    text-xs font-medium transition-colors
                    ${isCompleted || isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground/50'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (except for last item) */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-0.5 flex-1 mx-2 transition-colors
                    ${index < currentIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                    }
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function BookingDrawer({
  open,
  onOpenChange,
  shop,
  course,
}: BookingDrawerProps) {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Point and Coupon states
  const [usedPoints, setUsedPoints] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);

  // Check user authentication status
  useEffect(() => {
    const checkUser = async () => {
      setUserLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setUserLoading(false);
    };
    if (open) {
      checkUser();
    }
  }, [open]);

  const isGuest = !currentUser;
  const basePrice = isGuest
    ? course.price_original
    : (course.price_discount || course.price_original);
  const hasDiscount = !!course.price_discount;

  // Calculate coupon discount
  const couponDiscount = selectedCoupon?.coupon
    ? calculateDiscount(selectedCoupon.coupon, basePrice)
    : 0;

  // Final payment calculation: basePrice - points - couponDiscount
  const paymentAmount = Math.max(0, basePrice - usedPoints - couponDiscount);

  // Callback for point changes
  const handlePointsChange = useCallback((points: number) => {
    setUsedPoints(points);
  }, []);

  // Callback for coupon selection
  const handleCouponSelect = useCallback((coupon: UserCoupon | null) => {
    setSelectedCoupon(coupon);
  }, []);

  // Get available time slots for selected date
  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['available-slots', shop.id, selectedDate?.toISOString()],
    queryFn: () =>
      getAvailableTimeSlots(
        shop.id,
        format(selectedDate!, 'yyyy-MM-dd')
      ),
    enabled: !!selectedDate && step === 'time',
  });

  // Create reservation mutation
  const reservationMutation = useMutation({
    mutationFn: createReservation,
    onError: (error) => {
      console.error('Reservation error:', error);
      toast.error('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep('time');
      setSelectedTime(undefined);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    // 로그인 유저만 할인 단계로, 비회원은 바로 확인 단계로
    setStep(currentUser ? 'discount' : 'confirm');
  };

  const handleDiscountConfirm = () => {
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;

    const userId = currentUser?.id || null;
    const paymentId = `payment-${Date.now()}-${crypto.randomUUID()}`;

    setIsProcessingPayment(true);

    // Declare reservation outside try so catch can access it
    let reservationId: string | null = null;

    try {
      // 0원 결제 처리 (포인트/쿠폰으로 전액 결제)
      if (paymentAmount === 0 && userId) {
        // Create reservation (status: pending)
        const reservation = await reservationMutation.mutateAsync({
          user_id: userId,
          shop_id: shop.id,
          course_id: course.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          status: 'pending',
        });
        reservationId = reservation.id;

        // Process points deduction
        if (usedPoints > 0) {
          await consumePoints(userId, usedPoints, reservation.id);
        }

        // Process coupon usage
        if (selectedCoupon) {
          await applyCoupon(selectedCoupon.id, reservation.id);
        }

        // Update reservation to confirmed
        await supabase
          .from('reservations')
          .update({ status: 'confirmed' })
          .eq('id', reservation.id);

        toast.success('예약이 완료되었습니다!');
        onOpenChange(false);
        router.push(`/booking/complete?id=${reservation.id}`);
        return;
      }

      // 1. Check PortOne SDK availability BEFORE creating reservation
      if (!window.PortOne) {
        toast.error('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 2. Create reservation (status: pending)
      const reservation = await reservationMutation.mutateAsync({
        user_id: userId,
        shop_id: shop.id,
        course_id: course.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'pending',
      });
      reservationId = reservation.id;

      // 3. Request payment via PortOne
      const paymentResponse = await window.PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName: `${shop.name} - ${course.name}`,
        totalAmount: paymentAmount,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        customer: {
          fullName: currentUser?.user_metadata?.nickname || '비회원',
          email: currentUser?.email || undefined,
        },
        redirectUrl: `${window.location.origin}/booking/complete?id=${reservation.id}`,
      });

      // 4. Check payment result
      if (paymentResponse?.code != null) {
        // Payment failed or cancelled by user
        toast.error(paymentResponse.message || '결제가 취소되었습니다.');
        // Cancel the pending reservation
        await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', reservation.id);
        return;
      }

      // 5. Verify payment on server
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          reservationId: reservation.id,
          expectedAmount: paymentAmount,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        toast.error(errorData.error || '결제 검증에 실패했습니다.');
        return;
      }

      // 6. Process points deduction (after payment verified)
      if (userId && usedPoints > 0) {
        try {
          await consumePoints(userId, usedPoints, reservation.id);
        } catch (pointError) {
          console.error('Failed to deduct points:', pointError);
          // Continue anyway - payment was successful
        }
      }

      // 7. Process coupon usage (after payment verified)
      if (selectedCoupon) {
        try {
          await applyCoupon(selectedCoupon.id, reservation.id);
        } catch (couponError) {
          console.error('Failed to use coupon:', couponError);
          // Continue anyway - payment was successful
        }
      }

      // 8. Success
      toast.success('결제 및 예약이 완료되었습니다!');
      onOpenChange(false);
      router.push(`/booking/complete?id=${reservation.id}`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('결제 처리 중 오류가 발생했습니다.');

      // Cancel the pending reservation if it was created
      if (reservationId) {
        try {
          await supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('id', reservationId);
        } catch (cancelError) {
          console.error('Failed to cancel reservation:', cancelError);
        }
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBack = () => {
    if (step === 'time') {
      setStep('date');
      setSelectedTime(undefined);
    } else if (step === 'discount') {
      setStep('time');
    } else if (step === 'confirm') {
      // 로그인 유저는 할인 단계로, 비회원은 시간 단계로
      setStep(currentUser ? 'discount' : 'time');
    }
  };

  const resetAndClose = () => {
    if (isProcessingPayment) return; // Prevent closing during payment
    setStep('date');
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setUsedPoints(0);
    setSelectedCoupon(null);
    onOpenChange(false);
  };

  const isPending = reservationMutation.isPending || isProcessingPayment;

  return (
    <Drawer open={open} onOpenChange={resetAndClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>
            {step === 'date' && '날짜 선택'}
            {step === 'time' && '시간 선택'}
            {step === 'discount' && '할인 적용'}
            {step === 'confirm' && '예약 확인'}
          </DrawerTitle>
          <DrawerDescription>
            {course.name} - {course.duration}분
          </DrawerDescription>
        </DrawerHeader>

        {/* Step Indicator */}
        {!userLoading && (
          <StepIndicator
            steps={currentUser ? MEMBER_STEPS : GUEST_STEPS}
            currentStep={step}
          />
        )}

        <div className="overflow-y-auto px-4 pb-4">
          {/* Date Selection Step */}
          {step === 'date' && (
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                locale={ko}
                className="rounded-md border"
              />
            </div>
          )}

          {/* Time Selection Step */}
          {step === 'time' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {selectedDate && format(selectedDate, 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                </span>
              </div>

              <Separator />

              {slotsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  시간대를 불러오는 중...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  선택 가능한 시간이 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? 'default' : 'outline'}
                      onClick={() => handleTimeSelect(time)}
                      className="w-full"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discount Selection Step (Members Only) */}
          {step === 'discount' && currentUser && (
            <div className="space-y-6">
              {/* Selected Date/Time Summary */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {selectedDate && format(selectedDate, 'MM월 dd일 (EEE)', { locale: ko })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedTime}</span>
                </div>
              </div>

              <Separator />

              {/* Point Selector */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold">포인트 사용</h3>
                </div>
                <PointUseSelector
                  totalPrice={basePrice - couponDiscount}
                  onPointsChange={handlePointsChange}
                />
              </div>

              <Separator />

              {/* Coupon Selector */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Ticket className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">쿠폰 사용</h3>
                </div>
                <CouponSelector
                  userId={currentUser.id}
                  shopId={shop.id}
                  originalPrice={basePrice}
                  selectedCoupon={selectedCoupon}
                  onSelectCoupon={handleCouponSelect}
                />
              </div>

              <Separator />

              {/* Payment Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">코스 가격</span>
                  <span>{basePrice.toLocaleString()}원</span>
                </div>
                {usedPoints > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>포인트 사용</span>
                    <span>-{usedPoints.toLocaleString()}원</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>쿠폰 할인</span>
                    <span>-{couponDiscount.toLocaleString()}원</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>최종 결제 금액</span>
                  <span className="text-xl text-primary">
                    {paymentAmount.toLocaleString()}원
                  </span>
                </div>
                {paymentAmount === 0 && (
                  <p className="text-xs text-green-600 text-center mt-2">
                    포인트/쿠폰으로 전액 결제됩니다
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Guest discount promotion */}
              {isGuest && hasDiscount && (
                <Alert className="border-primary/50 bg-primary/5">
                  <LogIn className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <span className="font-medium">
                      로그인하면 할인가 {course.price_discount!.toLocaleString()}원에 이용 가능합니다.
                    </span>
                    <br />
                    <span className="text-muted-foreground">
                      비회원은 정가({course.price_original.toLocaleString()}원)로 결제됩니다.
                    </span>
                    <Button
                      variant="link"
                      className="h-auto p-0 mt-1 text-primary"
                      onClick={() => router.push('/login')}
                    >
                      로그인하러 가기
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Shop & Course Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">샵 이름</p>
                  <p className="font-medium">{shop.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">코스</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{course.name}</p>
                    <Badge variant="outline">{course.duration}분</Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">예약 날짜</p>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <p className="font-medium">
                      {selectedDate && format(selectedDate, 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">예약 시간</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">결제 금액</p>
                  <div className="space-y-1">
                    {/* Original price with member discount */}
                    <div className="flex items-baseline gap-2">
                      {!isGuest && course.price_discount ? (
                        <>
                          <p className="text-sm line-through text-muted-foreground">
                            {course.price_original.toLocaleString()}원
                          </p>
                          <p className="font-medium">
                            {basePrice.toLocaleString()}원
                          </p>
                        </>
                      ) : (
                        <p className="font-medium">
                          {basePrice.toLocaleString()}원
                        </p>
                      )}
                    </div>

                    {/* Point discount */}
                    {usedPoints > 0 && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>포인트 사용</span>
                        <span>-{usedPoints.toLocaleString()}원</span>
                      </div>
                    )}

                    {/* Coupon discount */}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>쿠폰 할인 ({selectedCoupon?.coupon?.name})</span>
                        <span>-{couponDiscount.toLocaleString()}원</span>
                      </div>
                    )}

                    {/* Final amount */}
                    {(usedPoints > 0 || couponDiscount > 0) && (
                      <Separator className="my-2" />
                    )}
                    <p className="text-2xl font-bold text-primary">
                      {paymentAmount.toLocaleString()}원
                    </p>
                    {paymentAmount === 0 && (
                      <Badge variant="secondary" className="mt-1">
                        전액 할인 적용
                      </Badge>
                    )}
                  </div>
                  {isGuest && hasDiscount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      회원 할인가: {course.price_discount!.toLocaleString()}원
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  결제 완료 후 예약이 확정됩니다.
                  <br />
                  예약 취소는 예약 시간 3시간 전까지 가능합니다.
                </p>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <div className="flex gap-2 w-full">
            {step !== 'date' && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={isPending}
              >
                이전
              </Button>
            )}

            {step === 'discount' ? (
              <Button
                onClick={handleDiscountConfirm}
                className="flex-1"
              >
                다음
              </Button>
            ) : step === 'confirm' ? (
              <Button
                onClick={handleConfirm}
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? (
                  '결제 처리 중...'
                ) : paymentAmount === 0 ? (
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    예약 완료하기
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {paymentAmount.toLocaleString()}원 결제하기
                  </span>
                )}
              </Button>
            ) : (
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  닫기
                </Button>
              </DrawerClose>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
