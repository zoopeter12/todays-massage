-- ============================================================
-- Migration: 042_add_coupon_system_fields.sql
-- Description: Extend coupons table with system coupon fields
-- Adds: coupon_type, is_system, makes shop_id nullable
-- ============================================================

-- =========================
-- 1. ADD NEW COLUMNS
-- =========================

-- 쿠폰 타입 (welcome: 가입, referral: 추천, event: 이벤트, shop: 매장)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'shop';
COMMENT ON COLUMN coupons.coupon_type IS '쿠폰 타입 (welcome: 가입환영, referral: 친구추천, event: 이벤트, shop: 매장쿠폰)';

-- coupon_type CHECK 제약조건 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'coupons_coupon_type_check'
    AND conrelid = 'coupons'::regclass
  ) THEN
    ALTER TABLE coupons ADD CONSTRAINT coupons_coupon_type_check
      CHECK (coupon_type IN ('welcome', 'referral', 'event', 'shop'));
  END IF;
END $$;

-- 시스템 쿠폰 여부 (true: 플랫폼 발행, false: 매장 발행)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN coupons.is_system IS '시스템 쿠폰 여부 (true: 플랫폼 발행, false: 매장 발행)';

-- =========================
-- 2. MODIFY shop_id TO NULLABLE
-- =========================

-- 기존 NOT NULL 제약조건 제거 (시스템 쿠폰은 shop_id가 NULL일 수 있음)
ALTER TABLE coupons ALTER COLUMN shop_id DROP NOT NULL;
COMMENT ON COLUMN coupons.shop_id IS '매장 ID (시스템 쿠폰은 NULL, 매장 쿠폰은 필수)';

-- shop_id와 is_system의 일관성 체크 제약조건
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'coupons_shop_system_consistency'
    AND conrelid = 'coupons'::regclass
  ) THEN
    ALTER TABLE coupons ADD CONSTRAINT coupons_shop_system_consistency
      CHECK (
        -- 시스템 쿠폰은 shop_id가 NULL이어야 함
        (is_system = TRUE AND shop_id IS NULL) OR
        -- 매장 쿠폰은 shop_id가 필수
        (is_system = FALSE AND shop_id IS NOT NULL) OR
        -- 기본값 (기존 데이터 호환)
        (is_system IS NULL)
      );
  END IF;
END $$;

-- =========================
-- 3. UPDATE EXISTING DATA
-- =========================

-- 기존 데이터에 기본값 적용
UPDATE coupons SET coupon_type = 'shop' WHERE coupon_type IS NULL;
UPDATE coupons SET is_system = FALSE WHERE is_system IS NULL;

-- =========================
-- 4. INDEXES
-- =========================

-- 쿠폰 타입별 조회
CREATE INDEX IF NOT EXISTS idx_coupons_coupon_type ON coupons(coupon_type);

-- 시스템 쿠폰 조회
CREATE INDEX IF NOT EXISTS idx_coupons_is_system ON coupons(is_system) WHERE is_system = TRUE;

-- 시스템 쿠폰 타입별 조회 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_system_type ON coupons(coupon_type, is_system) WHERE is_system = TRUE;

-- =========================
-- 5. UPDATE RLS POLICIES
-- =========================

-- 기존 정책에 시스템 쿠폰 조회 허용 추가
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT
  USING (
    is_active = TRUE
    AND valid_until >= NOW()
  );

-- 관리자는 모든 쿠폰 관리 가능
DROP POLICY IF EXISTS "Admins can manage all coupons" ON coupons;
CREATE POLICY "Admins can manage all coupons" ON coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =========================
-- 6. HELPER FUNCTIONS
-- =========================

