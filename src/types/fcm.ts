/**
 * FCM (Firebase Cloud Messaging) 타입 정의
 */

// 알림 유형
export type NotificationType =
  | 'reservation_confirmed'  // 예약 확정
  | 'reservation_cancelled'  // 예약 취소
  | 'reservation_reminder'   // 예약 리마인더
  | 'new_reservation'        // 새 예약 (파트너용)
  | 'payment_completed'      // 결제 완료
  | 'review_request'         // 리뷰 요청
  | 'promotion';             // 프로모션

// FCM 토큰 데이터베이스 레코드
export interface FCMToken {
  id: string;
  user_id: string;
  token: string;
  device_type: 'web' | 'android' | 'ios';
  device_info?: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

// FCM 토큰 생성/갱신 요청
export interface FCMTokenRequest {
  token: string;
  device_type: 'web' | 'android' | 'ios';
  device_info?: string;
}

// 알림 페이로드
export interface FCMNotificationPayload {
  type: NotificationType;
  title?: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  clickAction?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: Record<string, string>;
}

// 알림 액션 버튼
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// 푸시 발송 결과
export interface FCMSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  shouldRemoveToken?: boolean;
}

// 알림 발송 요청 (API)
export interface SendNotificationRequest {
  user_id?: string;
  user_ids?: string[];
  topic?: string;
  notification: FCMNotificationPayload;
}

// 알림 발송 응답 (API)
export interface SendNotificationResponse {
  success: boolean;
  sent_count?: number;
  failed_count?: number;
  invalid_tokens_removed?: number;
  error?: string;
}

// 알림 히스토리 레코드
export interface NotificationHistory {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  is_read: boolean;
  sent_at: string;
  read_at?: string;
}

// 알림 설정
export interface NotificationSettings {
  user_id: string;
  reservation_updates: boolean;
  payment_notifications: boolean;
  review_reminders: boolean;
  promotions: boolean;
  created_at: string;
  updated_at: string;
}

// 알림 권한 상태
export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

// useFCM 훅 반환 타입
export interface UseFCMReturn {
  token: string | null;
  permission: NotificationPermissionStatus;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
}
