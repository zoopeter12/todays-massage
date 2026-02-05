# 🚀 배포 전 종합 체크리스트

Today's Massage 프로젝트를 프로덕션에 배포하기 전 반드시 확인해야 할 모든 항목을 단계별로 정리한 체크리스트입니다.

**이 문서를 인쇄하여 체크하면서 배포를 진행하세요.**

---

## 📋 체크리스트 사용 방법

1. 각 섹션을 순서대로 진행
2. 완료된 항목에 ✅ 체크
3. 모든 필수 항목이 체크되어야 배포 가능
4. 선택 항목은 서비스 사용 여부에 따라 체크

**표기 방법**:
- ⭐ **필수**: 반드시 완료해야 하는 항목
- ⚡ **선택**: 해당 기능 사용 시에만 필요

---

## 1️⃣ 사전 준비 (필수)

### 계정 및 서비스 가입

- [ ] ⭐ GitHub 계정 (코드 저장소)
- [ ] ⭐ Vercel 계정 (배포 플랫폼)
- [ ] ⭐ Supabase 계정 (데이터베이스)
- [ ] ⭐ NCloud 계정 (네이버 지도)
- [ ] ⭐ 포트원 계정 (결제)
- [ ] ⚡ Firebase 계정 (푸시 알림)
- [ ] ⚡ 카카오 비즈니스 계정 (알림톡)
- [ ] ⚡ 알림톡 대행사 계정 (알리고/솔라피)

### 도메인 준비

- [ ] ⭐ 프로덕션 도메인 등록 완료
- [ ] ⭐ DNS 관리 콘솔 접근 가능
- [ ] ⭐ 도메인 소유권 확인 완료

---

## 2️⃣ Supabase 설정 (필수)

상세 가이드: [docs/services/SUPABASE_SETUP.md](./services/SUPABASE_SETUP.md)

### 프로젝트 생성

- [ ] ⭐ Supabase 프로젝트 생성 (서울 리전)
- [ ] ⭐ 데이터베이스 비밀번호 안전하게 저장
- [ ] ⭐ 프로젝트 URL 확인: `___________________________`
- [ ] ⭐ Project ID 확인: `___________________________`

### 데이터베이스 마이그레이션

- [ ] ⭐ Supabase CLI 설치 완료
- [ ] ⭐ 프로젝트 연결 완료 (`supabase link`)
- [ ] ⭐ 모든 마이그레이션 실행 완료 (`supabase db push`)
- [ ] ⭐ 주요 테이블 생성 확인:
  - [ ] profiles
  - [ ] shops
  - [ ] reservations
  - [ ] reviews
  - [ ] coupons
  - [ ] fcm_tokens
  - [ ] chat_rooms, chat_messages

### Row Level Security (RLS)

- [ ] ⭐ profiles 테이블 RLS 활성화
- [ ] ⭐ shops 테이블 RLS 활성화
- [ ] ⭐ reservations 테이블 RLS 활성화
- [ ] ⭐ reviews 테이블 RLS 활성화
- [ ] ⭐ 모든 민감 테이블 RLS 정책 적용

### Storage 버킷

- [ ] ⭐ avatars 버킷 생성 (Public)
- [ ] ⭐ shop-images 버킷 생성 (Public)
- [ ] ⭐ review-images 버킷 생성 (Public)
- [ ] ⭐ Storage 정책 활성화

### Realtime 설정

- [ ] ⭐ Realtime 기능 활성화
- [ ] ⭐ chat_messages 테이블 Realtime 활성화
- [ ] ⭐ reservations 테이블 Realtime 활성화

### OAuth 제공자 설정

- [ ] ⭐ 카카오 OAuth 설정 완료
- [ ] ⭐ 구글 OAuth 설정 완료
- [ ] ⭐ Redirect URLs 추가:
  - [ ] `http://localhost:3000/auth/callback` (개발)
  - [ ] `https://[도메인]/auth/callback` (프로덕션)

### API 키 확인

- [ ] ⭐ Project URL 저장: `___________________________`
- [ ] ⭐ Anon Key 저장: `___________________________`
- [ ] ⭐ Service Role Key 저장: `___________________________`

---

## 3️⃣ Firebase FCM 설정 (선택 - 푸시 알림)

상세 가이드: [docs/services/FIREBASE_FCM_SETUP.md](./services/FIREBASE_FCM_SETUP.md)

