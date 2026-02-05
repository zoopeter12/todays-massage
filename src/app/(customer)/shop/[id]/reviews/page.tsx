'use client';

/**
 * Shop Reviews Page (Example Integration)
 * Shows how to integrate ShopReviews and ReviewForm components
 */

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import ShopReviews from '@/components/customer/ShopReviews';
import ReviewForm from '@/components/customer/ReviewForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { canUserReview } from '@/lib/api/reviews';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ShopReviewsPage({ params }: PageProps) {
  const { id: shopId } = use(params);
  const router = useRouter();

  // Get current user
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Check if user can review
  const { data: canReview } = useQuery({
    queryKey: ['can-review', session?.user?.id, shopId],
    queryFn: () => {
      if (!session?.user?.id) return false;
      return canUserReview(session.user.id, shopId);
    },
    enabled: !!session?.user?.id,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">매장 리뷰</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Write Review Button */}
        {session?.user && canReview && (
          <div className="mb-6">
            <ReviewForm
              shopId={shopId}
              userId={session.user.id}
            />
          </div>
        )}

        {/* Reviews List */}
        <ShopReviews shopId={shopId} />
      </div>
    </div>
  );
}
