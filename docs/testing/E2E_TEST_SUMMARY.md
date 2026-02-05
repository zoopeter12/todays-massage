# E2E 테스트 요약 문서

> **최종 업데이트**: 2026-01-29
> **테스트 프레임워크**: Playwright

## 테스트 파일 현황

| 파일명 | 테스트 범위 | 상태 |
|--------|-------------|------|
| `auth.spec.ts` | 로그인/인증 | Active |
| `homepage.spec.ts` | 홈페이지 | Active |
| `search.spec.ts` | 검색 기능 | Active |
| `nearby.spec.ts` | 근처 샵 | Active |
| `shop-detail.spec.ts` | 샵 상세 | Active |
| `customer-app-full-test.spec.ts` | 고객 앱 전체 | Active |
| `partner-app-full-test.spec.ts` | 파트너 앱 전체 | Active |
| `admin-pages.spec.ts` | 관리자 페이지 | Active |

---

## 최근 변경 사항 (2026-01-28)

### 1. Header.tsx - 로그인 상태별 UI 분기

**변경 내용**:
- `useAuth` 훅을 사용하여 로그인 상태 확인
- 로그인 상태: 알림 버튼(Bell) + 프로필 아바타(Avatar) 표시
- 비로그인 상태: 로그인 버튼(LogIn 아이콘) 표시
- 로딩 중: 스켈레톤 애니메이션 표시

**테스트 영향**:
- `auth.spec.ts`: 로그인 페이지 테스트는 기존과 동일
- `homepage.spec.ts`: 헤더 확인 테스트에서 로그인/비로그인 분기 고려 필요

**E2E 테스트 포인트**:
```
- 비로그인 시 헤더에 "로그인" 버튼 표시
- 로그인 후 헤더에 프로필 아바타 + 알림 버튼 표시
- 검색 버튼은 항상 표시
```

---

### 2. MapSearchDrawer.tsx - 지도 메뉴 동작 개선

**변경 내용**:
- 초기 로드 시 Drawer 자동 열림 (1회만)
- 사용자가 닫은 후에는 자동으로 다시 열리지 않음
- 닫힌 상태에서 플로팅 버튼 표시 ("주변 매장 N개 보기")
- `userClosedRef`, `initialOpenDoneRef` 상태 관리

**테스트 영향**:
- `search.spec.ts`: 지도 페이지에서 Drawer 동작 확인 필요
- `nearby.spec.ts`: 지도 보기 버튼 동작 테스트

**E2E 테스트 포인트**:
```
- /search 접속 시 Drawer가 자동으로 열림
- Drawer 닫으면 플로팅 버튼 표시
- 플로팅 버튼 클릭 시 Drawer 재오픈
- 매장 카드 클릭 시 상세 페이지 이동
```

---

### 3. verify-otp/route.ts - 세션 생성 로직

**변경 내용**:
- Twilio OTP 검증 후 Supabase 세션 생성
- 가상 이메일(`phone@phone.todays-massage.local`) 기반 세션
- 쿠키 설정: `user_id`, `user_phone`, `logged_in`
- Supabase 세션 토큰 쿠키(`sb-*-auth-token`) 설정

**테스트 영향**:
- `auth.spec.ts`: OTP 인증 플로우 테스트

**E2E 테스트 포인트**:
```
- OTP 입력 후 세션 생성 확인
- 로그인 후 쿠키 설정 확인
- 리다이렉트 동작 확인
```

---

### 4. use-twilio-otp.ts - 클라이언트 세션 설정

**변경 내용**:
- `verifyOTP` 함수에서 서버 응답의 세션 토큰을 Supabase에 설정
- `supabase.auth.setSession()` 호출로 클라이언트 세션 동기화

**테스트 영향**:
- `auth.spec.ts`: 로그인 후 상태 유지 확인

---

### 5. login/page.tsx - 로그인 페이지 보호

