# Twilio OTP 인증 시스템 아키텍처

## 시스템 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                    Twilio OTP 인증 시스템                          │
│                                                                 │
│  클라이언트 → API → 서비스 → Twilio/Supabase → 응답              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 전체 아키텍처

```
┌──────────────────┐
│   Frontend       │
│  (React Hook)    │
└────────┬─────────┘
         │
         │ HTTP POST
         ▼
┌──────────────────┐
│   API Routes     │
│  /send-otp       │
│  /verify-otp     │
└────────┬─────────┘
         │
         │ Function Call
         ▼
┌──────────────────┐
│  OTP Service     │
│  - generateOTP   │
│  - sendOTP       │
│  - verifyOTP     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌─────────┐
│ Twilio │ │Supabase │
│  SMS   │ │   DB    │
└────────┘ └─────────┘
```

---

## 데이터 흐름

### 1. OTP 발송 플로우

```
사용자
  │
  │ 1. 전화번호 입력
  │
  ▼
Frontend (useTwilioOTP)
  │
  │ 2. POST /api/auth/twilio/send-otp
  │    { phone: "010-1234-5678" }
  │
  ▼
API Route (send-otp/route.ts)
  │
  │ 3. 전화번호 검증
  │ 4. Rate Limiting 확인
  │
  ▼
OTP Service (otp-service.ts)
  │
  ├──→ 5. generateOTP()
  │       └─→ "123456"
  │
  ├──→ 6. saveOTP(phone, code)
  │       └─→ Supabase DB 저장
  │            ┌─────────────────┐
  │            │   otp_codes     │
  │            │ phone | code    │
  │            │ 010.. | 123456  │
  │            └─────────────────┘
  │
  └──→ 7. sendOTP(phone, code)
        └─→ Twilio API 호출
             ┌──────────────────┐
             │  Twilio SMS      │
             │  +821012345678   │
             │  "인증번호: 123456" │
             └──────────────────┘
  │
  │ 8. Response
  │    { success: true, otp: "123456" }
  │
  ▼
Frontend
  │
  │ 9. OTP 입력 UI 표시
  │
  ▼
사용자 (SMS 수신)
```

---

### 2. OTP 검증 플로우

```
사용자
  │
  │ 1. OTP 입력 (123456)
  │
  ▼
Frontend (useTwilioOTP)
  │
  │ 2. POST /api/auth/twilio/verify-otp
  │    { phone: "010-1234-5678", code: "123456" }
  │
  ▼
API Route (verify-otp/route.ts)
  │
  │ 3. 입력 검증
  │
  ▼
OTP Service (otp-service.ts)
  │
  │ 4. verifyOTP(phone, code)
  │
  ├──→ Supabase 조회
  │    SELECT * FROM otp_codes WHERE phone = ?
  │
  ├──→ 만료 시간 확인
  │    NOW() > expires_at?
  │
  ├──→ 시도 횟수 확인
  │    attempts >= 5?
  │
  └──→ OTP 코드 검증
       code === data.code?
  │
  │ 5. 검증 성공
  │    └─→ OTP 삭제
  │
  ▼
API Route (verify-otp/route.ts)
  │
  │ 6. Supabase Auth 세션 생성
  │    - 신규 사용자: signUp
  │    - 기존 사용자: signInWithOtp
  │
  │ 7. Response
  │    { success: true, user: {...} }
  │
  ▼
Frontend
  │
  │ 8. 로그인 성공 처리
  │    - onSuccess 콜백 실행
  │    - 홈으로 리다이렉트
  │
  ▼
사용자 (로그인 완료)
```

---

## 파일 구조

