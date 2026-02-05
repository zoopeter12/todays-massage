/**
 * 다날 PASS 본인인증 클라이언트
 *
 * @description
 * 다날 PASS 본인인증 API를 통해 사용자 본인인증을 처리합니다.
 * CI/DI 발급을 통해 동일인 여부 확인 및 블랙리스트 체크가 가능합니다.
 */

// ============================================================
// 타입 정의
// ============================================================

/**
 * 본인인증 요청 파라미터
 */
export interface VerificationRequest {
  /** 사용자 전화번호 (010-xxxx-xxxx 형식) */
  phoneNumber: string;
  /** 사용자 이름 (선택) */
  name?: string;
  /** 생년월일 YYYYMMDD (선택) */
  birthday?: string;
}

/**
 * 본인인증 결과
 */
export interface VerificationResult {
  /** 인증 성공 여부 */
  success: boolean;
  /** 연계정보 (Connecting Information) - 기관간 연계용 */
  ci?: string;
  /** 중복가입확인정보 (Duplication Information) - 서비스별 고유 */
  di?: string;
  /** 인증된 실명 */
  realName?: string;
  /** 성별 */
  gender?: 'male' | 'female';
  /** 생년월일 (YYYY-MM-DD) */
  birthDate?: string;
  /** 에러 메시지 */
  error?: string;
}

/**
 * 본인인증 요청 응답 (인증 페이지 URL 반환)
 */
export interface VerificationRequestResponse {
  /** 인증 페이지 URL */
  verificationUrl: string;
  /** 트랜잭션 ID (콜백에서 사용) */
  transactionId: string;
}

/**
 * 다날 API 설정
 */
export interface DanalConfig {
  /** CP ID (가맹점 ID) */
  cpId: string;
  /** CP Password */
  cpPwd: string;
  /** API URL */
  apiUrl: string;
  /** 콜백 URL */
  returnUrl: string;
}

// ============================================================
// 환경 설정 로드
// ============================================================

/**
 * 환경변수에서 다날 설정 로드
 * @throws 프로덕션 환경에서 환경변수 누락 시 에러
 */
export function loadDanalConfig(): DanalConfig {
  const cpId = process.env.DANAL_CP_ID;
  const cpPwd = process.env.DANAL_CP_PWD;
  const apiUrl = process.env.DANAL_API_URL;
  const returnUrl = process.env.DANAL_RETURN_URL;

  // 개발/테스트 환경: 환경변수 없어도 Mock 설정 반환
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return {
      cpId: cpId || 'MOCK_CP_ID',
      cpPwd: cpPwd || 'MOCK_CP_PWD',
      apiUrl: apiUrl || 'https://mock-danal-api.com',
      returnUrl: returnUrl || 'http://localhost:3000/api/auth/danal/callback',
    };
  }

  // 프로덕션 환경: 환경변수 필수
  if (!cpId || !cpPwd || !apiUrl || !returnUrl) {
    throw new Error(
      '다날 PASS 설정이 완료되지 않았습니다. ' +
        '환경변수를 확인해주세요: DANAL_CP_ID, DANAL_CP_PWD, DANAL_API_URL, DANAL_RETURN_URL'
    );
  }

  return {
    cpId,
    cpPwd,
    apiUrl,
    returnUrl,
  };
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 트랜잭션 ID 생성
 * 형식: TXN_{timestamp}_{random}
 * @returns 고유한 트랜잭션 ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `TXN_${timestamp}_${random}`;
}

/**
 * 전화번호 정규화 (숫자만 추출)
 * @param phone - 입력 전화번호
 * @returns 숫자만 포함된 전화번호
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * 전화번호 유효성 검사 (한국 휴대폰)
 * @param phone - 전화번호
 * @returns 유효 여부
 */
export function isValidKoreanPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^010\d{8}$/.test(normalized);
}

// ============================================================
// 메인 함수
// ============================================================

