/**
 * Twilio OTP 인증 시스템
 *
 * @module lib/twilio
 */

export { twilioClient, getVerifyService, verifyServiceSid } from './client';
export {
  isValidKoreanPhone,
  formatPhoneNumber,
  sendVerification,
  checkVerification,
  OTP_CONFIG,
} from './otp-service';
