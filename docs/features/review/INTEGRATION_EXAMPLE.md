# Review System Integration Examples

Complete integration examples for the review system.

## Complete Shop Detail Page with Reviews

```tsx
'use client';

/**
 * Complete Shop Detail Page Example
 * Shows full integration of review system
 */

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarRating } from '@/components/ui/star-rating';
import ShopReviews from '@/components/customer/ShopReviews';
import ReviewForm from '@/components/customer/ReviewForm';
import { getShopRatingStats, canUserReview } from '@/lib/api/reviews';
import { MapPin, Phone, Clock, Star } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ShopDetailPage({ params }: PageProps) {
  const { id: shopId } = use(params);

  // Get current user session
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Fetch shop details
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*, courses(*)')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch rating statistics
  const { data: ratingStats } = useQuery({
    queryKey: ['shop-rating-stats', shopId],
    queryFn: () => getShopRatingStats(shopId),
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

  if (shopLoading) {
    return <div>Loading...</div>;
  }

  if (!shop) {
    return <div>Shop not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop Header */}
      <div className="bg-white">
        {/* Shop Images */}
        {shop.images && shop.images.length > 0 && (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={shop.images[0]}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Shop Info */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{shop.name}</h1>

              {/* Rating Badge */}
              {ratingStats && ratingStats.totalReviews > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <StarRating
                    rating={ratingStats.averageRating}
                    size="sm"
                    showValue
                  />
                  <span className="text-sm text-gray-500">
                    ({ratingStats.totalReviews}개 리뷰)
                  </span>
                </div>
              )}

              {/* Shop Details */}
              <div className="space-y-2 text-sm text-gray-600">
                {shop.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{shop.address}</span>
                  </div>
                )}
                {shop.tel && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${shop.tel}`} className="hover:underline">
                      {shop.tel}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{shop.is_open ? '영업중' : '영업종료'}</span>
                </div>
              </div>
            </div>

            {shop.category && (
              <Badge variant="secondary">{shop.category}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="courses">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses">
              코스 ({shop.courses?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              리뷰 ({ratingStats?.totalReviews || 0})
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-4">
            {shop.courses && shop.courses.length > 0 ? (
              shop.courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {course.price_discount
                            ? course.price_discount.toLocaleString()
                            : course.price_original.toLocaleString()}
                          원
                        </div>
                        {course.price_discount && (
                          <div className="text-sm text-gray-500 line-through">
                            {course.price_original.toLocaleString()}원
                          </div>
                        )}
                        <div className="text-sm text-gray-500 mt-1">
                          {course.duration}분
                        </div>
                      </div>
                      <Button>예약하기</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  등록된 코스가 없습니다.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Write Review Button (if eligible) */}
            {session?.user && canReview && (
              <Card>
                <CardContent className="pt-6">
                  <ReviewForm
                    shopId={shopId}
                    userId={session.user.id}
                    trigger={
                      <Button variant="default" className="w-full" size="lg">
                        <Star className="w-4 h-4 mr-2" />
                        리뷰 작성하기
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <ShopReviews shopId={shopId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

## Quick Integration (Add to Existing Shop Page)

If you already have a shop detail page, simply add the reviews section:

```tsx
// Add these imports
import ShopReviews from '@/components/customer/ShopReviews';
import ReviewForm from '@/components/customer/ReviewForm';
import { getShopRatingStats } from '@/lib/api/reviews';

// Add rating stats query
const { data: ratingStats } = useQuery({
  queryKey: ['shop-rating-stats', shopId],
  queryFn: () => getShopRatingStats(shopId),
});

// Add to your JSX (at the bottom of shop details)
return (
  <div>
    {/* ... existing shop details ... */}

    {/* Reviews Section */}
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-4">고객 리뷰</h2>

      {/* Write Review (if logged in) */}
      {session?.user && (
        <div className="mb-6">
          <ReviewForm shopId={shopId} userId={session.user.id} />
        </div>
      )}

      {/* Reviews List */}
      <ShopReviews shopId={shopId} />
    </section>
  </div>
);
```

## Shop Card with Rating Badge

Add rating to shop list/grid cards:

```tsx
import { StarRating } from '@/components/ui/star-rating';
import { getShopRatingStats } from '@/lib/api/reviews';

function ShopCard({ shop }) {
  const { data: ratingStats } = useQuery({
    queryKey: ['shop-rating-stats', shop.id],
    queryFn: () => getShopRatingStats(shop.id),
  });

  return (
    <Card>
      <CardContent>
        <h3>{shop.name}</h3>

        {/* Rating Display */}
        {ratingStats && ratingStats.totalReviews > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <StarRating
              rating={ratingStats.averageRating}
              size="xs"
            />
            <span className="text-xs text-gray-500">
              {ratingStats.averageRating.toFixed(1)} ({ratingStats.totalReviews})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## My Reviews Page

Create a page where users can see all their reviews:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { fetchMyReviews } from '@/lib/api/reviews';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';

export default function MyReviewsPage() {
  // Get current user
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Fetch user's reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['my-reviews', session?.user?.id],
    queryFn: () => fetchMyReviews(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">내 리뷰</h1>

      <div className="space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('ko-KR')}
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                <p className="text-gray-700 mb-4">{review.comment}</p>

                {review.owner_reply && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">사장님 답변</div>
                    <p className="text-sm text-gray-700">{review.owner_reply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              작성한 리뷰가 없습니다.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

## Partner Dashboard Widget

Add review stats to partner dashboard:

```tsx
import { useQuery } from '@tanstack/react-query';
import { getShopRatingStats, fetchShopReviews } from '@/lib/api/reviews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { MessageSquare, Star } from 'lucide-react';

function ReviewStatsWidget({ shopId }) {
  const { data: stats } = useQuery({
    queryKey: ['shop-rating-stats', shopId],
    queryFn: () => getShopRatingStats(shopId),
  });

  const { data: reviews } = useQuery({
    queryKey: ['shop-reviews', shopId, 'latest'],
    queryFn: () => fetchShopReviews(shopId, 'latest'),
  });

  const pendingCount = reviews?.filter(r => !r.owner_reply).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Average Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">평균 평점</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">
              {stats?.averageRating.toFixed(1) || '0.0'}
            </div>
            <div>
              <StarRating
                rating={stats?.averageRating || 0}
                size="sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                {stats?.totalReviews || 0}개 리뷰
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Replies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">미답변 리뷰</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-orange-600">
              {pendingCount}
            </div>
            <MessageSquare className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Notification for New Reviews

Check for new reviews in partner dashboard:

```tsx
import { useQuery } from '@tanstack/react-query';
import { fetchShopReviews } from '@/lib/api/reviews';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function ReviewNotification({ shopId, lastChecked }) {
  const { data: reviews } = useQuery({
    queryKey: ['shop-reviews', shopId, 'latest'],
    queryFn: () => fetchShopReviews(shopId, 'latest'),
    refetchInterval: 60000, // Check every minute
  });

  const newReviews = reviews?.filter(r =>
    !r.owner_reply &&
    new Date(r.created_at) > new Date(lastChecked)
  ).length || 0;

  if (newReviews === 0) return null;

  return (
    <div className="relative">
      <Bell className="w-5 h-5" />
      <Badge
        variant="destructive"
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
      >
        {newReviews}
      </Badge>
    </div>
  );
}
```

## Custom Star Rating Component Usage

The reusable `StarRating` component can be used anywhere:

```tsx
import { StarRating, StarRatingInput } from '@/components/ui/star-rating';

// Display only (various sizes)
<StarRating rating={4.5} size="xs" />
<StarRating rating={4.5} size="sm" />
<StarRating rating={4.5} size="md" showValue />
<StarRating rating={4.5} size="lg" showValue />
<StarRating rating={4.5} size="xl" showValue />

// Interactive input
const [rating, setRating] = useState(0);

<StarRatingInput
  value={rating}
  onChange={setRating}
  size="lg"
  showLabel
/>

// Custom colors
<StarRating
  rating={4.5}
  color="text-red-500"
  emptyColor="text-gray-300"
/>
```

## API Usage Examples

```tsx
import {
  fetchShopReviews,
  createReview,
  deleteReview,
  replyToReview,
  getShopRatingStats,
  canUserReview,
} from '@/lib/api/reviews';

// Fetch reviews with sorting
const reviews = await fetchShopReviews('shop-id', 'latest');
const topRated = await fetchShopReviews('shop-id', 'highest');

// Create a review
const newReview = await createReview({
  shop_id: 'shop-id',
  user_id: 'user-id',
  rating: 5,
  comment: '정말 좋았어요!',
  images: [],
});

// Delete review
await deleteReview('review-id', 'user-id');

// Add owner reply
const updated = await replyToReview('review-id', '감사합니다!');

// Get statistics
const stats = await getShopRatingStats('shop-id');
console.log(stats.averageRating); // 4.5
console.log(stats.totalReviews); // 42
console.log(stats.ratingDistribution); // { 5: 20, 4: 15, 3: 5, 2: 1, 1: 1 }

// Check if user can review
const eligible = await canUserReview('user-id', 'shop-id');
```

---

These examples show various integration patterns for the review system. Mix and match based on your needs!
