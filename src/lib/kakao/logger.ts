/**
 * 카카오 알림톡 발송 로거
 * @description 알림톡 발송 결과 로깅 및 모니터링
 */

import type { SendStatus } from './types';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (서버 사이드에서 사용, RLS 우회)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

// Service Role Key가 있을 때만 admin 클라이언트 생성
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================
// 로그 타입
// ============================================================

interface SendLogEntry {
  bookingId: string;
  templateCode: string;
  phoneNumber: string;
  status: SendStatus;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
}

interface LogContext {
  timestamp: string;
  environment: string;
  service: string;
}

// ============================================================
// 로거 클래스
// ============================================================

class AlimtalkLogger {
  private serviceName = 'kakao-alimtalk';

  /**
   * 기본 컨텍스트 생성
   */
  private getContext(): LogContext {
    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: this.serviceName,
    };
  }

  /**
   * 발송 로그 기록
   */
  logSend(entry: SendLogEntry): void {
    const context = this.getContext();
    const logData = {
      ...context,
      type: 'ALIMTALK_SEND',
      ...entry,
    };

    // 콘솔 로깅 (개발 환경 디버깅용)
    if (entry.status === 'success') {
      console.log('[ALIMTALK]', JSON.stringify(logData));
    } else {
      console.error('[ALIMTALK_ERROR]', JSON.stringify(logData));
    }

    // Supabase alimtalk_logs 테이블에 영구 저장
    this.persistLog(logData);
  }

  /**
   * 로그 영구 저장
   * @description Supabase alimtalk_logs 테이블에 로그 저장
   */
  private async persistLog(logData: Record<string, unknown>): Promise<void> {
    // Supabase Admin 클라이언트가 없으면 저장 스킵
    if (!supabaseAdmin) {
      console.warn('[ALIMTALK] Supabase admin client not configured, skipping log persistence');
      return;
    }

    try {
      const insertData = {
        booking_id: logData.bookingId as string | undefined,
        template_code: logData.templateCode as string,
        recipient_phone: logData.phoneNumber as string,
        status: logData.status as string,
        message_id: logData.messageId as string | undefined,
        error_code: logData.errorCode as string | undefined,
        error_message: logData.errorMessage as string | undefined,
        request_payload: logData.requestPayload as Record<string, unknown> | undefined,
        response_payload: logData.responsePayload as Record<string, unknown> | undefined,
        sent_at: logData.timestamp as string,
      };

      const { error } = await (supabaseAdmin.from('alimtalk_logs') as unknown as { insert: (data: unknown[]) => Promise<{ error: { message: string } | null }> }).insert([insertData]);

      if (error) {
        console.error('[ALIMTALK] Failed to persist log:', error.message);
      }
    } catch (err) {
      // 로그 저장 실패가 메인 기능에 영향을 주지 않도록 에러만 출력
      console.error('[ALIMTALK] Exception while persisting log:', err);
    }
  }

  /**
   * 에러 로그 기록
   */
  logError(error: Error, context?: Record<string, unknown>): void {
    const logData = {
      ...this.getContext(),
      type: 'ALIMTALK_ERROR',
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      ...context,
    };

    console.error('[ALIMTALK_ERROR]', JSON.stringify(logData));
  }

  /**
   * 정보 로그 기록
   */
  logInfo(message: string, context?: Record<string, unknown>): void {
    const logData = {
      ...this.getContext(),
      type: 'ALIMTALK_INFO',
      message,
      ...context,
    };

    console.log('[ALIMTALK]', JSON.stringify(logData));
  }

  /**
   * 발송 통계 로그
   */
  logStats(stats: {
    totalSent: number;
    successCount: number;
    failureCount: number;
    period: string;
  }): void {
    const logData = {
      ...this.getContext(),
      type: 'ALIMTALK_STATS',
      ...stats,
      successRate: stats.totalSent > 0
        ? ((stats.successCount / stats.totalSent) * 100).toFixed(2) + '%'
        : '0%',
    };

    console.log('[ALIMTALK_STATS]', JSON.stringify(logData));
  }
}

// ============================================================
// 싱글톤 인스턴스 내보내기
// ============================================================

export const logger = new AlimtalkLogger();
