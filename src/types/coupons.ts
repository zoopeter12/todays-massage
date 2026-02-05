export interface Coupon {
  id: string;
  shop_id: string;
  name: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_price: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  shop?: { name: string };
}

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  used_at: string | null;
  reservation_id: string | null;
  created_at: string;
  coupon?: Coupon;
}

export interface CouponFormData {
  name: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_price: number;
  max_discount: number | null;
  usage_limit: number | null;
  valid_from: string;
  valid_until: string;
}