```
C:/a/
│
├── src/
│   ├── lib/
│   │   └── twilio/
│   │       ├── client.ts          # Twilio SDK 초기화
│   │       ├── otp-service.ts     # 핵심 비즈니스 로직
│   │       └── index.ts           # Export 모듈
│   │
│   ├── app/
│   │   └── api/
│   │       └── auth/
│   │           └── twilio/
│   │               ├── send-otp/
│   │               │   └── route.ts    # OTP 발송 API
│   │               └── verify-otp/
│   │                   └── route.ts    # OTP 검증 API
│   │
│   ├── hooks/
│   │   └── use-twilio-otp.ts     # React Hook
│   │
│   └── components/
│       └── auth/
│           └── TwilioOTPLogin.tsx # 로그인 컴포넌트
│
├── supabase/
│   └── migrations/
│       └── 20260126000001_create_otp_codes_table.sql
│
├── docs/
│   ├── TWILIO_OTP_SETUP.md        # 설정 가이드
│   ├── TWILIO_OTP_TESTING.md      # 테스트 가이드
│   ├── TWILIO_OTP_README.md       # 빠른 시작
│   └── TWILIO_OTP_ARCHITECTURE.md # 아키텍처 (이 파일)
│
└── .env.example                    # 환경변수 예시
```

---

## 데이터베이스 스키마

```sql
┌──────────────────────────────────────────────────────────┐
│                     otp_codes                            │
├──────────────┬──────────────┬──────────────────────────┤
│ Column       │ Type         │ Description              │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ UUID         │ Primary Key              │
│ phone        │ VARCHAR(20)  │ 전화번호 (Unique)           │
│ code         │ VARCHAR(6)   │ OTP 코드                   │
│ expires_at   │ TIMESTAMP    │ 만료 시간 (5분 후)          │
│ attempts     │ INTEGER      │ 시도 횟수 (최대 5회)        │
│ created_at   │ TIMESTAMP    │ 생성 시간                  │
│ updated_at   │ TIMESTAMP    │ 수정 시간                  │
└──────────────┴──────────────┴──────────────────────────┘

인덱스:
- idx_otp_codes_phone (phone)
- idx_otp_codes_expires_at (expires_at)

RLS 정책:
- 클라이언트 접근 차단 (서버 전용)
```

---

## 보안 레이어

```
┌────────────────────────────────────────────────────────┐
│                   보안 메커니즘                          │
└────────────────────────────────────────────────────────┘

1. Rate Limiting
   ┌─────────────────────────────────────┐
   │ 동일 번호로 1분에 1회만 발송         │
   │                                     │
   │ checkRateLimit(phone)               │
   │   └→ created_at < NOW() - 60초?     │
   └─────────────────────────────────────┘

2. 시도 횟수 제한
   ┌─────────────────────────────────────┐
   │ OTP 검증 최대 5회 시도              │
   │                                     │
   │ verifyOTP(phone, code)              │
   │   └→ attempts >= 5? → DELETE        │
   └─────────────────────────────────────┘

3. OTP 만료
   ┌─────────────────────────────────────┐
   │ 생성 후 5분간 유효                  │
   │                                     │
   │ expires_at = NOW() + 5분            │
   │   └→ NOW() > expires_at? → DELETE   │
   └─────────────────────────────────────┘

4. Row Level Security (RLS)
   ┌─────────────────────────────────────┐
   │ 클라이언트 직접 접근 차단           │
   │                                     │
   │ CREATE POLICY "서버 전용"           │
   │   USING (false)                     │
   └─────────────────────────────────────┘

5. 환경변수 보호
   ┌─────────────────────────────────────┐
   │ Twilio 인증 정보 서버 전용          │
   │                                     │
   │ TWILIO_ACCOUNT_SID (서버)           │
   │ TWILIO_AUTH_TOKEN (서버)            │
   │ TWILIO_PHONE_NUMBER (서버)          │
   └─────────────────────────────────────┘
```

---

## API 계층 구조

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer                            │
└─────────────────────────────────────────────────────────┘

POST /api/auth/twilio/send-otp
├── Request
│   └── { phone: "010-1234-5678" }
│
├── Validation
│   ├── 전화번호 형식 검증 (한국 번호)
│   └── Rate limiting 확인
│
├── Processing
│   ├── generateOTP() → "123456"
│   ├── saveOTP(phone, code) → Supabase
│   └── sendOTP(phone, code) → Twilio
│
└── Response
    ├── Success (200)
    │   └── { success: true, otp: "123456" }
    │
    └── Error (400/429/500)
        └── { success: false, error: "..." }

