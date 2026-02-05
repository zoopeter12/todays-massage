'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getApplicableCoupons, calculateDiscount } from '@/lib/api/coupons';
import { UserCoupon, Coupon } from '@/types/coupons';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface CouponSelectorProps {
  userId: string | null;
  shopId: string;
  originalPrice: number;
  selectedCoupon: UserCoupon | null;
  onSelectCoupon: (coupon: UserCoupon | null) => void;
  trigger?: React.ReactNode;
}

export function CouponSelector({
  userId,
  shopId,
  originalPrice,
  selectedCoupon,
  onSelectCoupon,
  trigger,
}: CouponSelectorProps) {
  const [open, setOpen] = useState(false);

  // Fetch applicable coupons
  const { data: applicableCoupons = [], isLoading } = useQuery({
    queryKey: ['applicable-coupons', userId, shopId, originalPrice],
    queryFn: () =>
      userId
        ? getApplicableCoupons(userId, shopId, originalPrice)
        : Promise.resolve([]),
    enabled: !!userId && open,
  });

  const handleSelect = (userCoupon: UserCoupon | null) => {
    onSelectCoupon(userCoupon);
    setOpen(false);

    if (userCoupon?.coupon) {
      const discount = calculateDiscount(userCoupon.coupon, originalPrice);
      toast.success(`쿠폰이 적용되었습니다`, {
        description: `${userCoupon.coupon.name} (-${discount.toLocaleString()}원)`,
      });
    } else if (selectedCoupon !== null) {
      toast.info('쿠폰 사용이 취소되었습니다');
    }
  };

  const discountAmount = selectedCoupon?.coupon
    ? calculateDiscount(selectedCoupon.coupon, originalPrice)
    : 0;

  const defaultTrigger = (
    <Button
      variant="outline"
      className="w-full justify-between"
      disabled={!userId}
    >
      <span className="flex items-center gap-2">
        <Ticket className="h-4 w-4" />
        {selectedCoupon
          ? `${selectedCoupon.coupon?.name} (-${discountAmount.toLocaleString()}원)`
          : '쿠폰 선택'}
      </span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>

      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>쿠폰 선택</SheetTitle>
          <SheetDescription>
            사용 가능한 쿠폰을 선택하세요
            {originalPrice > 0 && (
              <span className="block mt-1">
                현재 금액: {originalPrice.toLocaleString()}원
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(80vh-200px)]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              쿠폰 로딩 중...
            </div>
          ) : applicableCoupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>사용 가능한 쿠폰이 없습니다</p>
              <p className="text-sm mt-2">
                {originalPrice > 0
                  ? '이 금액에 사용 가능한 쿠폰이 없습니다'
                  : '쿠폰을 먼저 다운로드해주세요'}
              </p>
            </div>
          ) : (
            <RadioGroup
              value={selectedCoupon?.id || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  handleSelect(null);
                } else {
                  const coupon = applicableCoupons.find(
                    (c) => c.id === value
                  );
                  if (coupon) {
                    handleSelect(coupon);
                  }
                }
              }}
            >
              {/* No coupon option */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-accent">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="flex-1 cursor-pointer">
                  <p className="font-medium">쿠폰 사용 안 함</p>
                  <p className="text-sm text-muted-foreground">
                    원래 금액으로 결제
                  </p>
                </Label>
              </div>

              <Separator />

              {/* Available coupons */}
              {applicableCoupons.map((userCoupon) => (
                <CouponOption
                  key={userCoupon.id}
                  userCoupon={userCoupon}
                  originalPrice={originalPrice}
                />
              ))}
            </RadioGroup>
          )}
        </div>

        {selectedCoupon && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">할인 금액</span>
              <span className="text-lg font-bold text-primary">
                -{discountAmount.toLocaleString()}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">최종 결제 금액</span>
              <span className="text-xl font-bold">
                {(originalPrice - discountAmount).toLocaleString()}원
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CouponOptionProps {
  userCoupon: UserCoupon;
  originalPrice: number;
}

function CouponOption({ userCoupon, originalPrice }: CouponOptionProps) {
  const coupon = userCoupon.coupon;
  if (!coupon) return null;

  const discount = calculateDiscount(coupon, originalPrice);

  const discountDisplay =
    coupon.discount_type === 'percent'
      ? `${coupon.discount_value}%`
      : `${coupon.discount_value.toLocaleString()}원`;

  return (
    <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-dashed border-primary/30 cursor-pointer hover:bg-primary/5 bg-gradient-to-br from-primary/5 to-transparent relative">
      {/* Decorative circles */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background -ml-2" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background -mr-2" />

      <RadioGroupItem value={userCoupon.id} id={userCoupon.id} className="mt-1" />
      <Label htmlFor={userCoupon.id} className="flex-1 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="h-4 w-4 text-primary" />
              <p className="font-semibold">{coupon.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-lg font-bold text-primary">
                  {discountDisplay}
                </span>
                <span className="text-muted-foreground ml-1">할인</span>
              </p>

              {coupon.min_price > 0 && (
                <p className="text-xs text-muted-foreground">
                  {coupon.min_price.toLocaleString()}원 이상
                </p>
              )}

              {coupon.discount_type === 'percent' && coupon.max_discount && (
                <p className="text-xs text-muted-foreground">
                  최대 {coupon.max_discount.toLocaleString()}원
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                {format(new Date(coupon.valid_until), 'yyyy.MM.dd까지', {
                  locale: ko,
                })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <Badge variant="default" className="mb-1">
              -{discount.toLocaleString()}원
            </Badge>
            <p className="text-xs text-muted-foreground">
              할인 적용
            </p>
          </div>
        </div>
      </Label>
    </div>
  );
}
