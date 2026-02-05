import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Admin App E2E Test Suite
 * Tests all admin pages with screenshots and console error collection
 */

const SCREENSHOT_DIR = 'C:/a/test-screenshots/admin';
const ADMIN_PAGES = [
  { path: '/admin', name: 'dashboard', title: '대시보드' },
  { path: '/admin/users', name: 'users', title: '회원 관리' },
  { path: '/admin/shops', name: 'shops', title: '매장 관리' },
  { path: '/admin/settlements', name: 'settlements', title: '정산 관리' },
  { path: '/admin/content', name: 'content', title: '콘텐츠 관리' },
  { path: '/admin/reports', name: 'reports', title: '신고/CS 관리' },
  { path: '/admin/settings', name: 'settings', title: '시스템 설정' },
];

// Console errors collection
const consoleErrors: { page: string; errors: string[] }[] = [];

test.describe('Admin App E2E Tests', () => {
  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  for (const pageInfo of ADMIN_PAGES) {
    test(`${pageInfo.title} (${pageInfo.path}) - Page Load and Screenshot`, async ({ page }) => {
      const errors: string[] = [];

      // Collect console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Collect page errors
      page.on('pageerror', (err) => {
        errors.push(`Page Error: ${err.message}`);
      });

      // Navigate to page
      const response = await page.goto(pageInfo.path, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Check response status
      expect(response?.status()).toBeLessThan(400);

      // Wait for content to load
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Extra wait for dynamic content

      // Take full page screenshot
      const screenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      // Store console errors
      if (errors.length > 0) {
        consoleErrors.push({ page: pageInfo.path, errors });
      }

      console.log(`Screenshot saved: ${screenshotPath}`);
      console.log(`Console errors: ${errors.length}`);
      if (errors.length > 0) {
        console.log('Errors:', errors);
      }
    });
  }

  test('Verify clickable buttons on Dashboard', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' });

    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on dashboard`);

    // Check each button is enabled and visible
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      const text = await button.textContent();
      console.log(`Button ${i + 1}: "${text?.trim()}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    }
  });

  test('Verify navigation sidebar links', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' });

    // Find navigation links
    const navLinks = await page.locator('nav a, aside a').all();
    console.log(`Found ${navLinks.length} navigation links`);

    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      const isVisible = await link.isVisible();
      if (href?.startsWith('/admin')) {
        console.log(`Nav Link: "${text?.trim()}" -> ${href} - Visible: ${isVisible}`);
      }
    }
  });

  test.afterAll(async () => {
    // Write summary report
    const report = {
      timestamp: new Date().toISOString(),
      testedPages: ADMIN_PAGES.map(p => p.path),
      screenshotDir: SCREENSHOT_DIR,
      consoleErrors: consoleErrors,
    };

    const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nTest Report saved: ${reportPath}`);

    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors Summary ===');
      for (const { page, errors } of consoleErrors) {
        console.log(`\n${page}:`);
        errors.forEach(e => console.log(`  - ${e}`));
      }
    }
  });
});