### Firebase 프로젝트

- [ ] ⚡ Firebase 프로젝트 생성
- [ ] ⚡ Cloud Messaging API 활성화
- [ ] ⚡ 웹 앱 추가 완료
- [ ] ⚡ VAPID 키 생성: `___________________________`

### Service Account

- [ ] ⚡ Service Account JSON 다운로드
- [ ] ⚡ Project ID 확인: `___________________________`
- [ ] ⚡ Client Email 확인: `___________________________`
- [ ] ⚡ Private Key 확인 (안전하게 보관)

### Service Worker

- [ ] ⚡ `public/firebase-messaging-sw.js` 파일 생성
- [ ] ⚡ Firebase Config 값 입력
- [ ] ⚡ Service Worker 생성 스크립트 추가 (선택)
- [ ] ⚡ PWA 아이콘 파일 준비

### 테스트

- [ ] ⚡ FCM 토큰 발급 테스트
- [ ] ⚡ Firebase Console에서 테스트 메시지 발송
- [ ] ⚡ 브라우저 알림 수신 확인

---

## 4️⃣ 네이버 지도 API 설정 (필수)

### NCloud 설정

- [ ] ⭐ NCloud 콘솔 접속
- [ ] ⭐ Maps API 애플리케이션 등록
- [ ] ⭐ Web Dynamic Map 활성화
- [ ] ⭐ Client ID 확인: `___________________________`

### 도메인 등록

- [ ] ⭐ 개발 도메인 등록: `localhost`
- [ ] ⭐ 프로덕션 도메인 등록: `___________________________`
- [ ] ⭐ www 서브도메인 등록 (필요시): `www.___________________________`

---

## 5️⃣ 포트원 결제 설정 (필수)

### 포트원 설정

- [ ] ⭐ 포트원 관리자 콘솔 접속
- [ ] ⭐ 스토어 생성 완료
- [ ] ⭐ Store ID 확인: `___________________________`
- [ ] ⭐ Channel Key 확인: `___________________________`
- [ ] ⭐ API Secret 발급: `___________________________`

### PG사 연동

- [ ] ⭐ 사용할 PG사 선택: `___________________________`
- [ ] ⭐ PG사 연동 완료
- [ ] ⭐ 테스트 모드 설정 완료
- [ ] ⭐ 실거래 모드 준비 (프로덕션 배포 시)

### Webhook 설정 (선택)

- [ ] ⚡ Webhook URL 등록: `https://[도메인]/api/portone/webhook`
- [ ] ⚡ Webhook 시크릿 생성: `___________________________`

---

## 6️⃣ 카카오 알림톡 설정 (선택)

상세 가이드: [docs/services/KAKAO_ALIMTALK_SETUP.md](./services/KAKAO_ALIMTALK_SETUP.md)

### 카카오 비즈니스 채널

- [ ] ⚡ 카카오 비즈니스 계정 생성
- [ ] ⚡ 사업자 등록 및 인증 완료
- [ ] ⚡ 카카오톡 채널 생성
- [ ] ⚡ 채널 ID 확인: `@___________________________`
- [ ] ⚡ 발신 프로필 생성 완료
- [ ] ⚡ Sender Key 확인: `___________________________`

### 알림톡 대행사

- [ ] ⚡ 대행사 선택: `___________________________` (알리고/솔라피)
- [ ] ⚡ 대행사 회원가입 및 인증
- [ ] ⚡ API 키 발급: `___________________________`
- [ ] ⚡ 발신 프로필 연동 완료
- [ ] ⚡ 충전 완료 (최소 10,000원)

### 템플릿 등록

- [ ] ⚡ 예약 확정 템플릿 등록 및 검수 승인
- [ ] ⚡ 예약 취소 템플릿 등록 및 검수 승인
- [ ] ⚡ 예약 리마인더 템플릿 등록 및 검수 승인
- [ ] ⚡ 리뷰 요청 템플릿 등록 및 검수 승인
- [ ] ⚡ 쿠폰 발급 템플릿 등록 및 검수 승인

### 템플릿 코드 저장

- [ ] ⚡ 예약 확정: `___________________________`
- [ ] ⚡ 예약 취소: `___________________________`
- [ ] ⚡ 예약 리마인더: `___________________________`
- [ ] ⚡ 리뷰 요청: `___________________________`
- [ ] ⚡ 쿠폰 발급: `___________________________`

