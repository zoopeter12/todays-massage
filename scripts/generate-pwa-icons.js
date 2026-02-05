/**
 * PWA 아이콘 생성 스크립트
 *
 * 사용법:
 * 1. npm install sharp (설치 필요)
 * 2. node scripts/generate-pwa-icons.js
 *
 * 이 스크립트는 SVG 아이콘에서 다양한 크기의 PNG 아이콘을 생성합니다.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 아이콘 크기 정의
const ICON_SIZES = [48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512];
const MASKABLE_SIZES = [192, 512];

// Splash screen 크기 정의 (iOS)
const SPLASH_SIZES = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732' },
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388' },
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048' },
  { width: 1290, height: 2796, name: 'apple-splash-1290-2796' },
  { width: 1179, height: 2556, name: 'apple-splash-1179-2556' },
  { width: 1170, height: 2532, name: 'apple-splash-1170-2532' },
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436' },
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688' },
  { width: 828, height: 1792, name: 'apple-splash-828-1792' },
  { width: 750, height: 1334, name: 'apple-splash-750-1334' },
  { width: 640, height: 1136, name: 'apple-splash-640-1136' },
];

const THEME_COLOR = '#ec4899';
const BACKGROUND_COLOR = '#ffffff';

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const splashDir = path.join(publicDir, 'splash');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateIcons() {
  console.log('PWA 아이콘 생성 시작...\n');

  await ensureDir(iconsDir);
  await ensureDir(splashDir);

  const iconSvg = fs.readFileSync(path.join(iconsDir, 'icon.svg'));
  const maskableSvg = fs.readFileSync(path.join(iconsDir, 'icon-maskable.svg'));

  // 일반 아이콘 생성
  console.log('일반 아이콘 생성 중...');
  for (const size of ICON_SIZES) {
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
    console.log(`  ✓ icon-${size}.png`);
  }

  // Maskable 아이콘 생성
  console.log('\nMaskable 아이콘 생성 중...');
  for (const size of MASKABLE_SIZES) {
    await sharp(maskableSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-maskable-${size}.png`));
    console.log(`  ✓ icon-maskable-${size}.png`);
  }

  // Apple Touch Icon 생성 (180x180)
  console.log('\nApple Touch Icon 생성 중...');
  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');

  // Android Chrome 아이콘 생성
  console.log('\nAndroid Chrome 아이콘 생성 중...');
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  console.log('  ✓ android-chrome-192x192.png');

  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  console.log('  ✓ android-chrome-512x512.png');

  // Favicon 생성
  console.log('\nFavicon 생성 중...');
  await sharp(iconSvg)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('  ✓ favicon-16x16.png');

  await sharp(iconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('  ✓ favicon-32x32.png');

  // Splash Screen 생성
  console.log('\nSplash Screen 생성 중...');
  for (const splash of SPLASH_SIZES) {
    const iconSize = Math.min(splash.width, splash.height) * 0.25;
    const iconBuffer = await sharp(iconSvg)
      .resize(Math.round(iconSize), Math.round(iconSize))
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: BACKGROUND_COLOR
      }
    })
      .composite([
        {
          input: iconBuffer,
          gravity: 'center'
        }
      ])
      .png()
      .toFile(path.join(splashDir, `${splash.name}.png`));
    console.log(`  ✓ ${splash.name}.png`);
  }

  console.log('\n✅ 모든 PWA 아이콘 생성 완료!');
  console.log(`\n생성된 파일 위치:`);
  console.log(`  - 아이콘: ${iconsDir}`);
  console.log(`  - 스플래시: ${splashDir}`);
  console.log(`  - 루트 아이콘: ${publicDir}`);
}

generateIcons().catch(console.error);
