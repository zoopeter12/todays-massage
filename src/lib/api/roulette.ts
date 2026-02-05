import { supabase } from '@/lib/supabase/client';
import { downloadCoupon } from './coupons';
import { grantBonusPoints, fetchPointBalance, consumePoints } from './points';
import type {
  RouletteReward,
  RouletteHistory,
  RouletteEligibility,
  SpinResult,
  RouletteRewardFormData,
} from '@/types/roulette';

const POINT_COST_PER_SPIN = 500; // 추가 참여 포인트 비용
const MAX_DAILY_SPINS = 5; // 일일 최대 참여 횟수

/**
 * 활성화된 룰렛 보상 목록 조회
 */
export async function fetchRouletteRewards(): Promise<RouletteReward[]> {
  const { data, error } = await supabase
    .from('roulette_rewards')
    .select('*, coupon:coupons(id, name, discount_type, discount_value)')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // Handle table not found gracefully
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('roulette_rewards')) {
      console.warn('Roulette rewards table not found');
      return [];
    }
    throw error;
  }
  return data || [];
}

/**
 * 룰렛 참여 가능 여부 확인
 */
export async function checkRouletteEligibility(
  userId: string
): Promise<RouletteEligibility> {
  // 오늘 자정 시간 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISOString = today.toISOString();

  // 오늘 참여 기록 조회
  const { data: todayHistory, error: historyError } = await supabase
    .from('roulette_history')
    .select('id, cost_points, created_at')
    .eq('user_id', userId)
    .gte('created_at', todayISOString)
    .order('created_at', { ascending: true });

  // Handle table not found gracefully
  if (historyError) {
    if (historyError.code === 'PGRST205' || historyError.message?.includes('roulette_history')) {
      console.warn('Roulette history table not found');
      return {
        canSpin: false,
        freeSpinAvailable: false,
        nextFreeSpinAt: null,
        todaySpinCount: 0,
        pointCost: POINT_COST_PER_SPIN,
        userPoints: 0,
      };
    }
    throw historyError;
  }

  const todaySpinCount = todayHistory?.length || 0;
  const freeSpinUsed = todayHistory?.some((h) => h.cost_points === 0) || false;
  const freeSpinAvailable = !freeSpinUsed;

  // 유저 포인트 잔액 조회
  const balance = await fetchPointBalance(userId);
  const userPoints = balance.available;

  // 다음 무료 참여 시간 계산
  let nextFreeSpinAt: string | null = null;
  if (!freeSpinAvailable) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    nextFreeSpinAt = tomorrow.toISOString();
  }

  // 참여 가능 여부 결정
  const canSpin =
    todaySpinCount < MAX_DAILY_SPINS &&
    (freeSpinAvailable || userPoints >= POINT_COST_PER_SPIN);

  return {
    canSpin,
    freeSpinAvailable,
    nextFreeSpinAt,
    todaySpinCount,
    pointCost: freeSpinAvailable ? 0 : POINT_COST_PER_SPIN,
    userPoints,
  };
}

/**
 * 확률 기반 보상 선택 (가중치 랜덤)
 */
function selectRewardByProbability(rewards: RouletteReward[]): RouletteReward {
  const totalProbability = rewards.reduce((sum, r) => sum + r.probability, 0);
  let random = Math.random() * totalProbability;

  for (const reward of rewards) {
    random -= reward.probability;
    if (random <= 0) {
      return reward;
    }
  }

  // 폴백: 마지막 보상 반환
  return rewards[rewards.length - 1];
}

/**
 * 룰렛 돌리기
 */