---

## 7️⃣ 환경변수 설정 (필수)

상세 가이드: [docs/ENV_VARIABLES.md](./ENV_VARIABLES.md)

### 로컬 환경 (.env.local)

- [ ] ⭐ `.env.example`을 `.env.local`로 복사
- [ ] ⭐ 모든 필수 환경변수 입력 완료
- [ ] ⭐ 로컬 개발 서버 정상 작동 확인

### Vercel 환경변수

#### 애플리케이션 설정
- [ ] ⭐ `NEXT_PUBLIC_BASE_URL` 설정 (프로덕션)
- [ ] ⭐ `NODE_ENV` 자동 설정 확인

#### Supabase
- [ ] ⭐ `NEXT_PUBLIC_SUPABASE_URL`
- [ ] ⭐ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] ⭐ `SUPABASE_SERVICE_ROLE_KEY` (Sensitive ✅)

#### 네이버 지도
- [ ] ⭐ `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

#### 포트원
- [ ] ⭐ `NEXT_PUBLIC_PORTONE_STORE_ID`
- [ ] ⭐ `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
- [ ] ⭐ `PORTONE_API_SECRET` (Sensitive ✅)

#### Firebase (선택)
- [ ] ⚡ `FIREBASE_PROJECT_ID`
- [ ] ⚡ `FIREBASE_CLIENT_EMAIL`
- [ ] ⚡ `FIREBASE_PRIVATE_KEY` (Sensitive ✅, 줄바꿈 주의)
- [ ] ⚡ `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] ⚡ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] ⚡ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] ⚡ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] ⚡ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] ⚡ `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] ⚡ `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- [ ] ⚡ `FCM_API_SECRET_KEY` (Sensitive ✅)

#### 카카오 알림톡 (선택)
- [ ] ⚡ `KAKAO_ALIMTALK_BASE_URL`
- [ ] ⚡ `KAKAO_SENDER_KEY`
- [ ] ⚡ `KAKAO_ACCESS_TOKEN` (Sensitive ✅)
- [ ] ⚡ `KAKAO_CHANNEL_ID`
- [ ] ⚡ `KAKAO_SENDER_NO`
- [ ] ⚡ `KAKAO_FALLBACK_ENABLED`

### 환경변수 검증

- [ ] ⭐ Sensitive 변수 보호 설정 확인
- [ ] ⭐ Production/Preview 환경 구분 확인
- [ ] ⭐ 변수명 오타 확인

---

## 8️⃣ Vercel 배포 설정 (필수)

상세 가이드: [docs/DEPLOYMENT.md](./DEPLOYMENT.md)

### 프로젝트 연결

- [ ] ⭐ Vercel CLI 설치 (`npm i -g vercel`)
- [ ] ⭐ Vercel 계정 로그인
- [ ] ⭐ GitHub 저장소 연결
- [ ] ⭐ 프로젝트 Import 완료

### 프레임워크 설정

- [ ] ⭐ Framework Preset: Next.js 확인
- [ ] ⭐ Build Command: `next build` 확인
- [ ] ⭐ Output Directory: `.next` 확인
- [ ] ⭐ Node.js 버전: 18.0.0 이상

### 도메인 설정

- [ ] ⭐ 커스텀 도메인 추가: `___________________________`
- [ ] ⭐ DNS A 레코드 설정: `76.76.21.21`
- [ ] ⭐ DNS CNAME 레코드 설정: `cname.vercel-dns.com`
- [ ] ⭐ SSL 인증서 자동 발급 확인

### 배포 설정

- [ ] ⭐ 자동 배포 활성화 (main 브랜치)
- [ ] ⭐ Preview 배포 활성화 (PR/브랜치)
- [ ] ⭐ 배포 보호 설정 (선택)

---

## 9️⃣ 코드 검증 (필수)

### 타입 체크

- [ ] ⭐ TypeScript 에러 없음 (`npm run build`)
- [ ] ⭐ ESLint 경고 확인 (`npm run lint`)
- [ ] ⭐ 빌드 성공 확인

### 보안 검증

- [ ] ⭐ `.env.local` 파일이 `.gitignore`에 포함
- [ ] ⭐ API 키가 코드에 하드코딩되지 않음
- [ ] ⭐ Service Role Key가 클라이언트 코드에 없음
- [ ] ⭐ 민감한 정보 Git 히스토리에 없음

### 기능 테스트 (로컬)

- [ ] ⭐ 홈페이지 로딩
- [ ] ⭐ OTP 로그인/회원가입
- [ ] ⭐ OAuth 로그인 (카카오/구글)
- [ ] ⭐ 매장 검색 및 지도 표시
- [ ] ⭐ 매장 상세 페이지
- [ ] ⭐ 예약 생성
- [ ] ⭐ 결제 프로세스 (테스트 모드)
- [ ] ⭐ 마이페이지
- [ ] ⚡ 리뷰 작성
- [ ] ⚡ 쿠폰 사용
- [ ] ⚡ 채팅 기능

---

## 🔟 첫 배포 (Staging)

### Staging 브랜치 배포

- [ ] ⭐ Staging 브랜치 생성 (`git checkout -b staging`)
- [ ] ⭐ GitHub에 푸시 (`git push origin staging`)
- [ ] ⭐ Vercel Preview 배포 자동 실행
- [ ] ⭐ Preview URL 확인: `___________________________`

### Staging 환경 테스트

- [ ] ⭐ Staging URL 접속 확인
- [ ] ⭐ HTTPS 연결 확인
- [ ] ⭐ 환경변수 로딩 확인
- [ ] ⭐ Supabase 연결 확인
- [ ] ⭐ 네이버 지도 로딩 확인
- [ ] ⭐ 결제 테스트 모드 동작 확인
- [ ] ⚡ Firebase Service Worker 등록 확인
- [ ] ⚡ FCM 토큰 발급 확인
- [ ] ⚡ 알림톡 테스트 발송 확인

### 성능 검증

- [ ] ⭐ Lighthouse 점수 확인 (Performance 80 이상)
- [ ] ⭐ Vercel Analytics 데이터 확인
- [ ] ⭐ 빌드 시간 확인 (5분 이내)

---

## 1️⃣1️⃣ 프로덕션 배포

### 최종 검증

- [ ] ⭐ Staging에서 모든 기능 정상 작동 확인
- [ ] ⭐ 모든 필수 환경변수 Production 환경에 설정
- [ ] ⭐ 도메인 DNS 전파 완료 (24-48시간)
- [ ] ⭐ SSL 인증서 발급 완료

### OAuth 프로덕션 설정

- [ ] ⭐ 카카오 Redirect URI 프로덕션 도메인으로 변경
- [ ] ⭐ 구글 Authorized Redirect URI 프로덕션 도메인으로 변경
- [ ] ⭐ Supabase Site URL 프로덕션 도메인으로 변경

### 결제 프로덕션 설정

- [ ] ⭐ 포트원 실거래 모드 전환
- [ ] ⭐ PG사 실거래 계약 완료
- [ ] ⭐ 정산 계좌 등록 완료

### 알림톡 프로덕션 설정 (선택)

- [ ] ⚡ 모든 템플릿 검수 승인 완료
- [ ] ⚡ 대행사 충분한 잔액 확인

### 배포 실행

- [ ] ⭐ main 브랜치로 머지
- [ ] ⭐ GitHub에 푸시
- [ ] ⭐ Vercel Production 배포 자동 실행
- [ ] ⭐ 배포 완료 확인
- [ ] ⭐ 프로덕션 URL 접속: `https://___________________________`

