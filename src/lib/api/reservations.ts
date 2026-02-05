import { supabase } from '@/lib/supabase/client';
import { Reservation, ReservationInsert, ReservationWithDetails } from '@/types/supabase';
import { refundPoints, getUsedPointsForReservation } from './points';
import { restoreCoupon, getUsedCouponForReservation } from './coupons';
import { sendNewReservationNotification } from './notification';
import { deductCreditOnLateCancellation } from './credit-score';

/**
 * Create a new reservation
 * 예약 생성 후 파트너(shop owner)에게 FCM 푸시 알림 발송
 */
export async function createReservation(data: ReservationInsert): Promise<Reservation> {
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      ...data,
      status: data.status || 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // 파트너에게 새 예약 알림 발송 (비동기, 실패해도 예약 생성은 성공)
  try {
    // shop 정보 조회 (owner_id 포함)
    const { data: shop } = await supabase
      .from('shops')
      .select('owner_id, name')
      .eq('id', data.shop_id)
      .single();

    // course 정보 조회
    const { data: course } = await supabase
      .from('courses')
      .select('name')
      .eq('id', data.course_id)
      .single();

    // 고객 정보 조회 (user_id가 있는 경우)
    let customerName = '비회원';
    if (data.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', data.user_id)
        .single();
      customerName = profile?.nickname || '고객';
    }

    // 파트너(shop owner)에게 알림 발송
    if (shop?.owner_id) {
      await sendNewReservationNotification(
        shop.owner_id,
        reservation.id,
        customerName,
        course?.name || '코스',
        data.date,
        data.time
      );
    }
  } catch (notificationError) {
    // 알림 발송 실패해도 예약 생성은 성공으로 처리
    console.error('파트너 알림 발송 실패:', notificationError);
  }

  return reservation;
}

/**
 * Get reservation by ID with full details (shop, course, user)
 */
export async function getReservationById(id: string): Promise<ReservationWithDetails | null> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      shop:shops(*),
      course:courses(*),
      user:profiles(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as ReservationWithDetails;
}

/**
 * Get available time slots for a specific date
 * Returns array of time strings (e.g., ['10:00', '11:00', ...])
 */
