# todays-massage 프로젝트 설정

> 이 파일은 프로젝트 특화 Claude Code 설정입니다.
> Global CLAUDE.md 규칙이 자동 적용되며, 여기서 프로젝트별 추가 설정을 정의합니다.

---

## 프로젝트 정보

| 항목 | 값 |
|------|-----|
| **프로젝트명** | todays-massage |
| **프레임워크** | Next.js 14.2.5 |
| **언어** | TypeScript 5.5.0 |
| **UI** | React 18.3.1 + Tailwind CSS 3.4.4 + shadcn/ui |
| **백엔드** | Supabase + Firebase |
| **테스트** | Playwright 1.58.0 + BackstopJS 6.3.25 + axe-core 4.11.0 |
| **패키지 매니저** | npm |

### 추가 기술 스택

| 분류 | 패키지 | 버전 | 용도 |
|------|--------|------|------|
| **상태 관리** | Zustand | 4.5.0 | 클라이언트 상태 |
| **상태 관리** | @tanstack/react-query | 5.50.0 | 서버 상태 |
| **폼 관리** | react-hook-form | 7.71.1 | 폼 처리 |
| **검증** | zod | 4.3.6 | 스키마 검증 |
| **애니메이션** | framer-motion | 11.3.0 | UI 애니메이션 |
| **차트** | recharts | 2.15.4 | 데이터 시각화 |
| **엑셀** | xlsx | 0.18.5 | 엑셀 파일 처리 |
| **아이콘** | lucide-react | 0.400.0 | 아이콘 라이브러리 |
| **캐러셀** | embla-carousel-react | 8.6.0 | 슬라이더/캐러셀 |
| **토스트** | sonner | 2.0.7 | 알림 토스트 |

---

## 자동 도구 선택 (프로젝트 특화)

### 프론트엔드 작업 시 자동 활성화
```
1. frontend-development 스킬
2. artifacts-builder 스킬 (복잡한 컴포넌트)
3. mcp__context7 (Next.js 14, React 18 최신 문서)
4. visual-testing-skill (시각적 검증)
5. playwright-skill-advanced (E2E 테스트)
```

### 백엔드/API 작업 시 자동 활성화
```
1. backend-development 스킬
2. mcp__supabase (데이터베이스 작업)
3. mcp__firebase (인증 작업)
4. test-driven-development 스킬
```

### 테스트 작업 시 자동 활성화
```
1. playwright-skill-advanced (E2E)
2. visual-testing-skill (시각적 회귀 + 접근성)
3. webapp-testing (로컬 서버 테스트)
4. claude-code-test-runner (AI 테스트)
```

---

## 프로젝트 구조

