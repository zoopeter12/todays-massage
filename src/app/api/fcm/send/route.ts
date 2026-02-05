/**
 * FCM 푸시 알림 발송 API
 * POST: 알림 발송
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification, sendPushNotificationBatch, sendPushToTopic } from '@/lib/firebase/messaging';
import type { SendNotificationRequest, SendNotificationResponse } from '@/types/fcm';

// Supabase Admin 클라이언트
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

// 서버 간 통신 인증 (API 키 검증)
function validateServerAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.FCM_API_SECRET_KEY;

  if (!expectedKey) {
    console.error('FCM_API_SECRET_KEY가 설정되지 않았습니다.');
    return false;
  }

  return apiKey === expectedKey;
}

/**
 * POST /api/fcm/send
 * 푸시 알림 발송
 */
export async function POST(request: NextRequest) {
  try {
    // 서버 인증 확인
    if (!validateServerAuth(request)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body: SendNotificationRequest = await request.json();

    // 필수 필드 검증
    if (!body.notification || !body.notification.body) {
      return NextResponse.json(
        { error: '알림 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 대상 지정 확인
    if (!body.user_id && !body.user_ids && !body.topic) {
      return NextResponse.json(
        { error: '알림 대상을 지정해주세요. (user_id, user_ids, 또는 topic)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    let response: SendNotificationResponse;

    // Topic 기반 발송
    if (body.topic) {
      const result = await sendPushToTopic(body.topic, body.notification);
      response = {
        success: result.success,
        sent_count: result.success ? 1 : 0,
        error: result.error,
      };
    }
    // 단일 사용자 발송
    else if (body.user_id) {
      const { data: tokens } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('user_id', body.user_id)
        .eq('is_active', true);

      if (!tokens || tokens.length === 0) {
        return NextResponse.json({
          success: true,
          sent_count: 0,
          message: '등록된 기기가 없습니다.',
        });
      }

      const tokenList = tokens.map((t) => t.token);
      const result = await sendPushNotificationBatch(tokenList, body.notification);

      // 유효하지 않은 토큰 정리
      if (result.invalidTokens.length > 0) {
        await supabase
          .from('fcm_tokens')
          .update({ is_active: false })
          .in('token', result.invalidTokens);
      }

      response = {
        success: result.successCount > 0,
        sent_count: result.successCount,
        failed_count: result.failureCount,
        invalid_tokens_removed: result.invalidTokens.length,
      };
    }
    // 다중 사용자 발송
    else if (body.user_ids && body.user_ids.length > 0) {
      const { data: tokens } = await supabase
        .from('fcm_tokens')
        .select('token')
        .in('user_id', body.user_ids)
        .eq('is_active', true);

      if (!tokens || tokens.length === 0) {
        return NextResponse.json({
          success: true,
          sent_count: 0,
          message: '등록된 기기가 없습니다.',
        });
      }

      const tokenList = tokens.map((t) => t.token);

      // FCM은 한 번에 500개까지 발송 가능
      const batchSize = 500;
      let totalSuccess = 0;
      let totalFailure = 0;
      const allInvalidTokens: string[] = [];

      for (let i = 0; i < tokenList.length; i += batchSize) {
        const batch = tokenList.slice(i, i + batchSize);
        const result = await sendPushNotificationBatch(batch, body.notification);

        totalSuccess += result.successCount;
        totalFailure += result.failureCount;
        allInvalidTokens.push(...result.invalidTokens);
      }

      // 유효하지 않은 토큰 정리
      if (allInvalidTokens.length > 0) {
        await supabase
          .from('fcm_tokens')
          .update({ is_active: false })
          .in('token', allInvalidTokens);
      }

      response = {
        success: totalSuccess > 0,
        sent_count: totalSuccess,
        failed_count: totalFailure,
        invalid_tokens_removed: allInvalidTokens.length,
      };
    } else {
      return NextResponse.json(
        { error: '알림 대상을 지정해주세요.' },
        { status: 400 }
      );
    }

    // 알림 히스토리 저장 (선택적)
    if (response.success && (body.user_id || body.user_ids)) {
      const userIds = body.user_id ? [body.user_id] : body.user_ids!;
      const historyRecords = userIds.map((userId) => ({
        user_id: userId,
        type: body.notification.type,
        title: body.notification.title || '',
        body: body.notification.body,
        data: body.notification.data,
        is_read: false,
        sent_at: new Date().toISOString(),
      }));

      await supabase.from('notification_history').insert(historyRecords);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('FCM 발송 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
