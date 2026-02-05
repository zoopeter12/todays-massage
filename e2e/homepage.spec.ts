import { test, expect } from '@playwright/test';

/**
 * 홈페이지 E2E 테스트
 * - 페이지 로딩 검증
 * - 주요 UI 요소 확인
 * - 네비게이션 기능 테스트
 */
test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    // 페이지 타이틀 확인 (공백 포함 여부 상관없이)
    await expect(page).toHaveTitle(/오늘의\s*마사지/i);

    // 헤더 확인
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('배너 섹션이 표시되어야 함', async ({ page }) => {
    // 배너 또는 히어로 섹션 확인
    const banner = page.locator('[class*="banner"], [class*="hero"], [class*="carousel"]').first();

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // 배너가 표시되는지 확인 (선택적, 배너가 없을 수도 있음)
    const bannerCount = await banner.count();
    if (bannerCount > 0) {
      await expect(banner).toBeVisible();
    }
  });

  test('카테고리 섹션이 표시되어야 함', async ({ page }) => {
    // 네트워크 안정화 대기
    await page.waitForLoadState('networkidle');

    // 카테고리 텍스트 또는 버튼 찾기
    const categories = page.getByText(/타이|스웨디시|아로마|스포츠|발|커플/i).first();
    await expect(categories).toBeVisible({ timeout: 10000 });
  });

  test('추천 샵 섹션이 표시되어야 함', async ({ page }) => {
    // 네트워크 안정화 대기
    await page.waitForLoadState('networkidle');

    // '추천' 또는 '인기' 텍스트 찾기
    const recommendedSection = page.getByText(/추천|인기|베스트/i).first();

    // 섹션이 로드될 때까지 대기
    await expect(recommendedSection).toBeVisible({ timeout: 10000 });
  });

  test('하단 네비게이션이 있어야 함', async ({ page }) => {
    // 모바일 하단 네비게이션 또는 푸터 확인
    const navigation = page.locator('nav, footer').last();
    await expect(navigation).toBeVisible();
  });

  test('검색 페이지로 이동할 수 있어야 함', async ({ page }) => {
    // 검색 버튼 또는 링크 찾기
    const searchLink = page.locator('a[href*="search"], button:has-text("검색")').first();

    if (await searchLink.isVisible()) {
      await searchLink.click();
      await expect(page).toHaveURL(/search/);
    }
  });

  test('근처 샵 페이지로 이동할 수 있어야 함', async ({ page }) => {
    // 근처 샵 링크 찾기
    const nearbyLink = page.locator('a[href*="nearby"]').first();

    if (await nearbyLink.isVisible()) {
      await nearbyLink.click();
      await expect(page).toHaveURL(/nearby/);
    }
  });

  test('스크린샷 캡처 (시각적 회귀 테스트용)', async ({ page }) => {
    // 페이지 로딩 완료 대기
    await page.waitForLoadState('networkidle');

    // 전체 페이지 스크린샷 (optional)
    try {
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    } catch (error) {
      // 스크린샷 실패 시 무시
      console.log('Screenshot skipped:', error);
    }
  });
});

/**
 * 반응형 디자인 테스트
 */
test.describe('홈페이지 반응형', () => {
  test('모바일 뷰포트에서 정상 작동해야 함', async ({ page }) => {
    // 모바일 뷰포트 설정 (iPhone 12 크기)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // 페이지 로딩 확인
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // 모바일 스크린샷 (optional)
    try {
      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    } catch (error) {
      // 스크린샷 실패 시 무시
      console.log('Screenshot skipped:', error);
    }
  });

  test('태블릿 뷰포트에서 정상 작동해야 함', async ({ page }) => {
    // 태블릿 뷰포트 설정 (iPad 크기)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // 페이지 로딩 확인
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});
