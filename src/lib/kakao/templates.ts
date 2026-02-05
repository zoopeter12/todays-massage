/**
 * 카카오 알림톡 템플릿 정의
 * @description 예약 관련 알림톡 메시지 템플릿
 *
 * 주의: 템플릿은 카카오 비즈니스 채널에서 사전 승인 후 사용 가능
 * 아래 템플릿 코드는 실제 승인받은 코드로 교체 필요
 */

import type {
  AlimtalkTemplate,
  BookingConfirmationData,
  BookingCancellationData,
  BookingReminderData,
  PartnerNotificationData
} from './types';

// ============================================================
// 템플릿 코드 상수
// ============================================================

export const TEMPLATE_CODES = {
  BOOKING_CONFIRMATION: 'TM_BOOKING_CONFIRM_001',
  BOOKING_CANCELLATION: 'TM_BOOKING_CANCEL_001',
  BOOKING_REMINDER: 'TM_BOOKING_REMIND_001',
  PARTNER_NEW_BOOKING: 'TM_PARTNER_NEW_001',
  PARTNER_CANCELLATION: 'TM_PARTNER_CANCEL_001',
} as const;

// ============================================================
// 템플릿 정의
// ============================================================

/** 예약 확정 알림 템플릿 */
export const BOOKING_CONFIRMATION_TEMPLATE: AlimtalkTemplate = {
  code: TEMPLATE_CODES.BOOKING_CONFIRMATION,
  category: 'booking_confirmation',
  name: '예약 확정 안내',
  content: `[오늘의마사지] 예약이 확정되었습니다.

안녕하세요, #{customerName}님!
예약이 성공적으로 완료되었습니다.

■ 예약 정보
- 업체명: #{shopName}
- 서비스: #{serviceName}
- 일시: #{bookingDate} #{bookingTime}
- 소요시간: #{duration}분
- 결제금액: #{price}원

■ 주소
#{shopAddress}

예약번호: #{bookingId}

※ 예약 변경/취소는 예약 시간 24시간 전까지 가능합니다.`,
  buttons: [
    {
      type: 'WL',
      name: '예약 확인하기',
      url_mobile: '#{bookingUrl}',
      url_pc: '#{bookingUrl}',
    },
  ],
  variables: [
    'customerName',
    'shopName',
    'serviceName',
    'bookingDate',
    'bookingTime',
    'duration',
    'price',
    'shopAddress',
    'bookingId',
    'bookingUrl',
  ],
};

/** 예약 취소 알림 템플릿 */
export const BOOKING_CANCELLATION_TEMPLATE: AlimtalkTemplate = {
  code: TEMPLATE_CODES.BOOKING_CANCELLATION,
  category: 'booking_cancellation',
  name: '예약 취소 안내',
  content: `[오늘의마사지] 예약이 취소되었습니다.

안녕하세요, #{customerName}님.
아래 예약이 취소 처리되었습니다.

■ 취소된 예약 정보
- 업체명: #{shopName}
- 서비스: #{serviceName}
- 일시: #{bookingDate} #{bookingTime}

예약번호: #{bookingId}
#{cancelReasonText}
#{refundText}

다음에 다시 이용해 주세요.
감사합니다.`,
  buttons: [
    {
      type: 'WL',
      name: '다시 예약하기',
      url_mobile: '#{rebookUrl}',
      url_pc: '#{rebookUrl}',
    },
  ],
  variables: [
    'customerName',
    'shopName',
    'serviceName',
    'bookingDate',
    'bookingTime',
    'bookingId',
    'cancelReasonText',
    'refundText',
    'rebookUrl',
  ],
};

/** 예약 리마인더 알림 템플릿 */
export const BOOKING_REMINDER_TEMPLATE: AlimtalkTemplate = {
  code: TEMPLATE_CODES.BOOKING_REMINDER,
  category: 'booking_reminder',
  name: '예약 리마인더',
  content: `[오늘의마사지] 예약 알림

안녕하세요, #{customerName}님!
내일 예약이 있습니다.

■ 예약 정보
- 업체명: #{shopName}
- 서비스: #{serviceName}
- 일시: #{bookingDate} #{bookingTime}

■ 주소
#{shopAddress}

예약번호: #{bookingId}

※ 예약 변경/취소는 예약 시간 24시간 전까지 가능합니다.`,
  buttons: [
    {
      type: 'WL',
      name: '길찾기',
      url_mobile: '#{mapUrl}',
      url_pc: '#{mapUrl}',
    },
    {
      type: 'WL',
      name: '예약 확인',
      url_mobile: '#{bookingUrl}',
      url_pc: '#{bookingUrl}',
    },
  ],
  variables: [
    'customerName',
    'shopName',
    'serviceName',
    'bookingDate',
    'bookingTime',
    'shopAddress',
    'bookingId',
    'mapUrl',
    'bookingUrl',
  ],
};

/** 파트너 신규 예약 알림 템플릿 */
export const PARTNER_NEW_BOOKING_TEMPLATE: AlimtalkTemplate = {
  code: TEMPLATE_CODES.PARTNER_NEW_BOOKING,
  category: 'partner_new_booking',
  name: '파트너 신규 예약 알림',
  content: `[오늘의마사지] 새로운 예약이 있습니다.

#{partnerName}님, 새 예약이 접수되었습니다!

■ 예약 정보
- 고객명: #{customerName}
- 서비스: #{serviceName}
- 일시: #{bookingDate} #{bookingTime}

예약번호: #{bookingId}

파트너 관리 페이지에서 확인해 주세요.`,
  buttons: [
    {
      type: 'WL',
      name: '예약 관리',
      url_mobile: '#{partnerDashboardUrl}',
      url_pc: '#{partnerDashboardUrl}',
    },
  ],
  variables: [
    'partnerName',
    'customerName',
    'serviceName',
    'bookingDate',
    'bookingTime',
    'bookingId',
    'partnerDashboardUrl',
  ],
};

