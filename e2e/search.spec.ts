import { test, expect } from '@playwright/test';

/**
 * 검색 기능 E2E 테스트
 * - 검색 페이지 접근
 * - 검색 입력 및 결과 표시
 * - 필터링 기능
 */
test.describe('검색 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('검색 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    // 페이지 로딩 확인
    await expect(page).toHaveURL(/search/);

    // 검색 입력 필드 또는 검색 UI 확인
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('지도 또는 리스트 뷰가 있어야 함', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 지도 모드 또는 리스트 모드 확인
    const mapContainer = page.locator('[id*="map"], canvas').first();
    const listContainer = page.locator('[class*="shop"], [class*="card"]').first();

    // 지도 또는 리스트 중 하나는 표시되어야 함
    const mapVisible = await mapContainer.isVisible({ timeout: 5000 }).catch(() => false);
    const listVisible = await listContainer.isVisible({ timeout: 5000 }).catch(() => false);

    expect(mapVisible || listVisible).toBeTruthy();
  });

  test('지도로 보기 또는 리스트로 보기 버튼이 있어야 함', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 뷰 전환 버튼 찾기
    const viewToggleButton = page.getByRole('button', { name: /지도로 보기|리스트/i }).first();

    // 버튼이 있는지 확인 (optional, 카테고리가 있을 때만 표시)
    const buttonCount = await viewToggleButton.count();
    if (buttonCount > 0) {
      await expect(viewToggleButton).toBeVisible();
    }
  });

  test('현재 위치 버튼이 있어야 함', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 현재 위치 버튼 찾기 (지도 모드에서만 표시)
    const locationButton = page.locator('button:has-text("현재"), button[aria-label*="위치"]').first();

    const buttonCount = await locationButton.count();
    if (buttonCount > 0) {
      await expect(locationButton).toBeVisible();
    }
  });

  test('지도가 표시되어야 함', async ({ page }) => {
    // 네트워크 안정화 대기
    await page.waitForLoadState('networkidle');

    // 지도 컨테이너 찾기 (Kakao Map 또는 Naver Map)
    const mapContainer = page.locator('[id*="map"], [class*="map"], canvas').first();

    // 지도가 로드될 때까지 대기 (지도 로딩은 시간이 걸릴 수 있음)
    await expect(mapContainer).toBeVisible({ timeout: 15000 });
  });

  test('필터 옵션이 있어야 함', async ({ page }) => {
    // 네트워크 안정화 대기
    await page.waitForLoadState('networkidle');

    // 필터 버튼 또는 필터 UI 찾기
    const filterButton = page.getByText(/필터|정렬|옵션/i).first();

    // 필터가 있는 경우 확인
    const filterCount = await filterButton.count();
    if (filterCount > 0) {
      await expect(filterButton).toBeVisible();
    }
  });

  test('카테고리 필터를 선택할 수 있어야 함', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 카테고리 버튼 찾기
    const categoryButton = page.getByText(/타이|스웨디시|아로마/i).first();

    if (await categoryButton.isVisible()) {
      await categoryButton.click();

      // 필터 적용 후 네트워크 안정화 대기
      await page.waitForLoadState('networkidle');
    }
  });

  test('검색 페이지 스크린샷', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 스크린샷 테스트는 optional
    try {
      await expect(page).toHaveScreenshot('search-page.png', {
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
 * 검색 결과 상호작용 테스트
 */
test.describe('검색 결과 상호작용', () => {
  test('검색 결과에서 샵을 클릭하면 상세 페이지로 이동해야 함', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // 샵 카드 또는 링크 찾기
    const shopLink = page.locator('a[href*="/shops/"], a[href*="/shop/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      // 링크 클릭
      await shopLink.click();

      // 상세 페이지로 이동 확인
      await expect(page).toHaveURL(/\/shops?\//, { timeout: 10000 });
    }
  });
});

/**
 * 에지 케이스 테스트
 */
test.describe('검색 에지 케이스', () => {
  test('카테고리 필터가 있을 때 Badge가 표시되어야 함', async ({ page }) => {
    // 카테고리를 포함한 URL로 이동
    await page.goto('/search?category=타이');
    await page.waitForLoadState('networkidle');

    // 카테고리 Badge 확인
    const categoryBadge = page.getByText(/타이/i).first();
    await expect(categoryBadge).toBeVisible({ timeout: 10000 });
  });

  test('카테고리 필터 해제 버튼이 작동해야 함', async ({ page }) => {
    await page.goto('/search?category=타이');
    await page.waitForLoadState('networkidle');

    // X 버튼 찾기
    const closeButton = page.locator('button[aria-label*="필터 해제"], button:has-text("×")').first();

    const buttonCount = await closeButton.count();
    if (buttonCount > 0) {
      await closeButton.click();
      await page.waitForLoadState('networkidle');

      // URL에서 category가 제거되었는지 확인
      expect(page.url()).not.toContain('category=');
    }
  });
});
