/**
 * 카카오 알림톡 발송 API Route
 * POST /api/notifications/alimtalk
 *
 * @description 예약 관련 알림톡 발송 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAlimtalkClient,
  logger,
  type BookingConfirmationData,
  type BookingCancellationData,
  type BookingReminderData,
  type PartnerNotificationData,
} from '@/lib/kakao';

// ============================================================
// 타입 정의
// ============================================================

type NotificationType =
  | 'booking_confirmation'
  | 'booking_cancellation'
  | 'booking_reminder'
  | 'partner_new_booking'
  | 'partner_cancellation';

interface AlimtalkRequestBody {
  type: NotificationType;
  data:
    | BookingConfirmationData
    | BookingCancellationData
    | BookingReminderData
    | PartnerNotificationData;
}

interface AlimtalkResponse {
  success: boolean;
  message: string;
  data?: {
    messageId?: string;
    bookingId: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================
// 인증 검사
// ============================================================

/**
 * 서버 간 통신 API Key 검증
 * @param request NextRequest 객체
 * @returns 인증 성공 여부
 */
function validateServerAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const secretKey = process.env.ALIMTALK_API_SECRET_KEY;

  // 환경변수가 설정되지 않은 경우 경고 로그
  if (!secretKey) {
    logger.logError(
      new Error('ALIMTALK_API_SECRET_KEY 환경변수가 설정되지 않았습니다'),
      { endpoint: '/api/notifications/alimtalk' }
    );
    return false;
  }

  // API Key 헤더가 없거나 일치하지 않는 경우
  if (!apiKey || apiKey !== secretKey) {
    logger.logError(new Error('유효하지 않은 API Key'), {
      endpoint: '/api/notifications/alimtalk',
      hasApiKey: !!apiKey,
    });
    return false;
  }

  return true;
}

// ============================================================
// 유효성 검사
// ============================================================

function validatePhoneNumber(phone: string): boolean {
  // 한국 휴대폰 번호 형식 검증 (010, 011, 016, 017, 018, 019)
  const phoneRegex = /^01[0-9]{8,9}$/;
  return phoneRegex.test(phone.replace(/-/g, ''));
}

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/-/g, '');
}

function validateBookingConfirmation(
  data: BookingConfirmationData
): string | null {
  if (!data.customerName) return '고객명이 필요합니다';
  if (!data.customerPhone) return '고객 전화번호가 필요합니다';
  if (!validatePhoneNumber(data.customerPhone))
    return '유효하지 않은 전화번호 형식입니다';
  if (!data.shopName) return '업체명이 필요합니다';
  if (!data.serviceName) return '서비스명이 필요합니다';
  if (!data.bookingDate) return '예약일이 필요합니다';
  if (!data.bookingTime) return '예약시간이 필요합니다';
  if (!data.bookingId) return '예약번호가 필요합니다';
  return null;
}

function validateBookingCancellation(
  data: BookingCancellationData
): string | null {
  if (!data.customerName) return '고객명이 필요합니다';
  if (!data.customerPhone) return '고객 전화번호가 필요합니다';
  if (!validatePhoneNumber(data.customerPhone))
    return '유효하지 않은 전화번호 형식입니다';
  if (!data.shopName) return '업체명이 필요합니다';
  if (!data.bookingId) return '예약번호가 필요합니다';
  return null;
}

function validateBookingReminder(data: BookingReminderData): string | null {
  if (!data.customerName) return '고객명이 필요합니다';
  if (!data.customerPhone) return '고객 전화번호가 필요합니다';
  if (!validatePhoneNumber(data.customerPhone))
    return '유효하지 않은 전화번호 형식입니다';
  if (!data.shopName) return '업체명이 필요합니다';
  if (!data.bookingId) return '예약번호가 필요합니다';
  return null;
}

function validatePartnerNotification(
  data: PartnerNotificationData
): string | null {
  if (!data.partnerName) return '파트너명이 필요합니다';
  if (!data.partnerPhone) return '파트너 전화번호가 필요합니다';
  if (!validatePhoneNumber(data.partnerPhone))
    return '유효하지 않은 전화번호 형식입니다';
  if (!data.bookingId) return '예약번호가 필요합니다';
  if (!['new_booking', 'cancellation'].includes(data.notificationType))
    return '유효하지 않은 알림 타입입니다';
  return null;
}

