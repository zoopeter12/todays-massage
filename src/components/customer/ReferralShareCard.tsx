'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Copy, Share2, Check, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  getReferralCodeInfo,
  getReferralStats,
  generateShareUrl,
  generateShareMessage,
} from '@/lib/api/referrals';
import Link from 'next/link';

interface ReferralShareCardProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function ReferralShareCard({ variant = 'compact', className }: ReferralShareCardProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: codeInfo, isLoading: codeLoading } = useQuery({
    queryKey: ['referralCode', user?.id],
    queryFn: () => getReferralCodeInfo(user!.id),
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['referralStats', user?.id],
    queryFn: () => getReferralStats(user!.id),
    enabled: !!user && variant === 'full',
  });

  const handleCopyCode = async () => {
    if (!codeInfo?.referral_code) return;

    try {
      await navigator.clipboard.writeText(codeInfo.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (codeLoading || !user) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href="/referral">
        <Card className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">친구 초대</div>
                <div className="text-sm text-gray-600">
                  친구와 함께 8,000P 받기
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className={`border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white ${className}`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
            <Gift className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">친구 초대하기</div>
            <div className="text-sm text-gray-600">
              내 코드: <span className="font-mono font-bold text-purple-700">{codeInfo?.referral_code}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                코드 복사
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-purple-500 hover:bg-purple-600"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-1" />
            공유하기
          </Button>
        </div>

        {stats && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              초대한 친구: {stats.completed_referrals}명
            </div>
            <Link href="/referral" className="text-sm text-purple-600 hover:underline">
              자세히 보기
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