───────────────────────────────────────────────────────────

POST /api/auth/twilio/verify-otp
├── Request
│   └── { phone: "010-1234-5678", code: "123456" }
│
├── Validation
│   ├── 전화번호 검증
│   └── OTP 코드 검증 (6자리)
│
├── Processing
│   ├── verifyOTP(phone, code)
│   │   ├── 만료 시간 확인
│   │   ├── 시도 횟수 확인
│   │   └── 코드 일치 확인
│   │
│   ├── Supabase Auth 세션 생성
│   │   ├── 신규 사용자: signUp
│   │   └── 기존 사용자: signInWithOtp
│   │
│   └── 프로필 조회/생성
│
└── Response
    ├── Success (200)
    │   └── { success: true, user: {...} }
    │
    └── Error (400/500)
        └── { success: false, error: "..." }
```

---

## 에러 처리 흐름

```
┌─────────────────────────────────────────────────────────┐
│                  에러 처리 계층                          │
└─────────────────────────────────────────────────────────┘

Frontend (useTwilioOTP)
  │
  ├── Network Error
  │   └→ "네트워크 오류가 발생했습니다."
  │
  ├── API Error (Response)
  │   └→ error 상태에 저장
  │
  └── Loading State
      └→ isLoading 관리

API Routes
  │
  ├── Validation Error (400)
  │   ├→ "전화번호를 입력해주세요."
  │   ├→ "올바른 전화번호 형식이 아닙니다."
  │   └→ "인증번호를 입력해주세요."
  │
  ├── Rate Limiting (429)
  │   └→ "1분에 1회만 인증번호를 요청할 수 있습니다."
  │
  └── Server Error (500)
      ├→ Twilio API Error
      ├→ Supabase DB Error
      └→ "OTP 발송에 실패했습니다."

OTP Service
  │
  ├── OTP 만료
  │   └→ { success: false, error: "인증번호가 만료되었습니다." }
  │
  ├── 시도 횟수 초과
  │   └→ { success: false, error: "인증 시도 횟수를 초과했습니다." }
  │
  └── OTP 불일치
      └→ { success: false, error: "인증번호가 일치하지 않습니다. (남은 시도: 4회)" }
```

---

## 상태 관리

```
Frontend Component State
┌────────────────────────────────────────┐
│ TwilioOTPLogin Component               │
│                                        │
│ State:                                 │
│ - phone: string                        │
│ - code: string                         │
│ - step: 'phone' | 'verify'             │
│ - countdown: number                    │
│ - devOTP: string | null                │
└────────────────────────────────────────┘
         │
         │ uses
         ▼
┌────────────────────────────────────────┐
│ useTwilioOTP Hook                      │
│                                        │
│ State:                                 │
│ - isLoading: boolean                   │
│ - error: string | null                 │
│                                        │
│ Functions:                             │
│ - sendOTP(phone)                       │
│ - verifyOTP(phone, code)               │
│ - clearError()                         │
└────────────────────────────────────────┘
         │
         │ calls
         ▼
┌────────────────────────────────────────┐
│ API Endpoints                          │
│                                        │
│ - POST /api/auth/twilio/send-otp       │
│ - POST /api/auth/twilio/verify-otp     │
└────────────────────────────────────────┘
```

---

## 개발 vs 프로덕션

```
┌─────────────────────────────────────────────────────────┐
│              환경별 동작 차이                            │
└─────────────────────────────────────────────────────────┘

Development (NODE_ENV=development)
├── OTP 응답에 포함
│   └── { success: true, otp: "123456" }
│
├── 상세한 로깅
│   ├── console.log("[Twilio] SMS 전송 성공")
│   └── console.error("[OTP] 검증 실패")
│
└── 테스트 편의성
    └── 개발자 도구에서 OTP 확인 가능

