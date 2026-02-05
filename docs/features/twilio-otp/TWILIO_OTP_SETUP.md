# Twilio SMS OTP 인증 시스템 설정 가이드

## 📋 목차

1. [개요](#개요)
2. [시스템 구조](#시스템-구조)
3. [인증 흐름](#인증-흐름)
4. [환경변수 설정](#환경변수-설정)
5. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
6. [사용 방법](#사용-방법)
7. [API 명세](#api-명세)
8. [보안 고려사항](#보안-고려사항)
9. [테스트](#테스트)
10. [트러블슈팅](#트러블슈팅)

---

## 개요

Twilio SMS OTP 인증 시스템은 전화번호를 통한 안전한 사용자 인증을 제공합니다.

### 주요 기능

- 6자리 랜덤 OTP 생성
- Twilio API를 통한 SMS 발송
- Rate limiting (1분에 1회)
- 시도 횟수 제한 (최대 5회)
- OTP 만료 시간 관리 (5분)
- Supabase Auth 통합

---

## 시스템 구조

```
src/
├── lib/
│   └── twilio/
│       ├── client.ts          # Twilio SDK 초기화
│       ├── otp-service.ts     # OTP 생성/발송/검증 로직
│       └── index.ts           # Export 모듈
├── app/
│   └── api/
│       └── auth/
│           └── twilio/
│               ├── send-otp/
│               │   └── route.ts    # OTP 발송 API
│               └── verify-otp/
│                   └── route.ts    # OTP 검증 API
└── hooks/
    └── use-twilio-otp.ts      # React Hook (Frontend)

supabase/
└── migrations/
    └── 20260126000001_create_otp_codes_table.sql
```

---

## 인증 흐름

### 전체 흐름도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Twilio OTP 인증 흐름                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ 사용자  │     │  클라이언트  │     │   API 서버  │     │   Supabase   │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬───────┘
     │                 │                   │                   │
     │  1. 전화번호 입력│                   │                   │
     │────────────────>│                   │                   │
     │                 │                   │                   │
     │                 │  2. POST /send-otp│                   │
     │                 │──────────────────>│                   │
     │                 │                   │                   │
     │                 │                   │  3. OTP 저장      │
     │                 │                   │──────────────────>│
     │                 │                   │                   │
     │                 │                   │  4. SMS 발송 (Twilio)
     │                 │                   │─────────────┐     │
     │                 │                   │<────────────┘     │
     │                 │                   │                   │
     │  5. SMS 수신     │                   │                   │
     │<─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─│                   │
     │                 │                   │                   │
     │  6. OTP 입력    │                   │                   │
     │────────────────>│                   │                   │
     │                 │                   │                   │
     │                 │ 7. POST /verify-otp                   │
     │                 │──────────────────>│                   │
     │                 │                   │                   │
     │                 │                   │  8. OTP 검증      │
     │                 │                   │──────────────────>│
     │                 │                   │                   │
     │                 │                   │  9. 가상 이메일 세션│
     │                 │                   │     생성 요청      │
     │                 │                   │──────────────────>│
     │                 │                   │                   │
     │                 │                   │  10. 세션 토큰 반환│
     │                 │                   │<──────────────────│
     │                 │                   │                   │
     │                 │ 11. 세션 정보 반환 │                   │
     │                 │<──────────────────│                   │
     │                 │                   │                   │
     │                 │ 12. setSession()  │                   │
     │                 │ 클라이언트 세션 설정                   │
     │                 │──────────────────────────────────────>│
     │                 │                   │                   │
     │ 13. 로그인 완료 │                   │                   │
     │<────────────────│                   │                   │
     │                 │                   │                   │
```

### 가상 이메일 기반 세션 생성

Supabase Auth는 기본적으로 이메일/소셜 로그인을 지원합니다. 전화번호 OTP 인증을 Supabase 세션과 통합하기 위해 **가상 이메일 방식**을 사용합니다.

#### 가상 이메일 변환 규칙

전화번호를 다음 형식의 가상 이메일로 변환합니다:

```
{정규화된_전화번호}@phone.todays-massage.local
```

**예시:**
| 전화번호 입력 | 정규화된 번호 | 가상 이메일 |
|--------------|--------------|-------------|
| `010-1234-5678` | `01012345678` | `01012345678@phone.todays-massage.local` |
| `+82 10 1234 5678` | `01012345678` | `01012345678@phone.todays-massage.local` |

#### 서버 측 세션 생성 (verify-otp API)

```typescript
// app/api/auth/twilio/verify-otp/route.ts

// 1. OTP 검증 성공 후, 가상 이메일 생성
const normalizedPhone = phone.replace(/[^0-9]/g, '');
const virtualEmail = `${normalizedPhone}@phone.todays-massage.local`;
const tempPassword = `otp_${Date.now()}_${Math.random().toString(36)}`;

// 2. Supabase Admin으로 사용자 생성 또는 조회
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // 서비스 역할 키 필요
);

// 3. 기존 사용자 확인
let { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
let user = existingUser.users.find(u => u.email === virtualEmail);

// 4. 없으면 새 사용자 생성
if (!user) {
  const { data } = await supabaseAdmin.auth.admin.createUser({
    email: virtualEmail,
    password: tempPassword,
    email_confirm: true,  // 이메일 인증 건너뛰기
    user_metadata: {
      phone: normalizedPhone,
      auth_method: 'phone_otp'
    }
  });
  user = data.user;
}

// 5. 세션 토큰 생성
const { data: session } = await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',
  email: virtualEmail,
});

// 6. 클라이언트에 세션 정보 반환
return NextResponse.json({
  success: true,
  session: {
    access_token: session.properties.access_token,
    refresh_token: session.properties.refresh_token,
    expires_in: 3600,
  },
  user: {
    id: user.id,
    phone: normalizedPhone
  }
});
```

#### 클라이언트 측 세션 설정 (use-twilio-otp.ts)

```typescript
// hooks/use-twilio-otp.ts

const verifyOTP = async (phone: string, code: string) => {
  const response = await fetch('/api/auth/twilio/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });

  const data = await response.json();

  if (data.success && data.session) {
    // Supabase 클라이언트에 세션 설정
    const supabase = createClientComponentClient();
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  return data;
};
```

### 세션 유지 및 갱신

- 세션은 Supabase Auth의 표준 메커니즘을 따릅니다
- Access Token: 1시간 유효
- Refresh Token: 자동 갱신 (Supabase 클라이언트가 처리)
- 로그아웃: `supabase.auth.signOut()` 호출

---

## 환경변수 설정

### 1. Twilio 계정 생성

1. [Twilio 콘솔](https://console.twilio.com)에 접속
2. 계정 생성 또는 로그인
3. Account > Keys & Credentials 메뉴로 이동

### 2. Twilio 전화번호 구매

1. Twilio 콘솔 > Phone Numbers > Buy a Number
2. 한국 전화번호 선택 또는 국제 번호 구매
3. SMS 기능이 활성화된 번호 선택

### 3. 환경변수 설정

`.env.local` 파일에 다음 내용 추가:

```bash
# Twilio SMS OTP 인증
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+821012345678
```

#### 환경변수 설명

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `TWILIO_ACCOUNT_SID` | Twilio 계정 식별자 | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio 인증 토큰 | `your_auth_token_here` |
| `TWILIO_PHONE_NUMBER` | Twilio 발신 전화번호 (E.164 형식) | `+821012345678` |

---

## 데이터베이스 마이그레이션

### Supabase CLI 사용

```bash
# 마이그레이션 적용
npx supabase db push

# 또는 특정 파일만 실행
npx supabase db execute -f supabase/migrations/20260126000001_create_otp_codes_table.sql
```

### Supabase Dashboard 사용

1. Supabase Dashboard > SQL Editor
2. `supabase/migrations/20260126000001_create_otp_codes_table.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기 후 실행

### 테이블 구조

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

---

## 사용 방법

### 1. React Hook 사용 (권장)

```tsx
import { useTwilioOTP } from '@/hooks/use-twilio-otp';

function LoginPage() {
  const { sendOTP, verifyOTP, isLoading, error } = useTwilioOTP();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  // OTP 발송
  const handleSendOTP = async () => {
    const result = await sendOTP(phone);

    if (result.success) {
      alert('인증번호가 발송되었습니다.');

      // 개발 환경에서는 OTP 확인 가능
      if (result.otp) {
        console.log('OTP:', result.otp);
      }
    } else {
      alert(result.error);
    }
  };

  // OTP 검증
  const handleVerifyOTP = async () => {
    const result = await verifyOTP(phone, code);

    if (result.success) {
      alert('로그인 성공!');
      // 로그인 후 리다이렉트
      router.push('/');
    } else {
      alert(result.error);
    }
  };

  return (
    <div>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="010-1234-5678"
      />
      <button onClick={handleSendOTP} disabled={isLoading}>
        인증번호 발송
      </button>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="인증번호 6자리"
        maxLength={6}
      />
      <button onClick={handleVerifyOTP} disabled={isLoading}>
        인증 확인
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### 2. API 직접 호출

```tsx
// OTP 발송
const sendOTP = async (phone: string) => {
  const response = await fetch('/api/auth/twilio/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  const data = await response.json();
  return data;
};

// OTP 검증
const verifyOTP = async (phone: string, code: string) => {
  const response = await fetch('/api/auth/twilio/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });

  const data = await response.json();
  return data;
};
```

---

## API 명세

### 1. OTP 발송 API

**Endpoint:** `POST /api/auth/twilio/send-otp`

**Request:**
```json
{
  "phone": "010-1234-5678"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "인증번호가 발송되었습니다.",
  "otp": "123456"  // 개발 환경에서만 포함
}
```

**Error Response (400/429/500):**
```json
{
  "success": false,
  "error": "1분에 1회만 인증번호를 요청할 수 있습니다."
}
```

### 2. OTP 검증 API

**Endpoint:** `POST /api/auth/twilio/verify-otp`

**Request:**
```json
{
  "phone": "010-1234-5678",
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "로그인되었습니다.",
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.refresh_token_here...",
    "expires_in": 3600
  },
  "user": {
    "id": "uuid-here",
    "phone": "01012345678"
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "인증번호가 일치하지 않습니다. (남은 시도: 4회)"
}
```

---

## 보안 고려사항

### 1. Rate Limiting

- 동일 전화번호로 1분에 1회만 OTP 발송 가능
- DB에 마지막 발송 시간 저장 및 검증

### 2. 시도 횟수 제한

- OTP 검증 최대 5회 시도 가능
- 초과 시 OTP 자동 삭제 및 재발송 필요

### 3. OTP 만료 시간

- OTP 생성 후 5분간 유효
- 만료된 OTP는 검증 시 자동 삭제

### 4. 환경변수 보호

- Twilio 인증 정보는 절대 클라이언트에 노출 금지
- `.env.local` 파일은 `.gitignore`에 추가

### 5. Row Level Security (RLS)

- `otp_codes` 테이블은 서버에서만 접근 가능
- 클라이언트 직접 접근 차단

### 6. 가상 이메일 도메인 격리

- 가상 이메일은 `@phone.todays-massage.local` 도메인 사용
- 실제 이메일과 충돌 방지
- `.local` TLD는 외부 라우팅 불가능 (RFC 2606)

### 7. 서비스 역할 키 보호

- `SUPABASE_SERVICE_ROLE_KEY`는 서버 측에서만 사용
- Admin API 접근에 필요 (사용자 생성, 세션 발급)
- 절대 클라이언트에 노출 금지

---

## 테스트

### 1. 로컬 테스트

```bash
# 개발 서버 실행
npm run dev

# API 테스트 (curl)
curl -X POST http://localhost:3000/api/auth/twilio/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678"}'

# OTP 검증 (개발 환경에서 받은 OTP 사용)
curl -X POST http://localhost:3000/api/auth/twilio/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678", "code": "123456"}'
```

### 2. 개발 환경 OTP 확인

개발 환경(`NODE_ENV=development`)에서는 API 응답에 OTP가 포함됩니다.

```json
{
  "success": true,
  "message": "인증번호가 발송되었습니다.",
  "otp": "123456"  // 개발 환경에서만 포함
}
```

### 3. Postman/Insomnia 테스트

1. **OTP 발송 요청**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/twilio/send-otp`
   - Body: `{"phone": "010-1234-5678"}`

2. **OTP 검증 요청**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/twilio/verify-otp`
   - Body: `{"phone": "010-1234-5678", "code": "123456"}`

---

## 트러블슈팅

### 1. Twilio 환경변수 오류

**오류:**
```
Error: TWILIO_ACCOUNT_SID 환경변수가 설정되지 않았습니다.
```

**해결:**
- `.env.local` 파일 확인
- 환경변수 이름 오타 확인
- 서버 재시작 (`npm run dev`)

### 2. SMS 발송 실패

**오류:**
```
SMS 전송에 실패했습니다.
```

**해결:**
- Twilio 콘솔에서 계정 잔액 확인
- 전화번호 형식 확인 (E.164 형식: `+821012345678`)
- Twilio 콘솔 > Logs에서 오류 메시지 확인

### 3. Rate Limiting 오류

**오류:**
```
1분에 1회만 인증번호를 요청할 수 있습니다.
```

**해결:**
- 1분 대기 후 재시도
- 또는 Supabase에서 `otp_codes` 테이블의 해당 전화번호 레코드 삭제

### 4. OTP 만료

**오류:**
```
인증번호가 만료되었습니다.
```

**해결:**
- OTP는 5분간 유효
- 새로운 OTP 발송 요청

### 5. 시도 횟수 초과

**오류:**
```
인증 시도 횟수를 초과했습니다.
```

**해결:**
- 새로운 OTP 발송 요청
- 또는 Supabase에서 `otp_codes` 테이블의 해당 전화번호 레코드 삭제

### 6. 로그인 후 세션이 유지되지 않음

**증상:**
- OTP 인증은 성공하지만 로그인 상태가 유지되지 않음
- 페이지 새로고침 시 로그아웃됨
- Header 등에서 사용자 정보가 표시되지 않음

**원인:**
- 클라이언트에서 `setSession()` 호출 누락
- API 응답에서 세션 정보 누락

**해결:**
1. `verify-otp` API가 `session` 객체를 반환하는지 확인
2. 클라이언트 hook에서 `setSession()` 호출 확인:
```typescript
// use-twilio-otp.ts
if (data.success && data.session) {
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}
```

### 7. 가상 이메일 사용자 중복 생성

**증상:**
- 동일 전화번호로 여러 사용자가 생성됨

**원인:**
- 사용자 조회 로직 오류

**해결:**
- `listUsers` 대신 이메일로 직접 조회:
```typescript
const { data } = await supabaseAdmin
  .from('auth.users')
  .select('*')
  .eq('email', virtualEmail)
  .single();
```

---

## 추가 참고 자료

- [Twilio SMS API 문서](https://www.twilio.com/docs/sms)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Supabase Admin API 문서](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Next.js API Routes 문서](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-26 | 1.0 | 초기 문서 작성 |
| 2026-01-28 | 1.1 | 가상 이메일 기반 세션 생성 방식 추가, 인증 흐름도 추가, 트러블슈팅 항목 추가 |