```
C:/a/
├── middleware.ts              # Next.js 미들웨어 (인증/리다이렉트)
├── next.config.mjs            # Next.js 설정
├── tailwind.config.ts         # Tailwind CSS 설정
├── playwright.config.ts       # Playwright 설정
├── backstop.json              # BackstopJS 설정
├── components.json            # shadcn/ui CLI 설정
├── vercel.json                # Vercel 배포 설정
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (admin)/           # 관리자 페이지 그룹
│   │   │   └── admin/
│   │   │       ├── page.tsx           # 대시보드
│   │   │       ├── users/             # 회원 관리
│   │   │       ├── shops/             # 매장 관리
│   │   │       ├── settlements/       # 정산 관리
│   │   │       ├── content/           # 콘텐츠 관리
│   │   │       ├── reports/           # 신고/CS 관리
│   │   │       └── settings/          # 시스템 설정
│   │   │
│   │   ├── (customer)/        # 고객 페이지 그룹 (루트 경로)
│   │   │   ├── page.tsx               # 홈페이지 (/)
│   │   │   ├── login/                 # 로그인 (/login)
│   │   │   ├── search/                # 검색 (/search)
│   │   │   ├── nearby/                # 근처 매장 (/nearby)
│   │   │   ├── shops/[id]/            # 매장 상세 (/shops/[id])
│   │   │   ├── reservations/          # 예약 목록 (/reservations)
│   │   │   ├── booking/complete/      # 예약 완료
│   │   │   ├── mypage/                # 마이페이지
│   │   │   ├── chat/                  # 채팅
│   │   │   ├── favorites/             # 즐겨찾기
│   │   │   ├── coupons/               # 쿠폰
│   │   │   ├── points/                # 포인트
│   │   │   ├── roulette/              # 이벤트 룰렛
│   │   │   ├── attendance/            # 출석 체크
│   │   │   ├── referral/              # 친구 초대
│   │   │   ├── notifications/         # 알림
│   │   │   ├── faq/                   # FAQ
│   │   │   ├── terms/                 # 이용약관
│   │   │   ├── privacy/               # 개인정보처리방침
│   │   │   └── about/                 # 앱 소개
│   │   │
│   │   ├── partner/           # 파트너 페이지 그룹
│   │   │   ├── page.tsx               # 대시보드 (/partner)
│   │   │   ├── join/                  # 파트너 가입
│   │   │   ├── reservations/          # 예약 관리
│   │   │   ├── chat/                  # 고객 문의
│   │   │   ├── courses/               # 코스 관리
│   │   │   ├── settlements/           # 정산
│   │   │   ├── statistics/            # 통계
│   │   │   ├── customers/             # 고객 관리
│   │   │   ├── staff/                 # 직원 관리
│   │   │   ├── operating-hours/       # 운영 시간
│   │   │   ├── coupons/               # 쿠폰 관리
│   │   │   ├── reviews/               # 리뷰 관리
│   │   │   ├── shop/                  # 매장 정보
│   │   │   └── settings/              # 설정
│   │   │
│   │   ├── api/               # API 엔드포인트
│   │   │   ├── auth/twilio/           # Twilio OTP 인증
│   │   │   │   ├── send-otp/
│   │   │   │   └── verify-otp/
│   │   │   ├── fcm/                   # Firebase Cloud Messaging
│   │   │   │   ├── send/
│   │   │   │   └── token/
│   │   │   ├── notifications/         # 알림
│   │   │   │   ├── alimtalk/
│   │   │   │   └── unread-count/
│   │   │   ├── payment/               # 결제 (PortOne)
│   │   │   │   ├── verify/
│   │   │   │   └── webhook/
│   │   │   └── settings/              # 설정
│   │   │       └── status/
│   │   │
│   │   ├── auth/              # OAuth 콜백
│   │   │   └── callback/
│   │   │
│   │   └── maintenance/       # 유지보수 페이지
│   │
│   ├── components/            # React 컴포넌트
│   │   ├── ui/                        # shadcn/ui 컴포넌트 (40+개)
│   │   ├── admin/                     # 관리자 UI
│   │   ├── customer/                  # 고객 UI
│   │   ├── partner/                   # 파트너 UI
│   │   ├── auth/                      # 인증 관련
│   │   ├── chat/                      # 채팅 UI
│   │   ├── attendance/                # 출석 관련
│   │   ├── notifications/             # 알림 UI
│   │   └── shared/                    # 공용 컴포넌트
│   │
│   ├── hooks/                 # Custom React 훅
│   │   ├── useAuth.ts                 # 인증 관리
│   │   ├── useChat.ts                 # 채팅 기능
│   │   ├── useFCM.ts                  # Firebase Cloud Messaging
│   │   ├── useImageUpload.ts          # 이미지 업로드
│   │   ├── use-mobile.tsx             # 반응형 감지
│   │   ├── use-toast.ts               # 토스트 알림
│   │   └── use-twilio-otp.ts          # Twilio OTP
│   │
│   ├── lib/                   # 유틸리티
│   │   ├── supabase/                  # Supabase 클라이언트
│   │   │   ├── client.ts              # 브라우저 클라이언트
│   │   │   └── server.ts              # 서버 클라이언트
│   │   ├── firebase/                  # Firebase 설정
│   │   │   ├── client.ts              # 클라이언트 SDK
│   │   │   └── admin.ts               # Admin SDK
│   │   ├── twilio/                    # Twilio 클라이언트
│   │   │   └── client.ts
│   │   ├── kakao/                     # 카카오 알림톡
│   │   │   └── client.ts
│   │   ├── api/                       # API 클라이언트 함수 (21개)
│   │   │   ├── admin-logs.ts
│   │   │   ├── attendance.ts
│   │   │   ├── chat.ts
│   │   │   ├── content.ts
│   │   │   ├── coupons.ts
│   │   │   ├── favorites.ts
│   │   │   ├── filters.ts
│   │   │   ├── notification.ts
│   │   │   ├── operating-hours.ts
│   │   │   ├── partner.ts
│   │   │   ├── points.ts
│   │   │   ├── referrals.ts
│   │   │   ├── reservations.ts
│   │   │   ├── reviews.ts
│   │   │   ├── roulette.ts
│   │   │   ├── settings.ts
│   │   │   ├── settlements.ts
│   │   │   ├── shops.ts
│   │   │   ├── staff.ts
│   │   │   ├── storage.ts
│   │   │   └── users.ts
│   │   └── admin/                     # 관리자 헬퍼
│   │
│   └── types/                 # TypeScript 타입
│
├── e2e/                       # Playwright E2E 테스트
│   ├── helpers/
│   │   └── accessibility.ts           # 접근성 테스트 헬퍼
│   ├── admin-pages.spec.ts
│   ├── auth.spec.ts
│   ├── customer-app-full-test.spec.ts
│   ├── homepage.spec.ts
│   ├── nearby.spec.ts
│   ├── partner-app-full-test.spec.ts
│   ├── search.spec.ts
│   └── shop-detail.spec.ts
│
├── backstop_data/             # BackstopJS 데이터
│   ├── bitmaps_reference/             # 기준 스크린샷
│   ├── bitmaps_test/                  # 테스트 스크린샷
│   ├── html_report/                   # HTML 리포트
│   └── engine_scripts/                # 엔진 스크립트
│
├── docs/                      # 프로젝트 문서
├── scripts/                   # 유틸리티 스크립트
├── supabase/                  # Supabase 마이그레이션
└── public/                    # 정적 파일
    ├── icons/
    ├── images/
    └── splash/
```

