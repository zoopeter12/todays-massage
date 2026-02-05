/**
 * 다날 PASS 본인인증 클라이언트 테스트
 *
 * 개발/테스트 환경에서 자동 승인 기능 검증
 */

import {
  requestVerification,
  verifyIdentity,
  loadDanalConfig,
  generateTransactionId,
  isValidKoreanPhone,
} from '../client';

// Node 환경을 development로 설정
const originalNodeEnv = process.env.NODE_ENV;

beforeAll(() => {
  process.env.NODE_ENV = 'development';
});

afterAll(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe('다날 PASS 클라이언트 (개발 모드)', () => {
  describe('loadDanalConfig', () => {
    it('개발 환경에서 환경변수 없어도 Mock 설정 반환', () => {
      // 환경변수 삭제
      delete process.env.DANAL_CP_ID;
      delete process.env.DANAL_CP_PWD;
      delete process.env.DANAL_API_URL;
      delete process.env.DANAL_RETURN_URL;

      const config = loadDanalConfig();

      expect(config.cpId).toBe('MOCK_CP_ID');
      expect(config.cpPwd).toBe('MOCK_CP_PWD');
      expect(config.apiUrl).toBe('https://mock-danal-api.com');
      expect(config.returnUrl).toContain('localhost');
    });
  });

  describe('generateTransactionId', () => {
    it('고유한 트랜잭션 ID 생성', () => {
      const txId1 = generateTransactionId();
      const txId2 = generateTransactionId();

      expect(txId1).toMatch(/^TXN_\d+_[a-z0-9]+$/);
      expect(txId1).not.toBe(txId2);
    });
  });

  describe('isValidKoreanPhone', () => {
    it('유효한 전화번호 형식 검증', () => {
      expect(isValidKoreanPhone('01012345678')).toBe(true);
      expect(isValidKoreanPhone('010-1234-5678')).toBe(true);
    });

    it('유효하지 않은 전화번호 거부', () => {
      expect(isValidKoreanPhone('0212345678')).toBe(false); // 지역번호
      expect(isValidKoreanPhone('01012345')).toBe(false); // 너무 짧음
      expect(isValidKoreanPhone('abc')).toBe(false); // 문자
    });
  });

  describe('requestVerification (개발 모드)', () => {
    it('Mock URL과 트랜잭션 ID 반환', async () => {
      const result = await requestVerification({
        phoneNumber: '010-1234-5678',
      });

      expect(result.verificationUrl).toContain('/mock/danal-verification');
      expect(result.verificationUrl).toContain('txId=');
      expect(result.transactionId).toMatch(/^TXN_\d+_[a-z0-9]+$/);
    });

    it('유효하지 않은 전화번호 거부', async () => {
      await expect(
        requestVerification({
          phoneNumber: '0212345678', // 지역번호
        })
      ).rejects.toThrow('올바른 전화번호 형식이 아닙니다');
    });
  });

  describe('verifyIdentity (개발 모드 - 자동 승인)', () => {
    it('Mock CI/DI 반환', async () => {
      const txId = generateTransactionId();
      const encryptedData = 'mock_encrypted_data_12345';

      const result = await verifyIdentity(txId, encryptedData);

      expect(result.success).toBe(true);
      expect(result.ci).toContain('MOCK_CI_');
      expect(result.di).toContain('MOCK_DI_');
      expect(result.ci).toContain(txId);
      expect(result.di).toContain(txId);
      expect(result.realName).toBe('테스트사용자');
      expect(result.gender).toBe('male');
      expect(result.birthDate).toBe('1990-01-01');
    });

    it('유효하지 않은 트랜잭션 ID 거부', async () => {
      const result = await verifyIdentity('INVALID_ID', 'mock_data');

      expect(result.success).toBe(false);
      expect(result.error).toContain('유효하지 않은 트랜잭션 ID');
    });

    it('유효하지 않은 암호화 데이터 거부', async () => {
      const txId = generateTransactionId();
      const result = await verifyIdentity(txId, 'short');

      expect(result.success).toBe(false);
      expect(result.error).toContain('유효하지 않은 인증 데이터');
    });

    it('고유한 CI/DI 생성 (timestamp 포함)', async () => {
      const txId = generateTransactionId();
      const encryptedData = 'mock_encrypted_data_12345';

      const result1 = await verifyIdentity(txId, encryptedData);
      // 1ms 대기
      await new Promise((resolve) => setTimeout(resolve, 2));
      const result2 = await verifyIdentity(txId, encryptedData);

      expect(result1.ci).not.toBe(result2.ci);
      expect(result1.di).not.toBe(result2.di);
    });
  });

  describe('전체 플로우 테스트', () => {
    it('인증 요청 → 인증 검증 (개발 모드 자동 승인)', async () => {
      // Step 1: 인증 요청
      const verificationRequest = await requestVerification({
        phoneNumber: '010-1234-5678',
        name: '홍길동',
        birthday: '19900101',
      });

      expect(verificationRequest.transactionId).toBeDefined();
      expect(verificationRequest.verificationUrl).toContain('mock');

      // Step 2: 인증 검증 (자동 승인)
      const verificationResult = await verifyIdentity(
        verificationRequest.transactionId,
        'mock_encrypted_data_from_danal'
      );

      expect(verificationResult.success).toBe(true);
      expect(verificationResult.ci).toContain(verificationRequest.transactionId);
      expect(verificationResult.di).toContain(verificationRequest.transactionId);
      expect(verificationResult.realName).toBe('테스트사용자');
    });
  });
});
