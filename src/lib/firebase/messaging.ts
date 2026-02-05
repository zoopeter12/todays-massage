/**
 * FCM 메시지 발송 유틸리티
 * 서버사이드에서 푸시 알림을 발송하기 위한 헬퍼 함수들
 */
import { getMessaging } from './admin';
import type { FCMNotificationPayload, FCMSendResult, NotificationType } from '@/types/fcm';

// 알림 유형별 기본 설정
const NOTIFICATION_DEFAULTS: Record<NotificationType, { title: string; icon: string }> = {
  reservation_confirmed: {
    title: '예약 확정',
    icon: '/images/icons/icon-192x192.png',
  },
  reservation_cancelled: {
    title: '예약 취소',
    icon: '/images/icons/icon-192x192.png',
  },
  reservation_reminder: {
    title: '예약 알림',
    icon: '/images/icons/icon-192x192.png',
  },
  new_reservation: {
    title: '새 예약',
    icon: '/images/icons/icon-192x192.png',
  },
  payment_completed: {
    title: '결제 완료',
    icon: '/images/icons/icon-192x192.png',
  },
  review_request: {
    title: '리뷰 요청',
    icon: '/images/icons/icon-192x192.png',
  },
  promotion: {
    title: '프로모션',
    icon: '/images/icons/icon-192x192.png',
  },
};

/**
 * 단일 기기에 푸시 알림 발송
 */
export async function sendPushNotification(
  token: string,
  payload: FCMNotificationPayload
): Promise<FCMSendResult> {
  try {
    const messaging = getMessaging();
    const defaults = NOTIFICATION_DEFAULTS[payload.type];

    const message = {
      token,
      notification: {
        title: payload.title || defaults.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      webpush: {
        notification: {
          icon: payload.icon || defaults.icon,
          badge: '/images/icons/badge-72x72.png',
          tag: payload.tag || payload.type,
          requireInteraction: payload.requireInteraction ?? false,
          actions: payload.actions,
        },
        fcmOptions: {
          link: payload.clickAction || '/',
        },
      },
      data: {
        type: payload.type,
        ...payload.data,
      },
    };

    const response = await messaging.send(message);

    return {
      success: true,
      messageId: response,
    };
  } catch (error: any) {
    console.error('푸시 알림 발송 실패:', error);

    // 토큰이 유효하지 않은 경우 식별
    const isInvalidToken =
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered';

    return {
      success: false,
      error: error.message,
      shouldRemoveToken: isInvalidToken,
    };
  }
}

/**
 * 여러 기기에 푸시 알림 일괄 발송
 */
export async function sendPushNotificationBatch(
  tokens: string[],
  payload: FCMNotificationPayload
): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const messaging = getMessaging();
  const defaults = NOTIFICATION_DEFAULTS[payload.type];

  const message = {
    notification: {
      title: payload.title || defaults.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
    },
    webpush: {
      notification: {
        icon: payload.icon || defaults.icon,
        badge: '/images/icons/badge-72x72.png',
        tag: payload.tag || payload.type,
        requireInteraction: payload.requireInteraction ?? false,
        actions: payload.actions,
      },
      fcmOptions: {
        link: payload.clickAction || '/',
      },
    },
    data: {
      type: payload.type,
      ...payload.data,
    },
    tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);

    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = resp.error.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error: any) {
    console.error('일괄 푸시 알림 발송 실패:', error);
    return {
      successCount: 0,
      failureCount: tokens.length,
      invalidTokens: [],
    };
  }
}

/**
 * 특정 주제(topic)에 푸시 알림 발송
 */
export async function sendPushToTopic(
  topic: string,
  payload: FCMNotificationPayload
): Promise<FCMSendResult> {
  try {
    const messaging = getMessaging();
    const defaults = NOTIFICATION_DEFAULTS[payload.type];

    const message = {
      topic,
      notification: {
        title: payload.title || defaults.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      webpush: {
        notification: {
          icon: payload.icon || defaults.icon,
          badge: '/images/icons/badge-72x72.png',
          tag: payload.tag || payload.type,
        },
        fcmOptions: {
          link: payload.clickAction || '/',
        },
      },
      data: {
        type: payload.type,
        ...payload.data,
      },
    };

    const response = await messaging.send(message);

    return {
      success: true,
      messageId: response,
    };
  } catch (error: any) {
    console.error('주제 푸시 알림 발송 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
