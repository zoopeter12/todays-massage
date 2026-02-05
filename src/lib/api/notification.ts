/**
 * 알림 발송 헬퍼 함수
 * 예약 상태 변경 등에서 사용하는 푸시 알림 발송 유틸리티
 */
import type { FCMNotificationPayload, NotificationType } from '@/types/fcm';

// FCM API 엔드포인트
const FCM_API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const FCM_API_SECRET = process.env.FCM_API_SECRET_KEY;

interface SendNotificationOptions {
  userId?: string;
  userIds?: string[];
  topic?: string;
  notification: FCMNotificationPayload;
}

/**
 * 푸시 알림 발송 (서버사이드 전용)
 */
export async function sendNotification(options: SendNotificationOptions): Promise<boolean> {
  if (!FCM_API_SECRET) {
    console.error('FCM_API_SECRET_KEY가 설정되지 않았습니다.');
    return false;
  }

  try {
    const response = await fetch(`${FCM_API_URL}/api/fcm/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': FCM_API_SECRET,
      },
      body: JSON.stringify({
        user_id: options.userId,
        user_ids: options.userIds,
        topic: options.topic,
        notification: options.notification,
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('알림 발송 실패:', error);
    return false;
  }
}

// ============================================
// 예약 관련 알림 헬퍼 함수
// ============================================

/**
 * 예약 확정 알림 발송 (고객용)
 */
export async function sendReservationConfirmedNotification(
  userId: string,
  reservationId: string,
  shopName: string,
  reservationDate: string,
  reservationTime: string
): Promise<boolean> {
  return sendNotification({
    userId,
    notification: {
      type: 'reservation_confirmed',
      title: '예약이 확정되었습니다',
      body: `${shopName}에서 ${reservationDate} ${reservationTime} 예약이 확정되었습니다.`,
      clickAction: `/reservations/${reservationId}`,
      data: {
        reservation_id: reservationId,
        shop_name: shopName,
      },
    },
  });
}

/**
 * 예약 취소 알림 발송 (고객용)
 */
export async function sendReservationCancelledNotification(
  userId: string,
  reservationId: string,
  shopName: string,
  reason?: string
): Promise<boolean> {
  return sendNotification({
    userId,
    notification: {
      type: 'reservation_cancelled',
      title: '예약이 취소되었습니다',
      body: reason
        ? `${shopName} 예약이 취소되었습니다. 사유: ${reason}`
        : `${shopName} 예약이 취소되었습니다.`,
      clickAction: `/reservations/${reservationId}`,
      data: {
        reservation_id: reservationId,
        shop_name: shopName,
      },
    },
  });
}

/**
 * 새 예약 알림 발송 (파트너용)
 */
export async function sendNewReservationNotification(
  partnerId: string,
  reservationId: string,
  customerName: string,
  serviceName: string,
  reservationDate: string,
  reservationTime: string
): Promise<boolean> {
  return sendNotification({
    userId: partnerId,
    notification: {
      type: 'new_reservation',
      title: '새 예약이 접수되었습니다',
      body: `${customerName}님이 ${serviceName} (${reservationDate} ${reservationTime}) 예약을 요청했습니다.`,
      clickAction: `/partner/reservations/${reservationId}`,
      requireInteraction: true,
      data: {
        reservation_id: reservationId,
        customer_name: customerName,
        service_name: serviceName,
      },
    },
  });
}

/**
 * 예약 리마인더 알림 발송 (고객용)
 */
export async function sendReservationReminderNotification(
  userId: string,
  reservationId: string,
  shopName: string,
  reservationTime: string
): Promise<boolean> {
  return sendNotification({
    userId,
    notification: {
      type: 'reservation_reminder',
      title: '예약 알림',
      body: `${shopName} 예약이 ${reservationTime}에 있습니다. 잊지 마세요!`,
      clickAction: `/reservations/${reservationId}`,
      data: {
        reservation_id: reservationId,
        shop_name: shopName,
      },
    },
  });
}

/**
 * 결제 완료 알림 발송
 */
export async function sendPaymentCompletedNotification(
  userId: string,
  paymentId: string,
  amount: number,
  shopName: string
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('ko-KR').format(amount);

  return sendNotification({
    userId,
    notification: {
      type: 'payment_completed',
      title: '결제가 완료되었습니다',
      body: `${shopName}에서 ${formattedAmount}원 결제가 완료되었습니다.`,
      clickAction: `/payments/${paymentId}`,
      data: {
        payment_id: paymentId,
        amount: String(amount),
        shop_name: shopName,
      },
    },
  });
}

/**
 * 리뷰 요청 알림 발송
 */
export async function sendReviewRequestNotification(
  userId: string,
  shopId: string,
  shopName: string
): Promise<boolean> {
  return sendNotification({
    userId,
    notification: {
      type: 'review_request',
      title: '이용은 만족스러우셨나요?',
      body: `${shopName} 이용 경험을 공유해주세요. 리뷰를 작성하면 포인트를 드립니다!`,
      clickAction: `/shops/${shopId}/review`,
      data: {
        shop_id: shopId,
        shop_name: shopName,
      },
    },
  });
}

/**
 * 프로모션 알림 발송 (다수 사용자)
 */
export async function sendPromotionNotification(
  userIds: string[],
  title: string,
  body: string,
  promotionUrl: string
): Promise<boolean> {
  return sendNotification({
    userIds,
    notification: {
      type: 'promotion',
      title,
      body,
      clickAction: promotionUrl,
      data: {
        promotion_url: promotionUrl,
      },
    },
  });
}
