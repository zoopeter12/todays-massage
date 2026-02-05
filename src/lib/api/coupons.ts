import { supabase } from '@/lib/supabase/client';
import { Coupon, UserCoupon, CouponFormData } from '@/types/coupons';

/**
 * Fetch active coupons for a specific shop
 */
export async function fetchShopCoupons(shopId: string): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*, shop:shops(name)')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .gte('valid_until', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch user's coupons (downloaded coupons)
 */
export async function fetchMyCoupons(userId: string): Promise<UserCoupon[]> {
  const { data, error } = await supabase
    .from('user_coupons')
    .select('*, coupon:coupons(*, shop:shops(name))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Download a coupon (add to user's coupon wallet)
 */
export async function downloadCoupon(
  userId: string,
  couponId: string
): Promise<UserCoupon> {
  // Check if coupon exists and has remaining quota
  const { data: coupon, error: fetchError } = await supabase
    .from('coupons')
    .select('*, user_coupons!inner(id)')
    .eq('id', couponId)
    .single();

  if (fetchError) throw fetchError;

  // Check usage limit
  if (
    coupon.usage_limit !== null &&
    coupon.used_count >= coupon.usage_limit
  ) {
    throw new Error('쿠폰 수량이 모두 소진되었습니다.');
  }

  // Check if user already downloaded this coupon
  const { data: existing } = await supabase
    .from('user_coupons')
    .select('id')
    .eq('user_id', userId)
    .eq('coupon_id', couponId)
    .maybeSingle();

  if (existing) {
    throw new Error('이미 다운로드한 쿠폰입니다.');
  }

  // Download coupon
  const { data, error } = await supabase
    .from('user_coupons')
    .insert({
      user_id: userId,
      coupon_id: couponId,
    })
    .select('*, coupon:coupons(*, shop:shops(name))')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Use a coupon for a reservation
 */
export async function applyCoupon(
  userCouponId: string,
  reservationId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_coupons')
    .update({
      used_at: new Date().toISOString(),
      reservation_id: reservationId,
    })
    .eq('id', userCouponId)
    .is('used_at', null); // Only update if not already used

  if (error) throw error;
}

/**
 * Calculate discount amount for a given coupon and price
 */
export function calculateDiscount(
  coupon: Coupon,
  originalPrice: number
): number {
  if (originalPrice < coupon.min_price) {
    return 0;
  }

  let discount = 0;

  if (coupon.discount_type === 'percent') {
    discount = Math.floor((originalPrice * coupon.discount_value) / 100);
    if (coupon.max_discount !== null) {
      discount = Math.min(discount, coupon.max_discount);
    }
  } else {
    // fixed amount
    discount = coupon.discount_value;
  }

  return Math.min(discount, originalPrice); // Never exceed original price
}

/**
 * Get applicable coupons for a reservation (user's unused coupons that meet min_price)
 */
export async function getApplicableCoupons(
  userId: string,
  shopId: string,
  price: number
): Promise<UserCoupon[]> {
  const { data, error } = await supabase
    .from('user_coupons')
    .select('*, coupon:coupons!inner(*)')
    .eq('user_id', userId)
    .is('used_at', null)
    .eq('coupon.shop_id', shopId)
    .eq('coupon.is_active', true)
    .lte('coupon.min_price', price)
    .gte('coupon.valid_until', new Date().toISOString());

  if (error) throw error;
  return data || [];
}

// ============================================
// Partner API (for shop owners)
// ============================================

/**
 * Fetch all coupons for partner's shop
 */
export async function fetchPartnerCoupons(shopId: string): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new coupon (partner only)
 */
export async function createCoupon(
  shopId: string,
  formData: CouponFormData
): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      shop_id: shopId,
      ...formData,
      is_active: true,
      used_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing coupon
 */
export async function updateCoupon(
  couponId: string,
  updates: Partial<CouponFormData> & { is_active?: boolean }
): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', couponId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(couponId: string): Promise<void> {
  const { error } = await supabase.from('coupons').delete().eq('id', couponId);

  if (error) throw error;
}

/**
 * Restore a used coupon (for refund scenarios)
 * Sets used_at to null and removes reservation_id
 */
export async function restoreCoupon(
  userCouponId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_coupons')
      .update({
        used_at: null,
        reservation_id: null,
      })
      .eq('id', userCouponId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Failed to restore coupon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '쿠폰 복구에 실패했습니다.',
    };
  }
}

/**
 * Get used coupon for a reservation
 */
export async function getUsedCouponForReservation(
  reservationId: string
): Promise<UserCoupon | null> {
  const { data, error } = await supabase
    .from('user_coupons')
    .select('*, coupon:coupons(*)')
    .eq('reservation_id', reservationId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

// ============================================
// Welcome Coupon API (for new users)
// ============================================

/**
 * 신규 가입 회원에게 환영 쿠폰 자동 지급
 * 5,000원 쿠폰 2개 지급 (총 10,000원 혜택)
 * @param userId - 사용자 ID
 * @returns 지급된 UserCoupon 배열 (이미 지급받은 경우 빈 배열)
 */
export async function grantWelcomeCoupons(userId: string): Promise<UserCoupon[]> {
  try {
    // 1. 이미 환영 쿠폰을 받았는지 확인
    const { data: existing, error: existingError } = await supabase
      .from('user_coupons')
      .select('id, coupon:coupons!inner(coupon_type)')
      .eq('user_id', userId)
      .eq('coupon.coupon_type', 'welcome');

    if (existingError) {
      console.error('Failed to check existing welcome coupons:', existingError);
      throw existingError;
    }

    if (existing && existing.length > 0) {
      console.log('User already has welcome coupons');
      return [];
    }

    // 2. 시스템 환영 쿠폰 조회 또는 생성 (5,000원)
    let { data: welcomeCoupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('coupon_type', 'welcome')
      .eq('is_system', true)
      .eq('is_active', true)
      .eq('discount_value', 5000)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Failed to fetch welcome coupon template:', fetchError);
      throw fetchError;
    }

    if (!welcomeCoupon) {
      // 쿠폰 템플릿 생성
      const { data: newCoupon, error: createError } = await supabase
        .from('coupons')
        .insert({
          name: '신규가입 환영 쿠폰',
          coupon_type: 'welcome',
          discount_type: 'fixed',
          discount_value: 5000,
          min_price: 0,
          is_active: true,
          is_system: true,
          shop_id: null,
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create welcome coupon template:', createError);
        throw createError;
      }
      welcomeCoupon = newCoupon;
    }

    // 3. 만료일 계산 (7일 후)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. 2개 쿠폰 지급
    const couponsToInsert = [
      {
        user_id: userId,
        coupon_id: welcomeCoupon.id,
        expires_at: expiresAt.toISOString(),
      },
      {
        user_id: userId,
        coupon_id: welcomeCoupon.id,
        expires_at: expiresAt.toISOString(),
      },
    ];

    const { data: userCoupons, error: insertError } = await supabase
      .from('user_coupons')
      .insert(couponsToInsert)
      .select('*, coupon:coupons(*)');

    if (insertError) {
      console.error('Failed to grant welcome coupons:', insertError);
      throw insertError;
    }

    console.log(`Granted ${userCoupons?.length || 0} welcome coupons to user ${userId}`);
    return userCoupons || [];
  } catch (error) {
    console.error('Error in grantWelcomeCoupons:', error);
    throw error;
  }
}
