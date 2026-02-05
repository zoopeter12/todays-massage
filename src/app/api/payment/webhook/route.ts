/**
 * PortOne 결제 웹훅 엔드포인트
 * POST /api/payment/webhook
 *
 * @description PortOne에서 결제 상태 변경 시 호출되는 웹훅 엔드포인트
 * 이벤트 타입: Transaction.Paid, Transaction.Cancelled, Transaction.Failed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import {
  sendPaymentCompletedNotification,
  sendReservationCancelledNotification,
} from '@/lib/api/notification';

// ============================================================
// 환경 변수 검증
// ============================================================

const PORTONE_WEBHOOK_SECRET = process.env.PORTONE_WEBHOOK_SECRET;
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// 타입 정의
// ============================================================

/**
 * PortOne 웹훅 이벤트 타입
 */
type PortOneWebhookEventType =
  | 'Transaction.Paid'
  | 'Transaction.Cancelled'
  | 'Transaction.Failed'
  | 'Transaction.Ready'
  | 'Transaction.PartialCancelled';

/**
 * PortOne 웹훅 요청 본문
 */
interface PortOneWebhookPayload {
  type: PortOneWebhookEventType;
  timestamp: string;
  data: {
    paymentId: string;
    transactionId?: string;
    storeId?: string;
  };
}

/**
 * PortOne 결제 조회 응답
 */
interface PortOnePaymentResponse {
  id: string;
  status: 'READY' | 'PAID' | 'CANCELLED' | 'FAILED' | 'PARTIAL_CANCELLED';
  amount: {
    total: number;
    paid: number;
    cancelled: number;
  };
  customData?: string;
  paidAt?: string;
  cancelledAt?: string;
  failedAt?: string;
  cancellations?: Array<{
    id: string;
    totalAmount: number;
    reason: string;
    cancelledAt: string;
  }>;
}

/**
 * 예약 상태 타입
 */
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/**
 * 웹훅 응답 타입
 */
interface WebhookResponse {
  success: boolean;
  message: string;
  data?: {
    paymentId: string;
    reservationId?: string;
    status?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================
// 웹훅 서명 검증
// ============================================================

/**
 * PortOne 웹훅 서명을 검증합니다.
 * HMAC SHA256을 사용하여 요청의 무결성을 확인합니다.
 *
 * @param payload 원본 요청 본문 (문자열)
 * @param signature PortOne-Signature 헤더 값
 * @returns 서명이 유효한지 여부
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!PORTONE_WEBHOOK_SECRET) {
    console.error('[Webhook] PORTONE_WEBHOOK_SECRET 환경변수가 설정되지 않았습니다');
    return false;
  }

  try {
    // PortOne 서명 형식: timestamp.signature
    // 또는 단순 HMAC SHA256 해시
    const parts = signature.split('.');

    let providedSignature: string;
    let timestamp: string | undefined;

    if (parts.length === 2) {
      // timestamp.signature 형식
      [timestamp, providedSignature] = parts;

      // 타임스탬프 검증 (5분 이내)
      const requestTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(currentTime - requestTime);

      if (timeDiff > 300) {
        console.error('[Webhook] 서명 타임스탬프가 만료되었습니다', {
          requestTime,
          currentTime,
          diff: timeDiff,
        });
        return false;
      }

      // timestamp + payload로 서명 생성
      const signaturePayload = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', PORTONE_WEBHOOK_SECRET)
        .update(signaturePayload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      );
    } else {
      // 단순 해시 형식
      providedSignature = signature;
      const expectedSignature = crypto
        .createHmac('sha256', PORTONE_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      );
    }
  } catch (error) {
    console.error('[Webhook] 서명 검증 중 오류:', error);
    return false;
  }
}

// ============================================================
// PortOne API 호출
// ============================================================

/**
 * PortOne API에서 결제 정보를 조회합니다.
 *
 * @param paymentId 결제 ID
 * @returns 결제 정보 또는 null
 */
async function fetchPaymentFromPortOne(
  paymentId: string
): Promise<PortOnePaymentResponse | null> {
  if (!PORTONE_API_SECRET) {
    console.error('[Webhook] PORTONE_API_SECRET 환경변수가 설정되지 않았습니다');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Webhook] PortOne API 오류:', {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Webhook] PortOne API 호출 실패:', error);
    return null;
  }
}

// ============================================================
// 예약 상태 업데이트
// ============================================================

/**
 * 예약 상태를 업데이트합니다.
 *
 * @param reservationId 예약 ID
 * @param status 새로운 상태
 * @param paymentData 결제 관련 추가 데이터
 * @returns 성공 여부
 */
