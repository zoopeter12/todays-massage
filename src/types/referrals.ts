/**
 * Referral System Type Definitions
 */

export type ReferralStatus = 'pending' | 'completed' | 'expired';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: ReferralStatus;
  referrer_reward_points: number | null;
  referred_reward_points: number | null;
  referrer_reward_granted_at: string | null;
  referred_reward_granted_at: string | null;
  first_reservation_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ReferralInsert {
  referrer_id: string;
  referred_id: string;
  status?: ReferralStatus;
}

export interface ReferralWithUser extends Referral {
  referred_user: {
    id: string;
    nickname: string | null;
    phone: string | null;
  };
}

export interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_rewards_earned: number;
}

export interface ReferralCodeInfo {
  referral_code: string;
  referral_count: number;
}

// Reward configuration
export const REFERRAL_REWARDS = {
  REFERRER_POINTS: 5000, // Points for the person who invited
  REFERRED_POINTS: 3000, // Points for the invited person
  MAX_REFERRALS: 50, // Maximum referrals per user
} as const;
