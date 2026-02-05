'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, Calendar, Store } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  shop: {
    id: string;
    name: string;
  } | null;
}

export default function MyReviewsPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['my-reviews', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          content,
          created_at,
          shop:shops(id, name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!userId,
  });

  if (!userId && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg text-muted-foreground mb-4">
          로그인이 필요합니다
        </p>
        <div className="flex gap-3">
          <Link href="/login">
            <Button>로그인하기</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/mypage">
            <Button variant="ghost" size="icon" aria-label="마이페이지로 돌아가기">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">내 리뷰</h1>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <ReviewListSkeleton />
        ) : reviews.length === 0 ? (
          <EmptyState />
        ) : (
          <ReviewList reviews={reviews} />
        )}
      </div>
    </div>
  );
}

function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <div className="space-y-3">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {review.shop && (
                <Link href={`/shop/${review.shop.id}`} className="block">
                  <div className="flex items-center gap-2 mb-3">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold hover:text-primary transition-colors">
                      {review.shop.name}
                    </span>
                  </div>
                </Link>
              )}

              <div className="flex items-center gap-1 mb-2" role="img" aria-label={`별점 ${review.rating}점`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-medium">{review.rating}</span>
              </div>

              <p className="text-sm text-foreground whitespace-pre-wrap mb-3">
                {review.content}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <time dateTime={review.created_at}>
                  {format(new Date(review.created_at), 'yyyy년 MM월 dd일', { locale: ko })}
                </time>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
      <p className="text-muted-foreground mb-2">작성한 리뷰가 없습니다</p>
      <p className="text-sm text-muted-foreground mb-4">
        이용한 매장에 리뷰를 남겨보세요
      </p>
      <Link href="/reservations">
        <Button variant="outline" size="sm">내 예약 보기</Button>
      </Link>
    </div>
  );
}

function ReviewListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
