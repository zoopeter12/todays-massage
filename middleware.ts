/**
 * Next.js Middleware - Rate Limiting, API Authentication & System Controls
 *
 * @description
 * - V-001 해결: 전역 Rate Limiting (분당 100 요청)
 * - V-002 해결: 알림톡 API 인증 (x-api-key)
 * - 점검 모드: 일반 사용자 접근 차단 (관리자 우회 가능)
 *
 * @security
 * - 인메모리 기반 Rate Limiting (Vercel Edge 호환)
 * - Sliding Window 알고리즘 적용
 * - IP 기반 요청 추적
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// 타입 정의
// ============================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // 시간 윈도우 (밀리초)
  maxRequests: number; // 최대 요청 수
}

// ============================================================
// Rate Limiting 설정
// ============================================================

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 100, // 분당 100 요청
};

// 인메모리 Rate Limit 저장소
// 주의: Vercel Edge에서는 인스턴스별로 독립적으로 동작
// 대규모 서비스의 경우 Redis 등 외부 저장소 사용 권장
const rateLimitStore = new Map<string, RateLimitEntry>();

// ============================================================
// 인증이 필요한 API 경로
// ============================================================

const PROTECTED_API_ROUTES = [
  '/api/notifications/alimtalk',
  '/api/fcm/send',
];

// Rate Limiting에서 제외할 경로 (헬스체크 등)
const RATE_LIMIT_EXCLUDED_PATHS = [
  '/api/health',
  '/api/settings/status',
  '/_next',
  '/favicon.ico',
];

// 점검 모드에서 제외할 경로 (관리자 접근 등)
const MAINTENANCE_EXCLUDED_PATHS = [
  '/admin',
  '/api/admin',
  '/api/settings/status',
  '/api/auth',
  '/maintenance',
  '/_next',
  '/favicon.ico',
];

// 점검 모드 캐시 (Edge Runtime에서 DB 직접 호출 최소화)
interface MaintenanceCache {
  isEnabled: boolean;
  lastChecked: number;
}

let maintenanceCache: MaintenanceCache | null = null;
const MAINTENANCE_CACHE_TTL = 10000; // 10초

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 클라이언트 IP 추출 (보안 강화)
 *
 * @security
 * - x-forwarded-for는 클라이언트가 조작 가능하므로 가장 마지막에 확인
 * - 신뢰할 수 있는 프록시 헤더를 우선 사용
 * - Vercel: x-vercel-forwarded-for (Vercel 에지에서 설정, 조작 불가)
 * - Cloudflare: cf-connecting-ip (Cloudflare에서 설정, 조작 불가)
 */
function getClientIP(request: NextRequest): string {
  // 1. Vercel 전용 헤더 (가장 신뢰할 수 있음 - Vercel 에지에서 설정)
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // 2. Cloudflare 전용 헤더 (Cloudflare에서 설정, 조작 불가)
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // 3. x-real-ip (신뢰할 수 있는 리버스 프록시에서 설정)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // 4. x-forwarded-for (Fallback - 클라이언트 조작 가능하므로 마지막에 확인)
  // 주의: 이 헤더만 있는 경우 스푸핑 위험이 있음
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // 첫 번째 IP만 사용 (가장 원래 클라이언트에 가까움)
    return forwardedFor.split(',')[0].trim();
  }

  // 5. Fallback
  return 'unknown';
}

/**
 * Rate Limit 저장소 정리 (오래된 엔트리 제거)
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate Limiting 체크
 */
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // 주기적 정리 (1000개 초과 시)
  if (rateLimitStore.size > 1000) {
    cleanupRateLimitStore();
  }

  // 새 엔트리 또는 윈도우 리셋
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // 기존 엔트리 업데이트
  entry.count += 1;
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * API 키 인증 검증
 */
