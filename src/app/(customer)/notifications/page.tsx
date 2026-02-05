'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Calendar,
  CreditCard,
  Gift,
  Megaphone,
  Star,
  Clock,
  Check,
  CheckCheck,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { NotificationType, NotificationHistory } from '@/types/fcm';
import Link from 'next/link';

// ============================================
// Types
// ============================================
interface NotificationGroup {
  label: string;
  date: string;
  notifications: NotificationHistory[];
}

// ============================================
// API Functions
// ============================================
async function fetchNotifications(userId: string): Promise<NotificationHistory[]> {
  const { data, error } = await supabase
    .from('notification_history')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(100);

  if (error) {
    // PGRST205: 테이블이 없는 경우 빈 배열 반환
    // PGRST301: 권한 없음 - 빈 배열 반환
    if (error.code === 'PGRST205' || error.code === 'PGRST301' || error.code === '42P01') {
      console.warn('알림 테이블이 없거나 접근 권한이 없습니다:', error.code);
      return [];
    }
    console.error('알림 조회 오류:', error);
    throw error;
  }

  return (data || []) as NotificationHistory[];
}

async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_history')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    // 테이블이 없는 경우 무시
    if (error.code === 'PGRST205' || error.code === '42P01') return;
    console.error('읽음 처리 오류:', error);
    throw error;
  }
}

async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_history')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    // 테이블이 없는 경우 무시
    if (error.code === 'PGRST205' || error.code === '42P01') return;
    console.error('전체 읽음 처리 오류:', error);
    throw error;
  }
}

async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_history')
    .delete()
    .eq('id', notificationId);

  if (error) {
    // 테이블이 없는 경우 무시
    if (error.code === 'PGRST205' || error.code === '42P01') return;
    console.error('알림 삭제 오류:', error);
    throw error;
  }
}

// ============================================
// Utility Functions
// ============================================
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'reservation_confirmed':
    case 'reservation_cancelled':
    case 'reservation_reminder':
    case 'new_reservation':
      return Calendar;
    case 'payment_completed':
      return CreditCard;
    case 'review_request':
      return Star;
    case 'promotion':
      return Megaphone;
    default:
      return Bell;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'reservation_confirmed':
      return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    case 'reservation_cancelled':
      return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
    case 'reservation_reminder':
      return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
    case 'new_reservation':
      return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };
    case 'payment_completed':
      return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
    case 'review_request':
      return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    case 'promotion':
      return { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  }
}

function getNotificationLabel(type: NotificationType): string {
  switch (type) {
    case 'reservation_confirmed':
      return '예약 확정';
    case 'reservation_cancelled':
      return '예약 취소';
    case 'reservation_reminder':
      return '예약 알림';
    case 'new_reservation':
      return '새 예약';
    case 'payment_completed':
      return '결제 완료';
    case 'review_request':
      return '리뷰 요청';
    case 'promotion':
      return '프로모션';
    default:
      return '알림';
  }
}

function formatNotificationDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return format(date, 'a h:mm', { locale: ko });
  }

  if (isYesterday(date)) {
    return '어제 ' + format(date, 'a h:mm', { locale: ko });
  }

  return format(date, 'M월 d일 a h:mm', { locale: ko });
}

function groupNotificationsByDate(notifications: NotificationHistory[]): NotificationGroup[] {
  const groups: Map<string, NotificationHistory[]> = new Map();

  notifications.forEach((notification) => {
    const date = parseISO(notification.sent_at);
    let label: string;
    let groupKey: string;

    if (isToday(date)) {
      label = '오늘';
      groupKey = 'today';
    } else if (isYesterday(date)) {
      label = '어제';
      groupKey = 'yesterday';
    } else {
      label = format(date, 'M월 d일 (EEEE)', { locale: ko });
      groupKey = format(date, 'yyyy-MM-dd');
    }

    const existing = groups.get(groupKey) || [];
    existing.push(notification);
    groups.set(groupKey, existing);
  });

  const result: NotificationGroup[] = [];
  groups.forEach((notifications, key) => {
    let label: string;
    if (key === 'today') label = '오늘';
    else if (key === 'yesterday') label = '어제';
    else label = format(parseISO(key), 'M월 d일 (EEEE)', { locale: ko });

    result.push({ label, date: key, notifications });
  });

  return result;
}

