-- =============================================
-- 룰렛 이벤트 시스템 테이블 마이그레이션
-- 생성일: 2026-01-25
-- =============================================

-- 룰렛 보상 설정 테이블
CREATE TABLE IF NOT EXISTS roulette_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('coupon', 'points', 'nothing')),
  reward_value INTEGER NOT NULL DEFAULT 0,
  probability DECIMAL(5, 2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
  color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 룰렛 참여 기록 테이블
CREATE TABLE IF NOT EXISTS roulette_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES roulette_rewards(id) ON DELETE SET NULL,
  reward_type VARCHAR(20) NOT NULL,
  reward_value INTEGER NOT NULL DEFAULT 0,
  reward_name VARCHAR(100) NOT NULL,
  cost_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_roulette_rewards_active
  ON roulette_rewards(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_roulette_history_user_id
  ON roulette_history(user_id);

CREATE INDEX IF NOT EXISTS idx_roulette_history_created_at
  ON roulette_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_roulette_history_user_date
  ON roulette_history(user_id, created_at);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_roulette_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_roulette_rewards_updated_at ON roulette_rewards;
CREATE TRIGGER trigger_roulette_rewards_updated_at
  BEFORE UPDATE ON roulette_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_roulette_rewards_updated_at();

-- RLS (Row Level Security) 정책
ALTER TABLE roulette_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE roulette_history ENABLE ROW LEVEL SECURITY;

-- 룰렛 보상: 모든 사용자가 활성화된 보상 조회 가능
CREATE POLICY "Anyone can view active roulette rewards"
  ON roulette_rewards FOR SELECT
  USING (is_active = true);

-- 룰렛 보상: 관리자만 수정 가능
CREATE POLICY "Only admins can manage roulette rewards"
  ON roulette_rewards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 룰렛 기록: 본인 기록만 조회 가능
CREATE POLICY "Users can view own roulette history"
  ON roulette_history FOR SELECT
  USING (user_id = auth.uid());

-- 룰렛 기록: 본인 기록만 삽입 가능
CREATE POLICY "Users can insert own roulette history"
  ON roulette_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- 초기 보상 데이터 삽입 (샘플)
-- =============================================
INSERT INTO roulette_rewards (name, reward_type, reward_value, probability, color, display_order) VALUES
  ('500P 적립', 'points', 500, 15, '#f59e0b', 1),
  ('100P 적립', 'points', 100, 25, '#10b981', 2),
  ('50P 적립', 'points', 50, 30, '#3b82f6', 3),
  ('1000P 대박!', 'points', 1000, 5, '#ef4444', 4),
  ('꽝', 'nothing', 0, 15, '#6b7280', 5),
  ('200P 적립', 'points', 200, 10, '#8b5cf6', 6)
ON CONFLICT DO NOTHING;

-- =============================================
-- 확인용 주석
-- =============================================
COMMENT ON TABLE roulette_rewards IS '룰렛 이벤트 보상 설정 테이블';
COMMENT ON TABLE roulette_history IS '룰렛 이벤트 참여 기록 테이블';
COMMENT ON COLUMN roulette_rewards.probability IS '당첨 확률 (0-100%), 전체 합이 100이 되어야 함';
COMMENT ON COLUMN roulette_rewards.color IS '룰렛 세그먼트 색상 (HEX)';
COMMENT ON COLUMN roulette_history.cost_points IS '추가 참여 시 소모된 포인트 (무료 참여는 0)';
