/**
 * Twilio Verify API로 OTP 발송 API
 *
 * @route POST /api/auth/twilio/send-otp
 *
 * @description
 * 전화번호로 OTP SMS를 발송합니다. (Twilio Verify API 사용)
 *
 * Rate Limiting:
 * - 전화번호당 일일 5회 제한 (SMS 폭탄 방지)
 * - IP당 분당 10회 제한 (무차별 공격 방지)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendVerification, isValidKoreanPhone } from '@/lib/twilio/otp-service';

// ============================================
// Rate Limiting 설정
// ============================================
const PHONE_DAILY_LIMIT = 5; // 전화번호당 일일 최대 발송 횟수
const IP_RATE_LIMIT = 10; // IP당 분당 최대 요청 횟수
const IP_RATE_WINDOW_MS = 60 * 1000; // 1분 (밀리초)
const DAILY_RESET_MS = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

// ============================================
// 인메모리 Rate Limit 저장소
// ============================================
interface PhoneRateLimitEntry {
  count: number;
  resetAt: number; // 일일 리셋 타임스탬프
}

interface IpRateLimitEntry {
  count: number;
  resetAt: number; // 분당 리셋 타임스탬프
}

const phoneRateLimitStore = new Map<string, PhoneRateLimitEntry>();
const ipRateLimitStore = new Map<string, IpRateLimitEntry>();

// ============================================
// Rate Limit 헬퍼 함수
// ============================================

/**
 * 만료된 Rate Limit 엔트리 정리 (메모리 누수 방지)
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
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
function checkPhoneRateLimit(phone: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = phoneRateLimitStore.get(phone);

  // 엔트리가 없거나 만료된 경우
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + DAILY_RESET_MS;
    phoneRateLimitStore.set(phone, { count: 1, resetAt });
    return { allowed: true, remaining: PHONE_DAILY_LIMIT - 1, resetAt };
  }

  // 제한 초과 체크
  if (entry.count >= PHONE_DAILY_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // 카운트 증가
  entry.count += 1;
  return {
    allowed: true,
    remaining: PHONE_DAILY_LIMIT - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * IP Rate Limit 체크
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
function checkIpRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = ipRateLimitStore.get(ip);

  // 엔트리가 없거나 만료된 경우
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + IP_RATE_WINDOW_MS;
    ipRateLimitStore.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: IP_RATE_LIMIT - 1, resetAt };
  }

  // 제한 초과 체크
  if (entry.count >= IP_RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // 카운트 증가
  entry.count += 1;
  return {
    allowed: true,
    remaining: IP_RATE_LIMIT - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * 클라이언트 IP 추출 (보안 강화)
 *
 * @security
 * - x-forwarded-for는 클라이언트가 조작 가능하므로 가장 마지막에 확인
 * - 신뢰할 수 있는 프록시 헤더를 우선 사용
 * - Vercel: x-vercel-forwarded-for (Vercel 에지에서 설정, 조작 불가)
 * - Cloudflare: cf-connecting-ip (Cloudflare에서 설정, 조작 불가)
 */
function getClientIp(request: NextRequest): string {
  // 1. Vercel 전용 헤더 (가장 신뢰할 수 있음 - Vercel 에지에서 설정)
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // 2. Cloudflare 전용 헤더 (Cloudflare에서 설정, 조작 불가)
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // 3. x-real-ip (신뢰할 수 있는 리버스 프록시에서 설정)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
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
 * 전화번호 형식 추가 검증 (보안 강화)
 * - 숫자만 포함
 * - 적절한 길이 (10-11자리)
 * - 특수문자/스크립트 인젝션 방지
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

  // 010으로 시작하는지 검증
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
    // 주기적으로 만료된 엔트리 정리 (매 요청마다 실행)
    cleanupExpiredEntries();

    // 1. IP Rate Limit 체크 (가장 먼저 수행)
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
    const { phone } = body;

    // 3. 입력 검증
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '전화번호를 입력해주세요.',
        },
        { status: 400 }
      );
    }

    // 4. 전화번호 클리닝
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');

    // 5. 보안 형식 검증 (인젝션 방지)
    if (!isSecurePhoneFormat(cleanedPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: '올바른 전화번호 형식이 아닙니다.',
        },
        { status: 400 }
      );
    }

    // 6. 한국 전화번호 형식 검증 (010-xxxx-xxxx)
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
          error: `일일 발송 한도(${PHONE_DAILY_LIMIT}회)를 초과했습니다. 약 ${hoursUntilReset}시간 후 다시 시도해주세요.`,
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

    // 8. Twilio Verify API로 OTP 발송
    const result = await sendVerification(cleanedPhone);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'OTP 발송에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    // 9. 성공 응답 (남은 횟수 포함)
    return NextResponse.json(
      {
        success: true,
        message: '인증번호가 발송되었습니다.',
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
    console.error('[API] OTP 발송 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'OTP 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