---

## 1️⃣2️⃣ 배포 후 검증

### 기본 기능 검증

- [ ] ⭐ 홈페이지 로딩 (3초 이내)
- [ ] ⭐ OTP 로그인 동작
- [ ] ⭐ OAuth 로그인 동작 (카카오/구글)
- [ ] ⭐ 매장 검색 및 지도 표시
- [ ] ⭐ 예약 생성
- [ ] ⭐ 프로필 페이지

### 결제 검증

- [ ] ⭐ 실제 결제 테스트 (소액)
- [ ] ⭐ 결제 완료 확인
- [ ] ⭐ 예약 상태 업데이트 확인
- [ ] ⭐ 결제 내역 조회

### 알림 검증 (선택)

- [ ] ⚡ 예약 확정 알림톡 수신
- [ ] ⚡ 푸시 알림 수신 (FCM)
- [ ] ⚡ 이메일 알림 수신 (있는 경우)

### 성능 검증

- [ ] ⭐ Lighthouse 점수 (프로덕션)
  - Performance: 80+ ✅
  - Accessibility: 90+ ✅
  - Best Practices: 90+ ✅
  - SEO: 90+ ✅

### 모니터링 설정

- [ ] ⭐ Vercel Analytics 활성화
- [ ] ⭐ Vercel Speed Insights 활성화
- [ ] ⭐ Supabase Dashboard Monitoring 확인
- [ ] ⚡ Firebase Console Monitoring 확인
- [ ] ⚡ 알림톡 발송 내역 모니터링