export async function spinRoulette(userId: string): Promise<SpinResult> {
  try {
    // 참여 가능 여부 확인
    const eligibility = await checkRouletteEligibility(userId);

    if (!eligibility.canSpin) {
      if (eligibility.todaySpinCount >= MAX_DAILY_SPINS) {
        return {
          success: false,
          reward: null,
          message: `오늘 참여 횟수(${MAX_DAILY_SPINS}회)를 모두 사용했습니다.`,
        };
      }
      return {
        success: false,
        reward: null,
        message: '포인트가 부족합니다.',
      };
    }

    // 포인트 차감 (무료 참여가 아닌 경우)
    const costPoints = eligibility.freeSpinAvailable ? 0 : POINT_COST_PER_SPIN;
    if (costPoints > 0) {
      await consumePoints(userId, costPoints, null);
    }

    // 보상 목록 조회
    const rewards = await fetchRouletteRewards();
    if (rewards.length === 0) {
      return {
        success: false,
        reward: null,
        message: '현재 진행 중인 이벤트가 없습니다.',
      };
    }

    // 확률 기반 보상 선택
    const selectedReward = selectRewardByProbability(rewards);

    // 보상 지급
    let couponGranted = false;

    if (selectedReward.reward_type === 'points' && selectedReward.reward_value > 0) {
      await grantBonusPoints(
        userId,
        selectedReward.reward_value,
        `룰렛 이벤트 보상: ${selectedReward.name}`
      );
    } else if (selectedReward.reward_type === 'coupon' && selectedReward.coupon_id) {
      try {
        await downloadCoupon(userId, selectedReward.coupon_id);
        couponGranted = true;
      } catch (couponError: any) {
        // 이미 다운로드한 쿠폰이면 포인트로 대체
        if (couponError.message?.includes('이미 다운로드')) {
          await grantBonusPoints(
            userId,
            100, // 대체 포인트
            `룰렛 이벤트 보상 (쿠폰 중복으로 포인트 지급)`
          );
        }
      }
    }

    // 참여 기록 저장
    const { error: historyError } = await supabase
      .from('roulette_history')
      .insert({
        user_id: userId,
        reward_id: selectedReward.id,
        reward_type: selectedReward.reward_type,
        reward_value: selectedReward.reward_value,
        reward_name: selectedReward.name,
        cost_points: costPoints,
      });

    if (historyError) throw historyError;

    // 새로운 포인트 잔액 조회
    const newBalance = await fetchPointBalance(userId);

    return {
      success: true,
      reward: selectedReward,
      message:
        selectedReward.reward_type === 'nothing'
          ? '아쉽네요! 다음에 다시 도전하세요!'
          : `축하합니다! ${selectedReward.name}에 당첨되었습니다!`,
      newPointBalance: newBalance.available,
      couponGranted,
    };
  } catch (error: any) {
    console.error('Roulette spin failed:', error);
    return {
      success: false,
      reward: null,
      message: error.message || '룰렛 참여 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 사용자 룰렛 참여 기록 조회
 */
export async function fetchRouletteHistory(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: RouletteHistory[]; hasMore: boolean }> {
  const from = (page - 1) * limit;
  const to = from + limit;

  const { data, error, count } = await supabase
    .from('roulette_history')
    .select('*, reward:roulette_rewards(*)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to - 1);

  if (error) throw error;

  return {
    data: data || [],
    hasMore: (count || 0) > to,
  };
}

// ============================================
// 관리자 API (보상 설정)
// ============================================

/**
 * 모든 룰렛 보상 조회 (관리자)
 */
export async function fetchAllRouletteRewards(): Promise<RouletteReward[]> {
  const { data, error } = await supabase
    .from('roulette_rewards')
    .select('*, coupon:coupons(id, name, discount_type, discount_value)')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * 룰렛 보상 생성 (관리자)
 */
export async function createRouletteReward(
  formData: RouletteRewardFormData
): Promise<RouletteReward> {
  const { data, error } = await supabase
    .from('roulette_rewards')
    .insert(formData)
    .select('*, coupon:coupons(id, name, discount_type, discount_value)')
    .single();

  if (error) throw error;
  return data;
}

/**
 * 룰렛 보상 수정 (관리자)
 */
export async function updateRouletteReward(
  rewardId: string,
  updates: Partial<RouletteRewardFormData>
): Promise<RouletteReward> {
  const { data, error } = await supabase
    .from('roulette_rewards')
    .update(updates)
    .eq('id', rewardId)
    .select('*, coupon:coupons(id, name, discount_type, discount_value)')
    .single();

  if (error) throw error;
  return data;
}

/**
 * 룰렛 보상 삭제 (관리자)
 */
export async function deleteRouletteReward(rewardId: string): Promise<void> {
  const { error } = await supabase
    .from('roulette_rewards')
    .delete()
    .eq('id', rewardId);

  if (error) throw error;
}

/**
 * 룰렛 통계 조회 (관리자)
 */
export async function fetchRouletteStats(): Promise<{
  totalSpins: number;
  todaySpins: number;
  rewardDistribution: { reward_name: string; count: number }[];
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 전체 참여 수
  const { count: totalSpins, error: totalError } = await supabase
    .from('roulette_history')
    .select('*', { count: 'exact', head: true });

  if (totalError) throw totalError;

  // 오늘 참여 수
  const { count: todaySpins, error: todayError } = await supabase
    .from('roulette_history')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  if (todayError) throw todayError;

  // 보상 분포
  const { data: distribution, error: distError } = await supabase
    .from('roulette_history')
    .select('reward_name')
    .order('created_at', { ascending: false });

  if (distError) throw distError;

  // 보상별 집계
  const rewardCounts = (distribution || []).reduce((acc, item) => {
    acc[item.reward_name] = (acc[item.reward_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const rewardDistribution = Object.entries(rewardCounts).map(([name, count]) => ({
    reward_name: name,
    count: count as number,
  }));

  return {
    totalSpins: totalSpins || 0,
    todaySpins: todaySpins || 0,
    rewardDistribution,
  };
}
