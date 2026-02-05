import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Next.js E2E Testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // 테스트 타임아웃 설정
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },

  // 병렬 실행 설정
  fullyParallel: true,

  // CI 환경에서 재시도
  retries: process.env.CI ? 2 : 0,

  // 워커 수 설정
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['html'],
    ['list']
  ],

  // 모든 테스트에 공통 설정
  use: {
    // 베이스 URL (로컬 개발 서버)
    baseURL: 'http://localhost:3000',

    // 스크린샷 및 비디오 설정
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 브라우저 컨텍스트 옵션
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // 프로젝트별 설정 (브라우저)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 필요시 다른 브라우저 활성화
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // 모바일 테스트
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // 개발 서버 자동 시작
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
