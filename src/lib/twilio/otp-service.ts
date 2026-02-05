/**
 * Twilio OTP 서비스 (Verify API 사용)
 *
 * @description
 * Twilio Verify API를 사용하여 OTP 발송, 검증을 처리하는 서비스 레이어입니다.
 */

import { getVerifyService } from './client';

/**
 * OTP 설정 상수
 */
export const OTP_CONFIG = {
  RATE_LIMIT_SECONDS: 60, // SMS 발송 제한 시간 (초)
} as const;

/**
 * 한국 전화번호 검증
 *
 * @param phone - 전화번호 (010-xxxx-xxxx 또는 010xxxxxxxx)
 * @returns 유효한 한국 전화번호 여부
 */
export function isValidKoreanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  // 010으로 시작하고 총 11자리인 경우만 허용
  return /^010\d{8}$/.test(cleaned);
}

/**
 * 전화번호 포맷팅 (한국 번호 전용)
 *
 * @param phone - 전화번호 (010-xxxx-xxxx 또는 010xxxxxxxx)
 * @returns E.164 형식 전화번호 (+8210xxxxxxxx)
 */
export function formatPhoneNumber(phone: string): string {
  // 하이픈, 공백 제거
  const cleaned = phone.replace(/[\s-]/g, '');

  // 010으로 시작하는 한국 번호인 경우
  if (cleaned.startsWith('010')) {
    return `+82${cleaned.substring(1)}`; // 010 -> +8210
  }

  // 이미 +82로 시작하는 경우
  if (cleaned.startsWith('+82')) {
    return cleaned;
  }

  // 그 외의 경우 에러
  throw new Error('올바른 한국 전화번호가 아닙니다.');
}

/**
 * Twilio Verify API로 OTP 발송
 *
 * @param phone - 수신자 전화번호 (010-xxxx-xxxx)
 * @returns 발송 성공 여부
 */
export async function sendVerification(phone: string): Promise<{
  success: boolean;
  sid?: string;
  error?: string;
}> {
  try {
    // 전화번호 검증
    if (!isValidKoreanPhone(phone)) {
      return {
        success: false,
        error: '올바른 한국 전화번호 형식이 아닙니다. (010-xxxx-xxxx)',
      };
    }

    const formattedPhone = formatPhoneNumber(phone);
    const verifyService = getVerifyService();

    // Twilio Verify API로 OTP 발송
    const verification = await verifyService.verifications.create({
      to: formattedPhone,
      channel: 'sms',
      locale: 'ko', // 한국어 메시지
    });

    console.log(
      `[Twilio Verify] OTP 발송 성공 - SID: ${verification.sid}, To: ${formattedPhone}, Status: ${verification.status}`
    );

    return {
      success: true,
      sid: verification.sid,
    };
  } catch (error) {
    console.error('[Twilio Verify] OTP 발송 실패:', error);
    return {
      success: false,
      error: 'SMS 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

/**
 * Twilio Verify API로 OTP 검증
 *
 * @param phone - 전화번호 (010-xxxx-xxxx)
 * @param code - 입력된 OTP 코드
 * @returns 검증 결과
 */
export async function checkVerification(phone: string, code: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    // 전화번호 검증
    if (!isValidKoreanPhone(phone)) {
      return {
        success: false,
        error: '올바른 한국 전화번호 형식이 아닙니다. (010-xxxx-xxxx)',
      };
    }

    // 개발 환경에서 테스트용 고정 OTP 허용 (123456)
    if (process.env.NODE_ENV === 'development' && code === '123456') {
      console.log('[Twilio Verify] 개발 모드: 테스트 OTP 사용');
      return {
        success: true,
        status: 'approved',
      };
    }

    const formattedPhone = formatPhoneNumber(phone);
    const verifyService = getVerifyService();

    // Twilio Verify API로 OTP 검증
    const verificationCheck = await verifyService.verificationChecks.create({
      to: formattedPhone,
      code,
    });

    console.log(
      `[Twilio Verify] OTP 검증 - To: ${formattedPhone}, Status: ${verificationCheck.status}`
    );

    if (verificationCheck.status === 'approved') {
      return {
        success: true,
        status: verificationCheck.status,
      };
    } else {
      return {
        success: false,
        status: verificationCheck.status,
        error: '인증번호가 일치하지 않거나 만료되었습니다.',
      };
    }
  } catch (error: any) {
    console.error('[Twilio Verify] OTP 검증 실패:', error);

    // Twilio 에러 메시지 파싱
    let errorMessage = '인증에 실패했습니다. 다시 시도해주세요.';

    if (error.code === 20404) {
      errorMessage = '인증번호가 존재하지 않거나 만료되었습니다. 다시 요청해주세요.';
    } else if (error.code === 60202) {
      errorMessage = '최대 검증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.';
    } else if (error.code === 60203) {
      errorMessage = '인증번호가 일치하지 않습니다.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
