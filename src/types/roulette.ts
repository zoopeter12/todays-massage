// 룰렛 보상 타입
export type RewardType = 'coupon' | 'points' | 'nothing';

// 룰렛 보상 설정
export interface RouletteReward {
  id: string;
  name: string;
  reward_type: RewardType;
  reward_value: number; // 포인트 양 또는 할인율
  probability: number; // 확률 (0-100, 전체 합이 100이어야 함)
  color: string; // 룰렛 색상
  coupon_id: string | null; // 쿠폰 보상일 경우 쿠폰 ID
  is_active: boolean;
  display_order: number;
  created_at: string;
  coupon?: {
    id: string;
    name: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
  };
}

// 룰렛 참여 기록
export interface RouletteHistory {
  id: string;
  user_id: string;
  reward_id: string;
  reward_type: RewardType;
  reward_value: number;
  reward_name: string;
  cost_points: number; // 추가 참여 시 소모된 포인트
  created_at: string;
  reward?: RouletteReward;
}

// 룰렛 참여 가능 상태
export interface RouletteEligibility {
  canSpin: boolean;
  freeSpinAvailable: boolean;
  nextFreeSpinAt: string | null;
  todaySpinCount: number;
  pointCost: number; // 추가 참여 비용
  userPoints: number;
}

// 룰렛 결과
export interface SpinResult {
  success: boolean;
  reward: RouletteReward | null;
  message: string;
  newPointBalance?: number;
  couponGranted?: boolean;
}

// 관리자용 보상 설정 폼
export interface RouletteRewardFormData {
  name: string;
  reward_type: RewardType;
  reward_value: number;
  probability: number;
  color: string;
  coupon_id: string | null;
  is_active: boolean;
  display_order: number;
}
