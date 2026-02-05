'use client';

import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ReviewManagement from '@/components/partner/ReviewManagement';
import { getPartnerShop } from '@/lib/api/partner';

export default function PartnerReviewsPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [noShop, setNoShop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function resolveShop() {
      try {
        const shop = await getPartnerShop();
        if (shop) {
          setShopId(shop.id);
        } else {
          setNoShop(true);
        }
      } catch {
        setNoShop(true);
      } finally {
        setIsLoading(false);
      }
    }
    resolveShop();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (noShop) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                <Store className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                등록된 가게가 없습니다
              </h2>
              <p className="text-sm text-gray-500">
                리뷰를 관리하려면 먼저 가게를 등록해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // shopId가 없으면 빈 화면 (noShop이 true가 되어 위에서 처리됨)
  if (!shopId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">리뷰 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          고객 리뷰를 확인하고 답변을 관리합니다
        </p>
      </div>

      <ReviewManagement shopId={shopId} />
    </div>
  );
}
