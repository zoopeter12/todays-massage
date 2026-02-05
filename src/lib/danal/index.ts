/**
 * 다날 PASS 본인인증 모듈
 *
 * @description
 * 다날 PASS 본인인증 API 클라이언트 및 유틸리티를 제공합니다.
 *
 * @example
 * ```typescript
 * import { requestVerification, verifyIdentity } from '@/lib/danal';
 *
 * // 인증 요청
 * const { verificationUrl, transactionId } = await requestVerification({
 *   phoneNumber: '01012345678'
 * });
 *
 * // 인증 결과 검증 (콜백에서)
 * const result = await verifyIdentity(transactionId, encryptedData);
 * ```
 */

export {
  // 타입
  type VerificationRequest,
  type VerificationResult,
  type VerificationRequestResponse,
  type DanalConfig,
  // 함수
  requestVerification,
  verifyIdentity,
  generateTransactionId,
  isValidKoreanPhone,
  loadDanalConfig,
  // 클래스
  DanalPassClient,
  getDanalClient,
  resetDanalClient,
} from './client';