---

## 테스트 명령어

```bash
# E2E 테스트
npm run test:e2e              # Playwright 테스트 실행
npm run test:e2e:ui           # Playwright UI 모드
npm run test:e2e:headed       # 브라우저 표시
npm run test:e2e:debug        # 디버그 모드
npm run test:report           # HTML 리포트 보기

# 시각적 회귀 테스트
npm run test:visual           # backstop test (회귀 테스트)
npm run test:visual:approve   # backstop approve (승인)
npm run test:visual:reference # backstop reference (기준 생성)

# 또는 직접 실행
npx backstop reference        # 기준 스크린샷 생성
npx backstop test             # 회귀 테스트 실행
npx backstop approve          # 새 기준으로 승인

# 접근성 테스트
npx playwright test --grep @accessibility
```

---

## 완료 검증 체크리스트

모든 작업 완료 전 자동 검증:

- [ ] `npm run build` 성공
- [ ] `npx tsc --noEmit` 타입 에러 없음
- [ ] `npm run lint` 린트 통과
- [ ] `npm run test:e2e` E2E 테스트 통과
- [ ] `npx backstop test` 시각적 회귀 없음
- [ ] 접근성 테스트 통과 (critical/serious 0개)
- [ ] 스크린샷으로 UI 시각적 확인

---

## 주요 경로

### 고객 (Customer) - `(customer)` 라우트 그룹

| 용도 | 경로 | 설명 |
|------|------|------|
| 홈페이지 | `/` | 메인 랜딩 페이지 |
| 로그인 | `/login` | 고객 로그인 |
| 검색 | `/search` | 매장 검색 |
| 근처 매장 | `/nearby` | 위치 기반 검색 |
| 매장 상세 | `/shops/[id]` | 매장 정보 |
| 매장 리뷰 | `/shops/[id]/reviews` | 매장 리뷰 목록 |
| 예약 목록 | `/reservations` | 나의 예약 |
| 예약 완료 | `/booking/complete` | 예약 완료 페이지 |
| 마이페이지 | `/mypage` | 회원 정보 |
| 채팅 | `/chat` | 채팅 목록 |
| 채팅방 | `/chat/[shopId]` | 매장 채팅 |
| 즐겨찾기 | `/favorites` | 저장한 매장 |
| 쿠폰 | `/coupons` | 쿠폰 목록 |
| 포인트 | `/points` | 포인트 현황 |
| 룰렛 | `/roulette` | 이벤트 룰렛 |
| 출석 | `/attendance` | 출석 체크 |
| 친구 초대 | `/referral` | 리퍼럴 프로그램 |
| 알림 | `/notifications` | 알림 목록 |

### 관리자 (Admin) - `(admin)` 라우트 그룹

| 용도 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/admin` | 관리자 메인 |
| 회원 관리 | `/admin/users` | 모든 회원 관리 |
| 매장 관리 | `/admin/shops` | 모든 매장 관리 |
| 정산 관리 | `/admin/settlements` | 정산 현황 |
| 콘텐츠 관리 | `/admin/content` | 공지/배너 관리 |
| 신고 관리 | `/admin/reports` | 신고/CS 관리 |
| 시스템 설정 | `/admin/settings` | 시스템 설정 |

### 파트너 (Partner) - `partner` 라우트 그룹

| 용도 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/partner` | 파트너 메인 |
| 파트너 가입 | `/partner/join` | 신규 가입 |
| 예약 관리 | `/partner/reservations` | 예약 현황 |
| 고객 문의 | `/partner/chat` | 채팅 목록 |
| 채팅방 | `/partner/chat/[roomId]` | 고객 채팅 |
| 코스 관리 | `/partner/courses` | 마사지 코스 |
| 정산 | `/partner/settlements` | 정산 조회 |
| 통계 | `/partner/statistics` | 매장 통계 |
| 고객 관리 | `/partner/customers` | 단골 고객 |
| 직원 관리 | `/partner/staff` | 직원 정보 |
| 운영 시간 | `/partner/operating-hours` | 영업 시간 |
| 쿠폰 관리 | `/partner/coupons` | 쿠폰 생성 |
| 리뷰 관리 | `/partner/reviews` | 리뷰 관리 |
| 매장 정보 | `/partner/shop` | 매장 설정 |
| 설정 | `/partner/settings` | 계정 설정 |

