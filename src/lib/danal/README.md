# 다날 PASS 본인인증 클라이언트

다날 PASS 본인인증 API를 통해 사용자 본인인증을 처리하는 클라이언트입니다.

## 주요 기능

- **CI/DI 발급**: 연계정보(CI) 및 중복가입확인정보(DI) 발급
- **동일인 확인**: CI를 통한 기관 간 동일인 여부 확인
- **블랙리스트 체크**: DI를 통한 서비스별 중복 가입 방지
- **개발 모드 지원**: 개발/테스트 환경에서 자동 승인 (Mock CI/DI)

## 환경별 동작

### 개발/테스트 환경 (`NODE_ENV=development` 또는 `test`)

- **자동 승인**: 실제 다날 API 호출 없이 자동으로 인증 성공
- **Mock CI/DI**: 고유한 Mock CI/DI 자동 생성
- **환경변수 불필요**: 환경변수 없어도 Mock 설정 사용

```typescript
// 개발 환경에서 자동으로 처리
const { verificationUrl, transactionId } = await requestVerification({
  phoneNumber: '010-1234-5678',
});
// verificationUrl: /mock/danal-verification?txId=TXN_1234567890_abc123

const result = await verifyIdentity(transactionId, 'mock_encrypted_data');
// result.success: true
// result.ci: MOCK_CI_TXN_1234567890_abc123_1234567890123
// result.di: MOCK_DI_TXN_1234567890_abc123_1234567890123
```

### 프로덕션 환경 (`NODE_ENV=production`)

- **실제 API 호출**: 다날 PASS API 연동 (TODO: 구현 필요)
- **환경변수 필수**: `DANAL_CP_ID`, `DANAL_CP_PWD`, `DANAL_API_URL`, `DANAL_RETURN_URL`

```bash
# 프로덕션 환경변수 설정 (.env.local)
DANAL_CP_ID=your-cp-id-here
DANAL_CP_PWD=your-cp-password-here
DANAL_API_URL=https://api.danalpass.com
DANAL_RETURN_URL=https://todaysmassage.com/api/auth/danal/callback
```

## 사용 방법

### 1. 본인인증 요청

사용자가 본인인증을 시작할 때 호출합니다.

```typescript
import { requestVerification } from '@/lib/danal';

// 인증 요청
const { verificationUrl, transactionId } = await requestVerification({
  phoneNumber: '010-1234-5678',
  name: '홍길동', // 선택
  birthday: '19900101', // 선택
});

// 사용자를 인증 페이지로 리다이렉트
window.location.href = verificationUrl;
```

### 2. 본인인증 콜백 처리

다날 PASS 인증 완료 후 콜백 API에서 호출합니다.

```typescript
import { verifyIdentity } from '@/lib/danal';
import { checkBlacklist } from '@/lib/api/blacklist';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/danal/callback
export async function POST(request: NextRequest) {
  const { transactionId, encryptedData, userId } = await request.json();

  // 1. 인증 결과 검증
  const result = await verifyIdentity(transactionId, encryptedData);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // 2. 블랙리스트 확인
  const isBlacklisted = await checkBlacklist(result.di);

  if (isBlacklisted) {
    return NextResponse.json(
      { error: '서비스 이용이 제한된 사용자입니다.' },
      { status: 403 }
    );
  }

  // 3. profiles 테이블 업데이트
  const supabase = await createClient();
  await supabase
    .from('profiles')
    .update({
      ci: result.ci,
      di: result.di,
      real_name: result.realName,
      gender: result.gender,
      birth_date: result.birthDate,
      verified_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return NextResponse.json({ success: true, verified: true });
}
```

### 3. 유틸리티 함수

```typescript
import {
  generateTransactionId,
  isValidKoreanPhone,
  loadDanalConfig,
} from '@/lib/danal';

// 트랜잭션 ID 생성
const txId = generateTransactionId();
// 결과: TXN_1234567890_abc123

// 전화번호 유효성 검사
const isValid = isValidKoreanPhone('010-1234-5678');
// 결과: true

// 다날 설정 로드
const config = loadDanalConfig();
// 개발: Mock 설정 반환
// 프로덕션: 환경변수에서 로드
```

## API 엔드포인트

### POST /api/auth/danal

본인인증 요청 API

**Request Body:**

```json
{
  "phoneNumber": "010-1234-5678",
  "name": "홍길동",
  "birthday": "19900101"
}
```

**Response:**

```json
{
  "success": true,
  "verificationUrl": "/mock/danal-verification?txId=TXN_...",
  "transactionId": "TXN_1234567890_abc123",
  "remaining": 2
}
```

**Rate Limiting:**

- 전화번호당 일일 3회 제한
- IP당 분당 5회 제한

### POST /api/auth/danal/callback

본인인증 콜백 API

**Request Body:**

```json
{
  "transactionId": "TXN_1234567890_abc123",
  "encryptedData": "encrypted_result_from_danal",
  "userId": "uuid-here"
}
```

**Response:**

```json
{
  "success": true,
  "verified": true,
  "realName": "홍길동",
  "gender": "male",
  "birthDate": "1990-01-01"
}
```

**Error Codes:**

- `400`: 입력 검증 실패
- `403`: 블랙리스트 사용자 (`code: BLACKLISTED`)
- `409`: 이미 가입된 DI (`code: DUPLICATE_DI`)
- `500`: 서버 오류

