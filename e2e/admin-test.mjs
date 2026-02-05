/**
 * Admin E2E Test Script
 * Run with: node e2e/admin-test.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/a/test-screenshots/admin';
const BASE_URL = 'http://localhost:3000';

const ADMIN_PAGES = [
  { path: '/admin', name: 'dashboard', title: '대시보드' },
  { path: '/admin/users', name: 'users', title: '회원 관리' },
  { path: '/admin/shops', name: 'shops', title: '매장 관리' },
  { path: '/admin/settlements', name: 'settlements', title: '정산 관리' },
  { path: '/admin/content', name: 'content', title: '콘텐츠 관리' },
  { path: '/admin/reports', name: 'reports', title: '신고/CS 관리' },
  { path: '/admin/settings', name: 'settings', title: '시스템 설정' },
];

async function runTests() {
  console.log('=== Admin App E2E Test Started ===\n');

  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const results = [];

  for (const pageInfo of ADMIN_PAGES) {
    console.log(`\n--- Testing: ${pageInfo.title} (${pageInfo.path}) ---`);

    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const issues = [];

    // Collect console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Collect page errors
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    try {
      const startTime = Date.now();
      const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      const loadTime = Date.now() - startTime;

      const httpStatus = response?.status() || 0;
      console.log(`  HTTP Status: ${httpStatus}`);
      console.log(`  Load Time: ${loadTime}ms`);

      if (httpStatus >= 400) {
        issues.push(`HTTP Error: ${httpStatus}`);
      }

      // Wait for content
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      console.log(`  Screenshot: ${screenshotPath}`);

      // Check buttons
      const buttons = await page.locator('button').all();
      const buttonResults = [];

      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        try {
          const text = (await buttons[i].textContent())?.trim() || '';
          const visible = await buttons[i].isVisible();
          const enabled = await buttons[i].isEnabled();
          buttonResults.push({ text, visible, enabled });

          if (!visible || !enabled) {
            issues.push(`Button "${text}" - Visible: ${visible}, Enabled: ${enabled}`);
          }
        } catch (e) {
          // Button might be detached
        }
      }
      console.log(`  Buttons found: ${buttons.length}`);

      // Log console errors
      if (consoleErrors.length > 0) {
        console.log(`  Console Errors: ${consoleErrors.length}`);
        consoleErrors.forEach((e, i) => console.log(`    ${i + 1}. ${e.substring(0, 150)}`));
      }

      if (pageErrors.length > 0) {
        console.log(`  Page Errors: ${pageErrors.length}`);
        pageErrors.forEach((e, i) => console.log(`    ${i + 1}. ${e.substring(0, 150)}`));
      }

      results.push({
        page: pageInfo.path,
        title: pageInfo.title,
        status: httpStatus < 400 ? 'success' : 'error',
        screenshotPath,
        consoleErrors,
        pageErrors,
        httpStatus,
        loadTime,
        buttons: buttonResults,
        issues,
      });

    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
      issues.push(`Navigation error: ${error.message}`);

      results.push({
        page: pageInfo.path,
        title: pageInfo.title,
        status: 'error',
        consoleErrors,
        pageErrors,
        issues,
      });
    }

    await page.close();
  }

  await browser.close();

  // Generate summary report
  console.log('\n\n=== TEST SUMMARY ===\n');

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');

  console.log(`Total Pages Tested: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  console.log('\n--- Screenshot Paths ---');
  results.forEach(r => {
    if (r.screenshotPath) {
      console.log(`  ${r.title}: ${r.screenshotPath}`);
    }
  });

  const allConsoleErrors = results.flatMap(r => r.consoleErrors.map(e => ({ page: r.page, error: e })));
  if (allConsoleErrors.length > 0) {
    console.log('\n--- All Console Errors ---');
    allConsoleErrors.forEach(({ page, error }) => {
      console.log(`  [${page}] ${error.substring(0, 200)}`);
    });
  }

  const allIssues = results.flatMap(r => r.issues.map(i => ({ page: r.page, issue: i })));
  if (allIssues.length > 0) {
    console.log('\n--- All Issues Found ---');
    allIssues.forEach(({ page, issue }) => {
      console.log(`  [${page}] ${issue}`);
    });
  }

  // Save report
  const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
    },
    results
  }, null, 2));
  console.log(`\nReport saved: ${reportPath}`);

  console.log('\n=== Test Completed ===');
}

runTests().catch(console.error);