// ============================================
// Components
// ============================================
interface NotificationCardProps {
  notification: NotificationHistory;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationCard({ notification, onRead, onDelete }: NotificationCardProps) {
  const Icon = getNotificationIcon(notification.type as NotificationType);
  const colors = getNotificationColor(notification.type as NotificationType);
  const label = getNotificationLabel(notification.type as NotificationType);
  const router = useRouter();

  const handleClick = useCallback(() => {
    // 읽음 처리
    if (!notification.is_read) {
      onRead(notification.id);
    }

    // 클릭 액션이 있으면 해당 페이지로 이동
    if (notification.data?.click_action) {
      router.push(notification.data.click_action as string);
    }
  }, [notification, onRead, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
      className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer
        ${notification.is_read ? 'bg-white border-gray-100' : `${colors.bg} ${colors.border}`}
        hover:shadow-md active:scale-[0.99]`}
      onClick={handleClick}
    >
      {/* 읽지 않음 표시 */}
      {!notification.is_read && (
        <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
      )}

      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div
          className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0
            ${notification.is_read ? 'bg-gray-100' : colors.bg} border ${notification.is_read ? 'border-gray-200' : colors.border}`}
        >
          <Icon className={`w-5 h-5 ${notification.is_read ? 'text-gray-500' : colors.text}`} />
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className={`text-xs font-medium px-2 py-0.5
                ${notification.is_read ? 'bg-gray-100 text-gray-600' : `${colors.bg} ${colors.text}`}`}
            >
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatNotificationDate(notification.sent_at)}
            </span>
          </div>

          {notification.title && (
            <h3
              className={`text-sm font-semibold mb-0.5 truncate ${
                notification.is_read ? 'text-gray-700' : 'text-gray-900'
              }`}
            >
              {notification.title}
            </h3>
          )}

          <p
            className={`text-sm line-clamp-2 ${
              notification.is_read ? 'text-gray-500' : 'text-gray-700'
            }`}
          >
            {notification.body}
          </p>
        </div>
      </div>

      {/* 삭제 버튼 (hover 시 표시) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="absolute bottom-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100
          hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
        aria-label="알림 삭제"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================
export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // 알림 목록 조회 (로그인 상태에서만)
  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user && isAuthenticated,
    staleTime: 30 * 1000, // 30초
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // 읽음 처리 mutation
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // 전체 읽음 처리 mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // 알림 삭제 mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // 필터링된 알림
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.is_read);
    }
    return notifications;
  }, [notifications, activeTab]);

  // 날짜별 그룹핑
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

  // 읽지 않은 알림 개수
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // 핸들러
  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id);
    },
    [markAsReadMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNotificationMutation.mutate(id);
    },
    [deleteNotificationMutation]
  );

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  }, [unreadCount, markAllAsReadMutation]);

  // 로딩 상태
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 비로그인 상태 UI
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/30">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10">
            <BellOff className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">로그인이 필요합니다</h2>
            <p className="text-muted-foreground">
              알림을 확인하려면 로그인해주세요
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/login?redirect=/notifications">
              <Button className="w-full" size="lg">
                로그인하기
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" size="lg">
                홈으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-lg font-bold">알림</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-2.5 py-0.5">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
                aria-label="새로고침"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              {unreadCount > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs">
                      <CheckCheck className="h-4 w-4 mr-1" />
                      전체 읽음
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>전체 읽음 처리</AlertDialogTitle>
                      <AlertDialogDescription>
                        읽지 않은 알림 {unreadCount}개를 모두 읽음 처리하시겠습니까?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleMarkAllAsRead}>확인</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-4">
        {/* 탭 */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all">
              전체
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              읽지 않음
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <NotificationList
              groups={groupedNotifications}
              isLoading={isLoading}
              isError={isError}
              onRead={handleMarkAsRead}
              onDelete={handleDelete}
              emptyMessage="알림이 없습니다"
              emptyDescription="새로운 알림이 오면 여기에 표시됩니다"
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <NotificationList
              groups={groupedNotifications}
              isLoading={isLoading}
              isError={isError}
              onRead={handleMarkAsRead}
              onDelete={handleDelete}
              emptyMessage="읽지 않은 알림이 없습니다"
              emptyDescription="모든 알림을 확인했습니다"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================
// NotificationList Component
// ============================================
interface NotificationListProps {
  groups: NotificationGroup[];
  isLoading: boolean;
  isError: boolean;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
  emptyDescription: string;
}

function NotificationList({
  groups,
  isLoading,
  isError,
  onRead,
  onDelete,
  emptyMessage,
  emptyDescription,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-red-50">
          <Bell className="w-8 h-8 text-red-400" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-900">알림을 불러올 수 없습니다</p>
          <p className="text-sm text-muted-foreground">잠시 후 다시 시도해주세요</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0 || groups.every((g) => g.notifications.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 text-center space-y-4"
      >
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-gray-100">
          <Bell className="w-10 h-10 text-gray-400" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-900">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
        <Link href="/search">
          <Button variant="outline" className="mt-4">
            샵 둘러보기
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {groups.map((group) => (
          <motion.div
            key={group.date}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* 날짜 헤더 */}
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{group.label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* 알림 목록 */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {group.notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onRead={onRead}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