## 데이터베이스 스키마

```sql
-- profiles 테이블
ALTER TABLE profiles
ADD COLUMN ci TEXT UNIQUE,           -- 연계정보 (기관 간 동일인 확인)
ADD COLUMN di TEXT UNIQUE,           -- 중복가입확인정보 (서비스별 고유)
ADD COLUMN real_name TEXT,           -- 실명
ADD COLUMN gender TEXT,              -- 성별 (male/female)
ADD COLUMN birth_date DATE,          -- 생년월일
ADD COLUMN verified_at TIMESTAMPTZ; -- 인증 완료 시간
```

## 보안 고려사항

### CI/DI 암호화

- **CI (Connecting Information)**: 기관 간 연계용, 모든 서비스에서 동일
- **DI (Duplication Information)**: 서비스별 고유, 중복 가입 방지용

### 개발 모드 Mock 데이터

```typescript
// 개발 환경에서 생성되는 Mock CI/DI 형식
ci: `MOCK_CI_${transactionId}_${timestamp}`;
di: `MOCK_DI_${transactionId}_${timestamp}`;

// 예시
// MOCK_CI_TXN_1234567890_abc123_1234567890123
// MOCK_DI_TXN_1234567890_abc123_1234567890123
```

Mock CI/DI는 트랜잭션 ID와 타임스탬프를 포함하여 **고유성**을 보장합니다.

### Rate Limiting

**전화번호당 일일 3회 제한:**

- 악용 방지 (동일 번호로 무차별 인증 시도 차단)
- 인메모리 Map 사용 (24시간 후 자동 초기화)

**IP당 분당 5회 제한:**

- DDoS 방지 (무차별 공격 차단)
- 인메모리 Map 사용 (1분 후 자동 초기화)

### 블랙리스트

DI 기반 블랙리스트 체크를 통해 서비스 이용 제한 사용자를 차단합니다.

```typescript
const isBlacklisted = await checkBlacklist(result.di);

if (isBlacklisted) {
  // 403 Forbidden 반환
}
```

## 테스트

### 단위 테스트

```bash
# 개발 모드 테스트 (자동 승인)
npm test src/lib/danal/__tests__/client.test.ts
```

### 수동 테스트

```typescript
// Node.js REPL에서 테스트
NODE_ENV = development;
node;

const {
  requestVerification,
  verifyIdentity,
} = require('./src/lib/danal/client.ts');

// 인증 요청
const req = await requestVerification({ phoneNumber: '01012345678' });
console.log(req);
// {
//   verificationUrl: '/mock/danal-verification?txId=TXN_...',
//   transactionId: 'TXN_1234567890_abc123'
// }

// 인증 검증
const verify = await verifyIdentity(req.transactionId, 'mock_encrypted_data');
console.log(verify);
// {
//   success: true,
//   ci: 'MOCK_CI_TXN_1234567890_abc123_1234567890123',
//   di: 'MOCK_DI_TXN_1234567890_abc123_1234567890123',
//   realName: '테스트사용자',
//   gender: 'male',
//   birthDate: '1990-01-01'
// }
```

## TODO: 프로덕션 연동

프로덕션 환경에서 실제 다날 PASS API 연동이 필요합니다.

### 구현 필요 사항

1. **인증 요청 API 호출**

   ```typescript
   // src/lib/danal/client.ts - requestVerification()
   const response = await fetch(`${config.apiUrl}/certification/request`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       Authorization: `Basic ${Buffer.from(`${config.cpId}:${config.cpPwd}`).toString('base64')}`,
     },
     body: JSON.stringify({
       transaction_id: transactionId,
       phone_number: normalizedPhone,
       name: request.name,
       birthday: request.birthday,
       return_url: config.returnUrl,
     }),
   });
   ```

2. **인증 결과 검증 API 호출**

   ```typescript
   // src/lib/danal/client.ts - verifyIdentity()
   const response = await fetch(`${config.apiUrl}/certification/verify`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       Authorization: `Basic ${Buffer.from(`${config.cpId}:${config.cpPwd}`).toString('base64')}`,
     },
     body: JSON.stringify({
       transaction_id: transactionId,
       encrypted_data: encryptedData,
     }),
   });
   ```

3. **암호화 데이터 복호화**
   - AES-256 또는 다날 제공 SDK 사용
   - 서명 검증
   - CI/DI 및 사용자 정보 추출

### 다날 계약 체크리스트

- [ ] 다날 CP 계약 완료
- [ ] CP ID 및 CP Password 발급받음
- [ ] API URL 확인 (테스트/프로덕션)
- [ ] 콜백 URL 등록
- [ ] 환경변수 설정 완료
- [ ] 실제 API 호출 코드 구현
- [ ] 프로덕션 테스트 완료

## 참고 자료

- [다날 개발자 센터](https://www.danalpay.com)
- [PASS 본인인증 가이드](https://www.sktelecom.com/pass)
- [API 라우트 핸들러](C:/a/src/app/api/auth/danal/route.ts)
- [콜백 핸들러](C:/a/src/app/api/auth/danal/callback/route.ts)

## 라이센스

이 프로젝트는 프라이빗 라이센스입니다.
