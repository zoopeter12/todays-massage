'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, User, Calendar, Settings, LogOut, Pencil, Phone, Heart, Coins, Ticket, Star, CalendarCheck, Gift, Users } from 'lucide-react';
import Link from 'next/link';

import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { PointBadge } from '@/components/customer/PointBadge';

export default function MyPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // 컴포넌트가 언마운트된 경우 상태 업데이트 방지
        if (!isMounted) return;

        if (user) {
          setUser({ id: user.id, email: user.email || undefined });
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!isMounted) return;
          if (data) setProfile(data as Profile);
        }
      } catch (err) {
        // AbortError는 정상적인 cleanup이므로 무시
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[MyPage] loadProfile error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleEditStart = () => {
    setEditNickname(profile?.nickname || '');
    setEditPhone(profile?.phone || '');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditNickname('');
    setEditPhone('');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: editNickname.trim() || null,
          phone: editPhone.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? { ...prev, nickname: editNickname.trim() || null, phone: editPhone.trim() || null }
          : prev
      );
      setIsEditing(false);
    } catch (err) {
      console.error('프로필 업데이트 실패:', err);
      alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
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
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">마이페이지</h1>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {profile?.nickname?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {profile?.nickname || '사용자'}
                </h2>
                {profile?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="h-3.5 w-3.5" />
                    {profile.phone}
                  </p>
                )}
                {user.email && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {user.email}
                  </p>
                )}
                <PointBadge />
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEditStart}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  프로필 수정
                </Button>
              )}
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="mt-5 pt-5 border-t space-y-4">
                <div className="space-y-2">
                  <label htmlFor="edit-nickname" className="text-sm font-medium">
                    닉네임
                  </label>
                  <Input
                    id="edit-nickname"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-phone" className="text-sm font-medium">
                    전화번호
                  </label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="전화번호를 입력하세요"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleEditCancel} disabled={saving}>
                    취소
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu Section */}
        <Card>
          <CardContent className="p-0">
            <Link href="/reservations" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">내 예약</span>
            </Link>
            <Separator />
            <Link href="/favorites" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <Heart className="h-5 w-5 text-pink-500" />
              <span className="font-medium">찜한 가게</span>
            </Link>
            <Separator />
            <Link href="/points" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <Coins className="h-5 w-5 text-amber-500" />
              <span className="font-medium">포인트</span>
            </Link>
            <Separator />
            <Link href="/coupons" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <Ticket className="h-5 w-5 text-blue-500" />
              <span className="font-medium">쿠폰</span>
            </Link>
            <Separator />
            <Link href="/mypage/reviews" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">내 리뷰</span>
            </Link>
          </CardContent>
        </Card>

        {/* Event Section */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <span className="text-sm font-semibold text-purple-600">이벤트</span>
            </div>
            <Link href="/attendance" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
              <span className="font-medium">출석체크</span>
              <span className="ml-auto text-xs text-muted-foreground">매일 포인트 적립</span>
            </Link>
            <Separator />
            <Link href="/roulette" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <Gift className="h-5 w-5 text-purple-500" />
              <span className="font-medium">럭키룰렛</span>
              <span className="ml-auto text-xs text-muted-foreground">행운의 룰렛</span>
            </Link>
            <Separator />
            <Link href="/referral" className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <Users className="h-5 w-5 text-green-500" />
              <span className="font-medium">친구초대</span>
              <span className="ml-auto text-xs text-muted-foreground">초대하고 보상받기</span>
            </Link>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardContent className="p-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left"
            >
              <LogOut className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-500">로그아웃</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