**변경 내용**:
- `useAuth` 훅으로 인증 상태 확인
- 이미 로그인된 사용자는 홈(`/`)으로 리다이렉트
- 로딩 중 스피너 표시 (깜빡임 방지)

**테스트 영향**:
- `auth.spec.ts`: 로그인 페이지 접근 테스트

**E2E 테스트 포인트**:
```
- 비로그인 시 /login 페이지 정상 표시
- 로그인 상태에서 /login 접근 시 / 로 리다이렉트
```

---

### 6. points/page.tsx - 비로그인 처리

**변경 내용**:
- `useAuth` 훅으로 인증 상태 확인
- 비로그인 시 `/login?redirect=/points`로 리다이렉트
- 인증 로딩 중 스피너 표시

**테스트 영향**:
- `customer-app-full-test.spec.ts`: 포인트 페이지 테스트

**E2E 테스트 포인트**:
```
- 비로그인 시 /points 접근 -> /login으로 리다이렉트
- redirect 쿼리 파라미터 포함 확인
```

---

### 7. attendance/page.tsx, referral/page.tsx - 비로그인 처리

**변경 내용**:
- 동일한 패턴으로 비로그인 시 로그인 페이지로 리다이렉트

**E2E 테스트 포인트**:
```
- /attendance, /referral 비로그인 시 리다이렉트 확인
```

---

### 8. mypage/reviews/page.tsx - 새 페이지 추가

**변경 내용**:
- 내 리뷰 목록 조회 페이지 신규 생성
- Supabase에서 사용자 리뷰 조회
- 비로그인 시 안내 메시지 + 로그인 버튼 표시
- 별점, 리뷰 내용, 작성일 표시
- 매장 이름 클릭 시 상세 페이지 이동

**테스트 영향**:
- `customer-app-full-test.spec.ts`: 새 페이지 테스트 필요

**E2E 테스트 포인트**:
```
- /mypage/reviews 페이지 접근 가능
- 비로그인 시 "로그인이 필요합니다" 메시지 표시
- 로그인 후 리뷰 목록 표시 (또는 빈 상태)
- 뒤로가기 버튼 -> /mypage 이동
```

---

## 테스트 커버리지 현황

### 고객 앱 (Customer App)

| 페이지 | URL | 인증 필요 | 테스트 상태 |
|--------|-----|-----------|-------------|
| 홈 | `/` | No | Covered |
| 검색 | `/search` | No | Covered |
| 근처 샵 | `/nearby` | No | Covered |
| 샵 상세 | `/shops/[id]` | No | Covered |
| 로그인 | `/login` | No | Covered |
| 포인트 | `/points` | **Yes** | Covered |
| 쿠폰 | `/coupons` | Yes | Covered |
| 즐겨찾기 | `/favorites` | Yes | Covered |
| 마이페이지 | `/mypage` | Yes | Partial |
| **내 리뷰** | `/mypage/reviews` | **Yes** | **NEW** |
| 출석체크 | `/attendance` | Yes | Needs Update |
| 추천인 | `/referral` | Yes | Needs Update |

### 파트너 앱 (Partner App)

| 페이지 | URL | 테스트 상태 |
|--------|-----|-------------|
| 대시보드 | `/partner` | Covered |
| 예약 관리 | `/partner/reservations` | Covered |
| 코스 관리 | `/partner/courses` | Covered |
| 쿠폰 관리 | `/partner/coupons` | Covered |
| 고객 관리 | `/partner/customers` | Covered |
| 관리사 관리 | `/partner/staff` | Covered |
| 정산 조회 | `/partner/settlements` | Covered |
| 매출 통계 | `/partner/analytics` | Covered |
| 설정 | `/partner/settings` | Covered |
| 채팅 | `/partner/chat` | Covered |

### 관리자 앱 (Admin App)

