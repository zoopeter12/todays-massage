import { supabase } from '@/lib/supabase/client';
import { createClient, createServerClient } from '@/lib/supabase/server';
import { addToBlacklist } from './blacklist';

// =========================
// Constants
// =========================

const CREDIT_SCORE_DEFAULT = 100;
const CREDIT_SCORE_MAX = 100;
const CREDIT_SCORE_MIN = 0;
const CREDIT_SCORE_BLACKLIST_THRESHOLD = 0;

export const CREDIT_SCORE_CHANGES = {
  VISIT_COMPLETED: 2,      // 방문 완료
  REPORT_RECEIVED: -50,    // 신고 접수
  NO_SHOW: -30,            // 노쇼
  LATE_CANCELLATION: -10,  // 1시간 이내 취소
} as const;

// =========================
// Types
// =========================

export interface CreditScoreHistory {
  id: string;
  user_id: string;
  delta: number;
  previous_score: number;
  new_score: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  processed_by: string | null;
  created_at: string;
}

export interface UpdateCreditScoreResult {
  success: boolean;
  newScore: number;
  isBlacklisted: boolean;
  error?: string;
}

// =========================
// Core Functions
// =========================

/**
 * 사용자 신용점수 조회
 * @param userId - 사용자 ID
 * @returns 신용점수 (기본값 100)
 */
export async function getCreditScore(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('credit_score')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch credit score:', error);
      return CREDIT_SCORE_DEFAULT;
    }

    return data?.credit_score ?? CREDIT_SCORE_DEFAULT;
  } catch (error) {
    console.error('Failed to fetch credit score:', error);
    return CREDIT_SCORE_DEFAULT;
  }
}

/**
 * 신용점수 업데이트
 * 점수 변경 후 이력 저장, 0점 이하 시 자동 블랙리스트
 * @param userId - 사용자 ID
 * @param delta - 점수 변동량 (양수: 증가, 음수: 감소)
 * @param reason - 변동 사유
 * @param referenceType - 관련 엔티티 타입 (reservation, report 등)
 * @param referenceId - 관련 엔티티 ID
 * @returns 업데이트 결과
 */
export async function updateCreditScore(
  userId: string,
  delta: number,
  reason: string,
  referenceType?: string,
  referenceId?: string
): Promise<UpdateCreditScoreResult> {
  try {
    const serverClient = await createClient();

    // 1. 현재 점수 조회
    const { data: profile, error: profileError } = await serverClient
      .from('profiles')
      .select('credit_score, di')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      return {
        success: false,
        newScore: CREDIT_SCORE_DEFAULT,
        isBlacklisted: false,
        error: profileError.message,
      };
    }

    const currentScore = profile?.credit_score ?? CREDIT_SCORE_DEFAULT;

    // 2. 새 점수 계산 (0-100 범위 유지)
    const newScore = Math.max(
      CREDIT_SCORE_MIN,
      Math.min(CREDIT_SCORE_MAX, currentScore + delta)
    );

    // 3. 점수 업데이트
    const { error: updateError } = await serverClient
      .from('profiles')
      .update({
        credit_score: newScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update credit score:', updateError);
      return {
        success: false,
        newScore: currentScore,
        isBlacklisted: false,
        error: updateError.message,
      };
    }

    // 4. 이력 기록
    const { error: historyError } = await serverClient
      .from('credit_score_history')
      .insert({
        user_id: userId,
        delta,
        previous_score: currentScore,
        new_score: newScore,
        reason,
        reference_type: referenceType || null,
        reference_id: referenceId || null,
      });

    if (historyError) {
      console.error('Failed to insert credit score history:', historyError);
      // 이력 기록 실패는 치명적이지 않으므로 계속 진행
    }

    // 5. 0점 이하 시 자동 블랙리스트 처리
    let isBlacklisted = false;
    if (newScore <= CREDIT_SCORE_BLACKLIST_THRESHOLD && profile?.di) {
      const blacklistResult = await addToBlacklist(
        profile.di,
        `신용점수 ${newScore}점 도달로 자동 블랙리스트`,
        'system', // 시스템 자동 처리
        userId
      );

      if (blacklistResult.success) {
        isBlacklisted = true;
        console.log(`User ${userId} added to blacklist due to credit score ${newScore}`);
      } else {
        console.error('Failed to add user to blacklist:', blacklistResult.error);
      }
    }

    return {
      success: true,
      newScore,
      isBlacklisted,
    };
  } catch (error) {
    console.error('Failed to update credit score:', error);
    return {
      success: false,
      newScore: CREDIT_SCORE_DEFAULT,
      isBlacklisted: false,
      error: error instanceof Error ? error.message : '신용점수 업데이트 중 오류가 발생했습니다.',
    };
  }
}

// =========================
// Event-Specific Functions
// =========================

/**
 * 방문 완료 시 점수 적립 (+2점)
 * @param userId - 사용자 ID
 * @param reservationId - 예약 ID
 */
export async function earnCreditOnVisit(
  userId: string,
  reservationId: string
): Promise<void> {
  const result = await updateCreditScore(
    userId,
    CREDIT_SCORE_CHANGES.VISIT_COMPLETED,
    '방문 완료',
    'reservation',
    reservationId
  );

  if (!result.success) {
    console.error(`Failed to earn credit for visit: ${result.error}`);
  }
}

/**
 * 신고 접수 시 점수 차감 (-50점)
 * @param userId - 사용자 ID
 * @param reportId - 신고 ID
 * @returns 블랙리스트 여부
 */
