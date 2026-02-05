import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/a/test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results collector
interface TestResult {
  page: string;
  url: string;
  screenshotPath: string;
  consoleErrors: string[];
  networkErrors: { url: string; status: number; statusText: string }[];
  naverMapStatus: 'loaded' | 'not_loaded' | 'not_applicable';
  issues: string[];
  loadTime: number;
}

const testResults: TestResult[] = [];

// Helper function to setup error collectors
async function setupErrorCollectors(page: Page) {
  const consoleErrors: string[] = [];
  const networkErrors: { url: string; status: number; statusText: string }[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
      });
    }
  });

  return { consoleErrors, networkErrors };
}

// Helper function to check Naver Map
async function checkNaverMap(page: Page): Promise<'loaded' | 'not_loaded'> {
  try {
    // Check for Naver Map container or script
    const naverMapLoaded = await page.evaluate(() => {
      // Check if naver map object exists
      if (typeof (window as any).naver !== 'undefined' && (window as any).naver.maps) {
        return true;
      }
      // Check for map container
      const mapContainer = document.querySelector('[id*="map"]') ||
                          document.querySelector('.naver-map') ||
                          document.querySelector('[class*="map"]');
      return mapContainer !== null;
    });
    return naverMapLoaded ? 'loaded' : 'not_loaded';
  } catch {
    return 'not_loaded';
  }
}

