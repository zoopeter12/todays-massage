import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/supabase';

/**
 * 사용자 정지 처리
 * @param userId - 사용자 ID
 * @param reason - 정지 사유
 * @param suspendedUntil - 정지 해제 일자 (ISO 날짜 문자열, null이면 영구 정지)
 * @returns 성공/실패 결과
 */
export async function suspendUser(
  userId: string,
  reason: string,
  suspendedUntil?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspended_until: suspendedUntil || null,
        suspended_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to suspend user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to suspend user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '사용자 정지 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 사용자 정지 해제
 * @param userId - 사용자 ID
 * @returns 성공/실패 결과
 */
export async function unsuspendUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        suspension_reason: null,
        suspended_until: null,
        suspended_at: null,
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to unsuspend user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to unsuspend user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '사용자 정지 해제 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 사용자 상태 조회
 * @param userId - 사용자 ID
 * @returns 사용자 프로필 정보
 */
export async function getUserStatus(
  userId: string
): Promise<{ data: Profile | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch user status:', error);
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Failed to fetch user status:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : '사용자 정보 조회 중 오류가 발생했습니다.'
    };
  }
}
