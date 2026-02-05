'use client';

/**
 * FCM (Firebase Cloud Messaging) React Hook
 * 클라이언트에서 푸시 알림 권한 요청 및 토큰 관리
 */
import { useState, useEffect, useCallback } from 'react';
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase/client';
import type { NotificationPermissionStatus, UseFCMReturn } from '@/types/fcm';
import type { MessagePayload } from 'firebase/messaging';

interface UseFCMOptions {
  /** 자동으로 권한 요청 여부 */
  autoRequestPermission?: boolean;
  /** 포그라운드 메시지 콜백 */
  onMessage?: (payload: MessagePayload) => void;
  /** 토큰 변경 시 서버에 저장하는 콜백 */
  onTokenChange?: (token: string) => Promise<void>;
}

export function useFCM(options: UseFCMOptions = {}): UseFCMReturn {
  const {
    autoRequestPermission = false,
    onMessage,
    onTokenChange,
  } = options;

  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // 브라우저 지원 여부 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission as NotificationPermissionStatus);
      } else {
        setPermission('unsupported');
      }
    }
  }, []);

  // 포그라운드 메시지 리스너 등록
  useEffect(() => {
    if (!isSupported || !onMessage) return;

    const unsubscribe = onForegroundMessage(onMessage);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupported, onMessage]);

  // 토큰 서버 저장
  const saveTokenToServer = useCallback(async (fcmToken: string) => {
    if (!onTokenChange) return;

    try {
      await onTokenChange(fcmToken);
    } catch (err) {
      console.error('FCM 토큰 서버 저장 실패:', err);
    }
  }, [onTokenChange]);

  // 권한 요청 및 토큰 획득
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fcmToken = await requestFCMToken();

      if (fcmToken) {
        setToken(fcmToken);
        setPermission('granted');
        await saveTokenToServer(fcmToken);
      } else {
        // 토큰을 받지 못한 경우 현재 권한 상태 확인
        const currentPermission = Notification.permission as NotificationPermissionStatus;
        setPermission(currentPermission);

        if (currentPermission === 'denied') {
          setError('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
        } else {
          setError('FCM 토큰을 가져올 수 없습니다.');
        }
      }
    } catch (err: any) {
      setError(err.message || '알림 설정 중 오류가 발생했습니다.');
      console.error('FCM 초기화 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, saveTokenToServer]);

  // 자동 권한 요청
  useEffect(() => {
    if (autoRequestPermission && isSupported && permission === 'default') {
      requestPermission();
    }
  }, [autoRequestPermission, isSupported, permission, requestPermission]);

  // 이미 권한이 허용된 경우 토큰 자동 획득
  useEffect(() => {
    if (isSupported && permission === 'granted' && !token && !isLoading) {
      requestPermission();
    }
  }, [isSupported, permission, token, isLoading, requestPermission]);

  return {
    token,
    permission,
    isLoading,
    error,
    requestPermission,
    isSupported,
  };
}

export default useFCM;