### 기타

| 용도 | 경로 | 설명 |
|------|------|------|
| OAuth 콜백 | `/auth/callback` | 인증 콜백 |
| 유지보수 | `/maintenance` | 점검 페이지 |

---

## 환경 변수

### 필수 환경 변수 (.env.local)

#### Supabase (필수)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # 익명 키 (클라이언트용)
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # 서비스 역할 키 (서버용)
```

#### Firebase Client (필수)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[project].firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[project-id]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=[project].appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BK...          # FCM 웹 푸시용
```

#### Firebase Admin (필수 - 서버용)
```bash
FIREBASE_PROJECT_ID=[project-id]
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@[project].iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_API_SECRET_KEY=[custom-secret]            # FCM API 인증용
```

#### Twilio OTP 인증 (필수)
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
```

#### Kakao 알림톡 (필수)
```bash
KAKAO_ALIMTALK_BASE_URL=https://api.kakao.com
KAKAO_SENDER_KEY=...
KAKAO_ACCESS_TOKEN=...
KAKAO_CHANNEL_ID=...
KAKAO_SENDER_NO=0507...
KAKAO_FALLBACK_ENABLED=true
```

#### PortOne 결제 (필수)
```bash
NEXT_PUBLIC_PORTONE_STORE_ID=store-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-...
PORTONE_API_SECRET=...
```

#### 기타 (선택)
```bash
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...           # 네이버 지도 API
NEXT_PUBLIC_BASE_URL=https://todaysmassage.com
NODE_ENV=development
```

### 환경 변수 보안 분류

| 분류 | Prefix | 노출 가능 | 예시 |
|------|--------|----------|------|
| 🟢 Public | `NEXT_PUBLIC_*` | 클라이언트 노출 OK | SUPABASE_URL, FIREBASE_API_KEY |
| 🔴 Private | (prefix 없음) | 서버만 | SERVICE_ROLE_KEY, PRIVATE_KEY |

---

## 코딩 컨벤션

1. **컴포넌트**: PascalCase (예: `UserProfile.tsx`)
2. **훅**: camelCase with `use` prefix (예: `useAuth.ts`)
3. **유틸리티**: camelCase (예: `formatDate.ts`)
4. **타입**: PascalCase with `I` prefix for interfaces (예: `IUser`)
5. **스타일**: Tailwind CSS utility classes
6. **상태 관리**: Zustand for client state, React Query for server state

---

## 자동 적용 규칙

이 프로젝트에서 Claude는 자동으로:

1. **Next.js 14 패턴** 사용 (App Router, Server Components)
2. **TypeScript strict mode** 준수
3. **shadcn/ui 컴포넌트** 활용
4. **Tailwind CSS** 스타일링
5. **모든 UI 변경 후** 시각적 테스트 실행
6. **모든 기능 구현 후** E2E 테스트 실행
7. **완료 선언 전** 스크린샷으로 시각적 확인

---

## 프로젝트 현황 (2026-01-31)

| 영역 | 완성도 | 상태 |
|------|--------|------|
| **고객앱** | 100% | ✅ 프로덕션 준비 완료 |
| **파트너앱** | 95% | ✅ 프로덕션 준비 완료 |
| **관리자앱** | 100% | ✅ 프로덕션 준비 완료 |
| **API** | 100% | ✅ 완성 (11개 라우트, 200+ 함수) |
| **DB** | 100% | ✅ 42개 마이그레이션 적용 |
| **전체** | **99%** | ✅ 프로덕션 준비 완료 |

> 상세 현황: [docs/features/IMPLEMENTATION_STATUS_2026_01_31.md](docs/features/IMPLEMENTATION_STATUS_2026_01_31.md)

---

## 페이지 통계

| 영역 | 페이지 수 | 레이아웃 수 |
|------|----------|------------|
| Customer | 25개 | 10개 |
| Admin | 9개 | 1개 |
| Partner | 14개 | 1개 |
| 기타 | 2개 | - |
| **합계** | **50개** | **12개** |
