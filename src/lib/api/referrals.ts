import { supabase } from '@/lib/supabase/client';
import type {
  Referral,
  ReferralInsert,
  ReferralWithUser,
  ReferralStats,
  ReferralCodeInfo,
} from '@/types/referrals';

const { MAX_REFERRALS } = { MAX_REFERRALS: 50 };

/**
 * Get user's referral code and count
 */
export async function getReferralCodeInfo(userId: string): Promise<ReferralCodeInfo | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('referral_code, referral_count')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get referral code info:', error);
    throw error;
  }
}

/**
 * Find user by referral code
 */
export async function findUserByReferralCode(code: string): Promise<{ id: string; referral_count: number } | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, referral_count')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Failed to find user by referral code:', error);
    throw error;
  }
}

/**
 * Check if user was already referred
 */
export async function wasUserReferred(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', userId)
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  } catch (error) {
    console.error('Failed to check if user was referred:', error);
    throw error;
  }
}

/**
 * Create a referral relationship
 */
export async function createReferral(
  referrerId: string,
  referredId: string
): Promise<Referral> {
  try {
    // Validate: referrer exists and hasn't exceeded limit
    const referrer = await findUserByReferralCode('');

    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('id, referral_count')
      .eq('id', referrerId)
      .single();

    if (!referrerProfile) {
      throw new Error('추천인을 찾을 수 없습니다.');
    }

    if (referrerProfile.referral_count >= MAX_REFERRALS) {
      throw new Error('추천인의 최대 추천 횟수를 초과했습니다.');
    }

    // Validate: user hasn't been referred already
    const alreadyReferred = await wasUserReferred(referredId);
    if (alreadyReferred) {
      throw new Error('이미 추천 코드를 사용한 회원입니다.');
    }

    // Create referral record
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('이미 추천 코드를 사용한 회원입니다.');
      }
      throw error;
    }

    // Update referred_by in profile
    await supabase
      .from('profiles')
      .update({ referred_by: referrerId })
      .eq('id', referredId);

    return data;
  } catch (error) {
    console.error('Failed to create referral:', error);
    throw error;
  }
}

/**
 * Apply referral code during registration/first login
 */
export async function applyReferralCode(
  referredUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Find referrer by code
    const referrer = await findUserByReferralCode(referralCode);

    if (!referrer) {
      return { success: false, message: '유효하지 않은 추천 코드입니다.' };
    }

    if (referrer.id === referredUserId) {
      return { success: false, message: '자신의 추천 코드는 사용할 수 없습니다.' };
    }

    if (referrer.referral_count >= MAX_REFERRALS) {
      return { success: false, message: '추천인의 최대 추천 횟수를 초과했습니다.' };
    }

    // Check if already referred
    const alreadyReferred = await wasUserReferred(referredUserId);
    if (alreadyReferred) {
      return { success: false, message: '이미 추천 코드를 사용했습니다.' };
    }

    // Create referral
    await createReferral(referrer.id, referredUserId);

    return {
      success: true,
      message: '추천 코드가 적용되었습니다. 첫 예약 완료 시 보상이 지급됩니다!',
    };
  } catch (error) {
    console.error('Failed to apply referral code:', error);
    return { success: false, message: '추천 코드 적용 중 오류가 발생했습니다.' };
  }
}

/**
 * Get user's referral statistics
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  try {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('status, referrer_reward_points')
      .eq('referrer_id', userId);

    if (error) throw error;

    const stats: ReferralStats = {
      total_referrals: referrals?.length || 0,
      completed_referrals: referrals?.filter(r => r.status === 'completed').length || 0,
      pending_referrals: referrals?.filter(r => r.status === 'pending').length || 0,
      total_rewards_earned: referrals
        ?.filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.referrer_reward_points || 0), 0) || 0,
    };

    return stats;
  } catch (error) {
    console.error('Failed to get referral stats:', error);
    throw error;
  }
}

/**
 * Get list of referrals made by user
 */
export async function getReferralHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: ReferralWithUser[]; hasMore: boolean }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit;

    const { data, error, count } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:profiles!referrals_referred_id_fkey(id, nickname, phone)
      `, { count: 'exact' })
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to - 1);

    if (error) throw error;

    return {
      data: (data || []) as unknown as ReferralWithUser[],
      hasMore: (count || 0) > to,
    };
  } catch (error) {
    console.error('Failed to get referral history:', error);
    throw error;
  }
}

/**
 * Check if user has a pending referral (hasn't completed first reservation yet)
 */
export async function getPendingReferral(userId: string): Promise<Referral | null> {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Failed to get pending referral:', error);
    throw error;
  }
}

/**
 * Generate share URL with referral code
 */
export function generateShareUrl(referralCode: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  return `${baseUrl}/login?ref=${referralCode}`;
}

/**
 * Generate share message for KakaoTalk or other platforms
 */
export function generateShareMessage(referralCode: string, userName?: string): string {
  const shareUrl = generateShareUrl(referralCode);
  const name = userName || '친구';
  return `${name}님이 마사지 예약 앱을 추천합니다!\n\n추천 코드: ${referralCode}\n\n첫 예약 완료 시 3,000P를 드려요!\n\n${shareUrl}`;
}
