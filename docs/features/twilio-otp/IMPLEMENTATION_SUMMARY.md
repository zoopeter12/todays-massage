# Twilio SMS OTP 인증 시스템 구현 완료

## 구현 개요

Next.js 14 + Supabase 프로젝트에 Twilio를 사용한 SMS OTP 인증 시스템을 구축했습니다.

---

## 생성된 파일 목록

### 1. 핵심 라이브러리 (3개 파일)

#### `src/lib/twilio/client.ts`
Twilio SDK 초기화 및 환경변수 검증

```typescript
import twilio from 'twilio';

export const twilioClient = twilio(accountSid, authToken);
export const TWILIO_FROM_NUMBER = phoneNumber;
```

#### `src/lib/twilio/otp-service.ts`
OTP 생성, 발송, 검증 로직 (핵심 비즈니스 로직)

**주요 함수:**
- `generateOTP()` - 6자리 랜덤 OTP 생성
- `sendOTP(phone, otp)` - Twilio SMS 발송
- `saveOTP(phone, code)` - Supabase DB 저장
- `verifyOTP(phone, code)` - OTP 검증 및 시도 횟수 관리
- `checkRateLimit(phone)` - 1분 제한 확인
- `formatPhoneNumber(phone)` - E.164 형식 변환

**설정 상수:**
```typescript
export const OTP_CONFIG = {
  LENGTH: 6,              // OTP 길이
  EXPIRY_MINUTES: 5,      // 만료 시간
  MAX_ATTEMPTS: 5,        // 최대 시도 횟수
  RATE_LIMIT_SECONDS: 60  // 발송 제한
};
```

#### `src/lib/twilio/index.ts`
Export 모듈 (편의성)

---

### 2. API Routes (2개 파일)

#### `src/app/api/auth/twilio/send-otp/route.ts`
OTP 발송 API

**기능:**
- 전화번호 검증 (한국 번호 형식)
- Rate limiting 확인 (1분에 1회)
- OTP 생성 및 저장
- Twilio SMS 발송
- 개발 환경에서 OTP 응답 포함

**Request:**
```json
{
  "phone": "010-1234-5678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "인증번호가 발송되었습니다.",
  "otp": "123456"  // 개발 환경에서만
}
```

#### `src/app/api/auth/twilio/verify-otp/route.ts`
OTP 검증 및 로그인 API

**기능:**
- OTP 검증 (만료 시간, 시도 횟수 확인)
- Supabase Auth 세션 생성
- 신규 사용자 자동 회원가입
- 프로필 테이블 생성

**Request:**
```json
{
  "phone": "010-1234-5678",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "로그인되었습니다.",
  "user": {
    "id": "uuid",
    "phone": "01012345678"
  }
}
```

---

### 3. Frontend (2개 파일)

#### `src/hooks/use-twilio-otp.ts`
React Hook (추상화 레이어)

**제공 기능:**
```typescript
const { sendOTP, verifyOTP, isLoading, error, clearError } = useTwilioOTP();
```

**장점:**
- 상태 관리 자동화 (로딩, 에러)
- API 호출 추상화
- 재사용 가능한 로직

#### `src/components/auth/TwilioOTPLogin.tsx`
독립형 로그인 컴포넌트 (예시 구현)

**기능:**
- 2단계 UI (전화번호 입력 → OTP 검증)
- 전화번호 자동 포맷팅 (010-1234-5678)
- 카운트다운 타이머 (재발송 제한)
- 개발 환경에서 OTP 표시
- shadcn/ui 컴포넌트 사용

**사용 예시:**
```tsx
<TwilioOTPLogin
  onSuccess={(user) => router.push('/')}
  onError={(error) => console.error(error)}
/>
```

---

### 4. Database (1개 파일)

#### `supabase/migrations/20260126000001_create_otp_codes_table.sql`
OTP 코드 테이블 마이그레이션

**테이블 구조:**
```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,  -- 전화번호
  code VARCHAR(6) NOT NULL,           -- OTP 코드
  expires_at TIMESTAMP NOT NULL,      -- 만료 시간
  attempts INTEGER DEFAULT 0,         -- 시도 횟수
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**추가 기능:**
- 인덱스 생성 (phone, expires_at)
- 만료된 OTP 자동 삭제 함수
- Row Level Security (RLS) 설정
- updated_at 자동 업데이트 트리거

---

### 5. Documentation (4개 파일)

#### `docs/TWILIO_OTP_SETUP.md` (2,500+ 줄)
**내용:**
- 시스템 구조 설명
- Twilio 계정 설정 가이드
- 환경변수 설정 방법
- 데이터베이스 마이그레이션 가이드
- API 명세
- 보안 고려사항
- 트러블슈팅

#### `docs/TWILIO_OTP_TESTING.md` (1,800+ 줄)
**내용:**
- 테스트 체크리스트
- API 테스트 (curl)
- Frontend 테스트 (React Hook)
- Postman/Insomnia 테스트 케이스
- 데이터베이스 확인 쿼리
- 자동화 테스트 예시 (Jest)
- 프로덕션 배포 체크리스트

#### `docs/TWILIO_OTP_README.md` (500+ 줄)
**내용:**
- 빠른 시작 가이드
- 파일 목록
- API 명세 요약
- 주요 함수 사용법
- 트러블슈팅

#### `.env.example` 업데이트
Twilio 환경변수 추가:
```bash
TWILIO_ACCOUNT_SID=your-account-sid-here
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_PHONE_NUMBER=+821012345678
```

---

## 핵심 코드 스니펫

### 1. OTP 생성 및 발송

```typescript
// src/lib/twilio/otp-service.ts

