/**
 * Twilio Verify API로 OTP 검증 및 로그인 API
 *
 * @route POST /api/auth/twilio/verify-otp
 *
 * @description
 * Twilio Verify API로 OTP를 검증하고 Supabase 세션을 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkVerification, isValidKoreanPhone } from '@/lib/twilio/otp-service';
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { checkBlacklistByPhone } from '@/lib/api/blacklist';
import { grantWelcomeCoupons } from '@/lib/api/coupons';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, registrationAllowed = true } = body;

    // 입력 검증
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: '전화번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: '인증번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 전화번호 클리닝
    const cleanedPhone = phone.replace(/[\s-]/g, '');

    // 한국 전화번호 형식 검증
    if (!isValidKoreanPhone(cleanedPhone)) {
      return NextResponse.json(
        { success: false, error: '올바른 전화번호 형식이 아닙니다. (010-xxxx-xxxx)' },
        { status: 400 }
      );
    }

    // Twilio Verify API로 OTP 검증
    const verification = await checkVerification(cleanedPhone, code);

    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: 400 }
      );
    }

    // OTP 검증 성공 - 사용자 프로필 조회/생성
    const supabase = await createClient();

    // 1. 기존 사용자 조회 (전화번호로)
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, phone, nickname, role')
      .eq('phone', cleanedPhone)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // 기존 사용자
      userId = existingUser.id;
    } else {
      // 신규 사용자 - 회원가입 허용 여부 확인
      if (!registrationAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: '현재 신규 회원가입이 중단되었습니다. 기존 회원만 로그인할 수 있습니다.',
            code: 'REGISTRATION_DISABLED',
          },
          { status: 403 }
        );
      }

      // 블랙리스트 체크 (전화번호 기반 - 다날 PASS 연동 전 임시)
      const isBlacklisted = await checkBlacklistByPhone(cleanedPhone);
      if (isBlacklisted) {
        console.warn(`[Auth] Blacklisted phone attempted registration: ${cleanedPhone}`);
        return NextResponse.json(
          {
            success: false,
            error: '회원가입이 제한된 사용자입니다. 고객센터로 문의해주세요.',
            code: 'BLACKLISTED',
          },
          { status: 403 }
        );
      }

      // 신규 사용자 - Supabase Auth에 사용자 생성
      isNewUser = true;

      // 1. auth.users에 사용자 생성 (admin API)
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        phone: `+82${cleanedPhone.slice(1)}`, // 010... -> +8210...
        phone_confirm: true,
        user_metadata: { phone: cleanedPhone },
      });

      if (authError || !authUser.user) {
        console.error('[Auth] 사용자 생성 실패:', authError);
        return NextResponse.json(
          { success: false, error: `회원가입 실패: ${authError?.message || '사용자 생성 오류'}` },
          { status: 500 }
        );
      }

      userId = authUser.user.id;

      // 2. profiles 테이블에 프로필 생성
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        phone: cleanedPhone,
        role: 'user',
      });

      if (insertError) {
        console.error('[Auth] 프로필 생성 실패:', insertError);
        // auth.users는 생성됐으므로 프로필 에러는 무시하고 진행
      }

      // 3. 환영 쿠폰 지급 (신규 가입자에게 5,000원 쿠폰 2장 지급)
      try {
        const welcomeCoupons = await grantWelcomeCoupons(userId);
        console.log(`[Auth] 환영 쿠폰 ${welcomeCoupons.length}장 지급 완료 (User ID: ${userId})`);
      } catch (couponError) {
        console.error('[Auth] 환영 쿠폰 지급 실패:', couponError);
        // 쿠폰 지급 실패는 회원가입 성공에 영향을 주지 않도록 함
      }
    }

    // 2. Supabase 세션 생성
    // 방법: 가상 이메일 + 임시 비밀번호로 signInWithPassword 세션 획득
    // (Supabase signInWithPassword는 phone 필드를 직접 지원하지 않음)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth] Supabase 환경 변수 누락');
      return NextResponse.json(
        { success: false, error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // 가상 이메일 생성 (전화번호 기반)
    const virtualEmail = `${cleanedPhone}@phone.todays-massage.local`;

    // 임시 비밀번호 생성 및 사용자에게 설정 (이메일도 함께 설정)
    const tempPassword = `temp_${crypto.randomUUID()}`;

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      email: virtualEmail,
      password: tempPassword,
      email_confirm: true, // 이메일 확인 건너뛰기
    });

    if (updateError) {
      console.error('[Auth] 임시 비밀번호/이메일 설정 실패:', updateError);
      // 비밀번호 설정 실패해도 기본 쿠키 인증으로 진행
    }

    // 별도 클라이언트로 signInWithPassword 실행하여 세션 획득
    let session = null;
    if (!updateError) {
      const authClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

      const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
        email: virtualEmail,
        password: tempPassword,
      });

      if (signInError) {
        console.warn('[Auth] signInWithPassword 실패:', signInError.message);
        // 세션 생성 실패해도 기본 쿠키 인증으로 진행
      } else if (signInData?.session) {
        session = signInData.session;
        console.log('[Auth] Supabase 세션 생성 성공');
      }
    }

    // 3. 응답 반환
    const response = NextResponse.json(
      {
        success: true,
        message: isNewUser ? '회원가입이 완료되었습니다.' : '로그인되었습니다.',
        user: {
          id: userId,
          phone: cleanedPhone,
          isNewUser,
        },
        // 세션 토큰 포함 (있는 경우)
        session: session ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
        } : null,
      },
      { status: 200 }
    );

    // 쿠키에 사용자 정보 저장 (세션 관리)
    // user_id는 httpOnly로 보안 유지
    response.cookies.set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    // user_phone은 클라이언트에서 표시용으로 사용
    response.cookies.set('user_phone', cleanedPhone, {
      httpOnly: false, // 클라이언트에서 읽을 수 있도록
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    // 로그인 상태 플래그 (클라이언트에서 로그인 여부 확인용)
    response.cookies.set('logged_in', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    // Supabase 세션 쿠키 설정 (세션이 있는 경우)
    if (session) {
      // Supabase JS 클라이언트가 인식하는 쿠키 형식으로 설정
      // sb-<project-ref>-auth-token 형식
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase/)?.[1] || 'local';
      const cookieName = `sb-${projectRef}-auth-token`;

      const sessionData = JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type || 'bearer',
        user: session.user,
      });

      response.cookies.set(cookieName, sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: session.expires_in || 3600,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('[API] OTP 검증 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : '인증에 실패했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
