# Twilio OTP 인증 테스트 가이드

## 📋 테스트 체크리스트

### 환경 설정 테스트

- [ ] Twilio 환경변수 설정 확인
- [ ] 데이터베이스 마이그레이션 완료
- [ ] Twilio 계정 잔액 확인
- [ ] 발신 전화번호 인증 상태 확인

### 기능 테스트

- [ ] OTP 발송 성공
- [ ] OTP SMS 수신 확인
- [ ] OTP 검증 성공
- [ ] 로그인 세션 생성 확인

### 보안 테스트

- [ ] Rate limiting 동작 확인 (1분에 1회)
- [ ] 시도 횟수 제한 확인 (최대 5회)
- [ ] OTP 만료 시간 확인 (5분)
- [ ] 잘못된 OTP 입력 시 에러 처리

### 에러 처리 테스트

- [ ] 잘못된 전화번호 형식
- [ ] 만료된 OTP 검증
- [ ] 시도 횟수 초과
- [ ] 네트워크 오류 처리

---

## 1. 환경 설정 테스트

### 1.1 환경변수 확인

```bash
# .env.local 파일 확인
cat .env.local | grep TWILIO

# 출력 예시:
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_auth_token_here
# TWILIO_PHONE_NUMBER=+821012345678
```

### 1.2 데이터베이스 마이그레이션 확인

```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM information_schema.tables WHERE table_name = 'otp_codes';

-- 테이블이 존재하면 성공
```

---

## 2. API 테스트 (curl)

### 2.1 OTP 발송 테스트

```bash
# 성공 케이스
curl -X POST http://localhost:3000/api/auth/twilio/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678"}'

# 예상 응답:
# {
#   "success": true,
#   "message": "인증번호가 발송되었습니다.",
#   "otp": "123456"
# }
```

```bash
# 잘못된 전화번호 형식
curl -X POST http://localhost:3000/api/auth/twilio/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "123"}'

# 예상 응답:
# {
#   "success": false,
#   "error": "올바른 전화번호 형식이 아닙니다."
# }
```

```bash
# Rate limiting 테스트 (1분 내 재요청)
curl -X POST http://localhost:3000/api/auth/twilio/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678"}'

# 예상 응답:
# {
#   "success": false,
#   "error": "1분에 1회만 인증번호를 요청할 수 있습니다."
# }
```

### 2.2 OTP 검증 테스트

```bash
# 성공 케이스
curl -X POST http://localhost:3000/api/auth/twilio/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678", "code": "123456"}'

# 예상 응답:
# {
#   "success": true,
#   "message": "로그인되었습니다.",
#   "user": {
#     "id": "uuid-here",
#     "phone": "01012345678"
#   }
# }
```

```bash
# 잘못된 OTP
curl -X POST http://localhost:3000/api/auth/twilio/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "010-1234-5678", "code": "000000"}'

# 예상 응답:
# {
#   "success": false,
#   "error": "인증번호가 일치하지 않습니다. (남은 시도: 4회)"
# }
```

---

## 3. Frontend 테스트 (React Hook)

### 3.1 테스트 컴포넌트 생성

`src/app/test-otp/page.tsx` 파일 생성:

