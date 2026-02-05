/**
 * Firebase 모듈 통합 export
 */

// 서버사이드 (Admin SDK)
export { getMessaging, getAdminApp, admin } from './admin';
export {
  sendPushNotification,
  sendPushNotificationBatch,
  sendPushToTopic
} from './messaging';

// 클라이언트사이드
export {
  requestFCMToken,
  onForegroundMessage,
  getFirebaseApp,
  getFirebaseMessaging
} from './client';