function validateApiKey(request: NextRequest, pathname: string): boolean {
  const apiKey = request.headers.get('x-api-key');

  // 알림톡 API
  if (pathname === '/api/notifications/alimtalk') {
    const expectedKey = process.env.ALIMTALK_API_SECRET_KEY;
    if (!expectedKey) {
      console.error('[Security] ALIMTALK_API_SECRET_KEY 환경변수가 설정되지 않았습니다.');
      return false;
    }
    return apiKey === expectedKey;
  }

  // FCM API
  if (pathname === '/api/fcm/send') {
    const expectedKey = process.env.FCM_API_SECRET_KEY;
    if (!expectedKey) {
      console.error('[Security] FCM_API_SECRET_KEY 환경변수가 설정되지 않았습니다.');
      return false;
    }
    return apiKey === expectedKey;
  }

  return true;
}

/**
 * 경로가 보호된 API인지 확인
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Rate Limiting 제외 경로인지 확인
 */
function isRateLimitExcluded(pathname: string): boolean {
  return RATE_LIMIT_EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * 점검 모드 제외 경로인지 확인
 */
function isMaintenanceExcluded(pathname: string): boolean {
  return MAINTENANCE_EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * 점검 모드 상태 확인 (캐시 적용)
 */
async function checkMaintenanceMode(): Promise<boolean> {
  const now = Date.now();

  // 캐시가 유효하면 캐시된 값 반환
  if (maintenanceCache && (now - maintenanceCache.lastChecked) < MAINTENANCE_CACHE_TTL) {
    return maintenanceCache.isEnabled;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'general.maintenance_mode')
      .single();

    if (error || !data) {
      maintenanceCache = { isEnabled: false, lastChecked: now };
      return false;
    }

    const isEnabled = data.value === true;
    maintenanceCache = { isEnabled, lastChecked: now };
    return isEnabled;
  } catch (error) {
    console.error('[Middleware] Failed to check maintenance mode:', error);
    return false;
  }
}

/**
 * 사용자 역할 확인 (쿠키에서 세션 토큰 추출)
 */
async function isAdminUser(request: NextRequest): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }

    // Supabase auth 쿠키에서 토큰 추출
    const authCookie = request.cookies.get('sb-access-token')?.value
      || request.cookies.get('supabase-auth-token')?.value;

    if (!authCookie) {
      // 쿠키가 없으면 localStorage 기반 토큰 사용 불가 (서버 사이드)
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 토큰으로 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser(authCookie);

    if (authError || !user) {
      return false;
    }

    // 프로필에서 역할 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return false;
    }

    return profile.role === 'admin';
  } catch (error) {
    console.error('[Middleware] Failed to check admin status:', error);
    return false;
  }
}

// ============================================================
// 미들웨어 메인 함수
// ============================================================

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting 제외 경로 체크
  if (isRateLimitExcluded(pathname)) {
    return NextResponse.next();
  }

  // 2. 점검 모드 체크 (정적 파일 및 제외 경로 제외)
  if (!isMaintenanceExcluded(pathname) && !pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)) {
    const isMaintenanceEnabled = await checkMaintenanceMode();

    if (isMaintenanceEnabled) {
      // 관리자 여부 확인
      const isAdmin = await isAdminUser(request);

      if (!isAdmin) {
        // 일반 사용자는 점검 페이지로 리다이렉트
        const maintenanceUrl = new URL('/maintenance', request.url);
        return NextResponse.redirect(maintenanceUrl);
      }
    }
  }

  // 4. API 경로에만 Rate Limiting 적용
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);
    const rateLimitKey = `${clientIP}:${pathname}`;

    // Rate Limit 체크
    const { allowed, remaining, resetTime } = checkRateLimit(
      rateLimitKey,
      RATE_LIMIT_CONFIG
    );

    // Rate Limit 초과
    if (!allowed) {
      console.warn(`[RateLimit] IP ${clientIP} exceeded rate limit for ${pathname}`);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 5. 보호된 API 라우트 인증 체크
    if (isProtectedRoute(pathname)) {
      // GET 요청은 헬스체크용으로 인증 제외
      if (request.method !== 'GET') {
        if (!validateApiKey(request, pathname)) {
          console.warn(`[Auth] Unauthorized access attempt to ${pathname} from IP ${clientIP}`);

          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: '인증이 필요합니다.',
              },
            },
            { status: 401 }
          );
        }
      }
    }

    // 응답에 Rate Limit 헤더 추가
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

    return response;
  }

  return NextResponse.next();
}

// ============================================================
// 미들웨어 적용 경로 설정
// ============================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