export function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    otp += digits[randomIndex];
  }
  return otp;
}

export async function sendOTP(phone: string, otp: string): Promise<boolean> {
  const formattedPhone = formatPhoneNumber(phone);

  await twilioClient.messages.create({
    body: `[오늘의마사지] 인증번호는 [${otp}] 입니다. 5분 이내에 입력해주세요.`,
    from: TWILIO_FROM_NUMBER,
    to: formattedPhone,
  });

  return true;
}
```

### 2. OTP 검증

```typescript
// src/lib/twilio/otp-service.ts

export async function verifyOTP(phone: string, code: string) {
  const supabase = await createClient();

  // OTP 조회
  const { data } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .single();

  // 만료 확인
  if (new Date() > new Date(data.expires_at)) {
    await supabase.from('otp_codes').delete().eq('phone', phone);
    return { success: false, error: '인증번호가 만료되었습니다.' };
  }

  // 시도 횟수 확인
  if (data.attempts >= 5) {
    await supabase.from('otp_codes').delete().eq('phone', phone);
    return { success: false, error: '시도 횟수를 초과했습니다.' };
  }

  // OTP 검증
  if (data.code !== code) {
    await supabase
      .from('otp_codes')
      .update({ attempts: data.attempts + 1 })
      .eq('phone', phone);
    return { success: false, error: '인증번호가 일치하지 않습니다.' };
  }

  // 성공 - OTP 삭제
  await supabase.from('otp_codes').delete().eq('phone', phone);
  return { success: true };
}
```

### 3. React Hook 사용

```tsx
// 사용 예시

import { useTwilioOTP } from '@/hooks/use-twilio-otp';

function LoginPage() {
  const { sendOTP, verifyOTP, isLoading, error } = useTwilioOTP();

  // OTP 발송
  const handleSend = async () => {
    const result = await sendOTP('010-1234-5678');
    if (result.success) {
      console.log('OTP 발송 성공');
    }
  };

  // OTP 검증
  const handleVerify = async () => {
    const result = await verifyOTP('010-1234-5678', '123456');
    if (result.success) {
      console.log('로그인 성공', result.user);
    }
  };
}
```

---

## 환경변수 설정 가이드

### 1. Twilio 계정 생성

1. https://console.twilio.com 접속
2. 계정 생성 또는 로그인
3. Account > Keys & Credentials 메뉴

### 2. Twilio 전화번호 구매

1. Phone Numbers > Buy a Number
2. 한국 또는 국제 번호 선택
3. SMS 기능 활성화 확인

### 3. 환경변수 설정

`.env.local` 파일:

```bash
# Twilio SMS OTP
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+821012345678
```

### 4. 마이그레이션 실행

```bash
npx supabase db push
```

---

## 보안 기능

### 1. Rate Limiting
- 동일 전화번호로 1분에 1회만 발송 가능
- DB에 마지막 발송 시간 저장 및 검증

### 2. 시도 횟수 제한
- OTP 검증 최대 5회 시도 가능
- 초과 시 OTP 자동 삭제 및 재발송 필요

### 3. OTP 만료 시간
- OTP 생성 후 5분간 유효
- 만료된 OTP는 검증 시 자동 삭제

### 4. Row Level Security (RLS)
- `otp_codes` 테이블은 서버에서만 접근 가능
- 클라이언트 직접 접근 차단

### 5. 환경변수 보호
- Twilio 인증 정보는 서버 전용
- `.env.local` 파일은 `.gitignore`에 포함

---

## 테스트 방법

### 1. 로컬 테스트 (curl)

```bash
# OTP 발송
curl -X POST http://localhost:3000/api/auth/twilio/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678"}'

# OTP 검증
curl -X POST http://localhost:3000/api/auth/twilio/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678", "code": "123456"}'
```

### 2. Frontend 테스트

테스트 페이지 생성:

```tsx
// src/app/test-otp/page.tsx

import { TwilioOTPLogin } from '@/components/auth/TwilioOTPLogin';

