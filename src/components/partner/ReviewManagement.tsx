'use client';

/**
 * ReviewManagement Component
 * Partner interface for managing reviews and replies
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Send, Filter, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchShopReviews, replyToReview } from '@/lib/api/reviews';
import type { Review } from '@/types/reviews';

interface ReviewManagementProps {
  shopId: string;
}

export default function ReviewManagement({ shopId }: ReviewManagementProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['shop-reviews', shopId, 'latest'],
    queryFn: () => fetchShopReviews(shopId, 'latest'),
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      replyToReview(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-reviews', shopId] });
      toast.success('답변이 등록되었습니다');
      setReplyText({});
      setExpandedReview(null);
    },
    onError: (error: Error) => {
      toast.error(`답변 등록 실패: ${error.message}`);
    },
  });

  // Filter reviews
  const filteredReviews = reviews?.filter((review) => {
    if (activeTab === 'pending') {
      return !review.owner_reply;
    }
    return true;
  });

  const pendingCount = reviews?.filter((r) => !r.owner_reply).length || 0;

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle reply submit
  const handleReplySubmit = (reviewId: string) => {
    const reply = replyText[reviewId]?.trim();

    if (!reply) {
      toast.error('답변 내용을 입력해주세요');
      return;
    }

    if (reply.length < 5) {
      toast.error('답변은 최소 5자 이상 작성해주세요');
      return;
    }

    replyMutation.mutate({ reviewId, reply });
  };

  if (isLoading) {
    return <ReviewManagementSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>리뷰 관리</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                미답변 {pendingCount}개
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'pending')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            전체 리뷰 ({reviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            미답변 ({pendingCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredReviews && filteredReviews.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={!review.owner_reply ? 'border-orange-200 bg-orange-50/30' : ''}>
                    <CardContent className="pt-6">
                      {/* Review Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {review.user?.nickname || '익명'}
                            </span>
                            {!review.owner_reply && (
                              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                                <Clock className="w-3 h-3 mr-1" />
                                답변 대기
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Review Comment */}
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {review.comment}
                      </p>

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {review.images.map((image, idx) => (
                            <Image
                              key={idx}
                              src={image}
                              alt={`리뷰 이미지 ${idx + 1}`}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover rounded-lg"
                              unoptimized
                            />
                          ))}
                        </div>
                      )}

                      {/* Existing Reply */}
                      {review.owner_reply ? (
                        <>
                          <Separator className="my-4" />
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">
                                내 답변
                              </span>
                              {review.owner_replied_at && (
                                <span className="text-xs text-gray-500">
                                  {formatDate(review.owner_replied_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {review.owner_reply}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Separator className="my-4" />

                          {/* Reply Form */}
                          {expandedReview === review.id ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3"
                            >
                              <Textarea
                                value={replyText[review.id] || ''}
                                onChange={(e) =>
                                  setReplyText({ ...replyText, [review.id]: e.target.value })
                                }
                                placeholder="고객님께 정중하고 친절한 답변을 남겨주세요."
                                rows={4}
                                maxLength={300}
                                className="resize-none"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {(replyText[review.id] || '').length}/300
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setExpandedReview(null);
                                      setReplyText({ ...replyText, [review.id]: '' });
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReplySubmit(review.id)}
                                    disabled={
                                      replyMutation.isPending ||
                                      !replyText[review.id]?.trim()
                                    }
                                  >
                                    {replyMutation.isPending ? (
                                      <>등록 중...</>
                                    ) : (
                                      <>
                                        <Send className="w-3 h-3 mr-1" />
                                        답변 등록
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedReview(review.id)}
                              className="w-full"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              답변 작성하기
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {activeTab === 'pending'
                    ? '미답변 리뷰가 없습니다.'
                    : '아직 작성된 리뷰가 없습니다.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewManagementSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