/**
 * 본인인증 요청
 *
 * 다날 PASS 인증 페이지 URL과 트랜잭션 ID를 반환합니다.
 * 사용자는 반환된 URL로 이동하여 본인인증을 진행합니다.
 *
 * 개발/테스트 환경: Mock URL 반환 (자동 승인)
 * 프로덕션 환경: 실제 다날 API 호출 (TODO)
 *
 * @param request - 인증 요청 정보
 * @returns 인증 페이지 URL 및 트랜잭션 ID
 *
 * @example
 * ```typescript
 * const { verificationUrl, transactionId } = await requestVerification({
 *   phoneNumber: '01012345678'
 * });
 * // 클라이언트를 verificationUrl로 리다이렉트
 * ```
 */
export async function requestVerification(
  request: VerificationRequest
): Promise<VerificationRequestResponse> {
  const transactionId = generateTransactionId();

  // 전화번호 정규화
  const normalizedPhone = normalizePhoneNumber(request.phoneNumber);

  // 전화번호 유효성 검사
  if (!isValidKoreanPhone(normalizedPhone)) {
    throw new Error('올바른 전화번호 형식이 아닙니다. (010-xxxx-xxxx 형식만 지원)');
  }

  // 개발/테스트 환경: Mock URL 반환
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.log('[Danal] 개발 모드 - 본인인증 요청:', {
      transactionId,
      phone: normalizedPhone,
      name: request.name,
      birthday: request.birthday,
    });

    return {
      verificationUrl: `/mock/danal-verification?txId=${transactionId}`,
      transactionId,
    };
  }

  // 프로덕션 환경: 실제 다날 API 호출
  const config = loadDanalConfig();

  // TODO: 실제 다날 API 연동
  // 1. 다날 인증 요청 API 호출
  // 2. 인증 세션 생성 및 암호화
  // 3. 인증 페이지 URL 생성
  //
  // 예시 API 호출:
  // const response = await fetch(`${config.apiUrl}/certification/request`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Basic ${Buffer.from(`${config.cpId}:${config.cpPwd}`).toString('base64')}`,
  //   },
  //   body: JSON.stringify({
  //     transaction_id: transactionId,
  //     phone_number: normalizedPhone,
  //     name: request.name,
  //     birthday: request.birthday,
  //     return_url: config.returnUrl,
  //   }),
  // });
  //
  // const data = await response.json();
  // return {
  //   verificationUrl: data.certification_url,
  //   transactionId: data.transaction_id,
  // };

  console.log('[Danal] 프로덕션 모드 - 본인인증 요청 (TODO):', {
    transactionId,
    phone: normalizedPhone,
    name: request.name,
    birthday: request.birthday,
  });

  return {
    verificationUrl: `${config.apiUrl}/certification?txId=${transactionId}`,
    transactionId,
  };
}

/**
 * 본인인증 결과 검증
 *
 * 다날 콜백에서 받은 암호화 데이터를 복호화하고 검증합니다.
 * 성공 시 CI/DI 및 사용자 정보를 반환합니다.
 *
 * 개발/테스트 환경: Mock CI/DI 반환 (자동 승인)
 * 프로덕션 환경: 실제 다날 API 호출 (TODO)
 *
 * @param transactionId - 원본 트랜잭션 ID
 * @param encryptedData - 다날에서 전달받은 암호화된 인증 결과
 * @returns 인증 결과 (CI/DI, 실명, 성별, 생년월일)
 *
 * @example
 * ```typescript
 * const result = await verifyIdentity(transactionId, encryptedData);
 * if (result.success) {
 *   console.log('CI:', result.ci);
 *   console.log('DI:', result.di);
 *   console.log('실명:', result.realName);
 * }
 * ```
 */
