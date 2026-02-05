/**
 * 카카오 알림톡 API 클라이언트
 * @description 카카오 비즈니스 알림톡 발송 클라이언트
 */

import type {
  KakaoAlimtalkConfig,
  AlimtalkSendRequest,
  AlimtalkSendResponse,
  AlimtalkClientOptions,
  BookingConfirmationData,
  BookingCancellationData,
  BookingReminderData,
  PartnerNotificationData,
  SendStatus,
} from './types';

import {
  TEMPLATE_CODES,
  createBookingConfirmationMessage,
  createBookingCancellationMessage,
  createBookingReminderMessage,
  createPartnerNotificationMessage,
} from './templates';

import { logger } from './logger';

// ============================================================
// 환경 설정
// ============================================================

/**
 * 환경변수에서 설정 로드
 */
export function loadKakaoConfig(): KakaoAlimtalkConfig {
  const baseUrl = process.env.KAKAO_ALIMTALK_BASE_URL;
  const senderKey = process.env.KAKAO_SENDER_KEY;
  const senderNo = process.env.KAKAO_SENDER_NO;
  const accessToken = process.env.KAKAO_ACCESS_TOKEN;
  const channelId = process.env.KAKAO_CHANNEL_ID;
  const fallbackEnabled = process.env.KAKAO_FALLBACK_ENABLED === 'true';

  if (!baseUrl || !senderKey || !accessToken || !channelId) {
    throw new Error(
      '카카오 알림톡 설정이 완료되지 않았습니다. ' +
      '환경변수를 확인해주세요: KAKAO_ALIMTALK_BASE_URL, KAKAO_SENDER_KEY, ' +
      'KAKAO_ACCESS_TOKEN, KAKAO_CHANNEL_ID'
    );
  }

  return {
    baseUrl,
    senderKey,
    senderNo: senderNo || '',
    accessToken,
    channelId,
    fallbackEnabled,
  };
}

// ============================================================
// API 클라이언트
// ============================================================

export class KakaoAlimtalkClient {
  private config: KakaoAlimtalkConfig;
  private timeout: number;
  private retryCount: number;
  private retryDelay: number;
  private baseUrl: string;

  constructor(options: AlimtalkClientOptions) {
    this.config = options.config;
    this.timeout = options.timeout || 10000;
    this.retryCount = options.retryCount || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://todaysmassage.com';
  }

  /**
   * HTTP 요청 실행 (재시도 로직 포함)
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt < this.retryCount) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * attempt)
        );
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * 알림톡 발송
   */
  async sendAlimtalk(
    request: AlimtalkSendRequest
  ): Promise<AlimtalkSendResponse> {
    const url = `${this.config.baseUrl}/v2/send/kakao`;

    const body: AlimtalkSendRequest = {
      ...request,
      sender_key: this.config.senderKey,
      sender_no: this.config.senderNo,
      fall_back_yn: this.config.fallbackEnabled,
    };

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: '*/*',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // 로깅
      logger.logSend({
        bookingId: request.cid || 'unknown',
        templateCode: request.template_code,
        phoneNumber: this.maskPhoneNumber(request.phone_number),
        status: response.ok ? 'success' : 'failed',
        messageId: data.data?.message_id,
        errorCode: data.code,
        errorMessage: data.message,
      });

      return data as AlimtalkSendResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.logSend({
        bookingId: request.cid || 'unknown',
        templateCode: request.template_code,
        phoneNumber: this.maskPhoneNumber(request.phone_number),
        status: 'failed',
        errorMessage,
      });

      throw new Error(`알림톡 발송 실패: ${errorMessage}`);
    }
  }

  /**
   * 예약 확정 알림 발송
   */
  async sendBookingConfirmation(
    data: BookingConfirmationData
  ): Promise<AlimtalkSendResponse> {
    const message = createBookingConfirmationMessage(data, this.baseUrl);

    return this.sendAlimtalk({
      message_type: 'AT',
      sender_key: this.config.senderKey,
      template_code: TEMPLATE_CODES.BOOKING_CONFIRMATION,
      phone_number: data.customerPhone,
      message,
      cid: data.bookingId,
    });
  }

  /**
   * 예약 취소 알림 발송
   */
  async sendBookingCancellation(
    data: BookingCancellationData
  ): Promise<AlimtalkSendResponse> {
    const message = createBookingCancellationMessage(data, this.baseUrl);

    return this.sendAlimtalk({
      message_type: 'AT',
      sender_key: this.config.senderKey,
      template_code: TEMPLATE_CODES.BOOKING_CANCELLATION,
      phone_number: data.customerPhone,
      message,
      cid: data.bookingId,
    });
  }

  /**
   * 예약 리마인더 발송
   */
  async sendBookingReminder(
    data: BookingReminderData
  ): Promise<AlimtalkSendResponse> {
    const message = createBookingReminderMessage(data, this.baseUrl);

    return this.sendAlimtalk({
      message_type: 'AT',
      sender_key: this.config.senderKey,
      template_code: TEMPLATE_CODES.BOOKING_REMINDER,
      phone_number: data.customerPhone,
      message,
      cid: data.bookingId,
    });
  }

  /**
   * 파트너 알림 발송
   */
  async sendPartnerNotification(
    data: PartnerNotificationData
  ): Promise<AlimtalkSendResponse> {
    const message = createPartnerNotificationMessage(data, this.baseUrl);
    const templateCode = data.notificationType === 'new_booking'
      ? TEMPLATE_CODES.PARTNER_NEW_BOOKING
      : TEMPLATE_CODES.PARTNER_CANCELLATION;

    return this.sendAlimtalk({
      message_type: 'AT',
      sender_key: this.config.senderKey,
      template_code: templateCode,
      phone_number: data.partnerPhone,
      message,
      cid: data.bookingId,
    });
  }

  /**
   * 전화번호 마스킹 (로깅용)
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length < 7) return '***';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }
}

// ============================================================
// 싱글톤 인스턴스
// ============================================================

let clientInstance: KakaoAlimtalkClient | null = null;

/**
 * 알림톡 클라이언트 인스턴스 가져오기
 */
export function getAlimtalkClient(): KakaoAlimtalkClient {
  if (!clientInstance) {
    const config = loadKakaoConfig();
    clientInstance = new KakaoAlimtalkClient({ config });
  }
  return clientInstance;
}

/**
 * 클라이언트 인스턴스 초기화 (테스트용)
 */
export function resetAlimtalkClient(): void {
  clientInstance = null;
}