---

## 1️⃣3️⃣ 보안 최종 점검

### 환경변수 보안

- [ ] ⭐ 모든 Sensitive 변수 보호 설정 확인
- [ ] ⭐ 서버 전용 키가 클라이언트에 노출되지 않음
- [ ] ⭐ API 키가 Git에 커밋되지 않음

### API 보안

- [ ] ⭐ CORS 설정 확인
- [ ] ⭐ Rate Limiting 설정 (Vercel)
- [ ] ⭐ Supabase RLS 활성화 확인
- [ ] ⭐ API Route 인증 확인

### 도메인 보안

- [ ] ⭐ HTTPS 강제 리다이렉트 (Vercel 자동)
- [ ] ⭐ HSTS 헤더 설정 확인
- [ ] ⭐ CSP 헤더 설정 (선택)

---

## 1️⃣4️⃣ 문서화

### 내부 문서

- [ ] ⭐ README.md 업데이트
- [ ] ⭐ 배포 히스토리 기록
- [ ] ⭐ 알려진 이슈 문서화
- [ ] ⭐ 환경변수 리스트 최신화

### 외부 문서 (선택)

- [ ] ⚡ 사용자 가이드
- [ ] ⚡ 고객센터 FAQ
- [ ] ⚡ 개인정보 처리방침
- [ ] ⚡ 이용약관

---

## 1️⃣5️⃣ 백업 및 복구 계획

### 백업

- [ ] ⭐ Supabase 자동 백업 설정 확인
- [ ] ⭐ Git 저장소 백업 (GitHub)
- [ ] ⭐ 환경변수 안전한 곳에 백업
- [ ] ⭐ 중요 API 키 암호화 저장

### 롤백 계획

- [ ] ⭐ Vercel 이전 배포로 롤백 방법 숙지
- [ ] ⭐ 데이터베이스 마이그레이션 롤백 계획
- [ ] ⭐ 긴급 연락처 정리

---

## 1️⃣6️⃣ 런칭 준비

### 소프트 런칭 (선택)

- [ ] ⚡ 베타 테스터 초대
- [ ] ⚡ 초기 사용자 피드백 수집
- [ ] ⚡ 주요 버그 수정

### 공식 런칭

- [ ] ⭐ 런칭 일시 결정: `___________________________`
- [ ] ⭐ 고객 지원 체계 준비
- [ ] ⭐ 모니터링 알림 설정
- [ ] ⭐ 장애 대응 매뉴얼 준비

---

## ✅ 최종 승인

### 기술 책임자 승인

- [ ] 모든 필수 항목 완료 확인
- [ ] 보안 검증 완료
- [ ] 성능 기준 충족
- [ ] 서명: `___________________________` 날짜: `___________________________`

### 사업 책임자 승인

- [ ] 서비스 준비 완료 확인
- [ ] 법적 요구사항 충족
- [ ] 런칭 승인
- [ ] 서명: `___________________________` 날짜: `___________________________`

---

## 📞 긴급 연락처

**기술 지원**:
- Vercel 지원: [https://vercel.com/support](https://vercel.com/support)
- Supabase 지원: [https://supabase.com/support](https://supabase.com/support)
- Firebase 지원: [https://firebase.google.com/support](https://firebase.google.com/support)

**알림톡 대행사**:
- 알리고: 1661-4759
- 솔라피: 1661-5886

**포트원 고객센터**: 1899-1048

---

## 📚 관련 문서

- [배포 가이드](./DEPLOYMENT.md)
- [환경변수 가이드](./ENV_VARIABLES.md)
- [Supabase 설정](./services/SUPABASE_SETUP.md)
- [Firebase FCM 설정](./services/FIREBASE_FCM_SETUP.md)
- [카카오 알림톡 설정](./services/KAKAO_ALIMTALK_SETUP.md)

---

**이 체크리스트를 완료하면 안전하게 프로덕션 배포가 가능합니다.** 🚀
