/**
 * FCM 토큰 관리 API
 * POST: 토큰 등록/갱신
 * DELETE: 토큰 삭제
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { FCMTokenRequest } from '@/types/fcm';

// Supabase Admin 클라이언트 (서버사이드)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// 사용자 인증 확인
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = getSupabaseAdmin();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * POST /api/fcm/token
 * FCM 토큰 등록 또는 갱신
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body: FCMTokenRequest = await request.json();

    if (!body.token || !body.device_type) {
      return NextResponse.json(
        { error: '토큰과 기기 유형은 필수입니다.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 기존 토큰 확인 (동일 토큰이 이미 등록되어 있는지)
    const { data: existingToken } = await supabase
      .from('fcm_tokens')
      .select('id, user_id')
      .eq('token', body.token)
      .single();

    if (existingToken) {
      // 기존 토큰이 다른 사용자 것이면 해당 사용자에서 제거하고 현재 사용자에게 할당
      if (existingToken.user_id !== user.id) {
        await supabase
          .from('fcm_tokens')
          .update({
            user_id: user.id,
            device_type: body.device_type,
            device_info: body.device_info,
            is_active: true,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);
      } else {
        // 같은 사용자의 토큰이면 갱신
        await supabase
          .from('fcm_tokens')
          .update({
            device_type: body.device_type,
            device_info: body.device_info,
            is_active: true,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);
      }

      return NextResponse.json({ success: true, message: '토큰이 갱신되었습니다.' });
    }

    // 새 토큰 등록
    const { error: insertError } = await supabase
      .from('fcm_tokens')
      .insert({
        user_id: user.id,
        token: body.token,
        device_type: body.device_type,
        device_info: body.device_info,
        is_active: true,
        last_used_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('FCM 토큰 저장 실패:', insertError);
      return NextResponse.json(
        { error: '토큰 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '토큰이 등록되었습니다.' });
  } catch (error: any) {
    console.error('FCM 토큰 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fcm/token
 * FCM 토큰 삭제 (로그아웃 시 호출)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    const supabase = getSupabaseAdmin();

    if (token) {
      // 특정 토큰만 삭제
      await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);
    } else {
      // 해당 사용자의 모든 토큰 삭제
      await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true, message: '토큰이 삭제되었습니다.' });
  } catch (error: any) {
    console.error('FCM 토큰 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