export default function TestOTPPage() {
  return (
    <TwilioOTPLogin
      onSuccess={(user) => console.log('Success:', user)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

http://localhost:3000/test-otp 접속하여 테스트

### 3. 개발 환경 OTP 확인

개발 환경(`NODE_ENV=development`)에서는 API 응답에 OTP가 포함됩니다:

```json
{
  "success": true,
  "message": "인증번호가 발송되었습니다.",
  "otp": "123456"  // 개발 환경에서만
}
```

---

## 주요 특징

### 1. 독립적 구현
- 기존 로그인 시스템과 분리
- 별도 Hook으로 제공
- 필요한 곳에서만 사용 가능

### 2. 완전한 타입 안전성
- TypeScript 완전 지원
- 모든 API 응답 타입 정의

### 3. 에러 처리
- 상세한 에러 메시지
- Rate limiting 안내
- 시도 횟수 표시

### 4. 개발 편의성
- 개발 환경에서 OTP 자동 표시
- 상세한 로깅
- 테스트 컴포넌트 제공

### 5. 프로덕션 준비
- RLS 설정
- 환경변수 검증
- 에러 로깅

---

## 다음 단계

### 1. 프로덕션 배포 전 체크리스트

- [ ] Twilio 프로덕션 계정 잔액 확인
- [ ] Vercel 환경변수 설정
- [ ] 프로덕션 DB 마이그레이션
- [ ] 실제 전화번호로 SMS 수신 테스트
- [ ] Rate limiting 동작 확인
- [ ] 에러 로깅 설정 (Sentry 등)

### 2. 선택적 개선 사항

- [ ] 만료된 OTP 자동 삭제 스케줄러 (pg_cron)
- [ ] SMS 발송 실패 시 재시도 로직
- [ ] 국제 전화번호 지원 확장
- [ ] OTP 발송 이력 로깅 (analytics)
- [ ] 다국어 지원 (SMS 메시지)

### 3. 모니터링

- Twilio 콘솔 > SMS Logs에서 발송 상태 확인
- Supabase Dashboard > Table Editor에서 `otp_codes` 모니터링
- API 성공/실패율 추적

---

## 문제 해결

### Q1: OTP가 발송되지 않아요

**A:** Twilio 콘솔 > Logs 확인
- 잔액 부족인지 확인
- 전화번호 형식 확인 (E.164: +821012345678)

### Q2: 개발 환경에서 OTP가 응답에 포함되지 않아요

**A:** `NODE_ENV=development` 확인

### Q3: Rate limiting이 작동하지 않아요

**A:** Supabase `otp_codes` 테이블에서 `created_at` 컬럼 확인

### Q4: 로그인 후 세션이 생성되지 않아요

**A:** Supabase Auth 설정 및 `profiles` 테이블 RLS 정책 확인

---

## 참고 문서

- [설정 가이드](docs/TWILIO_OTP_SETUP.md)
- [테스트 가이드](docs/TWILIO_OTP_TESTING.md)
- [빠른 시작](docs/TWILIO_OTP_README.md)

---

## 버그 수정 (2026-01-29)

### 1. 로그인 후 로딩 화면 멈춤 버그 수정

**문제**: 로그인 성공 후 로딩 스피너만 표시되고, 새로고침해야 홈 화면으로 이동

**원인**:
- `useAuth` 훅의 `onAuthStateChange`에서 `setIsLoading(true)`를 먼저 호출
- 로그인 페이지에서 `isLoading` 체크가 `isAuthenticated` 체크보다 먼저 실행
- `isAuthenticated`가 true여도 `isLoading` 때문에 리다이렉트 미실행

**수정 파일**: `src/app/(customer)/login/page.tsx`

```typescript
// 수정 전: isLoading 체크가 먼저
if (isLoading || registrationAllowed === null) { return 로딩... }
if (isAuthenticated) { 리다이렉트 }

// 수정 후: isAuthenticated 체크가 먼저
if (isAuthenticated) {
  window.location.href = "/";  // 즉시 리다이렉트
  return 로딩...
}
if (isLoading || registrationAllowed === null) { return 로딩... }
```

---

### 2. AbortError: signal is aborted without reason 버그 수정

**문제**: 마이페이지에서 `AbortError: signal is aborted without reason` 에러 발생

**원인**:
- `useAuth.ts`의 의존성 배열에 `user` 포함 → 무한 재실행
- 컴포넌트 언마운트 시 cleanup 없이 비동기 요청 계속 실행
- React Strict Mode에서 더블 마운트 시 이전 요청이 취소되지 않음

**수정 파일**:
- `src/hooks/useAuth.ts`
- `src/app/(customer)/mypage/page.tsx`

**수정 내용**:

```typescript
// useAuth.ts
useEffect(() => {
  let isMounted = true;
  const abortController = new AbortController();

  async function getInitialSession() {
    // 컴포넌트 언마운트 시 상태 업데이트 방지
    if (!isMounted || abortController.signal.aborted) return;
    // ...
  }

  return () => {
    isMounted = false;
    abortController.abort();
    // ...
  };
}, [fetchProfile]); // user 의존성 제거
```

---

## 구현 완료 시간

- 총 파일: 11개
- 총 라인: 약 2,000+ 줄
- 문서: 약 5,000+ 줄

구현이 완료되었습니다. 문서를 참고하여 테스트 및 배포를 진행하세요.