export async function verifyIdentity(
  transactionId: string,
  encryptedData: string
): Promise<VerificationResult> {
  // 트랜잭션 ID 검증
  if (!transactionId || !transactionId.startsWith('TXN_')) {
    return {
      success: false,
      error: '유효하지 않은 트랜잭션 ID입니다.',
    };
  }

  // 암호화 데이터 검증
  if (!encryptedData || encryptedData.length < 10) {
    return {
      success: false,
      error: '유효하지 않은 인증 데이터입니다.',
    };
  }

  // 개발/테스트 환경: Mock CI/DI 반환 (자동 승인)
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.log('[Danal] 개발 모드 - 본인인증 자동 승인:', {
      transactionId,
      encryptedDataLength: encryptedData.length,
    });

    // 고유한 Mock CI/DI 생성
    const timestamp = Date.now();
    const mockCi = `MOCK_CI_${transactionId}_${timestamp}`;
    const mockDi = `MOCK_DI_${transactionId}_${timestamp}`;

    return {
      success: true,
      ci: mockCi,
      di: mockDi,
      realName: '테스트사용자',
      gender: 'male',
      birthDate: '1990-01-01',
    };
  }

  // 프로덕션 환경: 실제 다날 API 호출
  const config = loadDanalConfig();

  // TODO: 실제 다날 API 연동 - 암호화 데이터 복호화 및 검증
  // 1. 다날 인증 결과 조회 API 호출
  // 2. 암호화된 데이터 복호화 (AES-256 등)
  // 3. 서명 검증
  // 4. CI/DI 및 사용자 정보 추출
  //
  // 예시 API 호출:
  // const response = await fetch(`${config.apiUrl}/certification/verify`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Basic ${Buffer.from(`${config.cpId}:${config.cpPwd}`).toString('base64')}`,
  //   },
  //   body: JSON.stringify({
  //     transaction_id: transactionId,
  //     encrypted_data: encryptedData,
  //   }),
  // });
  //
  // const data = await response.json();
  //
  // if (data.result_code !== '0000') {
  //   return {
  //     success: false,
  //     error: data.result_message || '본인인증에 실패했습니다.',
  //   };
  // }
  //
  // // 복호화 로직
  // const decryptedData = decrypt(data.encrypted_result, config.cpPwd);
  //
  // return {
  //   success: true,
  //   ci: decryptedData.ci,
  //   di: decryptedData.di,
  //   realName: decryptedData.name,
  //   gender: decryptedData.gender === 'M' ? 'male' : 'female',
  //   birthDate: formatBirthDate(decryptedData.birthday), // YYYYMMDD -> YYYY-MM-DD
  // };

  console.log('[Danal] 프로덕션 모드 - 본인인증 검증 (TODO):', {
    transactionId,
    encryptedDataLength: encryptedData.length,
  });

  // 프로덕션에서는 실제 API 호출 전까지 에러 반환
  return {
    success: false,
    error: '다날 PASS 실제 API 연동이 필요합니다.',
  };
}

// ============================================================
// 싱글톤 클라이언트 (선택적)
// ============================================================

/**
 * 다날 PASS 클라이언트 클래스
 *
 * 인스턴스화하여 사용하거나, 위의 함수들을 직접 사용할 수 있습니다.
 */
export class DanalPassClient {
  private config: DanalConfig;

  constructor(config?: DanalConfig) {
    this.config = config || loadDanalConfig();
  }

  /**
   * 본인인증 요청
   */
  async requestVerification(
    request: VerificationRequest
  ): Promise<VerificationRequestResponse> {
    return requestVerification(request);
  }

  /**
   * 본인인증 결과 검증
   */
  async verifyIdentity(
    transactionId: string,
    encryptedData: string
  ): Promise<VerificationResult> {
    return verifyIdentity(transactionId, encryptedData);
  }
}

let clientInstance: DanalPassClient | null = null;

/**
 * 다날 PASS 클라이언트 인스턴스 가져오기
 */
export function getDanalClient(): DanalPassClient {
  if (!clientInstance) {
    clientInstance = new DanalPassClient();
  }
  return clientInstance;
}

/**
 * 클라이언트 인스턴스 초기화 (테스트용)
 */
export function resetDanalClient(): void {
  clientInstance = null;
}
