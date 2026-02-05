import { supabase } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/server';

/**
 * 블랙리스트 항목 타입
 */
export interface BlacklistEntry {
  id: string;
  di: string;
  reason: string;
  blocked_at: string;
  blocked_by: string | null;
  original_user_id: string | null;
  created_at: string;
}

/**
 * DI로 블랙리스트 여부 확인
 * 서비스 가용성을 우선하여 에러 시 false 반환
 * @param di - 본인인증 DI 값
 * @returns 블랙리스트 여부
 */
export async function checkBlacklist(di: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('blacklist')
      .select('id')
      .eq('di', di)
      .maybeSingle();

    if (error) {
      console.error('Failed to check blacklist:', error);
      return false; // 서비스 가용성 우선
    }

    return !!data;
  } catch (error) {
    console.error('Failed to check blacklist:', error);
    return false; // 서비스 가용성 우선
  }
}

/**
 * 전화번호로 블랙리스트 여부 확인 (임시 - 다날 PASS 연동 전)
 * 서비스 가용성을 우선하여 에러 시 false 반환
 * @param phone - 전화번호 (클리닝된 형식: 01012345678)
 * @returns 블랙리스트 여부
 */
export async function checkBlacklistByPhone(phone: string): Promise<boolean> {
  try {
    // 1. 해당 전화번호의 사용자 조회
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (userError) {
      console.error('Failed to check user profile:', userError);
      return false; // 서비스 가용성 우선
    }

    // 사용자가 없으면 블랙리스트가 아님
    if (!userProfile) {
      return false;
    }

    // 2. 해당 사용자 ID로 블랙리스트 확인
    const { data: blacklistEntry, error: blacklistError } = await supabase
      .from('blacklist')
      .select('id')
      .eq('original_user_id', userProfile.id)
      .maybeSingle();

    if (blacklistError) {
      console.error('Failed to check blacklist by user ID:', blacklistError);
      return false; // 서비스 가용성 우선
    }

    return !!blacklistEntry;
  } catch (error) {
    console.error('Failed to check blacklist by phone:', error);
    return false; // 서비스 가용성 우선
  }
}

/**
 * 블랙리스트에 추가
 * @param di - 본인인증 DI 값
 * @param reason - 차단 사유
 * @param blockedBy - 차단 처리한 관리자 ID
 * @param originalUserId - 원본 사용자 ID (선택)
 * @returns 성공/실패 결과
 */
export async function addToBlacklist(
  di: string,
  reason: string,
  blockedBy: string,
  originalUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const serverClient = createServerClient();

    const { error } = await serverClient
      .from('blacklist')
      .insert({
        di,
        reason,
        blocked_by: blockedBy,
        original_user_id: originalUserId || null,
        blocked_at: new Date().toISOString(),
      });

    if (error) {
      // unique violation 에러 처리 (이미 블랙리스트에 존재)
      if (error.code === '23505') {
        return { success: false, error: '이미 블랙리스트에 등록된 DI입니다.' };
      }
      console.error('Failed to add to blacklist:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add to blacklist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '블랙리스트 추가 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 블랙리스트에서 제거
 * @param di - 본인인증 DI 값
 * @returns 성공/실패 결과
 */
export async function removeFromBlacklist(
  di: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const serverClient = createServerClient();

    const { error } = await serverClient
      .from('blacklist')
      .delete()
      .eq('di', di);

    if (error) {
      console.error('Failed to remove from blacklist:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to remove from blacklist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '블랙리스트 제거 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 블랙리스트 목록 조회 (관리자용)
 * @param page - 페이지 번호 (1부터 시작)
 * @param limit - 페이지당 항목 수
 * @returns 블랙리스트 목록 및 총 개수
 */
export async function fetchBlacklist(
  page: number = 1,
  limit: number = 20
): Promise<{ data: BlacklistEntry[]; total: number }> {
  try {
    const offset = (page - 1) * limit;

    // 총 개수 조회
    const { count, error: countError } = await supabase
      .from('blacklist')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Failed to fetch blacklist count:', countError);
      return { data: [], total: 0 };
    }

    // 목록 조회
    const { data, error } = await supabase
      .from('blacklist')
      .select('*')
      .order('blocked_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch blacklist:', error);
      return { data: [], total: 0 };
    }

    return {
      data: data as BlacklistEntry[],
      total: count || 0
    };
  } catch (error) {
    console.error('Failed to fetch blacklist:', error);
    return { data: [], total: 0 };
  }
}
