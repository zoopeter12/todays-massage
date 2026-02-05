-- ============================================================
-- Point History Migration
-- 포인트 적립/사용/만료 내역 관리 테이블
-- Includes: Enum type, Table, Indexes, RLS policies, Functions
-- ============================================================

-- =========================
-- 1. ENUM TYPE
-- =========================

-- 포인트 유형: earn(적립), use(사용), expire(만료), bonus(보너스)
CREATE TYPE point_type AS ENUM ('earn', 'use', 'expire', 'bonus');

-- =========================
-- 2. TABLE
-- =========================

CREATE TABLE IF NOT EXISTS point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 참조 (profiles 테이블 외래키)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 포인트 금액 (양수: 적립/보너스, 음수: 사용/만료)
  amount INTEGER NOT NULL,

  -- 포인트 유형
  type point_type NOT NULL,

  -- 설명 (적립 사유, 사용처 등)
  description TEXT NOT NULL DEFAULT '',

  -- 연관 예약 (예약 완료 시 포인트 적립 등)
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,

  -- 포인트 만료일 (적립 시점 + 12개월)
  expired_at TIMESTAMPTZ,

  -- 생성일시
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 제약조건: 적립/보너스는 양수, 사용/만료는 음수
  CONSTRAINT check_amount_sign CHECK (
    (type IN ('earn', 'bonus') AND amount > 0) OR
    (type IN ('use', 'expire') AND amount < 0)
  ),

  -- 제약조건: 적립/보너스 포인트는 만료일 필수
  CONSTRAINT check_expired_at CHECK (
    (type IN ('earn', 'bonus') AND expired_at IS NOT NULL) OR
    (type IN ('use', 'expire') AND expired_at IS NULL)
  )
);

-- 테이블 코멘트
COMMENT ON TABLE point_history IS '포인트 적립/사용/만료 내역';
COMMENT ON COLUMN point_history.amount IS '포인트 금액 (양수: 적립, 음수: 사용/만료)';
COMMENT ON COLUMN point_history.expired_at IS '포인트 만료일 (적립 시점 + 12개월)';

-- =========================
-- 3. INDEXES
-- =========================

-- 사용자별 포인트 조회 (가장 빈번한 쿼리)
CREATE INDEX idx_point_history_user_id ON point_history(user_id);

-- 사용자별 최근 내역 조회 (내림차순)
CREATE INDEX idx_point_history_user_created ON point_history(user_id, created_at DESC);

-- 포인트 유형별 조회
CREATE INDEX idx_point_history_type ON point_history(type);

-- 만료 대상 포인트 조회 (배치 처리용)
CREATE INDEX idx_point_history_expired_at ON point_history(expired_at)
  WHERE type IN ('earn', 'bonus') AND expired_at IS NOT NULL;

-- 예약 연관 포인트 조회
CREATE INDEX idx_point_history_reservation_id ON point_history(reservation_id)
  WHERE reservation_id IS NOT NULL;

-- =========================
-- 4. ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 포인트 내역만 조회 가능
CREATE POLICY "point_history_select_own" ON point_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 인증된 사용자만 삽입 가능 (서버사이드 로직용)
-- 주의: 실제 운영에서는 service_role만 삽입 가능하도록 제한 권장
CREATE POLICY "point_history_insert_authenticated" ON point_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: 포인트 내역은 수정 불가 (감사 추적 목적)
-- 정책 없음 = UPDATE 불가

-- DELETE: 포인트 내역은 삭제 불가 (감사 추적 목적)
-- 정책 없음 = DELETE 불가

-- 관리자용 전체 조회 정책 (role = 'admin')
CREATE POLICY "point_history_select_admin" ON point_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 관리자용 삽입 정책
CREATE POLICY "point_history_insert_admin" ON point_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =========================
-- 5. FUNCTIONS
-- =========================

