'use client';

/**
 * FCM 알림 프로바이더 컴포넌트
 * 앱 전체에서 푸시 알림을 관리하는 컨텍스트 프로바이더
 */
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useFCM } from '@/hooks/useFCM';
import { toast } from 'sonner';
import type { MessagePayload } from 'firebase/messaging';
import type { NotificationPermissionStatus } from '@/types/fcm';

interface NotificationContextValue {
  /** FCM 토큰 */
  token: string | null;
  /** 알림 권한 상태 */
  permission: NotificationPermissionStatus;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 오류 메시지 */
  error: string | null;
  /** 권한 요청 함수 */
  requestPermission: () => Promise<void>;
  /** 푸시 알림 지원 여부 */
  isSupported: boolean;
  /** 읽지 않은 알림 개수 */
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  /** 인증된 사용자 ID (로그인 시) */
  userId?: string | null;
  /** 인증 토큰 (API 호출용) */
  authToken?: string | null;
}

export function NotificationProvider({
  children,
  userId,
  authToken,
}: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  // 포그라운드 메시지 핸들러
  const handleForegroundMessage = useCallback((payload: MessagePayload) => {
    const notification = payload.notification;

    if (notification) {
      // Sonner 토스트로 알림 표시
      toast(notification.title || '새 알림', {
        description: notification.body,
        action: payload.data?.click_action
          ? {
              label: '확인',
              onClick: () => {
                window.location.href = payload.data!.click_action as string;
              },
            }
          : undefined,
      });
    }

    // 읽지 않은 알림 카운트 증가
    setUnreadCount((prev) => prev + 1);
  }, []);

  // 토큰 서버 저장 핸들러
  const handleTokenChange = useCallback(async (token: string) => {
    if (!authToken) return;

    try {
      await fetch('/api/fcm/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          device_type: 'web',
          device_info: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('FCM 토큰 서버 저장 실패:', error);
    }
  }, [authToken]);

  // useFCM 훅 사용
  const {
    token,
    permission,
    isLoading,
    error,
    requestPermission,
    isSupported,
  } = useFCM({
    autoRequestPermission: false, // 수동으로 권한 요청
    onMessage: handleForegroundMessage,
    onTokenChange: userId ? handleTokenChange : undefined,
  });

  // 읽지 않은 알림 개수 로드
  useEffect(() => {
    if (!userId || !authToken) return;

    async function fetchUnreadCount() {
      try {
        // Supabase RPC 호출 또는 별도 API 사용
        const response = await fetch('/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('읽지 않은 알림 개수 조회 실패:', error);
      }
    }

    fetchUnreadCount();
  }, [userId, authToken]);

  const value: NotificationContextValue = {
    token,
    permission,
    isLoading,
    error,
    requestPermission,
    isSupported,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * 알림 컨텍스트 훅
 */
export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
}

export default NotificationProvider;