| 페이지 | URL | 테스트 상태 |
|--------|-----|-------------|
| 대시보드 | `/admin` | Covered |
| 회원 관리 | `/admin/users` | Covered |
| 매장 관리 | `/admin/shops` | Covered |
| 정산 관리 | `/admin/settlements` | Covered |
| 콘텐츠 관리 | `/admin/content` | Covered |
| 신고/CS 관리 | `/admin/reports` | Covered |
| 시스템 설정 | `/admin/settings` | Covered |

---

## 필요한 테스트 업데이트

### 우선순위 높음

1. **인증 보호 페이지 리다이렉트 테스트**
   - `/points`, `/attendance`, `/referral` 비로그인 시 리다이렉트 확인
   - redirect 쿼리 파라미터 유지 확인

2. **내 리뷰 페이지 테스트 추가**
   - `/mypage/reviews` 페이지 접근
   - 비로그인/로그인 상태별 UI 확인
   - 빈 상태 메시지 확인

3. **헤더 로그인 상태 테스트**
   - 비로그인 시 "로그인" 버튼 표시
   - 로그인 시 프로필 아바타 + 알림 버튼 표시

### 우선순위 중간

4. **MapSearchDrawer 동작 테스트**
   - 자동 열림/닫힘 동작
   - 플로팅 버튼 동작

5. **로그인 페이지 리다이렉트 테스트**
   - 로그인 상태에서 `/login` 접근 시 홈으로 이동

---

## 테스트 실행 명령어

```bash
# 전체 E2E 테스트
npm run test:e2e

# UI 모드 (권장)
npm run test:e2e:ui

# 특정 파일만 실행
npx playwright test auth.spec.ts
npx playwright test customer-app-full-test.spec.ts

# 특정 테스트만 실행
npx playwright test --grep "로그인"
npx playwright test --grep "리뷰"

# 테스트 리포트 확인
npm run test:report
```

---

## 참고 문서

- [E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md) - 상세 테스트 가이드
- [API_AUTHENTICATION_TEST.md](./API_AUTHENTICATION_TEST.md) - API 인증 테스트

---

---

## 최근 변경 사항 (2026-01-29)

### 9. login/page.tsx - 로그인 후 리다이렉트 버그 수정

**변경 내용**:
- `isAuthenticated` 체크를 `isLoading` 체크보다 먼저 배치
- 로그인 성공 후 즉시 `window.location.href = "/"`로 리다이렉트

**문제 해결**:
- 로그인 성공 후 로딩 스피너에서 멈추던 버그 수정
- 새로고침 없이 자동으로 홈 페이지로 이동

**E2E 테스트 포인트**:
```
- OTP 인증 후 자동으로 홈 페이지로 리다이렉트
- 헤더에 사용자 정보(전화번호 끝 4자리) 표시
```

---

### 10. useAuth.ts - AbortError 버그 수정

**변경 내용**:
- `isMounted` 플래그 추가로 언마운트 후 상태 업데이트 방지
- `AbortController` 추가로 요청 취소 처리
- 의존성 배열에서 `user` 제거 (무한 루프 방지)
- `visibilitychange` 이벤트에 디바운스 (100ms) 적용

**문제 해결**:
- `AbortError: signal is aborted without reason` 에러 수정
- React Strict Mode에서의 더블 마운트 문제 해결

**E2E 테스트 포인트**:
```
- 마이페이지 접근 시 에러 없음
- 빠른 페이지 전환 시 에러 없음
- 탭 전환 후 돌아올 때 상태 유지
```

---

### 11. mypage/page.tsx - cleanup 추가

**변경 내용**:
- `isMounted` 플래그 추가
- 언마운트 시 상태 업데이트 방지
- AbortError 예외 처리

**E2E 테스트 포인트**:
```
- /mypage 페이지 정상 로드
- 프로필 정보 표시
- 콘솔 에러 없음
```

---

*이 문서는 코드 변경 사항에 따라 지속적으로 업데이트됩니다.*