// ============================================================
// API 핸들러
// ============================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<AlimtalkResponse>> {
  try {
    // 1. API Key 인증 검증
    if (!validateServerAuth(request)) {
      return NextResponse.json(
        {
          success: false,
          message: '인증에 실패했습니다',
          error: {
            code: 'UNAUTHORIZED',
            message: '유효한 API Key가 필요합니다',
          },
        },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body: AlimtalkRequestBody = await request.json();
    const { type, data } = body;

    // 3. 알림 타입 검증
    const validTypes: NotificationType[] = [
      'booking_confirmation',
      'booking_cancellation',
      'booking_reminder',
      'partner_new_booking',
      'partner_cancellation',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: '유효하지 않은 알림 타입입니다',
          error: {
            code: 'INVALID_TYPE',
            message: `지원하는 타입: ${validTypes.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // 4. 데이터 유효성 검사
    let validationError: string | null = null;

    switch (type) {
      case 'booking_confirmation':
        validationError = validateBookingConfirmation(
          data as BookingConfirmationData
        );
        break;
      case 'booking_cancellation':
        validationError = validateBookingCancellation(
          data as BookingCancellationData
        );
        break;
      case 'booking_reminder':
        validationError = validateBookingReminder(data as BookingReminderData);
        break;
      case 'partner_new_booking':
      case 'partner_cancellation':
        validationError = validatePartnerNotification(
          data as PartnerNotificationData
        );
        break;
    }

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError,
          },
        },
        { status: 400 }
      );
    }

    // 5. 알림톡 클라이언트 가져오기
    const client = getAlimtalkClient();

    // 6. 알림톡 발송
    let response;
    let bookingId: string;

    switch (type) {
      case 'booking_confirmation': {
        const confirmData = data as BookingConfirmationData;
        confirmData.customerPhone = normalizePhoneNumber(confirmData.customerPhone);
        response = await client.sendBookingConfirmation(confirmData);
        bookingId = confirmData.bookingId;
        break;
      }
      case 'booking_cancellation': {
        const cancelData = data as BookingCancellationData;
        cancelData.customerPhone = normalizePhoneNumber(cancelData.customerPhone);
        response = await client.sendBookingCancellation(cancelData);
        bookingId = cancelData.bookingId;
        break;
      }
      case 'booking_reminder': {
        const reminderData = data as BookingReminderData;
        reminderData.customerPhone = normalizePhoneNumber(reminderData.customerPhone);
        response = await client.sendBookingReminder(reminderData);
        bookingId = reminderData.bookingId;
        break;
      }
      case 'partner_new_booking':
      case 'partner_cancellation': {
        const partnerData = data as PartnerNotificationData;
        partnerData.partnerPhone = normalizePhoneNumber(partnerData.partnerPhone);
        partnerData.notificationType =
          type === 'partner_new_booking' ? 'new_booking' : 'cancellation';
        response = await client.sendPartnerNotification(partnerData);
        bookingId = partnerData.bookingId;
        break;
      }
      default:
        throw new Error('알 수 없는 알림 타입');
    }

    // 7. 응답 처리
    if (response.code === '0000' || response.data?.result_code === 'SUCCESS') {
      logger.logInfo('알림톡 발송 성공', {
        type,
        bookingId,
        messageId: response.data?.message_id,
      });

      return NextResponse.json({
        success: true,
        message: '알림톡이 성공적으로 발송되었습니다',
        data: {
          messageId: response.data?.message_id,
          bookingId,
        },
      });
    } else {
      logger.logError(new Error(response.message), {
        type,
        bookingId,
        responseCode: response.code,
      });

      return NextResponse.json(
        {
          success: false,
          message: '알림톡 발송에 실패했습니다',
          error: {
            code: response.code,
            message: response.message,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';

    logger.logError(
      error instanceof Error ? error : new Error(errorMessage),
      { endpoint: '/api/notifications/alimtalk' }
    );

    // 환경 설정 오류인 경우
    if (errorMessage.includes('환경변수')) {
      return NextResponse.json(
        {
          success: false,
          message: '서버 설정 오류',
          error: {
            code: 'CONFIG_ERROR',
            message:
              process.env.NODE_ENV === 'development'
                ? errorMessage
                : '서버 설정을 확인해주세요',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: '알림톡 발송 중 오류가 발생했습니다',
        error: {
          code: 'INTERNAL_ERROR',
          message:
            process.env.NODE_ENV === 'development'
              ? errorMessage
              : '잠시 후 다시 시도해주세요',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================
// GET - 헬스체크 및 설정 상태 확인
// ============================================================

export async function GET(): Promise<NextResponse> {
  try {
    // 환경변수 존재 여부만 확인 (실제 값은 노출하지 않음)
    const configStatus = {
      KAKAO_ALIMTALK_BASE_URL: !!process.env.KAKAO_ALIMTALK_BASE_URL,
      KAKAO_SENDER_KEY: !!process.env.KAKAO_SENDER_KEY,
      KAKAO_ACCESS_TOKEN: !!process.env.KAKAO_ACCESS_TOKEN,
      KAKAO_CHANNEL_ID: !!process.env.KAKAO_CHANNEL_ID,
      KAKAO_SENDER_NO: !!process.env.KAKAO_SENDER_NO,
      KAKAO_FALLBACK_ENABLED: process.env.KAKAO_FALLBACK_ENABLED === 'true',
    };

    const isConfigured = Object.values(configStatus).slice(0, 4).every(Boolean);

    return NextResponse.json({
      status: isConfigured ? 'configured' : 'not_configured',
      message: isConfigured
        ? '알림톡 서비스가 설정되어 있습니다'
        : '알림톡 서비스 설정이 필요합니다',
      config: configStatus,
      supportedTypes: [
        'booking_confirmation',
        'booking_cancellation',
        'booking_reminder',
        'partner_new_booking',
        'partner_cancellation',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: '상태 확인 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
