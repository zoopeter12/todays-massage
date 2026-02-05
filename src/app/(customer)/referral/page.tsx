'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Gift,
  Copy,
  Share2,
  Check,
  Clock,
  CheckCircle2,
  UserPlus,
  Coins,
  ChevronRight,
  MessageCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  getReferralCodeInfo,
  getReferralStats,
  getReferralHistory,
  generateShareUrl,
  generateShareMessage,
} from '@/lib/api/referrals';
import { REFERRAL_REWARDS } from '@/types/referrals';
import type { ReferralWithUser, ReferralStatus } from '@/types/referrals';

export default function ReferralPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);

  // All hooks must be called before any conditional returns
  const { data: codeInfo, isLoading: codeLoading } = useQuery({
    queryKey: ['referralCode', user?.id],
    queryFn: () => getReferralCodeInfo(user!.id),
    enabled: !!user && isAuthenticated,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referralStats', user?.id],
    queryFn: () => getReferralStats(user!.id),
    enabled: !!user && isAuthenticated,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['referralHistory', user?.id, page],
    queryFn: () => getReferralHistory(user!.id, page),
    enabled: !!user && isAuthenticated,
  });

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/referral');
    }
  }, [isAuthenticated, authLoading, router]);

  // 인증 로딩 중이거나 비로그인 상태일 때 로딩 스피너 표시
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  const handleCopyCode = async () => {
    if (!codeInfo?.referral_code) return;

    try {
      await navigator.clipboard.writeText(codeInfo.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = codeInfo.referral_code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!codeInfo?.referral_code) return;

    const shareUrl = generateShareUrl(codeInfo.referral_code);
    const shareMessage = generateShareMessage(codeInfo.referral_code);

    if (navigator.share) {
      try {
        await navigator.share({
          title: '친구 초대',
          text: shareMessage,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy share message
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusConfig = (status: ReferralStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          label: '대기중',
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: '완료',
        };
      case 'expired':
        return {
          icon: Clock,
          color: 'text-gray-500',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: '만료',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const maskPhone = (phone: string | null) => {
    if (!phone) return '***-****-****';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 11) {
      return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
    }
    return '***-****-****';
  };

  if (codeLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 to-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">친구 초대</h1>
          <p className="text-gray-600">친구를 초대하고 함께 혜택을 받으세요</p>
        </div>

        {/* Referral Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="text-white/80 text-sm font-medium">내 추천 코드</div>
                <div className="text-3xl font-bold tracking-widest">
                  {codeInfo?.referral_code || '--------'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    코드 복사
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                공유하기
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs text-white/80">초대한 친구</span>
                </div>
                <div className="text-2xl font-bold">
                  {stats?.total_referrals || 0}
                  <span className="text-sm font-normal text-white/70">/50</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Coins className="w-4 h-4" />
                  <span className="text-xs text-white/80">받은 보상</span>
                </div>
                <div className="text-2xl font-bold">
                  {(stats?.total_rewards_earned || 0).toLocaleString()}
                  <span className="text-sm font-normal">P</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reward Info */}
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-purple-900 font-semibold">
              <Info className="w-5 h-5" />
              초대 보상 안내
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">추천인 (나)</div>
                  <div className="font-bold text-purple-700">
                    {REFERRAL_REWARDS.REFERRER_POINTS.toLocaleString()}P
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                  <Gift className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">피추천인 (친구)</div>
                  <div className="font-bold text-indigo-700">
                    {REFERRAL_REWARDS.REFERRED_POINTS.toLocaleString()}P
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-purple-700">
              * 보상은 초대받은 친구의 첫 예약 완료 시 자동 지급됩니다
            </p>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-gray-900">이용 방법</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-medium text-gray-900">추천 코드 공유</div>
                  <div className="text-sm text-gray-600">
                    위의 추천 코드를 친구에게 공유하세요
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-medium text-gray-900">친구 가입</div>
                  <div className="text-sm text-gray-600">
                    친구가 회원가입 시 추천 코드를 입력하면 초대 등록 완료
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-medium text-gray-900">첫 예약 완료</div>
                  <div className="text-sm text-gray-600">
                    친구가 첫 예약을 완료하면 양쪽 모두 보상 포인트 지급!
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">초대 현황</h2>
            {stats?.total_referrals && stats.total_referrals > 0 && (
              <span className="text-sm text-gray-500">
                총 {stats.total_referrals}명
              </span>
            )}
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : historyData && historyData.data.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {historyData.data.map((item, index) => {
                  const config = getStatusConfig(item.status);
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-2xl border ${config.border} ${config.bg}
                        hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-11 h-11 rounded-xl
                          ${config.bg} border ${config.border}`}
                        >
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                              ${config.bg} ${config.color} border ${config.border}`}
                            >
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {item.referred_user?.nickname || maskPhone(item.referred_user?.phone)}
                          </div>
                          {item.status === 'completed' && item.referrer_reward_points && (
                            <div className="mt-1 text-xs text-green-600">
                              +{item.referrer_reward_points.toLocaleString()}P 적립
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {historyData.hasMore && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="w-full py-3 rounded-xl bg-white border-2 border-gray-200
                    hover:border-purple-300 hover:bg-purple-50 text-gray-700 hover:text-purple-700
                    font-medium transition-all duration-200 active:scale-95"
                >
                  더 보기
                </button>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center space-y-4"
            >
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-gray-100">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="text-lg font-semibold text-gray-900">
                  아직 초대한 친구가 없어요
                </div>
                <div className="text-sm text-gray-600">
                  추천 코드를 공유하고 친구와 함께 혜택을 받아보세요!
                </div>
              </div>
              <Button
                onClick={handleShare}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Share2 className="w-4 h-4 mr-2" />
                친구 초대하기
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
