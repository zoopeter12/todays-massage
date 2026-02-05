/**
 * Partner App E2E Test Runner
 * 직접 실행용 스크립트
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'C:/a/test-screenshots/partner';
const BASE_URL = 'http://localhost:3000';

// 테스트할 파트너 페이지 목록
const partnerPages = [
  { name: '01-dashboard', path: '/partner', description: '대시보드 - 오늘 예약, 통계 차트' },
  { name: '02-reservations', path: '/partner/reservations', description: '예약 관리 - 예약 목록' },
  { name: '03-courses', path: '/partner/courses', description: '코스 관리 - 코스 목록' },
  { name: '04-coupons', path: '/partner/coupons', description: '쿠폰 관리 - 쿠폰 목록' },
  { name: '05-customers', path: '/partner/customers', description: '고객 관리 - 고객 목록' },
  { name: '06-staff', path: '/partner/staff', description: '관리사 관리 - 관리사 목록' },
  { name: '07-settlements', path: '/partner/settlements', description: '정산 조회 - 정산 내역' },
  { name: '08-analytics', path: '/partner/analytics', description: '매출 통계 - 차트' },
  { name: '09-settings', path: '/partner/settings', description: '설정 - 알림 설정' },
  { name: '10-chat', path: '/partner/chat', description: '채팅 - 채팅 목록' },
];

async function runTests() {
  // 스크린샷 디렉토리 생성
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('='.repeat(60));
  console.log('Partner App E2E Test Runner');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshot Dir: ${SCREENSHOT_DIR}`);
  console.log(`Total Pages: ${partnerPages.length}`);
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const results = [];
  const allConsoleErrors = [];

  for (const pageInfo of partnerPages) {
    console.log(`\n[${pageInfo.name}] Testing: ${pageInfo.description}`);
    console.log(`[${pageInfo.name}] URL: ${BASE_URL}${pageInfo.path}`);

    const page = await context.newPage();
    const consoleErrors = [];
    const issues = [];

    // 콘솔 에러 수집
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 페이지 에러 수집
    page.on('pageerror', (error) => {
      consoleErrors.push(`PageError: ${error.message}`);
    });

    // 네트워크 실패 수집
    page.on('requestfailed', (request) => {
      issues.push(`Network failed: ${request.url()} - ${request.failure()?.errorText || 'unknown'}`);
    });

    try {
      // 페이지 접근
      const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const status = response?.status() || 0;
      console.log(`[${pageInfo.name}] HTTP Status: ${status}`);

      if (status >= 400) {
        issues.push(`HTTP Error: ${status}`);
      }

      // 페이지 로드 대기
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500); // 렌더링 대기

      // 스크린샷 캡처
      const screenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      console.log(`[${pageInfo.name}] Screenshot: ${screenshotPath}`);

      // 페이지 내용 확인
      const bodyContent = await page.textContent('body');
      const contentLength = bodyContent?.trim().length || 0;
      console.log(`[${pageInfo.name}] Content length: ${contentLength} chars`);

      if (contentLength < 50) {
        issues.push('Page appears empty or has minimal content');
      }

      // 에러 페이지 확인
      if (bodyContent?.includes('404') && bodyContent?.includes('not found')) {
        issues.push('404 Not Found page detected');
      }
      if (bodyContent?.includes('500') || bodyContent?.includes('Internal Server Error')) {
        issues.push('500 Server Error page detected');
      }

      // 버튼 확인
      const buttons = await page.locator('button').count();
      console.log(`[${pageInfo.name}] Buttons found: ${buttons}`);

      // 클릭 가능한 버튼 확인
      let clickableButtons = 0;
      const buttonElements = await page.locator('button').all();
      for (const btn of buttonElements.slice(0, 10)) {
        try {
          if (await btn.isVisible() && await btn.isEnabled()) {
            clickableButtons++;
          }
        } catch (e) {
          // ignore
        }
      }
      console.log(`[${pageInfo.name}] Clickable buttons: ${clickableButtons}`);

      // 링크 확인
      const links = await page.locator('a').count();
      console.log(`[${pageInfo.name}] Links found: ${links}`);

      // 콘솔 에러 출력
      if (consoleErrors.length > 0) {
        console.log(`[${pageInfo.name}] Console Errors (${consoleErrors.length}):`);
        consoleErrors.slice(0, 5).forEach((err, i) => {
          console.log(`  ${i + 1}. ${err.substring(0, 150)}...`);
        });
        allConsoleErrors.push({
          page: pageInfo.name,
          errors: consoleErrors
        });
      }

      // 이슈 출력
      if (issues.length > 0) {
        console.log(`[${pageInfo.name}] Issues found:`);
        issues.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue}`);
        });
      }

      results.push({
        page: pageInfo.name,
        url: pageInfo.path,
        description: pageInfo.description,
        status: status,
        contentLength: contentLength,
        buttons: buttons,
        clickableButtons: clickableButtons,
        links: links,
        consoleErrors: consoleErrors.length,
        issues: issues,
        screenshot: screenshotPath,
        testResult: issues.length === 0 ? 'PASS' : 'ISSUES'
      });

    } catch (error) {
      console.log(`[${pageInfo.name}] ERROR: ${error.message}`);

      // 에러 스크린샷 시도
      try {
        const errorScreenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}-error.png`);
        await page.screenshot({ path: errorScreenshotPath });
        console.log(`[${pageInfo.name}] Error screenshot: ${errorScreenshotPath}`);
      } catch (e) {
        console.log(`[${pageInfo.name}] Could not capture error screenshot`);
      }

      results.push({
        page: pageInfo.name,
        url: pageInfo.path,
        description: pageInfo.description,
        error: error.message,
        testResult: 'ERROR'
      });
    }

    await page.close();
  }

  await browser.close();

  // 리포트 생성
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalPages: partnerPages.length,
    results: results,
    consoleErrors: allConsoleErrors,
    summary: {
      passed: results.filter(r => r.testResult === 'PASS').length,
      issues: results.filter(r => r.testResult === 'ISSUES').length,
      errors: results.filter(r => r.testResult === 'ERROR').length,
      totalConsoleErrors: allConsoleErrors.reduce((sum, e) => sum + e.errors.length, 0)
    }
  };

  const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // 최종 요약 출력
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Pages Tested: ${report.totalPages}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`With Issues: ${report.summary.issues}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Total Console Errors: ${report.summary.totalConsoleErrors}`);
  console.log(`\nReport saved: ${reportPath}`);
  console.log('='.repeat(60));

  // 스크린샷 목록
  console.log('\nSCREENSHOTS CAPTURED:');
  results.forEach(r => {
    if (r.screenshot) {
      console.log(`  - ${r.screenshot}`);
    }
  });

  // 문제점 요약
  const pagesWithIssues = results.filter(r => r.issues && r.issues.length > 0);
  if (pagesWithIssues.length > 0) {
    console.log('\nPAGES WITH ISSUES:');
    pagesWithIssues.forEach(r => {
      console.log(`  [${r.page}] ${r.issues.join(', ')}`);
    });
  }

  // 에러 요약
  const pagesWithErrors = results.filter(r => r.testResult === 'ERROR');
  if (pagesWithErrors.length > 0) {
    console.log('\nPAGES WITH ERRORS:');
    pagesWithErrors.forEach(r => {
      console.log(`  [${r.page}] ${r.error}`);
    });
  }
}

runTests().catch(console.error);
