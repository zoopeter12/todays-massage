export type PointType = 'earn' | 'use' | 'expire' | 'bonus' | 'refund';

export interface PointHistory {
  id: string;
  user_id: string;
  amount: number; // 양수: 적립, 음수: 사용
  type: PointType;
  description: string;
  reservation_id: string | null;
  created_at: string;
  expired_at: string | null;
}

export interface PointBalance {
  total_earned: number;
  total_used: number;
  total_expired: number;
  available: number;
}

export interface PointEarnCalculation {
  amount: number;
  rate: number;
  description: string;
}