Production (NODE_ENV=production)
├── OTP 응답에 미포함
│   └── { success: true, message: "..." }
│
├── 최소 로깅
│   └── 에러만 기록
│
└── 보안 강화
    └── OTP는 SMS로만 확인 가능
```

---

## 성능 최적화

```
┌─────────────────────────────────────────────────────────┐
│                  성능 최적화 포인트                      │
└─────────────────────────────────────────────────────────┘

1. Database Indexing
   ┌────────────────────────────────────┐
   │ CREATE INDEX ON otp_codes(phone)   │
   │ → 전화번호 조회 성능 향상           │
   └────────────────────────────────────┘

2. Rate Limiting
   ┌────────────────────────────────────┐
   │ 불필요한 SMS 발송 방지              │
   │ → 비용 절감                        │
   └────────────────────────────────────┘

3. OTP 자동 삭제
   ┌────────────────────────────────────┐
   │ 검증 성공 시 즉시 삭제              │
   │ 만료된 OTP 정리                    │
   │ → 데이터베이스 크기 최소화          │
   └────────────────────────────────────┘

4. 클라이언트 캐싱
   ┌────────────────────────────────────┐
   │ useState로 로컬 상태 관리           │
   │ → API 호출 최소화                  │
   └────────────────────────────────────┘
```

---

## 확장 가능성

```
┌─────────────────────────────────────────────────────────┐
│                  향후 확장 방향                          │
└─────────────────────────────────────────────────────────┘

1. 다중 채널 지원
   ├── SMS (현재)
   ├── 이메일
   ├── 카카오톡
   └── WhatsApp

2. 국제화
   ├── 다국어 SMS 메시지
   ├── 국제 전화번호 지원
   └── 지역별 SMS 제공자 분기

3. 고급 보안
   ├── 2FA (Two-Factor Authentication)
   ├── Biometric 연동
   └── Device Fingerprinting

4. 분석 및 모니터링
   ├── SMS 발송 성공률
   ├── OTP 검증 성공률
   ├── 평균 인증 완료 시간
   └── 비용 분석

5. A/B 테스트
   ├── SMS 메시지 템플릿
   ├── OTP 길이 (6자리 vs 4자리)
   └── 만료 시간 (5분 vs 3분)
```

---

## 모니터링 대시보드

```
┌─────────────────────────────────────────────────────────┐
│              주요 모니터링 지표                          │
└─────────────────────────────────────────────────────────┘

1. SMS 발송 현황
   ├── 총 발송 건수
   ├── 성공률 (%)
   ├── 실패 원인 분석
   └── 비용 추적

2. OTP 검증 현황
   ├── 총 검증 시도
   ├── 성공률 (%)
   ├── 평균 시도 횟수
   └── 실패 원인 분석

3. 사용자 행동 분석
   ├── 평균 인증 완료 시간
   ├── 재발송 비율
   ├── 만료율
   └── 포기율

4. 시스템 성능
   ├── API 응답 시간
   ├── DB 쿼리 성능
   ├── Rate limiting 발생 빈도
   └── 에러 발생률
```

---

## 비용 분석

```
┌─────────────────────────────────────────────────────────┐
│                 Twilio SMS 비용 구조                     │
└─────────────────────────────────────────────────────────┘

국내 SMS (한국)
├── 발송 단가: 약 $0.05 USD/건
├── 월 1,000건: $50 USD
├── 월 10,000건: $500 USD
└── 월 100,000건: $5,000 USD

최적화 방안
├── Rate limiting으로 불필요한 발송 방지
├── OTP 만료 시간 최적화 (5분)
├── 시도 횟수 제한으로 악용 방지
└── 개발 환경에서 실제 SMS 발송 안 함
```

---

## 배포 체크리스트

```
┌─────────────────────────────────────────────────────────┐
│              프로덕션 배포 전 확인사항                   │
└─────────────────────────────────────────────────────────┘

