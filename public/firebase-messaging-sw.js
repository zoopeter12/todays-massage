/**
 * Firebase Cloud Messaging Service Worker
 * 백그라운드 푸시 알림 처리
 */

// Firebase SDK 버전 (호환 버전 사용)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase 설정 (환경변수를 직접 사용할 수 없으므로 빌드 시 주입 필요)
// 실제 값은 배포 전 또는 빌드 스크립트에서 교체해야 합니다
const firebaseConfig = {
  apiKey: 'AIzaSyAR-iRuDxXBIlsLNFXgGZA_FOJMYga6XH0',
  authDomain: 'oneul-massage.firebaseapp.com',
  projectId: 'oneul-massage',
  storageBucket: 'oneul-massage.firebasestorage.app',
  messagingSenderId: '956554908188',
  appId: '1:956554908188:web:17b53c55bf455cc82205d9',
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '오늘의 마사지';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    // 알림 클릭 시 동작
    actions: getNotificationActions(payload.data?.type),
    // 사용자 상호작용 필요 여부
    requireInteraction: shouldRequireInteraction(payload.data?.type),
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 유형별 액션 버튼 설정
function getNotificationActions(type) {
  switch (type) {
    case 'reservation_confirmed':
    case 'reservation_cancelled':
      return [
        { action: 'view', title: '예약 확인' },
        { action: 'dismiss', title: '닫기' },
      ];
    case 'new_reservation':
      return [
        { action: 'view', title: '예약 확인' },
        { action: 'accept', title: '수락' },
      ];
    case 'review_request':
      return [
        { action: 'review', title: '리뷰 작성' },
        { action: 'later', title: '나중에' },
      ];
    default:
      return [];
  }
}

// 사용자 상호작용 필요 여부 결정
function shouldRequireInteraction(type) {
  const interactionRequired = [
    'reservation_confirmed',
    'reservation_cancelled',
    'new_reservation',
    'payment_completed',
  ];
  return interactionRequired.includes(type);
}

// 알림 클릭 이벤트 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 알림 클릭:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // 클릭 액션에 따른 URL 결정
  let targetUrl = '/';

  if (action === 'view' || !action) {
    // 알림 유형에 따른 이동 경로
    switch (data.type) {
      case 'reservation_confirmed':
      case 'reservation_cancelled':
      case 'reservation_reminder':
        targetUrl = data.reservation_id
          ? `/reservations/${data.reservation_id}`
          : '/reservations';
        break;
      case 'new_reservation':
        targetUrl = data.reservation_id
          ? `/partner/reservations/${data.reservation_id}`
          : '/partner/reservations';
        break;
      case 'payment_completed':
        targetUrl = data.payment_id
          ? `/payments/${data.payment_id}`
          : '/payments';
        break;
      case 'review_request':
        targetUrl = data.shop_id
          ? `/shops/${data.shop_id}/review`
          : '/reservations';
        break;
      case 'promotion':
        targetUrl = data.promotion_url || '/promotions';
        break;
      default:
        targetUrl = data.click_action || '/';
    }
  } else if (action === 'review') {
    targetUrl = data.shop_id
      ? `/shops/${data.shop_id}/review`
      : '/reservations';
  } else if (action === 'accept' && data.reservation_id) {
    targetUrl = `/partner/reservations/${data.reservation_id}?action=accept`;
  }

  // 이미 열린 창이 있으면 포커스, 없으면 새 창 열기
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 같은 origin의 열린 창 찾기
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // 열린 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 알림 닫기 이벤트 (분석용)
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] 알림 닫힘:', event.notification.tag);
});

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker 설치됨');
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker 활성화됨');
  event.waitUntil(clients.claim());
});