```tsx
'use client';

import { useState } from 'react';
import { useTwilioOTP } from '@/hooks/use-twilio-otp';

export default function TestOTPPage() {
  const { sendOTP, verifyOTP, isLoading, error, clearError } = useTwilioOTP();
  const [phone, setPhone] = useState('010-1234-5678');
  const [code, setCode] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSendOTP = async () => {
    clearError();
    addLog('OTP 발송 요청...');

    const result = await sendOTP(phone);

    if (result.success) {
      addLog(`✅ 성공: ${result.message}`);
      if (result.otp) {
        addLog(`📱 OTP: ${result.otp}`);
        setCode(result.otp); // 자동 입력
      }
    } else {
      addLog(`❌ 실패: ${result.error}`);
    }
  };

  const handleVerifyOTP = async () => {
    clearError();
    addLog('OTP 검증 요청...');

    const result = await verifyOTP(phone, code);

    if (result.success) {
      addLog(`✅ 성공: ${result.message}`);
      addLog(`👤 User ID: ${result.user?.id}`);
    } else {
      addLog(`❌ 실패: ${result.error}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Twilio OTP 테스트</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>전화번호:</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-1234-5678"
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
        />
      </div>

      <button
        onClick={handleSendOTP}
        disabled={isLoading}
        style={{ padding: '0.5rem 1rem', fontSize: '1rem', marginRight: '0.5rem' }}
      >
        {isLoading ? '발송 중...' : 'OTP 발송'}
      </button>

      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <label>인증번호:</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          maxLength={6}
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
        />
      </div>

      <button
        onClick={handleVerifyOTP}
        disabled={isLoading || !code}
        style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
      >
        {isLoading ? '검증 중...' : 'OTP 검증'}
      </button>

      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee', color: '#c00' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2>로그</h2>
        <div
          style={{
            background: '#f5f5f5',
            padding: '1rem',
            maxHeight: '300px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
          }}
        >
          {log.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 3.2 테스트 시나리오

1. **정상 흐름**
   - 전화번호 입력 (`010-1234-5678`)
   - "OTP 발송" 버튼 클릭
   - 로그에서 OTP 확인 (개발 환경)
   - OTP 입력 (자동 입력됨)
   - "OTP 검증" 버튼 클릭
   - 로그인 성공 확인

2. **Rate Limiting**
   - OTP 발송 후 즉시 재발송
   - "1분에 1회만..." 에러 확인

3. **잘못된 OTP**
   - OTP 발송
   - 잘못된 OTP 입력 (예: `000000`)
   - 에러 메시지 및 남은 시도 횟수 확인

4. **시도 횟수 초과**
   - 잘못된 OTP 5회 연속 입력
   - "시도 횟수 초과" 에러 확인

5. **OTP 만료**
   - OTP 발송
   - 5분 이상 대기
   - OTP 검증 시도
   - "만료되었습니다" 에러 확인

---

## 4. Postman/Insomnia 테스트

### 4.1 컬렉션 설정

**Collection:** Twilio OTP Tests

**Environment Variables:**
```
base_url: http://localhost:3000
phone: 010-1234-5678
```

### 4.2 테스트 케이스

#### Test 1: Send OTP (Success)
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/twilio/send-otp`
- **Body:**
  ```json
  {
    "phone": "{{phone}}"
  }
  ```
- **Expected:** 200, `success: true`

#### Test 2: Send OTP (Invalid Phone)
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/twilio/send-otp`
- **Body:**
  ```json
  {
    "phone": "123"
  }
  ```
- **Expected:** 400, `error: "올바른 전화번호 형식이 아닙니다."`

#### Test 3: Verify OTP (Success)
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/twilio/verify-otp`
- **Body:**
  ```json
  {
    "phone": "{{phone}}",
    "code": "123456"
  }
  ```
- **Expected:** 200, `success: true`

#### Test 4: Verify OTP (Wrong Code)
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/twilio/verify-otp`
- **Body:**
  ```json
  {
    "phone": "{{phone}}",
    "code": "000000"
  }
  ```
- **Expected:** 400, `error: "인증번호가 일치하지 않습니다..."`

---

## 5. 데이터베이스 확인

### 5.1 OTP 코드 조회

```sql
-- Supabase SQL Editor
SELECT * FROM otp_codes ORDER BY created_at DESC;

-- 예상 결과:
-- id | phone        | code   | expires_at          | attempts | created_at
-- ---+--------------+--------+---------------------+----------+------------
-- ...| 01012345678  | 123456 | 2026-01-26 10:05:00 | 0        | 2026-01-26 10:00:00
```

### 5.2 만료된 OTP 삭제

```sql
-- 수동 실행
SELECT delete_expired_otp_codes();

-- 또는 직접 삭제
DELETE FROM otp_codes WHERE expires_at < NOW();
```

---

## 6. 자동화 테스트 (Jest/Vitest)

### 6.1 OTP 서비스 유닛 테스트

```typescript
// src/lib/twilio/__tests__/otp-service.test.ts

import { generateOTP, formatPhoneNumber } from '../otp-service';

describe('OTP Service', () => {
  describe('generateOTP', () => {
    it('should generate 6-digit OTP', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Korean phone number', () => {
      expect(formatPhoneNumber('010-1234-5678')).toBe('+821012345678');
      expect(formatPhoneNumber('01012345678')).toBe('+821012345678');
    });

    it('should handle already formatted number', () => {
      expect(formatPhoneNumber('+821012345678')).toBe('+821012345678');
    });
  });
});
```

### 6.2 API 통합 테스트

```typescript
// src/app/api/auth/twilio/__tests__/send-otp.test.ts

import { POST } from '../send-otp/route';

describe('POST /api/auth/twilio/send-otp', () => {
  it('should send OTP successfully', async () => {
    const request = new Request('http://localhost:3000/api/auth/twilio/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '010-1234-5678' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject invalid phone number', async () => {
    const request = new Request('http://localhost:3000/api/auth/twilio/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
```

---

## 7. 프로덕션 체크리스트

배포 전 확인 사항:

- [ ] Twilio 프로덕션 계정 잔액 충분
- [ ] 환경변수 Vercel/배포 플랫폼에 설정
- [ ] 데이터베이스 마이그레이션 프로덕션 DB에 적용
- [ ] Rate limiting 정상 작동 확인
- [ ] SMS 수신 테스트 (실제 전화번호)
- [ ] 에러 로깅 설정 (Sentry 등)
- [ ] OTP 만료 자동 삭제 설정 (pg_cron 또는 스케줄러)

---

## 8. 모니터링

### 8.1 Twilio 콘솔

- **SMS Logs:** https://console.twilio.com/us1/monitor/logs/sms
- **Messaging Insights:** https://console.twilio.com/us1/monitor/insights/messaging

### 8.2 Supabase 콘솔

- **Table Editor:** `otp_codes` 테이블 모니터링
- **Database Logs:** 쿼리 성능 확인

### 8.3 주요 메트릭

- OTP 발송 성공률
- OTP 검증 성공률
- 평균 인증 완료 시간
- Rate limiting 발생 빈도
- 시도 횟수 초과 비율

---

## 트러블슈팅 FAQ

**Q1: OTP가 발송되지 않아요.**

A: Twilio 콘솔 > Logs에서 오류 확인. 대부분 잔액 부족 또는 전화번호 형식 오류.

**Q2: 개발 환경에서 OTP가 응답에 포함되지 않아요.**

A: `NODE_ENV=development` 환경변수 확인.

**Q3: Rate limiting이 작동하지 않아요.**

A: Supabase `otp_codes` 테이블에서 `created_at` 컬럼 확인.

**Q4: 로그인 후 세션이 생성되지 않아요.**

A: Supabase Auth 설정 확인. `profiles` 테이블 RLS 정책 확인.
