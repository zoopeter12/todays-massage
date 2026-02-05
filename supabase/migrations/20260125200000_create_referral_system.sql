-- ============================================================
-- Referral System Migration
-- Tables: referrals
-- Adds: referral_code to profiles, reward tracking
-- ============================================================

-- =========================
-- 1. ADD REFERRAL CODE TO PROFILES
-- =========================

-- Add referral_code column to profiles (unique code for each user)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0;

-- Create index for referral_code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- =========================
-- 2. REFERRALS TABLE
-- =========================

-- referrals: tracks referral relationships and rewards
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
  referrer_reward_points INT,
  referred_reward_points INT,
  referrer_reward_granted_at TIMESTAMPTZ,
  referred_reward_granted_at TIMESTAMPTZ,
  first_reservation_id UUID REFERENCES reservations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Each user can only be referred once
  CONSTRAINT unique_referred_user UNIQUE (referred_id),
  -- Prevent self-referral
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- =========================
-- 3. INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- =========================
-- 4. ROW LEVEL SECURITY
-- =========================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Development-phase policies: allow all operations
CREATE POLICY "referrals_select_all" ON referrals
  FOR SELECT USING (true);
CREATE POLICY "referrals_insert_all" ON referrals
  FOR INSERT WITH CHECK (true);
CREATE POLICY "referrals_update_all" ON referrals
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "referrals_delete_all" ON referrals
  FOR DELETE USING (true);

-- =========================
-- 5. FUNCTION: Generate Unique Referral Code
-- =========================

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_count INT;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) for 8));

    -- Check if code already exists
    SELECT COUNT(*) INTO exists_count FROM profiles WHERE referral_code = code;

    -- Exit loop if code is unique
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- 6. TRIGGER: Auto-generate referral code on profile creation
-- =========================

CREATE OR REPLACE FUNCTION set_referral_code_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_referral_code ON profiles;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code_on_insert();

-- =========================
-- 7. UPDATE EXISTING PROFILES WITH REFERRAL CODES
-- =========================

UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- =========================
-- 8. FUNCTION: Process Referral Reward on First Completed Reservation
-- =========================

CREATE OR REPLACE FUNCTION process_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
  referrer_reward INT := 5000; -- 5,000 points for referrer
  referred_reward INT := 3000; -- 3,000 points for referred
  expiry_date TIMESTAMPTZ;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Find pending referral for this user
    SELECT * INTO referral_record
    FROM referrals
    WHERE referred_id = NEW.user_id
      AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
      -- Calculate expiry date (12 months from now)
      expiry_date := now() + interval '12 months';

      -- Grant reward to referrer
      INSERT INTO point_history (user_id, amount, type, description, reservation_id, expired_at)
      VALUES (referral_record.referrer_id, referrer_reward, 'bonus',
              '친구 초대 보상 (추천인)', NEW.id, expiry_date);

      -- Grant reward to referred user
      INSERT INTO point_history (user_id, amount, type, description, reservation_id, expired_at)
      VALUES (referral_record.referred_id, referred_reward, 'bonus',
              '친구 초대 보상 (피추천인)', NEW.id, expiry_date);

      -- Update referral record
      UPDATE referrals
      SET status = 'completed',
          referrer_reward_points = referrer_reward,
          referred_reward_points = referred_reward,
          referrer_reward_granted_at = now(),
          referred_reward_granted_at = now(),
          first_reservation_id = NEW.id,
          completed_at = now()
      WHERE id = referral_record.id;

      -- Increment referrer's referral count
      UPDATE profiles
      SET referral_count = referral_count + 1
      WHERE id = referral_record.referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_process_referral_reward ON reservations;
CREATE TRIGGER trigger_process_referral_reward
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION process_referral_reward();
