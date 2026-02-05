/**
 * Twilio 클라이언트 초기화
 *
 * @description
 * Twilio Verify API를 초기화하고 OTP 인증을 위한 클라이언트를 제공합니다.
 */

import twilio from 'twilio';

// 환경변수 검증
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid) {
  throw new Error('TWILIO_ACCOUNT_SID 환경변수가 설정되지 않았습니다.');
}

if (!authToken) {
  throw new Error('TWILIO_AUTH_TOKEN 환경변수가 설정되지 않았습니다.');
}

if (!verifyServiceSid) {
  throw new Error('TWILIO_VERIFY_SERVICE_SID 환경변수가 설정되지 않았습니다.');
}

// Twilio 클라이언트 인스턴스
export const twilioClient = twilio(accountSid, authToken);

// Twilio Verify Service
export const getVerifyService = () => {
  return twilioClient.verify.v2.services(verifyServiceSid);
};

export { verifyServiceSid };
