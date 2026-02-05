/**
 * 카카오 알림톡 서비스 레이어
 * @description 예약 관련 비즈니스 로직과 알림톡 발송 통합
 */

import {
  getAlimtalkClient,
  logger,
  type BookingConfirmationData,
  type BookingCancellationData,
  type BookingReminderData,
  type PartnerNotificationData,
} from './index';

// ============================================================
// 예약 알림 서비스
// ============================================================

/**
 * 예약 확정 알림 전체 플로우
 * - 고객에게 예약 확정 알림 발송
 * - 파트너에게 신규 예약 알림 발송
 */
export async function sendBookingConfirmationNotifications(params: {
  customer: BookingConfirmationData;
  partner?: {
    partnerName: string;
    partnerPhone: string;
  };
}): Promise<{
  customerResult: { success: boolean; messageId?: string };
  partnerResult?: { success: boolean; messageId?: string };
}> {
  const client = getAlimtalkClient();
  const results: {
    customerResult: { success: boolean; messageId?: string };
    partnerResult?: { success: boolean; messageId?: string };
  } = {
    customerResult: { success: false },
  };

  // 1. 고객 알림 발송
  try {
    const customerResponse = await client.sendBookingConfirmation(params.customer);
    results.customerResult = {
      success: customerResponse.code === '0000',
      messageId: customerResponse.data?.message_id,
    };
  } catch (error) {
    logger.logError(error as Error, {
      context: 'sendBookingConfirmationNotifications',
      target: 'customer',
      bookingId: params.customer.bookingId,
    });
  }

  // 2. 파트너 알림 발송 (옵션)
  if (params.partner) {
    try {
      const partnerData: PartnerNotificationData = {
        partnerName: params.partner.partnerName,
        partnerPhone: params.partner.partnerPhone,
        customerName: params.customer.customerName,
        serviceName: params.customer.serviceName,
        bookingDate: params.customer.bookingDate,
        bookingTime: params.customer.bookingTime,
        bookingId: params.customer.bookingId,
        notificationType: 'new_booking',
      };

      const partnerResponse = await client.sendPartnerNotification(partnerData);
      results.partnerResult = {
        success: partnerResponse.code === '0000',
        messageId: partnerResponse.data?.message_id,
      };
    } catch (error) {
      logger.logError(error as Error, {
        context: 'sendBookingConfirmationNotifications',
        target: 'partner',
        bookingId: params.customer.bookingId,
      });
      results.partnerResult = { success: false };
    }
  }

  return results;
}

/**
 * 예약 취소 알림 전체 플로우
 * - 고객에게 예약 취소 알림 발송
 * - 파트너에게 취소 알림 발송
 */
export async function sendBookingCancellationNotifications(params: {
  customer: BookingCancellationData;
  partner?: {
    partnerName: string;
    partnerPhone: string;
  };
}): Promise<{
  customerResult: { success: boolean; messageId?: string };
  partnerResult?: { success: boolean; messageId?: string };
}> {
  const client = getAlimtalkClient();
  const results: {
    customerResult: { success: boolean; messageId?: string };
    partnerResult?: { success: boolean; messageId?: string };
  } = {
    customerResult: { success: false },
  };

  // 1. 고객 알림 발송
  try {
    const customerResponse = await client.sendBookingCancellation(params.customer);
    results.customerResult = {
      success: customerResponse.code === '0000',
      messageId: customerResponse.data?.message_id,
    };
  } catch (error) {
    logger.logError(error as Error, {
      context: 'sendBookingCancellationNotifications',
      target: 'customer',
      bookingId: params.customer.bookingId,
    });
  }

  // 2. 파트너 알림 발송 (옵션)
  if (params.partner) {
    try {
      const partnerData: PartnerNotificationData = {
        partnerName: params.partner.partnerName,
        partnerPhone: params.partner.partnerPhone,
        customerName: params.customer.customerName,
        serviceName: params.customer.serviceName,
        bookingDate: params.customer.bookingDate,
        bookingTime: params.customer.bookingTime,
        bookingId: params.customer.bookingId,
        notificationType: 'cancellation',
      };

      const partnerResponse = await client.sendPartnerNotification(partnerData);
      results.partnerResult = {
        success: partnerResponse.code === '0000',
        messageId: partnerResponse.data?.message_id,
      };
    } catch (error) {
      logger.logError(error as Error, {
        context: 'sendBookingCancellationNotifications',
        target: 'partner',
        bookingId: params.customer.bookingId,
      });
      results.partnerResult = { success: false };
    }
  }

  return results;
}

/**
 * 예약 리마인더 발송
 * - 예약 전날 고객에게 리마인더 발송
 */
export async function sendBookingReminder(
  data: BookingReminderData
): Promise<{ success: boolean; messageId?: string }> {
  const client = getAlimtalkClient();

  try {
    const response = await client.sendBookingReminder(data);
    return {
      success: response.code === '0000',
      messageId: response.data?.message_id,
    };
  } catch (error) {
    logger.logError(error as Error, {
      context: 'sendBookingReminder',
      bookingId: data.bookingId,
    });
    return { success: false };
  }
}

// ============================================================
// 배치 발송 서비스 (리마인더용)
// ============================================================

/**
 * 내일 예약 리마인더 일괄 발송
 * @param bookings 내일 예약 목록
 */
export async function sendTomorrowReminders(
  bookings: BookingReminderData[]
): Promise<{
  total: number;
  success: number;
  failed: number;
  results: Array<{
    bookingId: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}> {
  const results: Array<{
    bookingId: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }> = [];

  let successCount = 0;
  let failedCount = 0;

  // 순차 발송 (rate limit 고려)
  for (const booking of bookings) {
    try {
      const result = await sendBookingReminder(booking);
      results.push({
        bookingId: booking.bookingId,
        success: result.success,
        messageId: result.messageId,
      });

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }

      // Rate limit 방지를 위한 딜레이 (100ms)
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      failedCount++;
      results.push({
        bookingId: booking.bookingId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 통계 로깅
  logger.logStats({
    totalSent: bookings.length,
    successCount,
    failureCount: failedCount,
    period: 'daily_reminder',
  });

  return {
    total: bookings.length,
    success: successCount,
    failed: failedCount,
    results,
  };
}
