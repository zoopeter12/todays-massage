# Twilio SMS OTP 인증 시스템

전화번호 기반 OTP 인증 시스템입니다. Twilio API를 사용하여 SMS를 발송하고, Supabase에서 OTP를 관리합니다.

## 빠른 시작

### 1. 패키지 설치

```bash
npm install twilio
```

### 2. 환경변수 설정

`.env.local` 파일에 추가:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+821012345678
```

### 3. 데이터베이스 마이그레이션

```bash
npx supabase db push
```

### 4. 사용 예시

```tsx
import { TwilioOTPLogin } from '@/components/auth/TwilioOTPLogin';

export default function LoginPage() {
  return (
    <TwilioOTPLogin
      onSuccess={(user) => router.push('/')}
      onError={(error) => console.error(error)}
    />
  );
}
```

## 생성된 파일 목록

### 핵심 라이브러리
- `src/lib/twilio/client.ts` - Twilio SDK 초기화
- `src/lib/twilio/otp-service.ts` - OTP 생성/발송/검증 로직
- `src/lib/twilio/index.ts` - Export 모듈

### API Routes
- `src/app/api/auth/twilio/send-otp/route.ts` - OTP 발송 API
- `src/app/api/auth/twilio/verify-otp/route.ts` - OTP 검증 API

### Frontend
- `src/hooks/use-twilio-otp.ts` - React Hook
- `src/components/auth/TwilioOTPLogin.tsx` - 로그인 컴포넌트 (예시)

### Database
- `supabase/migrations/20260126000001_create_otp_codes_table.sql` - OTP 테이블 마이그레이션

### Documentation
- `docs/TWILIO_OTP_SETUP.md` - 설정 가이드
- `docs/TWILIO_OTP_TESTING.md` - 테스트 가이드
- `docs/TWILIO_OTP_README.md` - 이 파일

## API 명세

### POST /api/auth/twilio/send-otp

OTP 발송

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

### POST /api/auth/twilio/verify-otp

OTP 검증

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

## 보안 설정

### Rate Limiting
- 동일 전화번호로 1분에 1회만 발송

### 시도 횟수 제한
- OTP 검증 최대 5회 시도
- 초과 시 OTP 자동 삭제

### OTP 만료
- 생성 후 5분간 유효
- 만료된 OTP는 자동 삭제

### RLS (Row Level Security)
- `otp_codes` 테이블은 서버에서만 접근 가능
- 클라이언트 직접 접근 차단

## 테스트

### 로컬 테스트

```bash
# 개발 서버 실행
npm run dev

# curl로 테스트
curl -X POST http://localhost:3000/api/auth/twilio/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678"}'
```

### 개발 환경 OTP 확인

개발 환경에서는 API 응답에 OTP가 포함됩니다.

```json
{
  "success": true,
  "message": "인증번호가 발송되었습니다.",
  "otp": "123456"  // 개발 환경에서만
}
```

## 주요 함수

### OTP 생성
```typescript
import { generateOTP } from '@/lib/twilio';

const otp = generateOTP(); // "123456"
```

### OTP 발송
```typescript
import { sendOTP } from '@/lib/twilio';

await sendOTP('010-1234-5678', '123456');
```

### OTP 검증
```typescript
import { verifyOTP } from '@/lib/twilio';

const result = await verifyOTP('010-1234-5678', '123456');
if (result.success) {
  // 인증 성공
}
```

## 환경변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `TWILIO_ACCOUNT_SID` | Twilio 계정 ID | ✅ |
| `TWILIO_AUTH_TOKEN` | Twilio 인증 토큰 | ✅ |
| `TWILIO_PHONE_NUMBER` | Twilio 발신 번호 | ✅ |

## 데이터베이스 스키마

```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 트러블슈팅

### OTP 발송 실패

**원인:**
- Twilio 잔액 부족
- 잘못된 전화번호 형식
- 인증되지 않은 발신 번호

**해결:**
- Twilio 콘솔에서 잔액 확인
- E.164 형식 확인 (+821012345678)
- 발신 번호 인증 상태 확인

### Rate Limiting 오류

**원인:**
- 1분 내 재발송 시도

**해결:**
- 1분 대기 후 재시도
- 또는 DB에서 `otp_codes` 레코드 삭제

### 시도 횟수 초과

**원인:**
- 잘못된 OTP 5회 입력

**해결:**
- 새로운 OTP 발송 요청
- 또는 DB에서 `otp_codes` 레코드 삭제

### 로그인 후 로딩 화면에서 멈춤

**원인:**
- `useAuth` 훅의 `onAuthStateChange`에서 `setIsLoading(true)`가 먼저 호출됨
- 로그인 페이지에서 `isLoading` 체크가 `isAuthenticated` 체크보다 먼저 실행

**해결:**
- `src/app/(customer)/login/page.tsx`에서 `isAuthenticated` 체크를 먼저 배치
- 이미 수정됨 (2026-01-29)

### AbortError: signal is aborted without reason

**원인:**
- 컴포넌트 언마운트 시 비동기 요청이 정리되지 않음
- `useAuth` 훅의 의존성 배열에 `user` 포함으로 무한 재실행

**해결:**
- `useAuth.ts`에 `isMounted` 플래그와 `AbortController` 추가
- 의존성 배열에서 `user` 제거
- 이미 수정됨 (2026-01-29)

## 참고 문서

- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [설정 가이드](./TWILIO_OTP_SETUP.md)
- [테스트 가이드](./TWILIO_OTP_TESTING.md)

## 라이선스

이 프로젝트의 일부입니다.