/** 파트너 예약 취소 알림 템플릿 */
export const PARTNER_CANCELLATION_TEMPLATE: AlimtalkTemplate = {
  code: TEMPLATE_CODES.PARTNER_CANCELLATION,
  category: 'partner_cancellation',
  name: '파트너 예약 취소 알림',
  content: `[오늘의마사지] 예약이 취소되었습니다.

#{partnerName}님, 아래 예약이 취소되었습니다.

■ 취소된 예약 정보
- 고객명: #{customerName}
- 서비스: #{serviceName}
- 일시: #{bookingDate} #{bookingTime}

예약번호: #{bookingId}

파트너 관리 페이지에서 확인해 주세요.`,
  buttons: [
    {
      type: 'WL',
      name: '예약 관리',
      url_mobile: '#{partnerDashboardUrl}',
      url_pc: '#{partnerDashboardUrl}',
    },
  ],
  variables: [
    'partnerName',
    'customerName',
    'serviceName',
    'bookingDate',
    'bookingTime',
    'bookingId',
    'partnerDashboardUrl',
  ],
};

// ============================================================
// 템플릿 맵
// ============================================================

export const TEMPLATES = {
  [TEMPLATE_CODES.BOOKING_CONFIRMATION]: BOOKING_CONFIRMATION_TEMPLATE,
  [TEMPLATE_CODES.BOOKING_CANCELLATION]: BOOKING_CANCELLATION_TEMPLATE,
  [TEMPLATE_CODES.BOOKING_REMINDER]: BOOKING_REMINDER_TEMPLATE,
  [TEMPLATE_CODES.PARTNER_NEW_BOOKING]: PARTNER_NEW_BOOKING_TEMPLATE,
  [TEMPLATE_CODES.PARTNER_CANCELLATION]: PARTNER_CANCELLATION_TEMPLATE,
} as const;

// ============================================================
// 메시지 생성 헬퍼 함수
// ============================================================

/**
 * 템플릿 변수 치환
 */
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`#\\{${key}\\}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}

/**
 * 금액 포맷팅
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price);
}

/**
 * 예약 확정 메시지 생성
 */
export function createBookingConfirmationMessage(
  data: BookingConfirmationData,
  baseUrl: string
): string {
  const variables = {
    customerName: data.customerName,
    shopName: data.shopName,
    serviceName: data.serviceName,
    bookingDate: data.bookingDate,
    bookingTime: data.bookingTime,
    duration: data.duration,
    price: formatPrice(data.price),
    shopAddress: data.shopAddress,
    bookingId: data.bookingId,
    bookingUrl: `${baseUrl}/bookings/${data.bookingId}`,
  };

  return replaceTemplateVariables(
    BOOKING_CONFIRMATION_TEMPLATE.content,
    variables
  );
}

/**
 * 예약 취소 메시지 생성
 */
export function createBookingCancellationMessage(
  data: BookingCancellationData,
  baseUrl: string
): string {
  const cancelReasonText = data.cancelReason
    ? `\n취소 사유: ${data.cancelReason}`
    : '';

  const refundText = data.refundAmount !== undefined
    ? `\n환불 예정 금액: ${formatPrice(data.refundAmount)}원`
    : '';

  const variables = {
    customerName: data.customerName,
    shopName: data.shopName,
    serviceName: data.serviceName,
    bookingDate: data.bookingDate,
    bookingTime: data.bookingTime,
    bookingId: data.bookingId,
    cancelReasonText,
    refundText,
    rebookUrl: `${baseUrl}/shops`,
  };

  return replaceTemplateVariables(
    BOOKING_CANCELLATION_TEMPLATE.content,
    variables
  );
}

/**
 * 예약 리마인더 메시지 생성
 */
export function createBookingReminderMessage(
  data: BookingReminderData,
  baseUrl: string
): string {
  // 카카오맵 길찾기 URL 생성
  const encodedAddress = encodeURIComponent(data.shopAddress);
  const mapUrl = `https://map.kakao.com/link/search/${encodedAddress}`;

  const variables = {
    customerName: data.customerName,
    shopName: data.shopName,
    serviceName: data.serviceName,
    bookingDate: data.bookingDate,
    bookingTime: data.bookingTime,
    shopAddress: data.shopAddress,
    bookingId: data.bookingId,
    mapUrl,
    bookingUrl: `${baseUrl}/bookings/${data.bookingId}`,
  };

  return replaceTemplateVariables(
    BOOKING_REMINDER_TEMPLATE.content,
    variables
  );
}

/**
 * 파트너 알림 메시지 생성
 */
export function createPartnerNotificationMessage(
  data: PartnerNotificationData,
  baseUrl: string
): string {
  const template = data.notificationType === 'new_booking'
    ? PARTNER_NEW_BOOKING_TEMPLATE
    : PARTNER_CANCELLATION_TEMPLATE;

  const variables = {
    partnerName: data.partnerName,
    customerName: data.customerName,
    serviceName: data.serviceName,
    bookingDate: data.bookingDate,
    bookingTime: data.bookingTime,
    bookingId: data.bookingId,
    partnerDashboardUrl: `${baseUrl}/partner/bookings`,
  };

  return replaceTemplateVariables(template.content, variables);
}