export async function getAvailableTimeSlots(
  shopId: string,
  date: string
): Promise<string[]> {
  // Get existing reservations for the date
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('time')
    .eq('shop_id', shopId)
    .eq('date', date)
    .in('status', ['pending', 'confirmed']);

  if (error) throw error;

  const bookedTimes = reservations?.map((r) => r.time) || [];

  // Generate all possible time slots (10:00 - 22:00)
  const allSlots: string[] = [];
  for (let hour = 10; hour <= 22; hour++) {
    allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Filter out booked times
  return allSlots.filter((slot) => !bookedTimes.includes(slot));
}

/**
 * Cancel a reservation by updating its status to 'cancelled'
 * Also handles refund of points and coupons used in the reservation
 * Only pending or confirmed reservations can be cancelled
 * Deducts credit score (-10) if cancelled within 1 hour of reservation time
 */
export async function cancelReservation(
  reservationId: string
): Promise<{ success: boolean; refundedPoints?: number; restoredCoupon?: boolean; error?: string }> {
  try {
    // 1. 예약 정보 조회 (date, time 포함)
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, user_id, status, date, time')
      .eq('id', reservationId)
      .single();

    if (fetchError) {
      return { success: false, error: '예약 정보를 찾을 수 없습니다.' };
    }

    // 2. 이미 취소된 예약인지 확인
    if (reservation.status === 'cancelled') {
      return { success: false, error: '이미 취소된 예약입니다.' };
    }

    // 3. 완료된 예약은 취소 불가
    if (reservation.status === 'completed') {
      return { success: false, error: '완료된 예약은 취소할 수 없습니다.' };
    }

    const userId = reservation.user_id;
    let refundedPoints = 0;
    let restoredCoupon = false;

    // 4. 포인트 환불 처리
    if (userId) {
      const usedPoints = await getUsedPointsForReservation(reservationId);
      if (usedPoints > 0) {
        const pointRefundResult = await refundPoints(userId, usedPoints, reservationId);
        if (pointRefundResult.success) {
          refundedPoints = usedPoints;
        } else {
          console.error('Point refund failed:', pointRefundResult.error);
          // 포인트 환불 실패해도 예약 취소는 진행 (로그만 남김)
        }
      }
    }

    // 5. 쿠폰 복구 처리
    const usedCoupon = await getUsedCouponForReservation(reservationId);
    if (usedCoupon) {
      const couponRestoreResult = await restoreCoupon(usedCoupon.id);
      if (couponRestoreResult.success) {
        restoredCoupon = true;
      } else {
        console.error('Coupon restore failed:', couponRestoreResult.error);
        // 쿠폰 복구 실패해도 예약 취소는 진행 (로그만 남김)
      }
    }

    // 6. 예약 상태를 cancelled로 변경
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (updateError) {
      return { success: false, error: '예약 취소에 실패했습니다.' };
    }

    // 7. 신용점수 차감 (1시간 이내 취소 시)
    if (userId && reservation.date && reservation.time) {
      try {
        // 예약 시간까지 남은 시간 계산
        const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);
        const now = new Date();
        const hoursUntilReservation = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // 1시간 이내 취소 시 -10점
        if (hoursUntilReservation < 1 && hoursUntilReservation > 0) {
          await deductCreditOnLateCancellation(userId, reservationId);
        }
      } catch (creditError) {
        // Credit score 에러는 로그만 남기고 계속 진행
        console.error('Credit score deduction failed:', creditError);
      }
    }

    return {
      success: true,
      refundedPoints: refundedPoints > 0 ? refundedPoints : undefined,
      restoredCoupon: restoredCoupon || undefined,
    };
  } catch (error) {
    console.error('Cancel reservation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '예약 취소 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Cancel a reservation (simple version for backward compatibility)
 * @deprecated Use cancelReservation instead for full refund handling
 */
export async function cancelReservationSimple(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId);

  if (error) throw error;
}

/**
 * Get user's reservations
 */
export async function getUserReservations(userId: string): Promise<ReservationWithDetails[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      shop:shops(*),
      course:courses(*),
      user:profiles(*)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  if (error) throw error;
  return data as unknown as ReservationWithDetails[];
}

/**
 * Check if user has a completed reservation at a specific shop
 * Used to verify if user can write a review
 */
export async function hasCompletedReservation(
  userId: string,
  shopId: string
): Promise<{ hasCompleted: boolean; reservationId?: string }> {
  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    return { hasCompleted: true, reservationId: data[0].id };
  }

  return { hasCompleted: false };
}

/**
 * Reschedule a reservation to a new date and time
 * - Validates ownership (user_id must match)
 * - Only pending or confirmed reservations can be rescheduled
 * - After rescheduling, status is reset to 'pending' (requires re-confirmation)
 */
export async function rescheduleReservation(
  reservationId: string,
  newDate: string,
  newTime: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 예약 정보 조회 및 소유권/상태 확인
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, user_id, shop_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError) {
      return { success: false, error: '예약 정보를 찾을 수 없습니다.' };
    }

    // 2. 예약 소유권 확인
    if (reservation.user_id !== userId) {
      return { success: false, error: '본인의 예약만 변경할 수 있습니다.' };
    }

    // 3. 예약 상태 확인 (pending 또는 confirmed만 변경 가능)
    if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
      return {
        success: false,
        error: '대기 중이거나 확정된 예약만 변경할 수 있습니다.'
      };
    }

    // 4. 새 날짜/시간 유효성 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;

    if (!dateRegex.test(newDate)) {
      return { success: false, error: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' };
    }

    if (!timeRegex.test(newTime)) {
      return { success: false, error: '시간 형식이 올바르지 않습니다. (HH:MM)' };
    }

    // 5. 과거 날짜 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(newDate);

    if (selectedDate < today) {
      return { success: false, error: '과거 날짜로는 예약을 변경할 수 없습니다.' };
    }

    // 6. 해당 시간대 중복 예약 확인
    const { data: existingReservations, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('shop_id', reservation.shop_id)
      .eq('date', newDate)
      .eq('time', newTime)
      .in('status', ['pending', 'confirmed'])
      .neq('id', reservationId);

    if (checkError) {
      return { success: false, error: '예약 가능 여부를 확인할 수 없습니다.' };
    }

    if (existingReservations && existingReservations.length > 0) {
      return { success: false, error: '선택한 시간은 이미 예약되어 있습니다.' };
    }

    // 7. 예약 정보 업데이트 (상태는 pending으로 리셋)
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        date: newDate,
        time: newTime,
        status: 'pending',
      })
      .eq('id', reservationId);

    if (updateError) {
      return { success: false, error: '예약 변경에 실패했습니다.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: '예약 변경 중 오류가 발생했습니다.' };
  }
}