환경 설정
□ Twilio 프로덕션 계정 잔액 충분
□ Vercel 환경변수 설정 완료
□ 프로덕션 DB 마이그레이션 완료
□ NODE_ENV=production 설정

테스트
□ 실제 전화번호로 SMS 수신 테스트
□ Rate limiting 동작 확인
□ OTP 만료 시나리오 테스트
□ 에러 처리 시나리오 테스트

보안
□ RLS 정책 활성화 확인
□ 환경변수 노출 확인
□ API 엔드포인트 보안 확인
□ HTTPS 사용 확인

모니터링
□ 에러 로깅 설정 (Sentry 등)
□ Twilio 콘솔 모니터링 설정
□ 알림 설정 (잔액 부족, 실패율 증가)
□ 성능 모니터링 설정

문서
□ 운영 가이드 작성
□ 트러블슈팅 가이드 준비
□ 팀 공유 및 교육
□ 백업 및 복구 계획
```

---

## 버그 수정 히스토리

### 2026-01-29: 로그인 후 리다이렉트 및 AbortError 수정

#### 1. 로그인 페이지 리다이렉트 순서 수정

**문제**: 로그인 성공 후 로딩 스피너에서 멈춤

```
┌─────────────────────────────────────────────────────────┐
│              수정 전 (버그)                              │
└─────────────────────────────────────────────────────────┘

onAuthStateChange 트리거
  │
  │ setIsLoading(true)  ← 문제: 로딩 상태가 먼저
  │
  ▼
로그인 페이지 렌더링
  │
  ├──→ if (isLoading) → 로딩 스피너 표시  ← 여기서 멈춤
  │
  └──→ if (isAuthenticated) → 리다이렉트  ← 실행 안됨

┌─────────────────────────────────────────────────────────┐
│              수정 후 (정상)                              │
└─────────────────────────────────────────────────────────┘

onAuthStateChange 트리거
  │
  │ setIsLoading(true)
  │
  ▼
로그인 페이지 렌더링
  │
  ├──→ if (isAuthenticated) → window.location.href = "/"  ← 먼저 체크
  │                            └→ 즉시 리다이렉트
  │
  └──→ if (isLoading) → 로딩 스피너  ← 인증 안됐을 때만
```

#### 2. useAuth Hook AbortController 추가

**문제**: React Strict Mode에서 AbortError 발생

```
┌─────────────────────────────────────────────────────────┐
│              수정 후 Cleanup 흐름                        │
└─────────────────────────────────────────────────────────┘

컴포넌트 마운트
  │
  ├──→ isMounted = true
  ├──→ abortController = new AbortController()
  │
  ▼
비동기 요청 시작
  │
  ├──→ supabase.auth.getUser()
  │    └→ 응답 전 isMounted 체크
  │
  ├──→ fetchProfile()
  │    └→ AbortError 시 무시
  │
  ▼
컴포넌트 언마운트 (Cleanup)
  │
  ├──→ isMounted = false
  ├──→ abortController.abort()
  ├──→ subscription.unsubscribe()
  └──→ removeEventListener('visibilitychange')
```

---

## 결론

이 아키텍처는 다음을 제공합니다:

1. 안전성: Rate limiting, 시도 횟수 제한, OTP 만료
2. 확장성: 모듈화된 구조, 독립적 컴포넌트
3. 유지보수성: 상세한 문서, 명확한 에러 처리
4. 개발 편의성: React Hook, 테스트 컴포넌트
5. 프로덕션 준비: RLS, 환경변수 검증, 로깅
6. **안정성**: AbortController 기반 cleanup, 메모리 누수 방지

---

## 참고 문서

- [설정 가이드](./TWILIO_OTP_SETUP.md)
- [테스트 가이드](./TWILIO_OTP_TESTING.md)
- [빠른 시작](./TWILIO_OTP_README.md)
- [구현 요약](../TWILIO_OTP_IMPLEMENTATION_SUMMARY.md)
