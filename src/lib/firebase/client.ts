/**
 * Firebase 클라이언트 SDK 설정
 * 브라우저에서 FCM 토큰 획득 및 알림 수신을 위한 클라이언트 전용 모듈
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';

// Firebase 클라이언트 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 초기화 (싱글톤)
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Firebase Messaging 인스턴스 가져오기 (브라우저 전용)
function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const app = getFirebaseApp();
    return getMessaging(app);
  } catch (error) {
    console.error('Firebase Messaging 초기화 실패:', error);
    return null;
  }
}

/**
 * FCM 토큰 요청
 * Service Worker 등록 및 알림 권한 요청 후 토큰 반환
 */
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // 브라우저 지원 확인
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('이 브라우저는 푸시 알림을 지원하지 않습니다.');
    return null;
  }

  try {
    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('알림 권한이 거부되었습니다.');
      return null;
    }

    // Service Worker 등록
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    // Service Worker가 활성화될 때까지 대기
    await navigator.serviceWorker.ready;

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      throw new Error('Firebase Messaging을 초기화할 수 없습니다.');
    }

    // VAPID 키로 토큰 요청
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID 키가 설정되지 않았습니다.');
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      throw new Error('FCM 토큰을 가져올 수 없습니다.');
    }

    return token;
  } catch (error) {
    console.error('FCM 토큰 요청 실패:', error);
    return null;
  }
}

/**
 * 포그라운드 메시지 리스너 등록
 * 앱이 포그라운드에 있을 때 알림 수신 처리
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  return onMessage(messaging, (payload) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('포그라운드 메시지 수신:', payload);
    }
    callback(payload);
  });
}

export { getFirebaseApp, getFirebaseMessaging };
