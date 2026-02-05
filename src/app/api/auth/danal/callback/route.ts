/**
 * 다날 PASS 본인인증 콜백 API
 *
 * @route POST /api/auth/danal/callback
 *
 * @description
 * 다날 PASS 본인인증 완료 후 호출되는 콜백 API입니다.
 * 암호화된 인증 결과를 복호화하고, 사용자 프로필을 업데이트합니다.
 *
 * 처리 순서:
 * 1. 인증 결과 검증 (verifyIdentity)
 * 2. 블랙리스트 확인 (checkBlacklist)
 * 3. DI 중복 체크 (이미 가입된 사용자 확인)
 * 4. profiles 테이블 업데이트 (ci, di, real_name, gender, birth_date, verified_at)
 *
 * @requestBody
 * - transactionId: string (필수) - 본인인증 요청 시 받은 트랜잭션 ID
 * - encryptedData: string (필수) - 다날에서 전달받은 암호화된 인증 결과
 * - userId: string (필수) - 인증을 진행하는 사용자 ID
 *
 * @response
 * - 200: { success: true, verified: true } - 인증 성공
 * - 400: { success: false, error: string } - 입력 검증 실패
 * - 403: { success: false, error: string, code: 'BLACKLISTED' } - 블랙리스트 사용자
 * - 409: { success: false, error: string, code: 'DUPLICATE_DI' } - 이미 가입된 DI
 * - 500: { success: false, error: string } - 서버 오류
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdentity } from '@/lib/danal';
import { checkBlacklist } from '@/lib/api/blacklist';
import { createClient } from '@/lib/supabase/server';

// ============================================
// 헬퍼 함수
// ============================================

/**
 * UUID 형식 검증
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * 트랜잭션 ID 형식 검증
 */
function isValidTransactionId(txId: string): boolean {
  return /^TXN_\d+_[a-z0-9]+$/.test(txId);
}

// ============================================
// 메인 API 핸들러
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 본문 파싱
    const body = await request.json();
    const { transactionId, encryptedData, userId } = body;

    // 2. 필수 파라미터 검증
    if (!transactionId || typeof transactionId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '트랜잭션 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    if (!isValidTransactionId(transactionId)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 트랜잭션 ID 형식입니다.',
        },
        { status: 400 }
      );
    }

    if (!encryptedData || typeof encryptedData !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '인증 데이터가 필요합니다.',
        },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    if (!isValidUUID(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 사용자 ID 형식입니다.',
        },
        { status: 400 }
      );
    }

    // 3. 다날 인증 결과 검증
    const verificationResult = await verifyIdentity(transactionId, encryptedData);

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.error || '본인인증에 실패했습니다.',
        },
        { status: 400 }
      );
    }

    // CI/DI가 없으면 인증 실패
    if (!verificationResult.ci || !verificationResult.di) {
      return NextResponse.json(
        {
          success: false,
          error: '인증 정보를 확인할 수 없습니다.',
        },
        { status: 400 }
      );
    }

    // 4. 블랙리스트 확인
    const isBlacklisted = await checkBlacklist(verificationResult.di);

    if (isBlacklisted) {
      console.warn('[Danal Callback] 블랙리스트 사용자 접근 시도:', {
        userId,
        di: verificationResult.di.substring(0, 10) + '...',
      });

      return NextResponse.json(
        {
          success: false,
          error: '서비스 이용이 제한된 사용자입니다. 고객센터에 문의해주세요.',
          code: 'BLACKLISTED',
        },
        { status: 403 }
      );
    }

    // 5. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 6. DI 중복 체크 (이미 다른 계정에서 인증된 DI인지 확인)
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('di', verificationResult.di)
      .neq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('[Danal Callback] DI 중복 체크 실패:', checkError);
      return NextResponse.json(
        {
          success: false,
          error: '인증 처리 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 다른 계정에서 본인인증이 완료된 사용자입니다.',
          code: 'DUPLICATE_DI',
        },
        { status: 409 }
      );
    }

    // 7. profiles 테이블 업데이트
    const updateData = {
      ci: verificationResult.ci,
      di: verificationResult.di,
      real_name: verificationResult.realName || null,
      gender: verificationResult.gender || null,
      birth_date: verificationResult.birthDate || null,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('[Danal Callback] 프로필 업데이트 실패:', updateError);

      // unique violation (CI 또는 DI 중복)
      if (updateError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: '이미 본인인증이 완료된 사용자입니다.',
            code: 'DUPLICATE_VERIFICATION',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: '프로필 업데이트에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    // 8. 성공 로그
    console.log('[Danal Callback] 본인인증 완료:', {
      userId,
      realName: verificationResult.realName,
      gender: verificationResult.gender,
    });

    // 9. 성공 응답
    return NextResponse.json(
      {
        success: true,
        verified: true,
        realName: verificationResult.realName,
        gender: verificationResult.gender,
        birthDate: verificationResult.birthDate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 다날 콜백 처리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '본인인증 처리에 실패했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
