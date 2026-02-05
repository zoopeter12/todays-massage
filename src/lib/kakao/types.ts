/**
 * 카카오 알림톡 타입 정의
 * @description 카카오 비즈니스 알림톡 API 관련 타입
 */

// ============================================================
// 알림톡 메시지 타입
// ============================================================

/** 알림톡 메시지 타입 */
export type MessageType = 'AT' | 'FT'; // AT: 알림톡, FT: 친구톡

/** 버튼 타입 */
export type ButtonType =
  | 'WL'  // 웹 링크
  | 'AL'  // 앱 링크
  | 'DS'  // 배송 조회
  | 'BK'  // 봇 키워드
  | 'MD'  // 메시지 전달
  | 'BC'  // 상담톡 전환
  | 'BT'  // 봇 전환
  | 'AC'; // 채널 추가

/** 알림톡 버튼 */
export interface AlimtalkButton {
  type: ButtonType;
  name: string;
  url_mobile?: string;
  url_pc?: string;
  scheme_ios?: string;
  scheme_android?: string;
}

/** 알림톡 템플릿 변수 */
export interface TemplateVariables {
  [key: string]: string | number;
}

// ============================================================
// 예약 관련 알림 타입
// ============================================================

/** 예약 확정 알림 데이터 */
export interface BookingConfirmationData {
  customerName: string;
  customerPhone: string;
  shopName: string;
  shopAddress: string;
  serviceName: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm
  duration: number; // 분 단위
  price: number;
  bookingId: string;
}

/** 예약 취소 알림 데이터 */
export interface BookingCancellationData {
  customerName: string;
  customerPhone: string;
  shopName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  cancelReason?: string;
  refundAmount?: number;
  bookingId: string;
}

/** 예약 리마인더 알림 데이터 */
export interface BookingReminderData {
  customerName: string;
  customerPhone: string;
  shopName: string;
  shopAddress: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  bookingId: string;
}

/** 파트너(업체) 알림 데이터 */
export interface PartnerNotificationData {
  partnerName: string;
  partnerPhone: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  bookingId: string;
  notificationType: 'new_booking' | 'cancellation';
}

// ============================================================
// API 요청/응답 타입
// ============================================================

/** 알림톡 발송 요청 */
export interface AlimtalkSendRequest {
  message_type: MessageType;
  sender_key: string;
  template_code: string;
  phone_number: string;
  message: string;
  sender_no?: string;
  buttons?: AlimtalkButton[];
  fall_back_yn?: boolean;
  fall_back_message?: string;
  cid?: string; // 고객사 메시지 ID
}

/** 알림톡 발송 응답 */
export interface AlimtalkSendResponse {
  code: string;
  message: string;
  data?: {
    message_id: string;
    cid?: string;
    result_code: string;
    result_message: string;
  };
}

/** 발송 결과 상태 */
export type SendStatus = 'success' | 'failed' | 'pending';

/** 발송 로그 */
export interface SendLog {
  id: string;
  bookingId: string;
  templateCode: string;
  phoneNumber: string;
  status: SendStatus;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  sentAt: Date;
  createdAt: Date;
}

// ============================================================
// 템플릿 타입
// ============================================================

/** 템플릿 카테고리 */
export type TemplateCategory =
  | 'booking_confirmation'  // 예약 확정
  | 'booking_cancellation'  // 예약 취소
  | 'booking_reminder'      // 예약 리마인더
  | 'partner_new_booking'   // 파트너 신규 예약 알림
  | 'partner_cancellation'; // 파트너 취소 알림

/** 템플릿 정의 */
export interface AlimtalkTemplate {
  code: string;
  category: TemplateCategory;
  name: string;
  content: string;
  buttons?: AlimtalkButton[];
  variables: string[]; // 템플릿에서 사용하는 변수 목록
}

// ============================================================
// 환경 설정 타입
// ============================================================

/** 카카오 알림톡 설정 */
export interface KakaoAlimtalkConfig {
  baseUrl: string;
  senderKey: string;
  senderNo: string;
  accessToken: string;
  channelId: string;
  fallbackEnabled: boolean;
}

/** API 클라이언트 옵션 */
export interface AlimtalkClientOptions {
  config: KakaoAlimtalkConfig;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}
