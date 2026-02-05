import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'C:/a/visual-checks';

// 스크린샷 디렉토리 생성
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const pages = [
  {
    url: '/',
    name: 'home',
    waitFor: 'h1, main'
  },
  {
    url: '/privacy',
    name: 'privacy',
    waitFor: 'h1'
  },
  {
    url: '/terms',
    name: 'terms',
    waitFor: 'h1'
  },
  {
    url: '/admin/blacklist',
    name: 'admin-blacklist',
    waitFor: 'h1, body',
    skipAuth: true // 인증 필요 페이지
  },
];

(async () => {
  console.log('🚀 시각적 검증 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const results: any[] = [];

  for (const pageInfo of pages) {
    const url = `${BASE_URL}${pageInfo.url}`;
    console.log(`📄 검증 중: ${url}`);

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // 추가 대기 (동적 컨텐츠 로딩)
      await page.waitForTimeout(2000);

      // 응답 상태 확인
      const status = response?.status() || 0;
      console.log(`   ✓ 응답 상태: ${status}`);

      // 페이지 타이틀 확인
      const title = await page.title();
      console.log(`   ✓ 페이지 타이틀: ${title}`);

      // 주요 요소 대기
      try {
        await page.waitForSelector(pageInfo.waitFor, { timeout: 5000 });
        console.log(`   ✓ 주요 요소 발견: ${pageInfo.waitFor}`);
      } catch (e) {
        console.log(`   ⚠️ 주요 요소 대기 실패: ${pageInfo.waitFor}`);
      }

      // 에러 확인
      const errors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .error, .text-destructive');
        return Array.from(errorElements).map(el => el.textContent?.trim());
      });

      if (errors.length > 0) {
        console.log(`   ⚠️ 페이지 에러: ${errors.join(', ')}`);
      }

      // 스크린샷 캡처
      const screenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      console.log(`   ✓ 스크린샷 저장: ${screenshotPath}`);

      results.push({
        url,
        name: pageInfo.name,
        status,
        title,
        errors: errors.length > 0 ? errors : null,
        screenshot: screenshotPath,
        success: status >= 200 && status < 400
      });

      console.log(`   ✅ 완료\n`);

    } catch (error: any) {
      console.log(`   ❌ 실패: ${error.message}\n`);
      results.push({
        url,
        name: pageInfo.name,
        status: 0,
        error: error.message,
        success: false
      });
    }
  }

  await browser.close();

  // 결과 요약
  console.log('\n📊 검증 결과 요약\n');
  console.log('='.repeat(60));

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${result.status})`);
    console.log(`   URL: ${result.url}`);
    if (result.title) console.log(`   타이틀: ${result.title}`);
    if (result.errors) console.log(`   에러: ${result.errors.join(', ')}`);
    if (result.screenshot) console.log(`   스크린샷: ${result.screenshot}`);
    if (result.error) console.log(`   실패 사유: ${result.error}`);
    console.log();
  });

  console.log('='.repeat(60));
  console.log(`\n총 ${results.length}개 페이지 중 ${results.filter(r => r.success).length}개 성공\n`);

  // JSON 결과 저장
  const reportPath = path.join(SCREENSHOT_DIR, 'visual-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 상세 리포트: ${reportPath}\n`);

  process.exit(results.every(r => r.success) ? 0 : 1);
})();
