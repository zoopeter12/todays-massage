/**
 * 다날 PASS 본인인증 요청 API
 *
 * @route POST /api/auth/danal
 *
 * @description
 * 다날 PASS 본인인증을 요청하고, 인증 페이지 URL을 반환합니다.
 * 클라이언트는 반환된 URL로 사용자를 리다이렉트해야 합니다.
 *
 * @requestBody
 * - phoneNumber: string (필수) - 사용자 전화번호
 * - name: string (선택) - 사용자 이름
 * - birthday: string (선택) - 생년월일 (YYYYMMDD)
 *
 * @response
 * - 200: { success: true, verificationUrl: string, transactionId: string }
 * - 400: { success: false, error: string } - 입력 검증 실패
 * - 429: { success: false, error: string } - Rate limit 초과
 * - 500: { success: false, error: string } - 서버 오류
 *
 * Rate Limiting:
 * - 전화번호당 일일 3회 제한 (악용 방지)
 * - IP당 분당 5회 제한 (무차별 공격 방지)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestVerification, isValidKoreanPhone } from '@/lib/danal';

// ============================================
// Rate Limiting 설정
// ============================================
const PHONE_DAILY_LIMIT = 3; // 전화번호당 일일 최대 요청 횟수
const IP_RATE_LIMIT = 5; // IP당 분당 최대 요청 횟수
const IP_RATE_WINDOW_MS = 60 * 1000; // 1분 (밀리초)
const DAILY_RESET_MS = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

// ============================================
// 인메모리 Rate Limit 저장소
// ============================================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const phoneRateLimitStore = new Map<string, RateLimitEntry>();
const ipRateLimitStore = new Map<string, RateLimitEntry>();

// ============================================
// Rate Limit 헬퍼 함수
// ============================================

/**
 * 만료된 Rate Limit 엔트리 정리
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  phoneRateLimitStore.forEach((entry, key) => {
    if (now >= entry.resetAt) {
      phoneRateLimitStore.delete(key);
    }
  });

  ipRateLimitStore.forEach((entry, key) => {
    if (now >= entry.resetAt) {
      ipRateLimitStore.delete(key);
    }
  });
}

/**
 * 전화번호 Rate Limit 체크
 */
function checkPhoneRateLimit(phone: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = phoneRateLimitStore.get(phone);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + DAILY_RESET_MS;
    phoneRateLimitStore.set(phone, { count: 1, resetAt });
    return { allowed: true, remaining: PHONE_DAILY_LIMIT - 1, resetAt };
  }

  if (entry.count >= PHONE_DAILY_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: PHONE_DAILY_LIMIT - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * IP Rate Limit 체크
 */
function checkIpRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = ipRateLimitStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + IP_RATE_WINDOW_MS;
    ipRateLimitStore.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: IP_RATE_LIMIT - 1, resetAt };
  }

  if (entry.count >= IP_RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: IP_RATE_LIMIT - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * 클라이언트 IP 추출
 */
function getClientIp(request: NextRequest): string {
  // Vercel 전용 헤더
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Cloudflare 전용 헤더
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // x-forwarded-for (Fallback)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

/**
 * 전화번호 클리닝 (숫자만 추출)
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * 보안 전화번호 형식 검증
 */
function isSecurePhoneFormat(phone: string): boolean {
  // 숫자만 허용
  if (!/^\d+$/.test(phone)) {
    return false;
  }

  // 길이 검증 (한국 휴대폰: 10-11자리)
  if (phone.length < 10 || phone.length > 11) {
    return false;
  }

  // 010으로 시작
  if (!phone.startsWith('010')) {
    return false;
  }

  return true;
}

// ============================================
// 메인 API 핸들러
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 만료된 엔트리 정리
    cleanupExpiredEntries();

    // 1. IP Rate Limit 체크
    const clientIp = getClientIp(request);
    const ipRateCheck = checkIpRateLimit(clientIp);

    if (!ipRateCheck.allowed) {
      const retryAfter = Math.ceil((ipRateCheck.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': IP_RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(ipRateCheck.resetAt / 1000).toString(),
          },
        }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { phoneNumber, name, birthday } = body;

    // 3. phoneNumber 필수 체크
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '전화번호를 입력해주세요.',
        },
        { status: 400 }
      );
    }

    // 4. 전화번호 클리닝
    const cleanedPhone = cleanPhoneNumber(phoneNumber);

    // 5. 보안 형식 검증
    if (!isSecurePhoneFormat(cleanedPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: '올바른 전화번호 형식이 아닙니다.',
        },
        { status: 400 }
      );
    }

    // 6. 한국 전화번호 형식 검증
    if (!isValidKoreanPhone(cleanedPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: '올바른 전화번호 형식이 아닙니다. (010-xxxx-xxxx 형식만 지원)',
        },
        { status: 400 }
      );
    }

    // 7. 전화번호 Rate Limit 체크
    const phoneRateCheck = checkPhoneRateLimit(cleanedPhone);

    if (!phoneRateCheck.allowed) {
      const hoursUntilReset = Math.ceil(
        (phoneRateCheck.resetAt - Date.now()) / (1000 * 60 * 60)
      );
      return NextResponse.json(
        {
          success: false,
          error: `일일 본인인증 한도(${PHONE_DAILY_LIMIT}회)를 초과했습니다. 약 ${hoursUntilReset}시간 후 다시 시도해주세요.`,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': PHONE_DAILY_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(phoneRateCheck.resetAt / 1000).toString(),
          },
        }
      );
    }

    // 8. 다날 본인인증 요청
    const result = await requestVerification({
      phoneNumber: cleanedPhone,
      name: name || undefined,
      birthday: birthday || undefined,
    });

    // 9. 성공 응답
    return NextResponse.json(
      {
        success: true,
        verificationUrl: result.verificationUrl,
        transactionId: result.transactionId,
        remaining: phoneRateCheck.remaining,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': PHONE_DAILY_LIMIT.toString(),
          'X-RateLimit-Remaining': phoneRateCheck.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('[API] 다날 본인인증 요청 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '본인인증 요청에 실패했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
