import { supabase } from '@/lib/supabase/client';
import type { PointHistory, PointBalance, PointEarnCalculation, PointType } from '@/types/points';

const POINT_EARN_RATE = 0.05; // 5% 적립률
const POINT_EXPIRY_MONTHS = 12; // 12개월 후 만료

export async function fetchPointBalance(userId: string): Promise<PointBalance> {
  try {
    const { data, error } = await supabase
      .from('point_history')
      .select('amount, type')
      .eq('user_id', userId);

    if (error) throw error;

    const total_earned = data
      ?.filter(p => p.type === 'earn' || p.type === 'bonus' || p.type === 'refund')
      .reduce((sum, p) => sum + p.amount, 0) || 0;

    const total_used = Math.abs(
      data
        ?.filter(p => p.type === 'use')
        .reduce((sum, p) => sum + p.amount, 0) || 0
    );

    const total_expired = Math.abs(
      data
        ?.filter(p => p.type === 'expire')
        .reduce((sum, p) => sum + p.amount, 0) || 0
    );

    const available = total_earned - total_used - total_expired;

    return {
      total_earned,
      total_used,
      total_expired,
      available: Math.max(0, available),
    };
  } catch (error) {
    console.error('Failed to fetch point balance:', error);
    throw error;
  }
}

export async function fetchPointHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: PointHistory[]; hasMore: boolean }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit;

    const { data, error, count } = await supabase
      .from('point_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to - 1);

    if (error) throw error;

    return {
      data: data || [],
      hasMore: (count || 0) > to,
    };
  } catch (error) {
    console.error('Failed to fetch point history:', error);
    throw error;
  }
}

export async function earnPoints(
  userId: string,
  amount: number,
  reservationId: string | null = null,
  description: string = '예약 완료 적립'
): Promise<PointHistory> {
  try {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + POINT_EXPIRY_MONTHS);

    const { data, error } = await supabase
      .from('point_history')
      .insert({
        user_id: userId,
        amount: Math.floor(amount),
        type: 'earn',
        description,
        reservation_id: reservationId,
        expired_at: expiryDate.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Failed to earn points:', error);
    throw error;
  }
}

export async function consumePoints(
  userId: string,
  amount: number,
  reservationId: string | null = null
): Promise<PointHistory> {
  try {
    // 사용 가능 포인트 확인
    const balance = await fetchPointBalance(userId);

    if (balance.available < amount) {
      throw new Error('사용 가능한 포인트가 부족합니다.');
    }

    const { data, error } = await supabase
      .from('point_history')
      .insert({
        user_id: userId,
        amount: -Math.abs(amount), // 음수로 저장
        type: 'use',
        description: '예약 결제 시 사용',
        reservation_id: reservationId,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Failed to use points:', error);
    throw error;
  }
}

export async function checkExpiredPoints(userId: string): Promise<number> {
  try {
    const now = new Date().toISOString();

    // 만료된 적립 포인트 조회
    const { data: expiredPoints, error: fetchError } = await supabase
      .from('point_history')
      .select('id, amount, expired_at')
      .eq('user_id', userId)
      .in('type', ['earn', 'bonus'])
      .lt('expired_at', now);

    if (fetchError) throw fetchError;

    if (!expiredPoints || expiredPoints.length === 0) {
      return 0;
    }

    // 각 만료 포인트에 대해 만료 기록 생성
    const expireRecords = expiredPoints.map(point => ({
      user_id: userId,
      amount: -Math.abs(point.amount),
      type: 'expire',
      description: `포인트 만료 (${new Date(point.expired_at!).toLocaleDateString()})`,
      reservation_id: null,
    }));

    const { error: insertError } = await supabase
      .from('point_history')
      .insert(expireRecords);

    if (insertError) throw insertError;

    const totalExpired = expiredPoints.reduce((sum, p) => sum + p.amount, 0);
    return totalExpired;
  } catch (error) {
    console.error('Failed to check expired points:', error);
    throw error;
  }
}

export function calculateEarnAmount(totalPrice: number): PointEarnCalculation {
  const amount = Math.floor(totalPrice * POINT_EARN_RATE);

  return {
    amount,
    rate: POINT_EARN_RATE * 100,
    description: `${(POINT_EARN_RATE * 100).toFixed(0)}% 적립`,
  };
}

export async function grantBonusPoints(
  userId: string,
  amount: number,
  description: string
): Promise<PointHistory> {
  try {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + POINT_EXPIRY_MONTHS);

    const { data, error } = await supabase
      .from('point_history')
      .insert({
        user_id: userId,
        amount: Math.floor(amount),
        type: 'bonus',
        description,
        reservation_id: null,
        expired_at: expiryDate.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Failed to grant bonus points:', error);
    throw error;
  }
}

/**
 * Refund points for a cancelled reservation
 * Finds the 'use' record for the reservation and creates a refund record
 */
export async function refundPoints(
  userId: string,
  amount: number,
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 해당 예약에서 사용된 포인트가 있는지 확인
    const { data: usedPoints, error: fetchError } = await supabase
      .from('point_history')
      .select('id, amount')
      .eq('user_id', userId)
      .eq('reservation_id', reservationId)
      .eq('type', 'use')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116: no rows returned
      throw fetchError;
    }

    if (!usedPoints) {
      // 사용된 포인트가 없으면 환불할 것도 없음
      return { success: true };
    }

    const refundAmount = Math.abs(usedPoints.amount);

    if (refundAmount !== amount) {
      console.warn(
        `Refund amount mismatch: expected ${amount}, found ${refundAmount}`
      );
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + POINT_EXPIRY_MONTHS);

    // 환불 기록 생성 (양수로 저장)
    const { error: insertError } = await supabase
      .from('point_history')
      .insert({
        user_id: userId,
        amount: refundAmount,
        type: 'refund' as PointType,
        description: '예약 취소 환불',
        reservation_id: reservationId,
        expired_at: expiryDate.toISOString(),
      });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    console.error('Failed to refund points:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '포인트 환불에 실패했습니다.',
    };
  }
}

/**
 * Get used points amount for a reservation
 */
export async function getUsedPointsForReservation(
  reservationId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('point_history')
    .select('amount')
    .eq('reservation_id', reservationId)
    .eq('type', 'use')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data ? Math.abs(data.amount) : 0;
}