async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
  paymentData?: {
    paymentId?: string;
    paidAmount?: number;
    paidAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
  }
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[Webhook] Supabase 환경변수가 설정되지 않았습니다');
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // 결제 완료 시 추가 데이터
    if (paymentData?.paymentId) {
      updateData.payment_id = paymentData.paymentId;
    }
    if (paymentData?.paidAmount !== undefined) {
      updateData.paid_amount = paymentData.paidAmount;
    }
    if (paymentData?.paidAt) {
      updateData.paid_at = paymentData.paidAt;
    }

    // 취소 시 추가 데이터
    if (paymentData?.cancelledAt) {
      updateData.cancelled_at = paymentData.cancelledAt;
    }
    if (paymentData?.cancellationReason) {
      updateData.cancellation_reason = paymentData.cancellationReason;
    }

    const { error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId);

    if (error) {
      console.error('[Webhook] 예약 상태 업데이트 실패:', error);
      return false;
    }

    console.log('[Webhook] 예약 상태 업데이트 성공:', {
      reservationId,
      status,
    });
    return true;
  } catch (error) {
    console.error('[Webhook] 예약 상태 업데이트 중 오류:', error);
    return false;
  }
}

/**
 * 알림 발송에 필요한 예약 상세 정보
 */
interface ReservationDetails {
  id: string;
  user_id: string;
  shop_name: string;
  reservation_date?: string;
  reservation_time?: string;
}

/**
 * 결제 ID로 예약 ID를 찾습니다.
 * customData에 reservationId가 포함되어 있거나, 별도 매핑 테이블을 조회합니다.
 *
 * @param paymentId 결제 ID
 * @param customData 결제 시 전달된 커스텀 데이터
 * @returns 예약 ID 또는 null
 */
