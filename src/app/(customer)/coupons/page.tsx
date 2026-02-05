'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchMyCoupons, calculateDiscount } from '@/lib/api/coupons';
import { UserCoupon } from '@/types/coupons';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function CouponsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
    };
    checkUser();
  }, [router]);

  // Fetch user's coupons
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['my-coupons', userId],
    queryFn: () => (userId ? fetchMyCoupons(userId) : Promise.resolve([])),
    enabled: !!userId,
  });

  // Categorize coupons
  const categorizedCoupons = useMemo(() => {
    const available: UserCoupon[] = [];
    const used: UserCoupon[] = [];
    const expired: UserCoupon[] = [];

    coupons.forEach((uc) => {
      if (uc.used_at) {
        used.push(uc);
      } else if (
        uc.coupon &&
        isPast(new Date(uc.coupon.valid_until))
      ) {
        expired.push(uc);
      } else {
        available.push(uc);
      }
    });

    return { available, used, expired };
  }, [coupons]);

  if (isLoading || !userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-gray-500">쿠폰을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">내 쿠폰함</h1>
        <p className="text-muted-foreground">
          다운로드한 쿠폰을 확인하고 사용하세요
        </p>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available" className="gap-2">
            사용 가능
            {categorizedCoupons.available.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {categorizedCoupons.available.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="used">사용 완료</TabsTrigger>
          <TabsTrigger value="expired">만료</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          <CouponList
            coupons={categorizedCoupons.available}
            emptyMessage="사용 가능한 쿠폰이 없습니다"
            emptyDescription="샵에서 쿠폰을 다운로드해보세요"
          />
        </TabsContent>

        <TabsContent value="used" className="mt-6">
          <CouponList
            coupons={categorizedCoupons.used}
            emptyMessage="사용한 쿠폰이 없습니다"
            isUsed
          />
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          <CouponList
            coupons={categorizedCoupons.expired}
            emptyMessage="만료된 쿠폰이 없습니다"
            isExpired
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CouponListProps {
  coupons: UserCoupon[];
  emptyMessage: string;
  emptyDescription?: string;
  isUsed?: boolean;
  isExpired?: boolean;
}

function CouponList({
  coupons,
  emptyMessage,
  emptyDescription,
  isUsed,
  isExpired,
}: CouponListProps) {
  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ticket className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="font-medium">{emptyMessage}</p>
        {emptyDescription && (
          <p className="text-sm mt-1">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {coupons.map((userCoupon) => (
        <MyCouponCard
          key={userCoupon.id}
          userCoupon={userCoupon}
          isUsed={isUsed}
          isExpired={isExpired}
        />
      ))}
    </div>
  );
}

interface MyCouponCardProps {
  userCoupon: UserCoupon;
  isUsed?: boolean;
  isExpired?: boolean;
}

function MyCouponCard({ userCoupon, isUsed, isExpired }: MyCouponCardProps) {
  const coupon = userCoupon.coupon;
  if (!coupon) return null;

  const discountDisplay =
    coupon.discount_type === 'percent'
      ? `${coupon.discount_value}%`
      : `${coupon.discount_value.toLocaleString()}원`;

  const opacity = isUsed || isExpired ? 'opacity-60' : '';

  return (
    <Card
      className={`relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent ${opacity}`}
    >
      {/* Decorative circles */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background -ml-3" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background -mr-3" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            {/* Shop name */}
            <p className="text-sm text-muted-foreground mb-1">
              {coupon.shop?.name}
            </p>

            {/* Coupon name */}
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{coupon.name}</h3>
            </div>

            {/* Discount amount */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-primary">
                {discountDisplay}
              </span>
              <span className="text-muted-foreground text-sm">할인</span>
            </div>
          </div>

          {/* Status badge */}
          <div>
            {isUsed && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                사용 완료
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                만료
              </Badge>
            )}
            {!isUsed && !isExpired && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                사용 가능
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1 text-sm text-muted-foreground">
          {coupon.min_price > 0 && (
            <p>{coupon.min_price.toLocaleString()}원 이상 구매시</p>
          )}

          {coupon.discount_type === 'percent' && coupon.max_discount && (
            <p>최대 {coupon.max_discount.toLocaleString()}원 할인</p>
          )}

          <div className="flex items-center gap-1 pt-1">
            <Clock className="h-3 w-3" />
            <span>
              {format(new Date(coupon.valid_until), 'yyyy.MM.dd까지', {
                locale: ko,
              })}
            </span>
          </div>

          {isUsed && userCoupon.used_at && (
            <p className="text-xs">
              사용일:{' '}
              {format(new Date(userCoupon.used_at), 'yyyy.MM.dd', {
                locale: ko,
              })}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
