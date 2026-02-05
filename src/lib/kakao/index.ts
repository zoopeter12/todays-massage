/**
 * 카카오 알림톡 모듈 엔트리 포인트
 * @description 알림톡 관련 모든 기능 re-export
 */

// 타입 내보내기
export type {
  MessageType,
  ButtonType,
  AlimtalkButton,
  TemplateVariables,
  BookingConfirmationData,
  BookingCancellationData,
  BookingReminderData,
  PartnerNotificationData,
  AlimtalkSendRequest,
  AlimtalkSendResponse,
  SendStatus,
  SendLog,
  TemplateCategory,
  AlimtalkTemplate,
  KakaoAlimtalkConfig,
  AlimtalkClientOptions,
} from './types';

// 템플릿 내보내기
export {
  TEMPLATE_CODES,
  TEMPLATES,
  BOOKING_CONFIRMATION_TEMPLATE,
  BOOKING_CANCELLATION_TEMPLATE,
  BOOKING_REMINDER_TEMPLATE,
  PARTNER_NEW_BOOKING_TEMPLATE,
  PARTNER_CANCELLATION_TEMPLATE,
  createBookingConfirmationMessage,
  createBookingCancellationMessage,
  createBookingReminderMessage,
  createPartnerNotificationMessage,
} from './templates';

// 클라이언트 내보내기
export {
  KakaoAlimtalkClient,
  loadKakaoConfig,
  getAlimtalkClient,
  resetAlimtalkClient,
} from './client';

// 로거 내보내기
export { logger } from './logger';

// 서비스 레이어 내보내기
export {
  sendBookingConfirmationNotifications,
  sendBookingCancellationNotifications,
  sendBookingReminder,
  sendTomorrowReminders,
} from './service';
