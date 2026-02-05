# Today's Massage

마사지/스파 예약 플랫폼 - 프로덕션 준비 완료

## 프로젝트 상태

**100% 완료** (2026-01-29)

- 45개 페이지 테스트 통과
- 모든 버그 수정 완료
- 프로덕션 배포 준비 완료

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Payment | PortOne |
| Map | Naver Map API |
| Push (Optional) | Firebase Cloud Messaging |
| Notification (Optional) | Kakao Alimtalk |
| Deploy | Vercel |

## 주요 기능

- 매장 검색 및 예약
- 실시간 예약 관리
- 결제 처리 (PortOne)
- 리뷰 시스템
- 쿠폰/포인트 관리
- 채팅 기능
- 푸시 알림 (선택)
- 카카오 알림톡 (선택)

## 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/yourusername/todays-massage.git
cd todays-massage

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 필요한 값 입력

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 배포

### 배포 전 필수 작업

1. **Supabase 설정**
   - 데이터베이스 마이그레이션 실행
   - OAuth 제공자 연동 (카카오, 구글)
   - RLS 정책 확인

2. **외부 서비스 연동**
   - 네이버 지도 API 도메인 등록
   - PortOne 결제 연동
   - Firebase FCM 설정 (선택)
   - 카카오 알림톡 설정 (선택)

3. **Vercel 배포**
   - 환경변수 등록
   - 커스텀 도메인 설정
   - DNS 연결

### 배포 명령

```bash
npm i -g vercel
vercel link
vercel --prod
```

### 배포 문서

| 문서 | 설명 |
|------|------|
| [배포 체크리스트](./docs/DEPLOYMENT_MASTER_CHECKLIST.md) | 배포 전 필수 확인 항목 |
| [Vercel 배포 가이드](./docs/DEPLOYMENT.md) | 상세 배포 절차 |
| [환경변수 가이드](./docs/ENV_VARIABLES.md) | 환경변수 설명 |

### 외부 서비스 설정

| 서비스 | 가이드 |
|--------|--------|
| Supabase | [설정 가이드](./docs/services/SUPABASE_SETUP.md) |
| Firebase FCM | [설정 가이드](./docs/services/FIREBASE_FCM_SETUP.md) |
| 카카오 알림톡 | [설정 가이드](./docs/services/KAKAO_ALIMTALK_SETUP.md) |
| OAuth | [설정 가이드](./docs/SUPABASE_OAUTH_SETUP.md) |

## 프로젝트 구조

```
todays-massage/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지
│   ├── (main)/            # 메인 페이지
│   └── api/               # API Routes
├── components/            # React 컴포넌트
├── lib/                   # 유틸리티
├── docs/                  # 문서
├── supabase/migrations/   # DB 마이그레이션
└── public/               # 정적 파일
```

## 테스트

```bash
# E2E 테스트
npm run test:e2e

# UI 모드
npm run test:e2e:ui
```

### 테스트 현황 (2026-01-29)

| 구분 | 페이지 수 | 상태 |
|------|----------|------|
| 비회원 | 12개 | 통과 |
| 고객 | 12개 | 통과 |
| 파트너 | 14개 | 통과 |
| 관리자 | 7개 | 통과 |

상세: [기능 테스트 보고서](./docs/FUNCTIONAL_TEST_REPORT.md)

## 문서

### 개발
- [쿠폰 시스템](./docs/COUPON_SYSTEM.md)
- [리뷰 구현](./docs/REVIEWS_IMPLEMENTATION.md)
- [SEO/PWA 구현](./docs/SEO-PWA-IMPLEMENTATION.md)

### 테스트/수정
- [기능 테스트 보고서](./docs/FUNCTIONAL_TEST_REPORT.md)
- [버그 수정 목록](./docs/BUG_FIXES.md)
- [E2E 테스트 보고서](./E2E_TEST_SUMMARY.md)

## 라이선스

MIT License

## 지원

- [Issues](https://github.com/yourusername/todays-massage/issues)
- 관련 문서 참조
