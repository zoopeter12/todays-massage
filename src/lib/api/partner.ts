import { supabase } from '@/lib/supabase/client';
import { Course, CourseInsert, Reservation, ReservationWithDetails, Shop, ShopUpdate } from '@/types/supabase';
import { earnCreditOnVisit, deductCreditOnNoShow } from './credit-score';

/**
 * Partner API Functions
 * For shop owners to manage reservations and shop settings
 */

// =========================
// Authentication & Shop Resolution
// =========================

/**
 * Get the current logged-in user's partner shop ID.
 * Queries the shops table by owner_id matching the authenticated user.
 * Fallback: If owner_id column doesn't exist, returns the first shop for demo purposes.
 * @returns The shop owned by the current user, or null if not found/not logged in.
 */
export async function getPartnerShop(): Promise<Shop | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // First try to find shop by owner_id
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!error && data) return data as Shop;

  // Fallback: If owner_id column doesn't exist or no shop found,
  // return the first shop for demo/testing purposes
  console.log('[getPartnerShop] Fallback: returning first shop for demo');
  const { data: fallbackShop, error: fallbackError } = await supabase
    .from('shops')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (fallbackError || !fallbackShop) return null;
  return fallbackShop as Shop;
}

/**
 * Get the current logged-in user's partner shop ID only.
 * Lightweight version that returns just the ID string.
 * @returns The shop ID string, or null if not found/not logged in.
 */
export async function getPartnerShopId(): Promise<string | null> {
  const shop = await getPartnerShop();
  return shop?.id || null;
}

// =========================
// Reservation Management
// =========================

/**
 * Fetch all reservations for a specific shop
 * @param shopId - Shop ID to fetch reservations for
 * @param status - Optional status filter
 */
export async function fetchShopReservations(
  shopId: string,
  status?: string
): Promise<ReservationWithDetails[]> {
  let query = supabase
    .from('reservations')
    .select(`
      *,
      shop:shops(*),
      course:courses(*),
      user:profiles(*)
    `)
    .eq('shop_id', shopId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('date', { ascending: true }).order('time', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch today's reservations for a shop
 */
export async function fetchTodayReservations(shopId: string): Promise<ReservationWithDetails[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      shop:shops(*),
      course:courses(*),
      user:profiles(*)
    `)
    .eq('shop_id', shopId)
    .eq('date', today)
    .order('time', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Update reservation status
 * @param reservationId - Reservation ID to update
 * @param status - New status (confirmed, cancelled, completed, no_show)
 * @throws Error if the status transition is not allowed
 */
export async function updateReservationStatus(
  reservationId: string,
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
): Promise<Reservation> {
  // 1. Fetch current reservation status and user_id
  const { data: currentReservation, error: fetchError } = await supabase
    .from('reservations')
    .select('status, user_id')
    .eq('id', reservationId)
    .single();

  if (fetchError) throw fetchError;
  if (!currentReservation) {
    throw new Error('예약을 찾을 수 없습니다');
  }

  // 2. Define valid status transitions
  const validTransitions: Record<string, string[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled', 'no_show'],
    'cancelled': [],
    'completed': [],
    'no_show': [],
  };

  // 3. Validate status transition
  const currentStatus = currentReservation.status;
  const allowedStatuses = validTransitions[currentStatus] || [];

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      `상태 전이 불가: '${currentStatus}' 상태에서 '${status}'로 변경할 수 없습니다. 허용된 상태: ${allowedStatuses.length > 0 ? allowedStatuses.join(', ') : '없음'}`
    );
  }

  // 4. Update reservation status
  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', reservationId)
    .select()
    .single();

  if (error) throw error;

  // 5. Credit score integration (soft fail - errors logged but don't block status update)
  const userId = currentReservation.user_id;
  if (userId) {
    try {
      if (status === 'completed') {
        // 방문 완료 시 +2점
        await earnCreditOnVisit(userId, reservationId);
      } else if (status === 'no_show') {
        // 노쇼 시 -30점
        await deductCreditOnNoShow(userId, reservationId);
      }
    } catch (creditError) {
      // Credit score 에러는 로그만 남기고 계속 진행
      console.error('Credit score update failed:', creditError);
    }
  }

  return data as Reservation;
}

/**
 * Approve (confirm) a pending reservation
 */
export async function approveReservation(reservationId: string): Promise<Reservation> {
  return updateReservationStatus(reservationId, 'confirmed');
}

/**
 * Reject (cancel) a pending reservation
 */
export async function rejectReservation(reservationId: string): Promise<Reservation> {
  return updateReservationStatus(reservationId, 'cancelled');
}

/**
 * Complete a confirmed reservation
 */
export async function completeReservation(reservationId: string): Promise<Reservation> {
  return updateReservationStatus(reservationId, 'completed');
}

/**
 * Mark a confirmed reservation as no-show
 */
export async function markAsNoShow(reservationId: string): Promise<Reservation> {
  return updateReservationStatus(reservationId, 'no_show');
}

/**
 * Get reservation statistics for a shop
 */
export async function getReservationStats(shopId: string) {
  const reservations = await fetchShopReservations(shopId);

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
    completed: reservations.filter((r) => r.status === 'completed').length,
  };

  return stats;
}

// =========================
// Shop Management
// =========================

/**
 * Fetch shop details by ID
 */
export async function fetchShop(shopId: string): Promise<Shop> {
  const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single();

  if (error) throw error;
  return data;
}

/**
 * Update shop settings
 */
export async function updateShop(shopId: string, updates: ShopUpdate): Promise<Shop> {
  const { data, error } = await supabase
    .from('shops')
    .update(updates)
    .eq('id', shopId)
    .select()
    .single();

  if (error) throw error;
  return data as Shop;
}

// =========================
// Realtime Subscription
// =========================

/**
 * Subscribe to reservation changes for a shop
 * @param shopId - Shop ID to subscribe to
 * @param callback - Callback function to handle changes
 */
export function subscribeToReservations(
  shopId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`reservations:shop_id=eq.${shopId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: `shop_id=eq.${shopId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeChannel(channel: any) {
  await supabase.removeChannel(channel);
}

// =========================
// Course Management
// =========================

/**
 * Fetch all courses for a specific shop
 * @param shopId - Shop ID to fetch courses for
 */
export async function fetchShopCourses(shopId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new course
 * @param data - Course data to insert
 */
export async function createCourse(data: CourseInsert): Promise<Course> {
  const { data: course, error } = await supabase
    .from('courses')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return course as Course;
}

/**
 * Update an existing course
 * @param courseId - Course ID to update
 * @param data - Partial course data to update
 */
export async function updateCourse(
  courseId: string,
  data: Partial<CourseInsert>
): Promise<Course> {
  const { data: course, error } = await supabase
    .from('courses')
    .update(data)
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return course as Course;
}

/**
 * Delete a course
 * @param courseId - Course ID to delete
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
}