export async function deductCreditOnReport(
  userId: string,
  reportId: string
): Promise<{ isBlacklisted: boolean }> {
  const result = await updateCreditScore(
    userId,
    CREDIT_SCORE_CHANGES.REPORT_RECEIVED,
    '신고 접수',
    'report',
    reportId
  );

  if (!result.success) {
    console.error(`Failed to deduct credit for report: ${result.error}`);
  }

  return { isBlacklisted: result.isBlacklisted };
}

/**
 * 노쇼 시 점수 차감 (-30점)
 * @param userId - 사용자 ID
 * @param reservationId - 예약 ID
 * @returns 블랙리스트 여부
 */
export async function deductCreditOnNoShow(
  userId: string,
  reservationId: string
): Promise<{ isBlacklisted: boolean }> {
  const result = await updateCreditScore(
    userId,
    CREDIT_SCORE_CHANGES.NO_SHOW,
    '노쇼',
    'reservation',
    reservationId
  );

  if (!result.success) {
    console.error(`Failed to deduct credit for no-show: ${result.error}`);
  }

  return { isBlacklisted: result.isBlacklisted };
}

/**
 * 1시간 이내 취소 시 점수 차감 (-10점)
 * @param userId - 사용자 ID
 * @param reservationId - 예약 ID
 * @returns 블랙리스트 여부
 */
export async function deductCreditOnLateCancellation(
  userId: string,
  reservationId: string
): Promise<{ isBlacklisted: boolean }> {
  const result = await updateCreditScore(
    userId,
    CREDIT_SCORE_CHANGES.LATE_CANCELLATION,
    '1시간 이내 취소',
    'reservation',
    reservationId
  );

  if (!result.success) {
    console.error(`Failed to deduct credit for late cancellation: ${result.error}`);
  }

  return { isBlacklisted: result.isBlacklisted };
}

// =========================
// History Functions
// =========================

/**
 * 신용점수 변동 이력 조회
 * @param userId - 사용자 ID
 * @param limit - 조회할 이력 개수 (기본값 20)
 * @returns 신용점수 이력 목록
 */
export async function fetchCreditScoreHistory(
  userId: string,
  limit: number = 20
): Promise<CreditScoreHistory[]> {
  try {
    const { data, error } = await supabase
      .from('credit_score_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch credit score history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch credit score history:', error);
    return [];
  }
}

// =========================
// Admin Functions
// =========================

/**
 * 관리자 수동 점수 조정
 * @param userId - 대상 사용자 ID
 * @param delta - 점수 변동량
 * @param reason - 조정 사유
 * @param adminId - 관리자 ID
 * @returns 업데이트 결과
 */
export async function adminAdjustCreditScore(
  userId: string,
  delta: number,
  reason: string,
  adminId: string
): Promise<UpdateCreditScoreResult> {
  try {
    const serverClient = await createClient();

    // 1. 현재 점수 조회
    const { data: profile, error: profileError } = await serverClient
      .from('profiles')
      .select('credit_score, di')
      .eq('id', userId)
      .single();

    if (profileError) {
      return {
        success: false,
        newScore: CREDIT_SCORE_DEFAULT,
        isBlacklisted: false,
        error: profileError.message,
      };
    }

    const currentScore = profile?.credit_score ?? CREDIT_SCORE_DEFAULT;
    const newScore = Math.max(
      CREDIT_SCORE_MIN,
      Math.min(CREDIT_SCORE_MAX, currentScore + delta)
    );

    // 2. 점수 업데이트
    const { error: updateError } = await serverClient
      .from('profiles')
      .update({
        credit_score: newScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      return {
        success: false,
        newScore: currentScore,
        isBlacklisted: false,
        error: updateError.message,
      };
    }

    // 3. 이력 기록 (관리자 수동 조정)
    await serverClient
      .from('credit_score_history')
      .insert({
        user_id: userId,
        delta,
        previous_score: currentScore,
        new_score: newScore,
        reason: `관리자 수동 조정: ${reason}`,
        reference_type: 'manual',
        reference_id: null,
        processed_by: adminId,
      });

    // 4. 블랙리스트 처리
    let isBlacklisted = false;
    if (newScore <= CREDIT_SCORE_BLACKLIST_THRESHOLD && profile?.di) {
      const blacklistResult = await addToBlacklist(
        profile.di,
        `관리자 조정으로 신용점수 ${newScore}점 도달`,
        adminId,
        userId
      );
      isBlacklisted = blacklistResult.success;
    }

    return {
      success: true,
      newScore,
      isBlacklisted,
    };
  } catch (error) {
    console.error('Failed to adjust credit score:', error);
    return {
      success: false,
      newScore: CREDIT_SCORE_DEFAULT,
      isBlacklisted: false,
      error: error instanceof Error ? error.message : '신용점수 조정 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 전체 이력 조회 (관리자용)
 * @param userId - 사용자 ID
 * @param page - 페이지 번호 (1부터 시작)
 * @param limit - 페이지당 항목 수
 * @returns 이력 목록 및 총 개수
 */
export async function fetchCreditScoreHistoryAdmin(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: CreditScoreHistory[]; total: number; hasMore: boolean }> {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('credit_score_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch credit score history (admin):', error);
      return { data: [], total: 0, hasMore: false };
    }

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error('Failed to fetch credit score history (admin):', error);
    return { data: [], total: 0, hasMore: false };
  }
}
