#!/usr/bin/env node

/**
 * SEO & PWA Setup Verification Script
 * Run: node scripts/verify-seo-pwa.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const APP_DIR = path.join(ROOT_DIR, 'src', 'app');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'src', 'components');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function checkFile(filePath, displayName) {
  const exists = fs.existsSync(filePath);
  const status = exists ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  console.log(`${status} ${displayName}`);
  return exists;
}

function checkOptionalFile(filePath, displayName) {
  const exists = fs.existsSync(filePath);
  const status = exists ? `${GREEN}✓${RESET}` : `${YELLOW}○${RESET}`;
  console.log(`${status} ${displayName} ${exists ? '' : '(optional)'}`);
  return exists;
}

console.log('\n🔍 Verifying SEO & PWA Setup...\n');

let totalChecks = 0;
let passedChecks = 0;
let optionalChecks = 0;
let passedOptional = 0;

console.log('📁 Core Files:');
// Required files
const requiredFiles = [
  [path.join(APP_DIR, 'layout.tsx'), 'Enhanced layout.tsx'],
  [path.join(APP_DIR, 'not-found.tsx'), 'Custom 404 page'],
  [path.join(APP_DIR, 'error.tsx'), 'Error boundary'],
  [path.join(APP_DIR, 'global-error.tsx'), 'Global error handler'],
  [path.join(APP_DIR, 'sitemap.ts'), 'Sitemap generator'],
  [path.join(APP_DIR, 'robots.ts'), 'Robots.txt generator'],
  [path.join(APP_DIR, 'opengraph-image.tsx'), 'OG image generator'],
  [path.join(APP_DIR, '(customer)', 'loading.tsx'), 'Loading UI'],
  [path.join(COMPONENTS_DIR, 'shared', 'ErrorFallback.tsx'), 'ErrorFallback component'],
  [path.join(PUBLIC_DIR, 'manifest.json'), 'PWA manifest'],
];

requiredFiles.forEach(([filePath, name]) => {
  totalChecks++;
  if (checkFile(filePath, name)) passedChecks++;
});

console.log('\n📱 Icon Files (Create these):');
// Optional icon files
const iconFiles = [
  [path.join(PUBLIC_DIR, 'favicon.ico'), 'favicon.ico'],
  [path.join(PUBLIC_DIR, 'favicon-16x16.png'), 'favicon-16x16.png'],
  [path.join(PUBLIC_DIR, 'favicon-32x32.png'), 'favicon-32x32.png'],
  [path.join(PUBLIC_DIR, 'apple-touch-icon.png'), 'apple-touch-icon.png'],
  [path.join(PUBLIC_DIR, 'android-chrome-192x192.png'), 'android-chrome-192x192.png'],
  [path.join(PUBLIC_DIR, 'android-chrome-512x512.png'), 'android-chrome-512x512.png'],
];

iconFiles.forEach(([filePath, name]) => {
  optionalChecks++;
  if (checkOptionalFile(filePath, name)) passedOptional++;
});

console.log('\n📊 Content Validation:');

// Check manifest.json content
try {
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  totalChecks++;
  if (manifest.name && manifest.short_name && manifest.icons) {
    console.log(`${GREEN}✓${RESET} Manifest has required fields`);
    passedChecks++;
  } else {
    console.log(`${RED}✗${RESET} Manifest missing required fields`);
  }

  totalChecks++;
  if (manifest.theme_color === '#ec4899') {
    console.log(`${GREEN}✓${RESET} Manifest theme color correct`);
    passedChecks++;
  } else {
    console.log(`${YELLOW}!${RESET} Manifest theme color mismatch`);
  }
} catch (error) {
  console.log(`${RED}✗${RESET} Error reading manifest.json`);
}

// Check layout.tsx for metadata
try {
  const layoutPath = path.join(APP_DIR, 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  totalChecks++;
  if (layoutContent.includes('metadataBase') && layoutContent.includes('openGraph')) {
    console.log(`${GREEN}✓${RESET} Layout has enhanced metadata`);
    passedChecks++;
  } else {
    console.log(`${RED}✗${RESET} Layout missing enhanced metadata`);
  }

  totalChecks++;
  if (layoutContent.includes('manifest:')) {
    console.log(`${GREEN}✓${RESET} Layout links to manifest`);
    passedChecks++;
  } else {
    console.log(`${RED}✗${RESET} Layout missing manifest link`);
  }
} catch (error) {
  console.log(`${RED}✗${RESET} Error reading layout.tsx`);
}

console.log('\n📈 Summary:');
console.log(`Required Files: ${passedChecks}/${totalChecks} passed`);
console.log(`Optional Icons: ${passedOptional}/${optionalChecks} created`);

const percentage = Math.round((passedChecks / totalChecks) * 100);
console.log(`\nCore Setup: ${percentage}% complete`);

if (passedChecks === totalChecks) {
  console.log(`\n${GREEN}✓ Core setup complete!${RESET}`);
  if (passedOptional < optionalChecks) {
    console.log(`${YELLOW}⚠ Generate icon files for full PWA support${RESET}`);
    console.log(`See SETUP-SEO-PWA.md for instructions`);
  }
} else {
  console.log(`\n${RED}✗ Setup incomplete${RESET}`);
  console.log('Check missing files above');
}

console.log('\n📚 Next Steps:');
console.log('1. Generate icon files (see SETUP-SEO-PWA.md)');
console.log('2. Set NEXT_PUBLIC_BASE_URL in .env.local');
console.log('3. Run: npm run build');
console.log('4. Test with Lighthouse audit');
console.log('5. Verify /sitemap.xml and /robots.txt\n');

process.exit(passedChecks === totalChecks ? 0 : 1);
