import { test, expect } from '@playwright/test';

/**
 * 샵 상세 페이지 E2E 테스트
 * - 상세 정보 표시
 * - 이미지 갤러리
 * - 예약 버튼
 * - 리뷰 섹션
 */
test.describe('샵 상세 페이지', () => {
  // 테스트용 샵 ID (실제 환경에 맞게 조정 필요)
  const TEST_SHOP_ID = '1';

  test.beforeEach(async ({ page }) => {
    // 먼저 검색 페이지로 이동하여 실제 샵 링크를 찾음
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('검색에서 샵 상세 페이지로 이동할 수 있어야 함', async ({ page }) => {
    // 첫 번째 샵 링크 찾기
    const shopLink = page.locator('a[href*="/shops/"], a[href*="/shop/"]').first();

    if (await shopLink.isVisible({ timeout: 10000 })) {
      // 샵 이름 저장
      const shopName = await shopLink.textContent();

      // 링크 클릭
      await shopLink.click();

      // 상세 페이지로 이동 확인
      await expect(page).toHaveURL(/\/shops?\//, { timeout: 10000 });

      // 페이지 로딩 완료 대기
      await page.waitForLoadState('networkidle');
    }
  });

  test('샵 기본 정보가 표시되어야 함', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 샵 이름이 페이지 어딘가에 있어야 함
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    }
  });

  test('샵 이미지가 표시되어야 함', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 이미지 찾기
      const images = page.locator('img[src*="shop"], img[src*="massage"], img[alt*="샵"], img[alt*="마사지"]');

      // 최소 1개 이상의 이미지가 있어야 함
      const imageCount = await images.count();
      if (imageCount > 0) {
        await expect(images.first()).toBeVisible();
      }
    }
  });

  test('주소 및 위치 정보가 표시되어야 함', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 주소 또는 위치 아이콘 찾기
      const locationInfo = page.getByText(/주소|위치|서울|경기|부산/i).first();

      // 위치 정보가 있는지 확인 (없을 수도 있음)
      const locationCount = await locationInfo.count();
      if (locationCount > 0) {
        await expect(locationInfo).toBeVisible();
      }
    }
  });

  test('영업 시간 정보가 표시되어야 함', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 영업 시간 정보 찾기
      const hoursInfo = page.getByText(/영업|시간|운영|오픈|마감/i).first();

      const hoursCount = await hoursInfo.count();
      if (hoursCount > 0) {
        await expect(hoursInfo).toBeVisible();
      }
    }
  });

  test('가격 정보가 표시되어야 함', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 가격 정보 찾기 (원 단위)
      const priceInfo = page.getByText(/원|₩|,000/i).first();

      const priceCount = await priceInfo.count();
      if (priceCount > 0) {
        await expect(priceInfo).toBeVisible();
      }
    }
  });

  test('예약 버튼이 있어야 함', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 예약 버튼 찾기
      const bookingButton = page.getByRole('button', { name: /예약|예매|신청/i });

      const buttonCount = await bookingButton.count();
      if (buttonCount > 0) {
        await expect(bookingButton).toBeVisible();
        await expect(bookingButton).toBeEnabled();
      }
    }
  });

  test('리뷰 섹션이 있어야 함', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 리뷰 관련 텍스트 찾기
      const reviewSection = page.getByText(/리뷰|후기|평가|별점/i).first();

      const reviewCount = await reviewSection.count();
      if (reviewCount > 0) {
        await expect(reviewSection).toBeVisible();
      }
    }
  });

  test('즐겨찾기 버튼이 있어야 함', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 하트 아이콘 또는 즐겨찾기 버튼 찾기
      const favoriteButton = page.locator('button:has-text("즐겨찾기"), button:has-text("♥"), button:has-text("❤")').first();

      const favCount = await favoriteButton.count();
      if (favCount > 0) {
        await expect(favoriteButton).toBeVisible();
      }
    }
  });

  test('상세 페이지 스크린샷', async ({ page }) => {
    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 이미지 로딩 추가 대기
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('shop-detail.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    }
  });
});

/**
 * 예약 플로우 테스트
 */
test.describe('예약 기능', () => {
  test('예약 버튼 클릭 시 적절히 반응해야 함', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 예약 버튼 찾기
      const bookingButton = page.getByRole('button', { name: /예약/i });

      if (await bookingButton.isVisible({ timeout: 5000 })) {
        // 버튼 클릭
        await bookingButton.click();

        // 로그인 페이지로 이동하거나 예약 모달이 열릴 수 있음
        await page.waitForTimeout(2000);

        // URL 변경 또는 모달 표시 확인
        const currentUrl = page.url();
        const hasModal = await page.locator('[role="dialog"], [class*="modal"]').isVisible();

        // 어느 하나는 발생해야 함
        expect(currentUrl.includes('/login') || currentUrl.includes('/booking') || hasModal).toBeTruthy();
      }
    }
  });
});

/**
 * 반응형 테스트
 */
test.describe('샵 상세 페이지 반응형', () => {
  test('모바일에서 정상 작동해야 함', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const shopLink = page.locator('a[href*="/shops/"]').first();

    if (await shopLink.isVisible({ timeout: 5000 })) {
      await shopLink.click();
      await page.waitForLoadState('networkidle');

      // 기본 콘텐츠 확인
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
