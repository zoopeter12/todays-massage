# E2E 테스트 가이드

## 📋 목차
1. [개요](#개요)
2. [테스트 환경 설정](#테스트-환경-설정)
3. [테스트 실행](#테스트-실행)
4. [작성된 테스트](#작성된-테스트)
5. [테스트 작성 가이드](#테스트-작성-가이드)
6. [CI/CD 통합](#cicd-통합)

---

## 개요

이 프로젝트는 **Playwright**를 사용하여 E2E (End-to-End) 테스트를 수행합니다.

### 테스트 프레임워크
- **Playwright** v1.x
- **TypeScript** 지원
- 크로스 브라우저 테스트 (Chromium, Firefox, WebKit)

### 주요 특징
✅ 자동 대기 및 재시도 메커니즘
✅ 병렬 테스트 실행
✅ 스크린샷 및 비디오 녹화
✅ 네트워크 모킹 지원
✅ 모바일 및 태블릿 에뮬레이션

---

## 테스트 환경 설정

### 1. 의존성 설치

```bash
npm install
```

Playwright와 브라우저가 자동으로 설치됩니다.

### 2. 브라우저 수동 설치 (필요시)

```bash
npx playwright install
```

특정 브라우저만 설치:
```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

### 3. 설정 파일

테스트 설정은 `playwright.config.ts`에서 관리됩니다.

**주요 설정:**
- `baseURL`: http://localhost:3000 (개발 서버)
- `timeout`: 30초 (테스트별 타임아웃)
- `retries`: CI 환경에서 2회 재시도
- `webServer`: 개발 서버 자동 시작

---

## 테스트 실행

### 기본 테스트 실행

```bash
npm run test:e2e
```

모든 E2E 테스트를 헤드리스 모드로 실행합니다.

### UI 모드로 실행 (권장)

```bash
npm run test:e2e:ui
```

Playwright UI에서 테스트를 시각적으로 확인하고 디버깅할 수 있습니다.

### 브라우저를 띄워서 실행

```bash
npm run test:e2e:headed
```

실제 브라우저를 띄워서 테스트 실행 과정을 확인합니다.

### 디버그 모드

```bash
npm run test:e2e:debug
```

Playwright Inspector를 사용하여 단계별로 디버깅합니다.

### 특정 테스트 파일만 실행

```bash
npx playwright test homepage.spec.ts
npx playwright test search.spec.ts
```

### 특정 테스트만 실행

```bash
npx playwright test --grep "홈페이지"
npx playwright test --grep "로그인"
```

### 테스트 리포트 확인

```bash
npm run test:report
```

HTML 형식의 상세 테스트 리포트를 브라우저에서 확인합니다.

---

## 작성된 테스트

### 1. 홈페이지 테스트 (`e2e/homepage.spec.ts`)

**테스트 항목:**
- ✅ 페이지 정상 로딩
- ✅ 배너 섹션 표시
- ✅ 카테고리 섹션 표시
- ✅ 추천 샵 섹션 표시
- ✅ 네비게이션 동작
- ✅ 반응형 디자인 (모바일/태블릿)
- ✅ 시각적 회귀 테스트 (스크린샷)

**실행:**
```bash
npx playwright test homepage.spec.ts
```

### 2. 검색 기능 테스트 (`e2e/search.spec.ts`)

**테스트 항목:**
- ✅ 검색 페이지 로딩
- ✅ 검색 입력 필드 동작
- ✅ 검색 실행 및 결과 표시
- ✅ 지도 표시
- ✅ 필터 및 정렬 기능
- ✅ 카테고리 필터 선택
- ✅ 검색 결과 클릭 → 상세 페이지 이동
- ✅ 에지 케이스 (빈 검색어, 존재하지 않는 검색어)

**실행:**
```bash
npx playwright test search.spec.ts
```

### 3. 샵 상세 페이지 테스트 (`e2e/shop-detail.spec.ts`)

**테스트 항목:**
- ✅ 상세 페이지 로딩
- ✅ 샵 기본 정보 표시
- ✅ 이미지 갤러리
- ✅ 주소 및 위치 정보
- ✅ 영업 시간 정보
- ✅ 가격 정보
- ✅ 예약 버튼 동작
- ✅ 리뷰 섹션
- ✅ 즐겨찾기 기능
- ✅ 반응형 디자인

**실행:**
```bash
npx playwright test shop-detail.spec.ts
```

### 4. 로그인/인증 테스트 (`e2e/auth.spec.ts`)

**테스트 항목:**
- ✅ 로그인 페이지 로딩
- ✅ 로그인 폼 표시
- ✅ 이메일/비밀번호 입력 필드
- ✅ 소셜 로그인 옵션
- ✅ 폼 검증 (빈 값, 잘못된 이메일 형식)
- ✅ 로그인 시도 및 에러 처리
- ✅ 비밀번호 표시/숨김 토글
- ✅ 보안 (비밀번호 마스킹)
- ✅ 반응형 디자인

**실행:**
```bash
npx playwright test auth.spec.ts
```

### 5. 근처 샵 테스트 (`e2e/nearby.spec.ts`)

**테스트 항목:**
- ✅ 근처 샵 페이지 로딩
- ✅ 지도 표시
- ✅ 현재 위치 버튼
- ✅ 근처 샵 목록 표시
- ✅ 거리 정보 표시
- ✅ 지도 마커 표시
- ✅ 지도 드래그 및 줌 동작
- ✅ 거리순 정렬
- ✅ 반경 필터
- ✅ 위치 권한 처리
- ✅ 반응형 디자인

**실행:**
```bash
npx playwright test nearby.spec.ts
```

---

## 테스트 작성 가이드

### 기본 테스트 구조

```typescript
import { test, expect } from '@playwright/test';

test.describe('기능 그룹', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 실행
    await page.goto('/page-url');
  });

  test('구체적인 테스트 케이스', async ({ page }) => {
    // Arrange (준비)
    const element = page.locator('selector');

    // Act (실행)
    await element.click();

    // Assert (검증)
    await expect(page).toHaveURL(/expected-url/);
  });
});
```

### 주요 로케이터 (Locator)

```typescript
// 텍스트로 찾기
page.getByText('검색')
page.getByRole('button', { name: '로그인' })

// 플레이스홀더로 찾기
page.getByPlaceholder('이메일을 입력하세요')

// CSS 선택자
page.locator('.class-name')
page.locator('[data-testid="element"]')

// 첫 번째 요소
page.locator('button').first()

// n번째 요소
page.locator('li').nth(2)
```

### 주요 액션 (Actions)

```typescript
// 클릭
await button.click();

// 입력
await input.fill('텍스트');
await input.type('한글자씩');

// 키보드
await page.keyboard.press('Enter');
await input.press('Escape');

// 호버
await element.hover();

// 스크롤
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
```

### 주요 단언 (Assertions)

```typescript
// 가시성
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// 값
await expect(input).toHaveValue('기대값');

// 텍스트
await expect(element).toHaveText('기대 텍스트');

// URL
await expect(page).toHaveURL(/pattern/);

// 개수
await expect(page.locator('li')).toHaveCount(5);
```

### 대기 (Waiting)

```typescript
// 네트워크 안정화 대기
await page.waitForLoadState('networkidle');

// 특정 요소 대기
await element.waitFor({ state: 'visible' });

// 타임아웃
await page.waitForTimeout(2000); // 권장하지 않음, 특수 상황에만 사용
```

### 스크린샷 및 비디오

```typescript
// 스크린샷
await page.screenshot({ path: 'screenshot.png' });

// 전체 페이지 스크린샷
await page.screenshot({ path: 'full.png', fullPage: true });

// 시각적 회귀 테스트
await expect(page).toHaveScreenshot('expected.png');
```

---

## 모범 사례

### 1. 독립적인 테스트
각 테스트는 다른 테스트에 의존하지 않고 독립적으로 실행 가능해야 합니다.

```typescript
// ❌ 나쁜 예: 이전 테스트에 의존
test('로그인', async ({ page }) => { /* ... */ });
test('프로필 편집', async ({ page }) => {
  // 로그인이 이미 되어있다고 가정 - 위험!
});

// ✅ 좋은 예: 각 테스트가 독립적
test('로그인', async ({ page }) => { /* ... */ });
test('프로필 편집', async ({ page }) => {
  // 로그인부터 다시 수행
  await login(page);
  // 프로필 편집 테스트
});
```

### 2. 명확한 선택자 사용

```typescript
// ❌ 나쁜 예: 변경되기 쉬운 선택자
page.locator('div > div > button')

// ✅ 좋은 예: 의미 있는 선택자
page.getByRole('button', { name: '로그인' })
page.locator('[data-testid="login-button"]')
```

### 3. 적절한 타임아웃 사용

```typescript
// ✅ 자동 대기 활용
await expect(element).toBeVisible(); // 자동으로 5초 대기

// ✅ 특별한 경우 타임아웃 조정
await expect(slowElement).toBeVisible({ timeout: 10000 });

// ❌ 고정 대기는 피하기
await page.waitForTimeout(5000); // 테스트가 느려짐
```

### 4. 에러 처리

```typescript
// ✅ 조건부 동작
const button = page.locator('button');
if (await button.isVisible()) {
  await button.click();
}

// ✅ 옵셔널 요소 확인
const optionalElement = page.locator('.optional');
const count = await optionalElement.count();
if (count > 0) {
  await expect(optionalElement).toBeVisible();
}
```

### 5. 재사용 가능한 헬퍼 함수

```typescript
// 파일: e2e/helpers/auth.ts
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

// 테스트에서 사용
import { login } from './helpers/auth';

test('예약하기', async ({ page }) => {
  await login(page, 'test@example.com', 'password');
  // 예약 테스트 계속...
});
```

---

## CI/CD 통합

### GitHub Actions 예제

`.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Vercel 환경에서 실행

```bash
# 프로덕션 URL로 테스트
BASE_URL=https://your-app.vercel.app npx playwright test
```

---

## 디버깅 팁

### 1. UI 모드 사용
```bash
npm run test:e2e:ui
```
각 단계를 시각적으로 확인하고 타임라인을 통해 문제를 진단합니다.

### 2. 디버그 모드
```bash
npm run test:e2e:debug
```
브레이크포인트를 설정하고 단계별로 실행합니다.

### 3. 트레이스 확인
테스트 실패 시 `playwright-report` 폴더에 생성된 트레이스를 확인:
```bash
npx playwright show-trace test-results/.../trace.zip
```

### 4. 스크린샷 및 비디오
실패한 테스트의 스크린샷과 비디오는 `test-results/` 폴더에 저장됩니다.

---

## 문제 해결

### 문제: 테스트가 타임아웃됨
**해결:**
1. 네트워크 대기: `await page.waitForLoadState('networkidle')`
2. 타임아웃 증가: `{ timeout: 30000 }`
3. 개발 서버가 실행 중인지 확인

### 문제: 요소를 찾을 수 없음
**해결:**
1. UI 모드로 실행하여 실제 DOM 확인
2. 더 일반적인 선택자 사용 (`.first()`, 텍스트 일부분 매칭)
3. 동적 로딩 대기 추가

### 문제: 스크린샷 비교 실패
**해결:**
1. `maxDiffPixels` 값 조정
2. OS/브라우저별 스크린샷 차이 고려
3. 시각적 회귀 테스트는 안정적인 환경에서만 사용

---

## 추가 리소스

- [Playwright 공식 문서](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js E2E Testing Guide](https://nextjs.org/docs/testing)

---

## 라이선스 및 기여

테스트 개선 및 추가는 언제든 환영합니다!

**작성일**: 2026-01-26
**프레임워크**: Playwright v1.x
**프로젝트**: 오늘의 마사지
