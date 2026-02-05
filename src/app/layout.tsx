import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://todaymassage.com'),
  title: {
    default: "오늘의마사지 - 전국 마사지/스파 통합 예약",
    template: "%s | 오늘의마사지"
  },
  description: "전국 마사지샵, 스파, 태국마사지, 스웨디시를 한곳에서 비교하고 예약하세요. 실시간 예약, 리뷰 확인, 할인 혜택까지 오늘의마사지에서 간편하게.",
  keywords: ["마사지", "스파", "태국마사지", "스웨디시", "마사지예약", "전국마사지", "마사지샵", "힐링", "건강관리"],
  authors: [{ name: "오늘의마사지" }],
  creator: "오늘의마사지",
  publisher: "오늘의마사지",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: '오늘의마사지',
    title: '오늘의마사지 - 전국 마사지/스파 통합 예약',
    description: '전국 마사지샵, 스파, 태국마사지, 스웨디시를 한곳에서 비교하고 예약하세요.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '오늘의마사지',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '오늘의마사지 - 전국 마사지/스파 통합 예약',
    description: '전국 마사지샵, 스파, 태국마사지, 스웨디시를 한곳에서 비교하고 예약하세요.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/icon.svg', color: '#ec4899' },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // naver: 'your-naver-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="오늘의마사지" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="오마" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#ec4899" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Splash Screen for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1668-2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1536-2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1290-2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1179-2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170-2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1125-2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1242-2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-828-1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-750-1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-640-1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
      </head>
      <body className={inter.className}>
        {/* 네이버 지도 SDK 로딩 상태 디버깅 */}
        <Script
          id="naver-map-debug"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('네이버 지도 SDK 로딩 시작');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('Client ID: ${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}');
              console.log('현재 URL: ' + window.location.href);
              console.log('호스트명: ' + window.location.hostname);
              console.log('SDK URL: https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            `
          }}
        />
        {/* 네이버 지도 인증 실패 핸들러 */}
        <Script
          id="naver-map-auth-handler"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.navermap_authFailure = function() {
                // 전역 플래그 설정 - 컴포넌트에서 인증 실패 감지용
                window.__NAVER_MAP_AUTH_FAILED__ = true;

                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('네이버 지도 API 인증 실패');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('');
                console.error('현재 환경 정보:');
                console.error('- Client ID: ${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}');
                console.error('- 현재 URL: ' + window.location.href);
                console.error('- 호스트명: ' + window.location.hostname);
                console.error('- 포트: ' + window.location.port);
                console.error('- 프로토콜: ' + window.location.protocol);
                console.error('');
                console.error('가능한 원인:');
                console.error('1. NCP 콘솔에 도메인 미등록');
                console.error('   필요한 등록: http://localhost (포트 제외)');
                console.error('2. Client ID가 잘못되었거나 만료됨');
                console.error('3. Maps 서비스에서 "Web Dynamic Map" 활성화 안 됨');
                console.error('4. API 사용량 초과 또는 결제수단 미등록');
                console.error('5. Geocoding 서비스 미활성화 (submodules=geocoder 사용 시)');
                console.error('');
                console.error('즉시 확인할 사항:');
                console.error('1. NCP 콘솔 접속: https://console.ncloud.com/naver-service/application');
                console.error('2. Application 목록에서 Client ID "' + '${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}' + '" 확인');
                console.error('3. Web 서비스 URL 등록 상태:');
                console.error('   - http://localhost (필수)');
                console.error('   - https://yourdomain.com (운영 시)');
                console.error('4. 서비스 활성화 상태:');
                console.error('   - Web Dynamic Map (필수)');
                console.error('   - Geocoding (주소 검색 시 필수)');
                console.error('');
                console.error('디버깅 팁:');
                console.error('다른 파라미터 형식도 시도해보세요:');
                console.error('- ncpClientId (현재 사용 중 - 최신 권장)');
                console.error('- ncpKeyId (구버전)');
                console.error('- clientId (매우 오래된 버전)');
                console.error('');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // DOM에 에러 표시 (개발 환경에서만)
                if (window.location.hostname === 'localhost') {
                  var errorDiv = document.createElement('div');
                  errorDiv.id = 'naver-map-error';
                  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f97316;color:white;padding:8px 12px;z-index:9999;font-size:12px;text-align:center;font-family:system-ui;display:flex;justify-content:center;align-items:center;gap:8px;';
                  errorDiv.innerHTML = '<span>⚠️ 네이버 지도 API 인증 실패</span><button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:11px;">닫기</button>';
                  document.body.insertBefore(errorDiv, document.body.firstChild);
                }
              };
            `
          }}
        />
        {/* 네이버 지도 API v3 - ncpKeyId 사용 (2025년 최신 방식) */}
        <Script
          id="naver-map-sdk"
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`}
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.portone.io/v2/browser-sdk.js"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
