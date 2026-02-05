/**
 * Twilio 클라이언트 초기화
 *
 * @description
 * Twilio Verify API를 초기화하고 OTP 인증을 위한 클라이언트를 제공합니다.
 * Lazy initialization으로 빌드 타임 에러 방지
 */

import twilio from 'twilio';

// Lazy initialization을 위한 변수
let twilioClientInstance: ReturnType<typeof twilio> | null = null;
let verifyServiceSidValue: string | null = null;

// 환경변수 검증 및 클라이언트 초기화 (런타임에만 실행)
function initializeTwilioClient() {
  if (twilioClientInstance) {
    return twilioClientInstance;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  verifyServiceSidValue = process.env.TWILIO_VERIFY_SERVICE_SID || null;

  if (!accountSid) {
    throw new Error('TWILIO_ACCOUNT_SID 환경변수가 설정되지 않았습니다.');
  }

  if (!authToken) {
    throw new Error('TWILIO_AUTH_TOKEN 환경변수가 설정되지 않았습니다.');
  }

  if (!verifyServiceSidValue) {
    throw new Error('TWILIO_VERIFY_SERVICE_SID 환경변수가 설정되지 않았습니다.');
  }

  twilioClientInstance = twilio(accountSid, authToken);
  return twilioClientInstance;
}

// Twilio 클라이언트 인스턴스 (getter)
export const getTwilioClient = () => {
  return initializeTwilioClient();
};

// Twilio Verify Service
export const getVerifyService = () => {
  const client = getTwilioClient();
  const sid = verifyServiceSidValue;
  
  if (!sid) {
    throw new Error('TWILIO_VERIFY_SERVICE_SID 환경변수가 설정되지 않았습니다.');
  }
  
  return client.verify.v2.services(sid);
};

// verifyServiceSid getter (호환성 유지)
export const verifyServiceSid = () => {
  if (!verifyServiceSidValue) {
    verifyServiceSidValue = process.env.TWILIO_VERIFY_SERVICE_SID || null;
  }
  return verifyServiceSidValue;
};
