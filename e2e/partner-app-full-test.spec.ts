import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Partner App (사장님 앱) E2E Test Suite
 * 오늘의마사지 파트너 앱 전체 페이지 테스트
 */

const SCREENSHOT_DIR = 'C:/a/test-screenshots/partner';

// 콘솔 에러 수집용
const consoleErrors: { page: string; errors: string[] }[] = [];
const pageResults: { page: string; url: string; status: string; issues: string[] }[] = [];

// 테스트할 파트너 페이지 목록
const partnerPages = [
  { name: 'dashboard', path: '/partner', description: '대시보드 - 오늘 예약, 통계 차트' },
  { name: 'reservations', path: '/partner/reservations', description: '예약 관리 - 예약 목록' },
  { name: 'courses', path: '/partner/courses', description: '코스 관리 - 코스 목록' },
  { name: 'coupons', path: '/partner/coupons', description: '쿠폰 관리 - 쿠폰 목록' },
  { name: 'customers', path: '/partner/customers', description: '고객 관리 - 고객 목록' },
  { name: 'staff', path: '/partner/staff', description: '관리사 관리 - 관리사 목록' },
  { name: 'settlements', path: '/partner/settlements', description: '정산 조회 - 정산 내역' },
  { name: 'analytics', path: '/partner/analytics', description: '매출 통계 - 차트' },
  { name: 'settings', path: '/partner/settings', description: '설정 - 알림 설정' },
  { name: 'chat', path: '/partner/chat', description: '채팅 - 채팅 목록' },
];

test.describe('Partner App Full E2E Test', () => {
  test.beforeAll(() => {
    // 스크린샷 디렉토리 확인
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  for (const pageInfo of partnerPages) {
    test(`${pageInfo.name}: ${pageInfo.description}`, async ({ page }) => {
      const errors: string[] = [];
      const issues: string[] = [];

      // 콘솔 에러 수집
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // 페이지 에러 수집
      page.on('pageerror', (error) => {
        errors.push(`Page Error: ${error.message}`);
      });

      // 네트워크 실패 수집
      page.on('requestfailed', (request) => {
        issues.push(`Network failed: ${request.url()} - ${request.failure()?.errorText}`);
      });

      try {
        // 페이지 접근
        const response = await page.goto(pageInfo.path, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // HTTP 상태 확인
        const status = response?.status() || 0;
        if (status >= 400) {
          issues.push(`HTTP Error: ${status}`);
        }

        // 페이지 로드 대기
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000); // 추가 렌더링 대기

        // 스크린샷 캡처
        const screenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });

        // 기본 요소 확인
        const bodyContent = await page.textContent('body');
        if (!bodyContent || bodyContent.trim().length < 10) {
          issues.push('Page appears empty or has minimal content');
        }

        // 에러 페이지 확인
        if (bodyContent?.includes('404') || bodyContent?.includes('500') || bodyContent?.includes('Error')) {
          const errorMatch = bodyContent.match(/(404|500|Error|에러|오류)/gi);
          if (errorMatch) {
            issues.push(`Possible error page detected: ${errorMatch.join(', ')}`);
          }
        }

        // 버튼 클릭 가능 여부 확인
        const buttons = await page.locator('button').all();
        let clickableCount = 0;
        for (const button of buttons.slice(0, 10)) { // 최대 10개 버튼만 확인
          try {
            const isVisible = await button.isVisible();
            const isEnabled = await button.isEnabled();
            if (isVisible && isEnabled) {
              clickableCount++;
            }
          } catch (e) {
            // 버튼 확인 실패 무시
          }
        }

        // 링크 확인
        const links = await page.locator('a').all();
        let validLinksCount = 0;
        for (const link of links.slice(0, 10)) {
          try {
            const href = await link.getAttribute('href');
            if (href && href.length > 0) {
              validLinksCount++;
            }
          } catch (e) {
            // 링크 확인 실패 무시
          }
        }

        // 결과 기록
        pageResults.push({
          page: pageInfo.name,
          url: pageInfo.path,
          status: issues.length === 0 ? 'PASS' : 'ISSUES',
          issues: issues
        });

        // 콘솔 에러 기록
        if (errors.length > 0) {
          consoleErrors.push({
            page: pageInfo.name,
            errors: errors
          });
        }

        console.log(`[${pageInfo.name}] Screenshot saved: ${screenshotPath}`);
        console.log(`[${pageInfo.name}] Buttons: ${buttons.length}, Clickable: ${clickableCount}`);
        console.log(`[${pageInfo.name}] Links: ${links.length}, Valid: ${validLinksCount}`);
        console.log(`[${pageInfo.name}] Console Errors: ${errors.length}`);

        if (issues.length > 0) {
          console.log(`[${pageInfo.name}] Issues: ${issues.join(', ')}`);
        }

        // 에러가 너무 많지 않으면 테스트 통과
        expect(status).toBeLessThan(500);

      } catch (error) {
        // 에러 발생 시에도 스크린샷 시도
        try {
          const errorScreenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}-error.png`);
          await page.screenshot({ path: errorScreenshotPath });
          console.log(`[${pageInfo.name}] Error screenshot saved: ${errorScreenshotPath}`);
        } catch (e) {
          console.log(`[${pageInfo.name}] Could not capture error screenshot`);
        }

        issues.push(`Test error: ${error}`);
        pageResults.push({
          page: pageInfo.name,
          url: pageInfo.path,
          status: 'ERROR',
          issues: issues
        });

        throw error;
      }
    });
  }

  test.afterAll(async () => {
    // 최종 리포트 생성
    const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalPages: partnerPages.length,
      results: pageResults,
      consoleErrors: consoleErrors,
      summary: {
        passed: pageResults.filter(r => r.status === 'PASS').length,
        issues: pageResults.filter(r => r.status === 'ISSUES').length,
        errors: pageResults.filter(r => r.status === 'ERROR').length,
        totalConsoleErrors: consoleErrors.reduce((sum, e) => sum + e.errors.length, 0)
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('\n========== TEST SUMMARY ==========');
    console.log(`Total Pages: ${report.totalPages}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`With Issues: ${report.summary.issues}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Total Console Errors: ${report.summary.totalConsoleErrors}`);
    console.log(`Report saved: ${reportPath}`);
    console.log('==================================\n');
  });
});
