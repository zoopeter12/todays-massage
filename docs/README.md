# Documentation Index

프로젝트 문서 네비게이션 가이드입니다.

---

## 배포 필수 문서

배포 전 반드시 확인해야 할 핵심 문서입니다.

| 문서 | 설명 |
|------|------|
| [배포 전 체크리스트](deployment/DEPLOYMENT_MASTER_CHECKLIST.md) | 배포 전 필수 확인 항목 |
| [환경 변수 설정](deployment/ENV_VARIABLES.md) | 필수 환경 변수 목록 및 설정 방법 |
| [배포 가이드](deployment/DEPLOYMENT.md) | 단계별 배포 프로세스 |

### 외부 서비스 설정

| 문서 | 설명 |
|------|------|
| [Supabase 설정](services/SUPABASE_SETUP.md) | 데이터베이스 및 인증 설정 |
| [Supabase OAuth 설정](SUPABASE_OAUTH_SETUP.md) | 소셜 로그인 설정 |
| [Firebase FCM 설정](services/FIREBASE_FCM_SETUP.md) | 푸시 알림 설정 |
| [카카오 알림톡 설정](services/KAKAO_ALIMTALK_SETUP.md) | 알림톡 연동 설정 |

---

## 기능별 문서

### 쿠폰 시스템

| 문서 | 설명 |
|------|------|
| [쿠폰 시스템 개요](features/coupon/README.md) | 시스템 전체 개요 |
| [빠른 시작](features/coupon/QUICK_START.md) | 빠른 시작 가이드 |
| [구현 요약](features/coupon/IMPLEMENTATION_SUMMARY.md) | 구현 내용 요약 |
| [시스템 상세](features/coupon/COUPON_SYSTEM.md) | 상세 기능 설명 |
| [아키텍처](features/coupon/COUPON_ARCHITECTURE.md) | 시스템 아키텍처 |
| [테스트 가이드](features/coupon/COUPON_TESTING_GUIDE.md) | 테스트 방법 |

### 직원/운영시간 시스템

| 문서 | 설명 |
|------|------|
| [시스템 개요](features/staff/README.md) | Staff 시스템 전체 개요 |
| [빠른 시작](features/staff/QUICKSTART.md) | 빠른 시작 가이드 |
| [구현 요약](features/staff/IMPLEMENTATION_SUMMARY.md) | 구현 내용 요약 |
| [아키텍처](features/staff/SYSTEM_ARCHITECTURE.md) | 시스템 아키텍처 |

### 리뷰 시스템

| 문서 | 설명 |
|------|------|
| [시스템 요약](features/review/SUMMARY.md) | 리뷰 시스템 요약 |
| [구현 가이드](features/review/REVIEWS_IMPLEMENTATION.md) | 구현 상세 가이드 |
| [통합 예제](features/review/INTEGRATION_EXAMPLE.md) | 통합 코드 예제 |

### Twilio OTP 인증

| 문서 | 설명 |
|------|------|
| [시스템 개요](features/twilio-otp/TWILIO_OTP_README.md) | OTP 시스템 개요 |
| [구현 요약](features/twilio-otp/IMPLEMENTATION_SUMMARY.md) | 구현 내용 요약 |
| [설정 가이드](features/twilio-otp/TWILIO_OTP_SETUP.md) | Twilio 설정 방법 |
| [테스트 가이드](features/twilio-otp/TWILIO_OTP_TESTING.md) | 테스트 방법 |
| [아키텍처](features/twilio-otp/TWILIO_OTP_ARCHITECTURE.md) | 시스템 아키텍처 |

### 관리자 기능

| 문서 | 설명 |
|------|------|
| [등급 변경](features/admin/TIER_CHANGE.md) | 사용자 등급 변경 기능 |
| [리포트 통합](features/admin/REPORTS_INTEGRATION.md) | 리포트 시스템 통합 |
| [리포트 가이드](features/admin/ADMIN_REPORTS_GUIDE.md) | 관리자 리포트 사용법 |
| [로그 사용법](features/admin/ADMIN_LOGS_USAGE.md) | 관리자 로그 조회 |
| [사용자 정지](features/admin/USER_SUSPENSION_FEATURE.md) | 사용자 정지 기능 |

### 기타 기능

| 문서 | 설명 |
|------|------|
| [SEO/PWA 구현](SEO-PWA-IMPLEMENTATION.md) | SEO 최적화 및 PWA 설정 |
| [콘텐츠 관리 통합](CONTENT_MANAGEMENT_SUPABASE_INTEGRATION.md) | CMS Supabase 연동 |
| [콘텐츠 API 레퍼런스](CONTENT_API_QUICK_REFERENCE.md) | 콘텐츠 API 빠른 참조 |
| [정산 구현](SETTLEMENTS_IMPLEMENTATION.md) | 정산 시스템 구현 |

---

## 테스트 문서

| 문서 | 설명 |
|------|------|
| [E2E 테스트 가이드](testing/E2E_TESTING_GUIDE.md) | End-to-End 테스트 실행 방법 |
| [E2E 테스트 결과 요약](testing/E2E_TEST_SUMMARY.md) | 테스트 실행 결과 요약 |
| [API 인증 테스트](testing/API_AUTHENTICATION_TEST.md) | API 인증 테스트 케이스 |
| [기능 테스트 리포트](FUNCTIONAL_TEST_REPORT.md) | 기능별 테스트 결과 |

---

## 프로젝트 현황

| 문서 | 설명 |
|------|------|
| [**최신 구현 현황 (2026-01-30)**](features/IMPLEMENTATION_STATUS_2026_01_30.md) | **96% 완성 - 프로덕션 준비 완료** |

---

## 아카이브/참조 문서

개발 이력 및 참조용 문서입니다.

| 문서 | 설명 |
|------|------|
| [2026-01-28 구현 보고서](features/IMPLEMENTATION_STATUS_2026_01_28.md) | 30개+ 기능 구현 완료 보고서 |
| [검증 리포트](VERIFICATION_REPORT.md) | 시스템 검증 결과 |
| [버그 수정 기록](BUG_FIXES.md) | 버그 수정 이력 |

---

## 폴더 구조

```
docs/
├── README.md                    # 이 파일 (문서 인덱스)
├── deployment/                  # 배포 관련 문서
│   ├── DEPLOYMENT.md
│   ├── DEPLOYMENT_MASTER_CHECKLIST.md
│   └── ENV_VARIABLES.md
├── features/                    # 기능별 문서
│   ├── coupon/                  # 쿠폰 시스템
│   ├── staff/                   # 직원/운영시간
│   ├── review/                  # 리뷰 시스템
│   ├── twilio-otp/              # OTP 인증
│   └── admin/                   # 관리자 기능
├── testing/                     # 테스트 문서
│   ├── E2E_TESTING_GUIDE.md
│   ├── E2E_TEST_SUMMARY.md
│   └── API_AUTHENTICATION_TEST.md
└── services/                    # 외부 서비스 설정
    ├── SUPABASE_SETUP.md
    ├── FIREBASE_FCM_SETUP.md
    └── KAKAO_ALIMTALK_SETUP.md
```
