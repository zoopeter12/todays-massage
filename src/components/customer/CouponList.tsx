'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ticket, Download, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchShopCoupons, downloadCoupon } from '@/lib/api/coupons';
import { Coupon } from '@/types/coupons';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CouponListProps {
  shopId: string;
}

export function CouponList({ shopId }: CouponListProps) {
  const queryClient = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch shop coupons
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['shop-coupons', shopId],
    queryFn: () => fetchShopCoupons(shopId),
  });

  // Check current user
  const [userId, setUserId] = useState<string | null>(null);
  const [userCouponIds, setUserCouponIds] = useState<string[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Fetch user's downloaded coupons
        const { data } = await supabase
          .from('user_coupons')
          .select('coupon_id')
          .eq('user_id', user.id);
        if (data) {
          setUserCouponIds(data.map((uc) => uc.coupon_id));
        }
      }
    };
    checkUser();
  }, []);

  // Download coupon mutation
  const downloadMutation = useMutation({
    mutationFn: async (couponId: string) => {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }
      return downloadCoupon(userId, couponId);
    },
    onSuccess: (data) => {
      toast.success('쿠폰이 다운로드되었습니다!');
      setUserCouponIds((prev) => [...prev, data.coupon_id]);
      queryClient.invalidateQueries({ queryKey: ['shop-coupons', shopId] });
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '쿠폰 다운로드에 실패했습니다.');
    },
    onSettled: () => {
      setDownloadingId(null);
    },
  });

  const handleDownload = (couponId: string) => {
    setDownloadingId(couponId);
    downloadMutation.mutate(couponId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        쿠폰 로딩 중...
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>현재 진행 중인 쿠폰이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {coupons.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          isDownloaded={userCouponIds.includes(coupon.id)}
          isDownloading={downloadingId === coupon.id}
          onDownload={() => handleDownload(coupon.id)}
          isLoggedIn={!!userId}
        />
      ))}
    </div>
  );
}

interface CouponCardProps {
  coupon: Coupon;
  isDownloaded: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  isLoggedIn: boolean;
}

function CouponCard({
  coupon,
  isDownloaded,
  isDownloading,
  onDownload,
  isLoggedIn,
}: CouponCardProps) {
  const remaining =
    coupon.usage_limit !== null
      ? coupon.usage_limit - coupon.used_count
      : null;
  const isSoldOut = remaining !== null && remaining <= 0;

  const discountDisplay =
    coupon.discount_type === 'percent'
      ? `${coupon.discount_value}%`
      : `${coupon.discount_value.toLocaleString()}원`;

  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      {/* Decorative circles (coupon perforation effect) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background -ml-3" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background -mr-3" />

      <div className="p-4 flex items-start justify-between gap-4">
        {/* Left: Discount info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{coupon.name}</h3>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {discountDisplay}
              </span>
              <span className="text-muted-foreground">할인</span>
            </div>

            {coupon.min_price > 0 && (
              <p className="text-muted-foreground">
                {coupon.min_price.toLocaleString()}원 이상 구매시
              </p>
            )}

            {coupon.discount_type === 'percent' && coupon.max_discount && (
              <p className="text-xs text-muted-foreground">
                최대 {coupon.max_discount.toLocaleString()}원 할인
              </p>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(coupon.valid_until), 'yyyy.MM.dd까지', {
                  locale: ko,
                })}
              </span>
            </div>

            {remaining !== null && (
              <Badge
                variant={isSoldOut ? 'destructive' : 'secondary'}
                className="mt-2"
              >
                {isSoldOut ? '품절' : `${remaining}개 남음`}
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Download button */}
        <div className="flex flex-col items-end gap-2">
          {isDownloaded ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              사용 가능
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onDownload}
              disabled={isSoldOut || isDownloading || !isLoggedIn}
            >
              {isDownloading ? (
                '다운로드 중...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  다운받기
                </>
              )}
            </Button>
          )}

          {!isLoggedIn && !isDownloaded && (
            <p className="text-xs text-muted-foreground">로그인 필요</p>
          )}
        </div>
      </div>
    </Card>
  );
}
