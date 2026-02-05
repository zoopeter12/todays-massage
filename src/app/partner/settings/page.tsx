'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Lock,
  User,
  LogOut,
  HelpCircle,
  FileText,
  Shield,
  Loader2,
  Camera,
  Phone,
  Mail,
  MessageCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationSettings {
  newReservation: boolean;
  reservationChange: boolean;
  customerMessage: boolean;
  marketing: boolean;
}

interface UserProfile {
  nickname: string;
  email: string;
  avatar_url: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newReservation: true,
    reservationChange: true,
    customerMessage: false,
    marketing: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    nickname: '',
    email: '',
    avatar_url: null,
  });
  const [editingProfile, setEditingProfile] = useState<UserProfile>({
    nickname: '',
    email: '',
    avatar_url: null,
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Load notification settings and profile on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('notification_settings, nickname, email, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Failed to load settings:', error);
        } else {
          if (profileData?.notification_settings) {
            setNotifications(profileData.notification_settings as NotificationSettings);
          }
          setProfile({
            nickname: profileData?.nickname || '',
            email: profileData?.email || user.email || '',
            avatar_url: profileData?.avatar_url || null,
          });
          setEditingProfile({
            nickname: profileData?.nickname || '',
            email: profileData?.email || user.email || '',
            avatar_url: profileData?.avatar_url || null,
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Save notification settings to database
  const saveNotificationSettings = useCallback(async (newSettings: NotificationSettings) => {
    if (!userId) {
      toast.error('로그인이 필요합니다');
      return false;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_settings: newSettings })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  async function handleNotificationChange(key: keyof NotificationSettings) {
    const newSettings = {
      ...notifications,
      [key]: !notifications[key],
    };

    // Optimistic update
    setNotifications(newSettings);

    const success = await saveNotificationSettings(newSettings);
    if (success) {
      toast.success('알림 설정이 저장되었습니다');
    } else {
      // Revert on failure
      setNotifications(notifications);
      toast.error('알림 설정 저장에 실패했습니다');
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      // 1. Supabase signOut
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }

      // 2. Delete cookies by setting them to expire
      const cookiesToDelete = ['user_id', 'user_phone', 'logged_in'];
      cookiesToDelete.forEach(name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      // 3. Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase-auth');
      }

      toast.success('로그아웃되었습니다');

      // 4. Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('로그아웃 중 오류가 발생했습니다');
      setIsLoggingOut(false);
    }
  }

  // Profile management handlers
  function handleProfileDialogOpen() {
    setEditingProfile({ ...profile });
    setProfileDialogOpen(true);
  }

  async function handleProfileSave() {
    if (!userId) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if (!editingProfile.nickname.trim()) {
      toast.error('닉네임을 입력해주세요');
      return;
    }

    setIsProfileSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: editingProfile.nickname.trim(),
          email: editingProfile.email.trim(),
          avatar_url: editingProfile.avatar_url,
        })
        .eq('id', userId);

      if (error) throw error;

      setProfile({ ...editingProfile });
      toast.success('프로필이 저장되었습니다');
      setProfileDialogOpen(false);
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error('프로필 저장에 실패했습니다');
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('파일 크기는 2MB 이하여야 합니다');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setEditingProfile(prev => ({
        ...prev,
        avatar_url: urlData.publicUrl,
      }));

      toast.success('이미지가 업로드되었습니다');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('이미지 업로드에 실패했습니다');
    }
  }

  // Password change handler
  async function handlePasswordChange() {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('새 비밀번호는 8자 이상이어야 합니다');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다');
      return;
    }

    setIsPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('비밀번호가 변경되었습니다');
      setPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('비밀번호 변경에 실패했습니다');
    } finally {
      setIsPasswordSaving(false);
    }
  }

  const settingSections = [
    {
      title: '알림 설정',
      icon: Bell,
      description: '푸시 알림 및 이메일 알림 설정',
      items: [
        {
          key: 'newReservation' as const,
          label: '새 예약 알림',
          description: '새로운 예약이 들어올 때 알림을 받습니다',
          enabled: notifications.newReservation,
        },
        {
          key: 'reservationChange' as const,
          label: '예약 변경 알림',
          description: '예약이 취소되거나 변경될 때 알림을 받습니다',
          enabled: notifications.reservationChange,
        },
        {
          key: 'customerMessage' as const,
          label: '고객 메시지 알림',
          description: '고객으로부터 메시지가 올 때 알림을 받습니다',
          enabled: notifications.customerMessage,
        },
        {
          key: 'marketing' as const,
          label: '마케팅 알림',
          description: '프로모션 및 마케팅 정보를 받습니다',
          enabled: notifications.marketing,
        },
      ],
    },
  ];

  const actionItems = [
    {
      icon: User,
      label: '프로필 관리',
      description: '개인 정보 및 프로필 설정',
      onClick: handleProfileDialogOpen,
    },
    {
      icon: Lock,
      label: '비밀번호 변경',
      description: '계정 보안을 위해 비밀번호를 변경합니다',
      onClick: () => setPasswordDialogOpen(true),
    },
    {
      icon: Shield,
      label: '개인정보 처리방침',
      description: '개인정보 보호 정책을 확인합니다',
      onClick: () => setPrivacyDialogOpen(true),
    },
    {
      icon: FileText,
      label: '이용약관',
      description: '서비스 이용약관을 확인합니다',
      onClick: () => setTermsDialogOpen(true),
    },
    {
      icon: HelpCircle,
      label: '고객센터',
      description: '문의사항이 있으시면 연락주세요',
      onClick: () => setSupportDialogOpen(true),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="mt-1 text-sm text-gray-500">앱 설정 및 계정 관리</p>
      </div>

      {/* Notification Settings */}
      {settingSections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <section.icon className="mr-2 h-5 w-5 text-blue-600" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={item.key}>
                  {itemIndex > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={() => handleNotificationChange(item.key)}
                      disabled={isLoading || isSaving}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Account & Info */}
      <Card>
        <CardHeader>
          <CardTitle>계정 및 정보</CardTitle>
          <CardDescription>계정 관리 및 앱 정보</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {actionItems.map((item, index) => (
            <div key={item.label}>
              {index > 0 && <Separator className="my-2" />}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={item.onClick}
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-500" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-500">
            <p>오늘의마사지 파트너 v1.0.0</p>
            <p className="mt-1">© 2024 오늘의마사지. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Management Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>프로필 관리</DialogTitle>
            <DialogDescription>
              개인 정보를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={editingProfile.avatar_url || undefined} alt="프로필 이미지" />
                <AvatarFallback className="text-lg">
                  {editingProfile.nickname?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                  <Camera className="h-4 w-4" />
                  이미지 변경
                </div>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </Label>
            </div>
            {/* Nickname */}
            <div className="grid gap-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                value={editingProfile.nickname}
                onChange={(e) => setEditingProfile(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="닉네임을 입력하세요"
              />
            </div>
            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={editingProfile.email}
                onChange={(e) => setEditingProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="이메일을 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleProfileSave} disabled={isProfileSaving}>
              {isProfileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>
              계정 보안을 위해 정기적으로 비밀번호를 변경해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Current Password */}
            <div className="grid gap-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="현재 비밀번호를 입력하세요"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {/* New Password */}
            <div className="grid gap-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handlePasswordChange} disabled={isPasswordSaving}>
              {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>개인정보 처리방침</DialogTitle>
            <DialogDescription>
              최종 수정일: 2024년 1월 1일
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">1. 수집하는 개인정보 항목</h3>
                <p>오늘의마사지는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>필수항목: 이름, 연락처, 이메일 주소</li>
                  <li>선택항목: 프로필 이미지, 주소</li>
                  <li>자동 수집항목: 접속 IP, 쿠키, 방문 일시</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">2. 개인정보의 수집 및 이용목적</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>서비스 제공 및 계약의 이행</li>
                  <li>회원 관리 및 본인 확인</li>
                  <li>예약 서비스 제공</li>
                  <li>고객 문의 및 불만 처리</li>
                  <li>마케팅 및 광고 활용 (동의 시)</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">3. 개인정보의 보유 및 이용기간</h3>
                <p>회원 탈퇴 시 즉시 파기하며, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                  <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                  <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">4. 개인정보의 제3자 제공</h3>
                <p>오늘의마사지는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">5. 개인정보의 파기절차 및 방법</h3>
                <p>개인정보는 수집 및 이용목적이 달성된 후에는 지체 없이 파기합니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
                  <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">6. 이용자의 권리와 행사 방법</h3>
                <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>개인정보 열람 요구</li>
                  <li>오류 등이 있을 경우 정정 요구</li>
                  <li>삭제 요구</li>
                  <li>처리정지 요구</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">7. 개인정보 보호책임자</h3>
                <p>개인정보 보호와 관련한 문의는 아래 연락처로 문의해 주세요:</p>
                <ul className="list-none mt-2 space-y-1">
                  <li>담당자: 개인정보보호팀</li>
                  <li>이메일: privacy@todaymassage.com</li>
                  <li>전화: 1588-0000</li>
                </ul>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setPrivacyDialogOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>이용약관</DialogTitle>
            <DialogDescription>
              최종 수정일: 2024년 1월 1일
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">제1조 (목적)</h3>
                <p>이 약관은 오늘의마사지(이하 &quot;회사&quot;)가 제공하는 서비스의 이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">제2조 (정의)</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>&quot;서비스&quot;란 회사가 제공하는 마사지 예약 중개 플랫폼 서비스를 의미합니다.</li>
                  <li>&quot;이용자&quot;란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                  <li>&quot;파트너&quot;란 회사와 계약을 체결하고 서비스를 제공하는 업체를 말합니다.</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">제3조 (약관의 효력 및 변경)</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>이 약관은 서비스를 이용하고자 하는 모든 이용자에게 효력이 있습니다.</li>
                  <li>회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.</li>
                  <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">제4조 (서비스의 제공)</h3>
                <p>회사는 다음과 같은 서비스를 제공합니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>마사지 서비스 예약 중개</li>
                  <li>파트너 관리 서비스</li>
                  <li>고객 리뷰 및 평가 서비스</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">제5조 (이용자의 의무)</h3>
                <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>타인의 정보 도용</li>
                  <li>회사의 서비스 운영을 방해하는 행위</li>
                  <li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
                  <li>법령 또는 공서양속에 위반되는 행위</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">제6조 (예약 및 취소)</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>예약은 서비스 이용 시간 24시간 전까지 가능합니다.</li>
                  <li>예약 취소는 서비스 이용 시간 6시간 전까지 가능하며, 그 이후 취소 시 취소 수수료가 발생할 수 있습니다.</li>
                  <li>노쇼(No-Show) 시 향후 서비스 이용에 제한이 있을 수 있습니다.</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">제7조 (책임의 제한)</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.</li>
                  <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">제8조 (분쟁해결)</h3>
                <p>이 약관에 명시되지 않은 사항은 관계법령 및 상관례에 따르며, 분쟁이 발생한 경우 회사 소재지 관할 법원을 제1심 관할 법원으로 합니다.</p>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setTermsDialogOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Support Dialog */}
      <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>고객센터</DialogTitle>
            <DialogDescription>
              문의사항이 있으시면 아래 연락처로 연락해 주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">전화 문의</p>
                <p className="font-semibold text-gray-900">1588-0000</p>
                <p className="text-xs text-gray-500">평일 09:00 - 18:00</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">카카오톡 문의</p>
                <p className="font-semibold text-gray-900">@오늘의마사지</p>
                <p className="text-xs text-gray-500">24시간 접수 가능</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">이메일 문의</p>
                <p className="font-semibold text-gray-900">support@todaymassage.com</p>
                <p className="text-xs text-gray-500">답변까지 1-2 영업일 소요</p>
              </div>
            </div>
            <Separator />
            <div className="text-center text-sm text-gray-500">
              <p>운영시간: 평일 09:00 - 18:00</p>
              <p>(주말 및 공휴일 휴무)</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSupportDialogOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