async function findReservationByPayment(
  paymentId: string,
  customData?: string
): Promise<string | null> {
  // 1. customData에서 reservationId 추출 시도
  if (customData) {
    try {
      const data = JSON.parse(customData);
      if (data.reservationId) {
        return data.reservationId;
      }
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }

  // 2. 데이터베이스에서 payment_id로 예약 조회
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('payment_id', paymentId)
      .single();

    if (error || !data) {
      console.warn('[Webhook] 결제 ID로 예약을 찾을 수 없음:', paymentId);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('[Webhook] 예약 조회 중 오류:', error);
    return null;
  }
}

/**
 * 예약 ID로 알림 발송에 필요한 상세 정보를 조회합니다.
 *
 * @param reservationId 예약 ID
 * @returns 예약 상세 정보 또는 null
 */
async function getReservationDetails(
  reservationId: string
): Promise<ReservationDetails | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        user_id,
        reservation_date,
        reservation_time,
        shops:shop_id (name)
      `)
      .eq('id', reservationId)
      .single();

    if (error || !data) {
      console.warn('[Webhook] 예약 상세 정보 조회 실패:', reservationId);
      return null;
    }

    // Supabase 관계 쿼리는 배열 또는 단일 객체를 반환할 수 있음
    const shops = data.shops as { name: string } | { name: string }[] | null;
    const shopName = Array.isArray(shops)
      ? shops[0]?.name
      : shops?.name;

    return {
      id: data.id,
      user_id: data.user_id,
      shop_name: shopName || '알 수 없는 매장',
      reservation_date: data.reservation_date,
      reservation_time: data.reservation_time,
    };
  } catch (error) {
    console.error('[Webhook] 예약 상세 조회 중 오류:', error);
    return null;
  }
}

// ============================================================
// 이벤트 핸들러
// ============================================================

/**
 * Transaction.Paid 이벤트 처리
 * 결제 완료 시 예약 상태를 confirmed로 변경하고 알림 발송
 */
async function handleTransactionPaid(
  paymentId: string,
  payment: PortOnePaymentResponse
): Promise<{ success: boolean; reservationId?: string }> {
  console.log('[Webhook] Transaction.Paid 처리:', paymentId);

  const reservationId = await findReservationByPayment(
    paymentId,
    payment.customData
  );

  if (!reservationId) {
    console.warn('[Webhook] 연결된 예약을 찾을 수 없음:', paymentId);
    // 결제는 성공했으나 예약 매핑이 없는 경우
    // 결제 정보를 별도 로그로 기록
    return { success: true };
  }

  const updated = await updateReservationStatus(reservationId, 'confirmed', {
    paymentId,
    paidAmount: payment.amount.paid,
    paidAt: payment.paidAt,
  });

  // 결제 완료 알림 발송 (실패해도 웹훅 처리는 성공으로 처리)
  try {
    const reservationDetails = await getReservationDetails(reservationId);
    if (reservationDetails) {
      await sendPaymentCompletedNotification(
        reservationDetails.user_id,
        paymentId,
        payment.amount.paid,
        reservationDetails.shop_name
      );
      console.log('[Webhook] 결제 완료 알림 발송 성공:', {
        reservationId,
        userId: reservationDetails.user_id,
      });
    }
  } catch (notifError) {
    console.error('[Webhook] 결제 완료 알림 발송 실패 (무시):', notifError);
  }

  return { success: updated, reservationId };
}

/**
 * Transaction.Cancelled 이벤트 처리
 * 결제 취소/환불 시 예약 상태를 cancelled로 변경하고 알림 발송
 */
async function handleTransactionCancelled(
  paymentId: string,
  payment: PortOnePaymentResponse
): Promise<{ success: boolean; reservationId?: string }> {
  console.log('[Webhook] Transaction.Cancelled 처리:', paymentId);

  const reservationId = await findReservationByPayment(
    paymentId,
    payment.customData
  );

  if (!reservationId) {
    console.warn('[Webhook] 연결된 예약을 찾을 수 없음:', paymentId);
    return { success: true };
  }

  // 가장 최근 취소 정보 가져오기
  const latestCancellation = payment.cancellations?.[0];
  const cancellationReason = latestCancellation?.reason || '결제 취소';

  const updated = await updateReservationStatus(reservationId, 'cancelled', {
    paymentId,
    cancelledAt: payment.cancelledAt || latestCancellation?.cancelledAt,
    cancellationReason,
  });

  // 취소 알림 발송 (실패해도 웹훅 처리는 성공으로 처리)
  try {
    const reservationDetails = await getReservationDetails(reservationId);
    if (reservationDetails) {
      await sendReservationCancelledNotification(
        reservationDetails.user_id,
        reservationId,
        reservationDetails.shop_name,
        cancellationReason
      );
      console.log('[Webhook] 취소 알림 발송 성공:', {
        reservationId,
        userId: reservationDetails.user_id,
      });
    }
  } catch (notifError) {
    console.error('[Webhook] 취소 알림 발송 실패 (무시):', notifError);
  }

  return { success: updated, reservationId };
}

/**
 * Transaction.Failed 이벤트 처리
 * 결제 실패 시 예약 상태를 cancelled로 변경
 */
async function handleTransactionFailed(
  paymentId: string,
  payment: PortOnePaymentResponse
): Promise<{ success: boolean; reservationId?: string }> {
  console.log('[Webhook] Transaction.Failed 처리:', paymentId);

  const reservationId = await findReservationByPayment(
    paymentId,
    payment.customData
  );

  if (!reservationId) {
    console.warn('[Webhook] 연결된 예약을 찾을 수 없음:', paymentId);
    return { success: true };
  }

  const updated = await updateReservationStatus(reservationId, 'cancelled', {
    paymentId,
    cancellationReason: '결제 실패',
  });

  return { success: updated, reservationId };
}

// ============================================================
// API 핸들러
// ============================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<WebhookResponse>> {
  const startTime = Date.now();

  try {
    // 1. 환경변수 검증
    if (!PORTONE_WEBHOOK_SECRET) {
      console.error('[Webhook] PORTONE_WEBHOOK_SECRET이 설정되지 않았습니다');
      return NextResponse.json(
        {
          success: false,
          message: '서버 설정 오류',
          error: {
            code: 'CONFIG_ERROR',
            message: 'Webhook secret이 설정되지 않았습니다',
          },
        },
        { status: 500 }
      );
    }

    // 2. 웹훅 서명 검증
    const signature = request.headers.get('PortOne-Signature');
    const rawBody = await request.text();

    if (!signature) {
      console.warn('[Webhook] 서명 헤더가 없음');
      return NextResponse.json(
        {
          success: false,
          message: '서명이 없습니다',
          error: {
            code: 'MISSING_SIGNATURE',
            message: 'PortOne-Signature 헤더가 필요합니다',
          },
        },
        { status: 401 }
      );
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[Webhook] 서명 검증 실패');
      return NextResponse.json(
        {
          success: false,
          message: '서명 검증 실패',
          error: {
            code: 'INVALID_SIGNATURE',
            message: '웹훅 서명이 유효하지 않습니다',
          },
        },
        { status: 401 }
      );
    }

    // 3. 요청 본문 파싱
    let payload: PortOneWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[Webhook] 요청 본문 파싱 실패');
      return NextResponse.json(
        {
          success: false,
          message: '잘못된 요청 형식',
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'JSON 파싱에 실패했습니다',
          },
        },
        { status: 400 }
      );
    }

    const { type, data } = payload;
    const { paymentId } = data;

    console.log('[Webhook] 이벤트 수신:', {
      type,
      paymentId,
      timestamp: payload.timestamp,
    });

    // 4. 결제 정보 조회 (이중 검증)
    const payment = await fetchPaymentFromPortOne(paymentId);

    if (!payment) {
      console.error('[Webhook] 결제 정보 조회 실패:', paymentId);
      return NextResponse.json(
        {
          success: false,
          message: '결제 정보를 조회할 수 없습니다',
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: `결제 ID ${paymentId}를 찾을 수 없습니다`,
          },
        },
        { status: 400 }
      );
    }

    // 5. 이벤트 타입별 처리
    let result: { success: boolean; reservationId?: string };

    switch (type) {
      case 'Transaction.Paid':
        // 결제 상태 검증
        if (payment.status !== 'PAID') {
          console.warn('[Webhook] 결제 상태 불일치:', {
            expected: 'PAID',
            actual: payment.status,
          });
          return NextResponse.json({
            success: true,
            message: '결제 상태가 PAID가 아닙니다. 무시합니다.',
            data: { paymentId, status: payment.status },
          });
        }
        result = await handleTransactionPaid(paymentId, payment);
        break;

      case 'Transaction.Cancelled':
      case 'Transaction.PartialCancelled':
        if (payment.status !== 'CANCELLED' && payment.status !== 'PARTIAL_CANCELLED') {
          console.warn('[Webhook] 결제 상태 불일치:', {
            expected: 'CANCELLED',
            actual: payment.status,
          });
          return NextResponse.json({
            success: true,
            message: '결제 상태가 CANCELLED가 아닙니다. 무시합니다.',
            data: { paymentId, status: payment.status },
          });
        }
        result = await handleTransactionCancelled(paymentId, payment);
        break;

      case 'Transaction.Failed':
        if (payment.status !== 'FAILED') {
          console.warn('[Webhook] 결제 상태 불일치:', {
            expected: 'FAILED',
            actual: payment.status,
          });
          return NextResponse.json({
            success: true,
            message: '결제 상태가 FAILED가 아닙니다. 무시합니다.',
            data: { paymentId, status: payment.status },
          });
        }
        result = await handleTransactionFailed(paymentId, payment);
        break;

      case 'Transaction.Ready':
        // 결제 대기 상태는 처리하지 않음
        console.log('[Webhook] Transaction.Ready 이벤트 무시:', paymentId);
        return NextResponse.json({
          success: true,
          message: 'Transaction.Ready 이벤트는 처리하지 않습니다',
          data: { paymentId },
        });

      default:
        console.warn('[Webhook] 알 수 없는 이벤트 타입:', type);
        return NextResponse.json({
          success: true,
          message: `알 수 없는 이벤트 타입: ${type}`,
          data: { paymentId },
        });
    }

    // 6. 처리 결과 반환
    const elapsed = Date.now() - startTime;
    console.log('[Webhook] 처리 완료:', {
      type,
      paymentId,
      reservationId: result.reservationId,
      success: result.success,
      elapsed: `${elapsed}ms`,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: '예약 상태 업데이트 실패',
          error: {
            code: 'UPDATE_FAILED',
            message: '데이터베이스 업데이트에 실패했습니다',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '웹훅 처리 완료',
      data: {
        paymentId,
        reservationId: result.reservationId,
        status: payment.status,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';

    console.error('[Webhook] 처리 중 오류:', error);

    return NextResponse.json(
      {
        success: false,
        message: '웹훅 처리 중 오류가 발생했습니다',
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
// GET - 헬스체크 (선택사항)
// ============================================================

export async function GET(): Promise<NextResponse> {
  const configStatus = {
    PORTONE_WEBHOOK_SECRET: !!PORTONE_WEBHOOK_SECRET,
    PORTONE_API_SECRET: !!PORTONE_API_SECRET,
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!SUPABASE_SERVICE_KEY,
  };

  const isConfigured = Object.values(configStatus).every(Boolean);

  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    message: isConfigured
      ? 'PortOne 웹훅 엔드포인트가 설정되어 있습니다'
      : '환경변수 설정이 필요합니다',
    supportedEvents: [
      'Transaction.Paid',
      'Transaction.Cancelled',
      'Transaction.Failed',
      'Transaction.PartialCancelled',
    ],
    config: configStatus,
  });
}
