/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dhgoxmjhhqgeozscilqz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
    formats: ['image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), microphone=(), camera=(), payment=(self "https://service.iamport.kr")',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://openapi.map.naver.com https://openapi.map.naver.com http://oapi.map.naver.com https://oapi.map.naver.com http://nrbe.map.naver.net https://nrbe.map.naver.net https://ssl.pstatic.net https://cdn.iamport.kr https://service.iamport.kr https://cdn.portone.io https://*.supabase.co https://www.gstatic.com https://www.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://openapi.map.naver.com https://oapi.map.naver.com https://ssl.pstatic.net https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http: https://*.pstatic.net https://*.map.naver.com http://nrbe.map.naver.net https://nrbe.map.naver.net http://nrbe.pstatic.net https://nrbe.pstatic.net",
              "font-src 'self' data: https://fonts.gstatic.com https://ssl.pstatic.net",
              "connect-src 'self' https://naveropenapi.apigw.ntruss.com https://openapi.map.naver.com https://oapi.map.naver.com http://nrbe.map.naver.net https://nrbe.map.naver.net https://ssl.pstatic.net https://map.pstatic.net https://map-comp.pstatic.net https://*.pstatic.net http://*.pstatic.net https://*.map.naver.com http://*.map.naver.net https://*.map.naver.net https://*.nelo.navercorp.com http://*.nelo.navercorp.com https://*.supabase.co wss://*.supabase.co https://cdn.iamport.kr https://service.iamport.kr https://cdn.portone.io https://*.googleapis.com https://identitytoolkit.googleapis.com",
              "frame-src 'self' https://cdn.iamport.kr https://service.iamport.kr https://*.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