-- 5.1 사용자별 포인트 잔액 조회 함수
CREATE OR REPLACE FUNCTION get_point_balance(p_user_id UUID)
RETURNS TABLE (
  total_earned BIGINT,
  total_used BIGINT,
  total_expired BIGINT,
  total_bonus BIGINT,
  available BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN ph.type = 'earn' THEN ph.amount ELSE 0 END), 0)::BIGINT AS total_earned,
    COALESCE(SUM(CASE WHEN ph.type = 'use' THEN ABS(ph.amount) ELSE 0 END), 0)::BIGINT AS total_used,
    COALESCE(SUM(CASE WHEN ph.type = 'expire' THEN ABS(ph.amount) ELSE 0 END), 0)::BIGINT AS total_expired,
    COALESCE(SUM(CASE WHEN ph.type = 'bonus' THEN ph.amount ELSE 0 END), 0)::BIGINT AS total_bonus,
    COALESCE(SUM(ph.amount), 0)::BIGINT AS available
  FROM point_history ph
  WHERE ph.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.2 사용 가능한 포인트만 조회 (만료되지 않은 적립 포인트)
CREATE OR REPLACE FUNCTION get_available_points(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_available BIGINT;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_available
  FROM point_history
  WHERE user_id = p_user_id;

  RETURN v_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.3 포인트 적립 함수 (12개월 유효기간 자동 설정)
CREATE OR REPLACE FUNCTION earn_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reservation_id UUID DEFAULT NULL,
  p_type point_type DEFAULT 'earn'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_expired_at TIMESTAMPTZ;
BEGIN
  -- 유효성 검사
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive for earning points';
  END IF;

  IF p_type NOT IN ('earn', 'bonus') THEN
    RAISE EXCEPTION 'Type must be earn or bonus for earning points';
  END IF;

  -- 만료일 계산 (12개월 후)
  v_expired_at := now() + INTERVAL '12 months';

  INSERT INTO point_history (user_id, amount, type, description, reservation_id, expired_at)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reservation_id, v_expired_at)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 포인트 사용 함수
CREATE OR REPLACE FUNCTION use_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reservation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_available BIGINT;
BEGIN
  -- 유효성 검사
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive for using points';
  END IF;

  -- 잔액 확인
  SELECT get_available_points(p_user_id) INTO v_available;

  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient points. Available: %, Requested: %', v_available, p_amount;
  END IF;

  -- 포인트 사용 (음수로 저장)
  INSERT INTO point_history (user_id, amount, type, description, reservation_id, expired_at)
  VALUES (p_user_id, -p_amount, 'use', p_description, p_reservation_id, NULL)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 만료 포인트 처리 함수 (배치 작업용)
CREATE OR REPLACE FUNCTION process_expired_points()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
  v_expired_amount BIGINT;
BEGIN
  -- 만료일이 지난 적립 포인트가 있는 사용자별로 처리
  FOR v_user IN
    SELECT DISTINCT user_id
    FROM point_history
    WHERE type IN ('earn', 'bonus')
    AND expired_at < now()
    AND expired_at > now() - INTERVAL '1 day' -- 오늘 만료된 것만
  LOOP
    -- 해당 사용자의 만료 포인트 합계 계산
    SELECT COALESCE(SUM(amount), 0)
    INTO v_expired_amount
    FROM point_history
    WHERE user_id = v_user.user_id
    AND type IN ('earn', 'bonus')
    AND expired_at < now()
    AND expired_at > now() - INTERVAL '1 day';

    -- 만료 기록 생성
    IF v_expired_amount > 0 THEN
      INSERT INTO point_history (user_id, amount, type, description, expired_at)
      VALUES (
        v_user.user_id,
        -v_expired_amount,
        'expire',
        '포인트 유효기간 만료',
        NULL
      );

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- 6. GRANT PERMISSIONS
-- =========================

-- RPC 함수 권한 설정
GRANT EXECUTE ON FUNCTION get_point_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION earn_points(UUID, INTEGER, TEXT, UUID, point_type) TO authenticated;
GRANT EXECUTE ON FUNCTION use_points(UUID, INTEGER, TEXT, UUID) TO authenticated;
-- process_expired_points는 service_role만 실행 가능 (기본값)
