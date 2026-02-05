# 오늘의마사지 배포 가이드

## 프로젝트 정보
- **경로**: C:\a
- **프로젝트명**: todays-massage (마사지 예약 플랫폼)
- **기술 스택**: Next.js 14.2.5, Supabase, Firebase, Twilio OTP, Tailwind CSS
- **상태**: 개발 완료, DB 마이그레이션 완료, 배포 준비 완료

---

## 완료된 작업 요약 (2026-01-29)

| 항목 | 상태 | 비고 |
|------|------|------|
| PHASE 0-6 전체 | 완료 | 비회원/고객/파트너/관리자 기능 검증 |
| Bug A: 로그인 헤더 | 수정 완료 | useAuth.ts 수정 |
| Bug B: 출석체크 에러 | 수정 완료 | DB 마이그레이션 완료로 정상 동작 |
| Bug C: 친구초대 Hooks | 수정 완료 | hooks 호출 순서 수정 |
| Bug D: 파트너 샵 조회 | 수정 완료 | owner_id fallback 추가 |
| 페이지 검증 (45개) | 완료 | 콘솔 에러 0개 (외부 서비스 제외) |
| DB 마이그레이션 | 완료 | point_history, attendance, roulette_rewards, roulette_history 생성 |
| 문서화 | 완료 | `docs/FUNCTIONAL_TEST_REPORT.md`, `docs/BUG_FIXES.md` |

**테스트 OTP**: 개발환경에서 `123456` 사용 가능 (OTP 검증 단계에서만)

---

## 배포 체크리스트

### 1. Supabase DB 마이그레이션 - 완료

**생성된 테이블**:
- `attendance` - 출석체크
- `point_history` - 포인트 내역
- `roulette_rewards` - 룰렛 보상 설정
- `roulette_history` - 룰렛 참여 기록

**상태**: 2026-01-29 마이그레이션 완료

---

### 2. 외부 서비스 설정 확인

| 서비스 | 확인 항목 | 상태 |
|--------|----------|------|
| **Twilio** | 계정 잔액, API 키 유효성 | 미확인 |
| **NCP 지도** | localhost + 프로덕션 도메인 등록 | 미확인 |
| **Supabase** | 프로젝트 설정, RLS 정책 | 미확인 |
| **Firebase** | 프로젝트 설정 | 미확인 |

---

### 3. 환경 변수 확인

**필수 환경 변수** (`.env.local` 또는 Vercel 환경 변수):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NEXT_PUBLIC_NCP_CLIENT_ID=
NCP_CLIENT_SECRET=
```

---

### 4. Vercel 배포

**배포 단계**:
1. GitHub 저장소 연결
2. 환경 변수 설정 (위 목록)
3. 빌드 명령어: `npm run build`
4. 출력 디렉토리: `.next`
5. Node.js 버전: 18.x 이상

**배포 후 확인**:
- [ ] 메인 페이지 로드
- [ ] OTP 로그인 동작
- [ ] 지도 표시
- [ ] 예약 프로세스

---

### 5. 프로덕션 도메인 설정

**NCP 지도 콘솔**:
1. Application > 도메인 등록
2. 프로덕션 도메인 추가 (예: `todays-massage.vercel.app`)

**Twilio**:
1. Webhook URL 업데이트 (필요시)

---

## 선택적 작업

- [ ] 카카오 알림톡 연동
- [ ] Google Analytics 설정
- [ ] Sentry 에러 모니터링 연동
- [ ] 성능 최적화 (이미지 CDN 등)

---

## 관련 문서

| 문서 | 경로 |
|------|------|
| 기능 테스트 보고서 | `docs/FUNCTIONAL_TEST_REPORT.md` |
| 버그 수정 목록 | `docs/BUG_FIXES.md` |
| SQL 실행 가이드 | `SUPABASE_SQL_실행_가이드.md` |
| 배포 마스터 체크리스트 | `docs/deployment/DEPLOYMENT_MASTER_CHECKLIST.md` |

---

## 빠른 시작 (로컬 개발)

```bash
cd C:\a
npm run dev
# http://localhost:3000
```

**테스트 계정**:
- 전화번호: 01099991925
- OTP: 123456

---

*마지막 업데이트: 2026-01-29*
*상태: 개발 완료, DB 마이그레이션 완료, 배포 준비 완료*

---

## 최근 테스트 결과 (2026-01-29)

### UI 테스트 완료 페이지
| 페이지 | 상태 | 비고 |
|--------|------|------|
| 메인 페이지 (/) | 정상 | 배너, 카테고리, 추천샵 표시 |
| 로그인 (/login) | 정상 | OTP 입력 UI 동작 (Twilio SMS 외부 서비스 문제) |
| 검색 (/search) | 정상 | 네이버 지도 표시 |
| 샵 상세 (/shops/[id]) | 정상 | 정보/코스/리뷰 탭 전환 |
| FAQ (/faq) | 정상 | 카테고리별 아코디언 |
| 이용약관 (/terms) | 정상 | 전체 내용 표시 |
| 내 주변 (/nearby) | 정상 | 위치 기반 검색 |
| 파트너/관리자 | 정상 | 로그인 요구 후 접근 |

### 알려진 이슈
- **Twilio SMS API**: 외부 서비스 문제로 OTP 발송 실패 (테스트 환경)
- OTP 검증은 개발환경에서 `123456` 테스트 코드 사용 가능

### 스크린샷 위치
`docs/test-screenshots/` 폴더에 14개 스크린샷 저장됨
