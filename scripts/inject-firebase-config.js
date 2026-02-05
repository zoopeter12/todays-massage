/**
 * Firebase Service Worker 설정 주입 스크립트
 *
 * 빌드 시 public/firebase-messaging-sw.js의 플레이스홀더를
 * 환경변수 값으로 교체합니다.
 *
 * 사용법:
 *   node scripts/inject-firebase-config.js
 *
 * 환경변수 (.env.local 또는 CI 환경):
 *   - NEXT_PUBLIC_FIREBASE_API_KEY
 *   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   - NEXT_PUBLIC_FIREBASE_APP_ID
 */

const fs = require('fs');
const path = require('path');

// .env.local 파일 로드 (dotenv 없이 직접 파싱)
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};

  content.split('\n').forEach((line) => {
    // 주석과 빈 줄 무시
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // KEY=VALUE 파싱
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      return;
    }

    const key = trimmed.substring(0, equalIndex).trim();
    let value = trimmed.substring(equalIndex + 1).trim();

    // 따옴표 제거
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  });

  return env;
}

// 메인 실행
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const swPath = path.join(projectRoot, 'public', 'firebase-messaging-sw.js');

  // Service Worker 파일 존재 확인
  if (!fs.existsSync(swPath)) {
    console.error('[inject-firebase-config] Error: firebase-messaging-sw.js not found');
    console.error('  Expected path:', swPath);
    process.exit(1);
  }

  // .env.local 로드 (이미 process.env에 있으면 그것을 우선 사용)
  const envLocalPath = path.join(projectRoot, '.env.local');
  const envLocal = loadEnvFile(envLocalPath);

  // 환경변수 가져오기 (process.env 우선, 없으면 .env.local)
  const getEnv = (key) => process.env[key] || envLocal[key] || '';

  // 플레이스홀더 매핑
  const replacements = {
    '__FIREBASE_API_KEY__': getEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
    '__FIREBASE_AUTH_DOMAIN__': getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    '__FIREBASE_PROJECT_ID__': getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    '__FIREBASE_STORAGE_BUCKET__': getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    '__FIREBASE_MESSAGING_SENDER_ID__': getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    '__FIREBASE_APP_ID__': getEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  };

  // 누락된 환경변수 확인
  const missing = Object.entries(replacements)
    .filter(([, value]) => !value)
    .map(([placeholder]) => placeholder);

  if (missing.length > 0) {
    console.warn('[inject-firebase-config] Warning: Missing environment variables for:');
    const placeholderToEnvKey = {
      '__FIREBASE_API_KEY__': 'NEXT_PUBLIC_FIREBASE_API_KEY',
      '__FIREBASE_AUTH_DOMAIN__': 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      '__FIREBASE_PROJECT_ID__': 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      '__FIREBASE_STORAGE_BUCKET__': 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      '__FIREBASE_MESSAGING_SENDER_ID__': 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      '__FIREBASE_APP_ID__': 'NEXT_PUBLIC_FIREBASE_APP_ID',
    };
    missing.forEach((placeholder) => {
      const envKey = placeholderToEnvKey[placeholder] || placeholder;
      console.warn(`  - ${envKey}`);
    });
    console.warn('  Firebase push notifications may not work correctly.');
  }

  // 파일 읽기
  let content = fs.readFileSync(swPath, 'utf8');
  const originalContent = content;

  // 플레이스홀더 교체
  let replacedCount = 0;
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (content.includes(placeholder) && value) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
      replacedCount++;
    }
  }

  // 변경사항이 있으면 파일 저장
  if (content !== originalContent) {
    fs.writeFileSync(swPath, content, 'utf8');
    console.log('[inject-firebase-config] Successfully injected Firebase config');
    console.log(`  - Replaced ${replacedCount} placeholder(s)`);
    console.log(`  - File: ${swPath}`);
  } else {
    console.log('[inject-firebase-config] No changes needed (already configured or missing env vars)');
  }
}

// 스크립트 실행
main();