test.describe('Customer App E2E Full Page Tests', () => {

  test('1. Homepage (/) - Banner, Categories, Recommended Shops', async ({ page }) => {
    const startTime = Date.now();
    const { consoleErrors, networkErrors } = await setupErrorCollectors(page);
    const issues: string[] = [];

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, '01-homepage.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check for banner
    const bannerExists = await page.locator('[class*="banner"], [class*="carousel"], [class*="slider"], [data-testid*="banner"]').first().isVisible().catch(() => false);
    if (!bannerExists) {
      issues.push('Banner not found or not visible');
    }

    // Check for categories
    const categoryExists = await page.locator('[class*="category"], [class*="categories"], [data-testid*="category"]').first().isVisible().catch(() => false);
    if (!categoryExists) {
      issues.push('Categories section not found');
    }

    // Check for recommended shops
    const shopsExist = await page.locator('[class*="shop"], [class*="recommend"], [class*="card"]').first().isVisible().catch(() => false);
    if (!shopsExist) {
      issues.push('Recommended shops section not found');
    }

    testResults.push({
      page: 'Homepage',
      url: '/',
      screenshotPath,
      consoleErrors: [...consoleErrors],
      networkErrors: [...networkErrors],
      naverMapStatus: 'not_applicable',
      issues,
      loadTime,
    });

    console.log(`Homepage: ${consoleErrors.length} console errors, ${networkErrors.length} network errors, ${issues.length} issues`);
  });

  test('2. Search Page (/search) - Naver Map, Search Input, Filters', async ({ page }) => {
    const startTime = Date.now();
    const { consoleErrors, networkErrors } = await setupErrorCollectors(page);
    const issues: string[] = [];

    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Wait additional time for map to load
    await page.waitForTimeout(3000);
    const loadTime = Date.now() - startTime;

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, '02-search.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check Naver Map (CRITICAL)
    const naverMapStatus = await checkNaverMap(page);
    if (naverMapStatus === 'not_loaded') {
      issues.push('CRITICAL: Naver Map not loaded on search page');
    }

    // Check for search input
    const searchInputExists = await page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="search"], [class*="search"] input').first().isVisible().catch(() => false);
    if (!searchInputExists) {
      issues.push('Search input not found');
    }

    // Check for filters
    const filtersExist = await page.locator('[class*="filter"], [data-testid*="filter"], button:has-text("필터")').first().isVisible().catch(() => false);
    if (!filtersExist) {
      issues.push('Filter controls not found');
    }

    testResults.push({
      page: 'Search',
      url: '/search',
      screenshotPath,
      consoleErrors: [...consoleErrors],
      networkErrors: [...networkErrors],
      naverMapStatus,
      issues,
      loadTime,
    });

    console.log(`Search: Map=${naverMapStatus}, ${consoleErrors.length} console errors, ${networkErrors.length} network errors`);
  });

  test('3. Nearby Page (/nearby) - Naver Map', async ({ page }) => {
    const startTime = Date.now();
    const { consoleErrors, networkErrors } = await setupErrorCollectors(page);
    const issues: string[] = [];

    await page.goto('/nearby');
    await page.waitForLoadState('networkidle');

    // Wait additional time for map to load
    await page.waitForTimeout(3000);
    const loadTime = Date.now() - startTime;

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, '03-nearby.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check Naver Map (CRITICAL)
    const naverMapStatus = await checkNaverMap(page);
    if (naverMapStatus === 'not_loaded') {
      issues.push('CRITICAL: Naver Map not loaded on nearby page');
    }

    // Check for location-related elements
    const locationElements = await page.locator('[class*="location"], [class*="nearby"], [class*="distance"]').first().isVisible().catch(() => false);
    if (!locationElements) {
      issues.push('Location-related elements not found');
    }

    testResults.push({
      page: 'Nearby',
      url: '/nearby',
      screenshotPath,
      consoleErrors: [...consoleErrors],
      networkErrors: [...networkErrors],
      naverMapStatus,
      issues,
      loadTime,
    });

    console.log(`Nearby: Map=${naverMapStatus}, ${consoleErrors.length} console errors, ${networkErrors.length} network errors`);
  });

  test('4. Points Page (/points) - Balance, History', async ({ page }) => {
    const startTime = Date.now();
    const { consoleErrors, networkErrors } = await setupErrorCollectors(page);
    const issues: string[] = [];

    await page.goto('/points');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, '04-points.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check for points balance display
    const balanceExists = await page.locator('[class*="balance"], [class*="point"], :has-text("포인트"), :has-text("P")').first().isVisible().catch(() => false);
    if (!balanceExists) {
      issues.push('Points balance display not found');
    }

    // Check for history section
    const historyExists = await page.locator('[class*="history"], [class*="transaction"], [class*="list"]').first().isVisible().catch(() => false);
    if (!historyExists) {
      issues.push('Points history section not found');
    }

    testResults.push({
      page: 'Points',
      url: '/points',
      screenshotPath,
      consoleErrors: [...consoleErrors],
      networkErrors: [...networkErrors],
      naverMapStatus: 'not_applicable',
      issues,
      loadTime,
    });

    console.log(`Points: ${consoleErrors.length} console errors, ${networkErrors.length} network errors, ${issues.length} issues`);
  });

  test('5. Coupons Page (/coupons) - Coupon List', async ({ page }) => {
    const startTime = Date.now();
    const { consoleErrors, networkErrors } = await setupErrorCollectors(page);
    const issues: string[] = [];

    await page.goto('/coupons');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, '05-coupons.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check for coupon list
    const couponListExists = await page.locator('[class*="coupon"], [class*="voucher"], :has-text("쿠폰"), :has-text("할인")').first().isVisible().catch(() => false);
    if (!couponListExists) {
      issues.push('Coupon list not found');
    }

    // Check for empty state or coupon cards
    const hasContent = await page.locator('[class*="card"], [class*="item"], [class*="empty"]').first().isVisible().catch(() => false);
    if (!hasContent) {
      issues.push('No coupon content or empty state found');
    }

    testResults.push({
      page: 'Coupons',
      url: '/coupons',
      screenshotPath,
      consoleErrors: [...consoleErrors],
      networkErrors: [...networkErrors],
      naverMapStatus: 'not_applicable',
      issues,
      loadTime,
    });

    console.log(`Coupons: ${consoleErrors.length} console errors, ${networkErrors.length} network errors, ${issues.length} issues`);
  });

  test('6. Favorites Page (/favorites) - Favorites List', async ({ page }) => {
    const startTime = Date.now();
    const { consoleErrors, networkErrors } = await setupErrorCollectors(page);
    const issues: string[] = [];

    await page.goto('/favorites');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, '06-favorites.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check for favorites list
    const favoritesListExists = await page.locator('[class*="favorite"], [class*="bookmark"], [class*="heart"], :has-text("즐겨찾기"), :has-text("찜")').first().isVisible().catch(() => false);
    if (!favoritesListExists) {
      issues.push('Favorites list not found');
    }

    // Check for empty state or favorite items
    const hasContent = await page.locator('[class*="card"], [class*="item"], [class*="empty"], [class*="shop"]').first().isVisible().catch(() => false);
    if (!hasContent) {
      issues.push('No favorites content or empty state found');
    }

    testResults.push({
      page: 'Favorites',
      url: '/favorites',
      screenshotPath,
      consoleErrors: [...consoleErrors],
      networkErrors: [...networkErrors],
      naverMapStatus: 'not_applicable',
      issues,
      loadTime,
    });

    console.log(`Favorites: ${consoleErrors.length} console errors, ${networkErrors.length} network errors, ${issues.length} issues`);
  });

  test.afterAll(async () => {
    // Generate summary report
    const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

    // Print summary
    console.log('\n========================================');
    console.log('E2E TEST SUMMARY REPORT');
    console.log('========================================\n');

    let totalConsoleErrors = 0;
    let totalNetworkErrors = 0;
    let totalIssues = 0;

    testResults.forEach((result) => {
      console.log(`\n[${result.page}] (${result.url})`);
      console.log(`  Screenshot: ${result.screenshotPath}`);
      console.log(`  Load Time: ${result.loadTime}ms`);
      console.log(`  Naver Map: ${result.naverMapStatus}`);
      console.log(`  Console Errors: ${result.consoleErrors.length}`);
      result.consoleErrors.forEach((err) => console.log(`    - ${err.substring(0, 100)}`));
      console.log(`  Network Errors: ${result.networkErrors.length}`);
      result.networkErrors.forEach((err) => console.log(`    - ${err.status} ${err.url.substring(0, 80)}`));
      console.log(`  Issues: ${result.issues.length}`);
      result.issues.forEach((issue) => console.log(`    - ${issue}`));

      totalConsoleErrors += result.consoleErrors.length;
      totalNetworkErrors += result.networkErrors.length;
      totalIssues += result.issues.length;
    });

    console.log('\n========================================');
    console.log('TOTALS');
    console.log('========================================');
    console.log(`Total Console Errors: ${totalConsoleErrors}`);
    console.log(`Total Network Errors: ${totalNetworkErrors}`);
    console.log(`Total Issues Found: ${totalIssues}`);
    console.log(`Report saved to: ${reportPath}`);
    console.log('========================================\n');
  });
});