-- 시스템 쿠폰 생성 함수 (관리자용)
CREATE OR REPLACE FUNCTION create_system_coupon(
  p_name TEXT,
  p_coupon_type TEXT,
  p_discount_type TEXT,
  p_discount_value INTEGER,
  p_min_price INTEGER DEFAULT 0,
  p_max_discount INTEGER DEFAULT NULL,
  p_usage_limit INTEGER DEFAULT NULL,
  p_valid_days INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_coupon_id UUID;
BEGIN
  -- 호출자가 관리자인지 확인
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can create system coupons';
  END IF;

  -- 쿠폰 타입 검증
  IF p_coupon_type NOT IN ('welcome', 'referral', 'event') THEN
    RAISE EXCEPTION 'System coupon type must be welcome, referral, or event';
  END IF;

  -- 시스템 쿠폰 생성
  INSERT INTO coupons (
    shop_id, name, coupon_type, is_system,
    discount_type, discount_value, min_price, max_discount,
    usage_limit, valid_from, valid_until, is_active
  ) VALUES (
    NULL, -- 시스템 쿠폰은 shop_id NULL
    p_name,
    p_coupon_type,
    TRUE, -- is_system = true
    p_discount_type,
    p_discount_value,
    p_min_price,
    p_max_discount,
    p_usage_limit,
    NOW(),
    NOW() + (p_valid_days || ' days')::INTERVAL,
    TRUE
  )
  RETURNING id INTO v_coupon_id;

  RETURN v_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_system_coupon IS '시스템 쿠폰 생성 함수 (관리자 전용)';

-- 가입 환영 쿠폰 자동 발급 함수
CREATE OR REPLACE FUNCTION issue_welcome_coupon(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_welcome_coupon_id UUID;
  v_user_coupon_id UUID;
BEGIN
  -- 활성화된 가입 환영 쿠폰 찾기
  SELECT id INTO v_welcome_coupon_id
  FROM coupons
  WHERE coupon_type = 'welcome'
    AND is_system = TRUE
    AND is_active = TRUE
    AND valid_until >= NOW()
    AND (usage_limit IS NULL OR used_count < usage_limit)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_welcome_coupon_id IS NULL THEN
    RETURN NULL; -- 발급 가능한 쿠폰 없음
  END IF;

  -- 이미 받은 적 있는지 확인
  IF EXISTS (
    SELECT 1 FROM user_coupons
    WHERE user_id = p_user_id
    AND coupon_id = v_welcome_coupon_id
  ) THEN
    RETURN NULL; -- 이미 발급됨
  END IF;

  -- 쿠폰 발급
  INSERT INTO user_coupons (user_id, coupon_id)
  VALUES (p_user_id, v_welcome_coupon_id)
  RETURNING id INTO v_user_coupon_id;

  RETURN v_user_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION issue_welcome_coupon IS '신규 가입자에게 환영 쿠폰 자동 발급';

-- 추천인/피추천인 쿠폰 발급 함수
CREATE OR REPLACE FUNCTION issue_referral_coupon(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_referral_coupon_id UUID;
  v_user_coupon_id UUID;
BEGIN
  -- 활성화된 추천 쿠폰 찾기
  SELECT id INTO v_referral_coupon_id
  FROM coupons
  WHERE coupon_type = 'referral'
    AND is_system = TRUE
    AND is_active = TRUE
    AND valid_until >= NOW()
    AND (usage_limit IS NULL OR used_count < usage_limit)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_referral_coupon_id IS NULL THEN
    RETURN NULL; -- 발급 가능한 쿠폰 없음
  END IF;

  -- 쿠폰 발급
  INSERT INTO user_coupons (user_id, coupon_id)
  VALUES (p_user_id, v_referral_coupon_id)
  ON CONFLICT (user_id, coupon_id) DO NOTHING
  RETURNING id INTO v_user_coupon_id;

  RETURN v_user_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION issue_referral_coupon IS '추천인/피추천인에게 추천 쿠폰 발급';

-- =========================
-- 7. DOCUMENTATION
-- =========================

COMMENT ON TABLE coupons IS '쿠폰 테이블 - 매장 쿠폰 및 시스템 쿠폰 (가입/추천/이벤트)';
