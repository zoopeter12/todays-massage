-- ============================================================
-- Settlements (정산) Table Migration
-- Purpose: 파트너 정산 관리 시스템
-- Platform Fee: 10%
-- Includes: RLS policies, aggregate functions, indexes
-- ============================================================

-- =========================
-- 1. SETTLEMENTS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales BIGINT NOT NULL DEFAULT 0,
  platform_fee BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 동일 매장의 동일 정산 기간 중복 방지
  CONSTRAINT unique_shop_settlement_period UNIQUE (shop_id, period_start, period_end)
);

COMMENT ON TABLE settlements IS '파트너 정산 테이블 - 플랫폼 수수료 10%';
COMMENT ON COLUMN settlements.total_sales IS '총 매출액 (원)';
COMMENT ON COLUMN settlements.platform_fee IS '플랫폼 수수료 (10%)';
COMMENT ON COLUMN settlements.net_amount IS '정산 금액 (총 매출 - 수수료)';
COMMENT ON COLUMN settlements.status IS 'pending: 정산 대기, completed: 정산 완료';

-- =========================
-- 2. CUSTOMER NOTES TABLE (고객 메모)
-- =========================

CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  visit_count INT NOT NULL DEFAULT 0,
  total_spent BIGINT NOT NULL DEFAULT 0,
  last_visit TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 동일 매장 내 고객 전화번호 유니크
  CONSTRAINT unique_shop_customer UNIQUE (shop_id, customer_phone)
);

COMMENT ON TABLE customer_notes IS '매장별 고객 관리 메모';

-- =========================
-- 3. INDEXES
-- =========================

-- 정산 조회 최적화
CREATE INDEX IF NOT EXISTS idx_settlements_shop_id ON settlements(shop_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at DESC);

-- 고객 메모 조회 최적화
CREATE INDEX IF NOT EXISTS idx_customer_notes_shop_id ON customer_notes(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_phone ON customer_notes(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_notes_last_visit ON customer_notes(last_visit DESC);

-- =========================
-- 4. ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- 정산: 파트너는 자신의 매장 정산만 조회 가능
CREATE POLICY "settlements_select_own_shop" ON settlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = settlements.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- 정산: 시스템(서비스 역할)만 생성/수정 가능
CREATE POLICY "settlements_insert_service" ON settlements
  FOR INSERT WITH CHECK (
    -- service_role만 허용 (auth.uid()가 null인 경우)
    auth.uid() IS NULL
  );

CREATE POLICY "settlements_update_service" ON settlements
  FOR UPDATE USING (
    auth.uid() IS NULL
  ) WITH CHECK (
    auth.uid() IS NULL
  );

-- 고객 메모: 파트너는 자신의 매장 고객만 관리 가능
CREATE POLICY "customer_notes_select_own_shop" ON customer_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_notes.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "customer_notes_insert_own_shop" ON customer_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_notes.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "customer_notes_update_own_shop" ON customer_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_notes.shop_id
      AND shops.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_notes.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "customer_notes_delete_own_shop" ON customer_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customer_notes.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- =========================
-- 5. TRIGGERS
-- =========================

-- updated_at 자동 갱신 (settlements)
CREATE TRIGGER trigger_settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- updated_at 자동 갱신 (customer_notes)
CREATE TRIGGER trigger_customer_notes_updated_at
  BEFORE UPDATE ON customer_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 6. AGGREGATE FUNCTIONS (RPC)
-- =========================

-- 정산 생성 함수 (특정 기간의 예약 기반)
CREATE OR REPLACE FUNCTION generate_settlement(
  p_shop_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_platform_fee_rate NUMERIC DEFAULT 0.10
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_sales BIGINT;
  v_platform_fee BIGINT;
  v_net_amount BIGINT;
  v_settlement_id UUID;
BEGIN
  -- 완료된 예약의 총 매출 계산
  SELECT COALESCE(SUM(
    CASE
      WHEN c.price_discount IS NOT NULL THEN c.price_discount
      ELSE c.price_original
    END
  ), 0)
  INTO v_total_sales
  FROM reservations r
  JOIN courses c ON c.id = r.course_id
  WHERE r.shop_id = p_shop_id
    AND r.status = 'completed'
    AND r.date BETWEEN p_period_start AND p_period_end;

  -- 수수료 및 정산 금액 계산
  v_platform_fee := ROUND(v_total_sales * p_platform_fee_rate);
  v_net_amount := v_total_sales - v_platform_fee;

  -- 정산 레코드 생성 (이미 존재하면 업데이트)
  INSERT INTO settlements (
    shop_id, period_start, period_end,
    total_sales, platform_fee, net_amount, status
  )
  VALUES (
    p_shop_id, p_period_start, p_period_end,
    v_total_sales, v_platform_fee, v_net_amount, 'pending'
  )
  ON CONFLICT (shop_id, period_start, period_end)
  DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    platform_fee = EXCLUDED.platform_fee,
    net_amount = EXCLUDED.net_amount,
    updated_at = now()
  RETURNING id INTO v_settlement_id;

  RETURN v_settlement_id;
END;
$$;

COMMENT ON FUNCTION generate_settlement IS '특정 기간의 예약 매출을 집계하여 정산 레코드 생성';

-- 매출 통계 함수 (일별/주별/월별)
CREATE OR REPLACE FUNCTION get_sales_stats(
  p_shop_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily JSON;
  v_weekly JSON;
  v_monthly JSON;
  v_by_course JSON;
  v_by_hour JSON;
BEGIN
  -- 일별 통계
  SELECT json_agg(row_to_json(t))
  INTO v_daily
  FROM (
    SELECT
      r.date::TEXT as date,
      COALESCE(SUM(CASE WHEN c.price_discount IS NOT NULL THEN c.price_discount ELSE c.price_original END), 0) as amount,
      COUNT(*)::INT as count
    FROM reservations r
    JOIN courses c ON c.id = r.course_id
    WHERE r.shop_id = p_shop_id
      AND r.status = 'completed'
      AND r.date BETWEEN p_start_date AND p_end_date
    GROUP BY r.date
    ORDER BY r.date
  ) t;

  -- 주별 통계
  SELECT json_agg(row_to_json(t))
  INTO v_weekly
  FROM (
    SELECT
      TO_CHAR(date_trunc('week', r.date), 'IYYY-IW') as week,
      COALESCE(SUM(CASE WHEN c.price_discount IS NOT NULL THEN c.price_discount ELSE c.price_original END), 0) as amount,
      COUNT(*)::INT as count
    FROM reservations r
    JOIN courses c ON c.id = r.course_id
    WHERE r.shop_id = p_shop_id
      AND r.status = 'completed'
      AND r.date BETWEEN p_start_date AND p_end_date
    GROUP BY date_trunc('week', r.date)
    ORDER BY date_trunc('week', r.date)
  ) t;

  -- 월별 통계
  SELECT json_agg(row_to_json(t))
  INTO v_monthly
  FROM (
    SELECT
      TO_CHAR(date_trunc('month', r.date), 'YYYY-MM') as month,
      COALESCE(SUM(CASE WHEN c.price_discount IS NOT NULL THEN c.price_discount ELSE c.price_original END), 0) as amount,
      COUNT(*)::INT as count
    FROM reservations r
    JOIN courses c ON c.id = r.course_id
    WHERE r.shop_id = p_shop_id
      AND r.status = 'completed'
      AND r.date BETWEEN p_start_date AND p_end_date
    GROUP BY date_trunc('month', r.date)
    ORDER BY date_trunc('month', r.date)
  ) t;

  -- 코스별 통계
  SELECT json_agg(row_to_json(t))
  INTO v_by_course
  FROM (
    SELECT
      c.name,
      COALESCE(SUM(CASE WHEN c.price_discount IS NOT NULL THEN c.price_discount ELSE c.price_original END), 0) as amount,
      COUNT(*)::INT as count
    FROM reservations r
    JOIN courses c ON c.id = r.course_id
    WHERE r.shop_id = p_shop_id
      AND r.status = 'completed'
      AND r.date BETWEEN p_start_date AND p_end_date
    GROUP BY c.id, c.name
    ORDER BY amount DESC
  ) t;

  -- 시간대별 통계
  SELECT json_agg(row_to_json(t))
  INTO v_by_hour
  FROM (
    SELECT
      EXTRACT(HOUR FROM r.time)::INT as hour,
      COUNT(*)::INT as count
    FROM reservations r
    WHERE r.shop_id = p_shop_id
      AND r.status = 'completed'
      AND r.date BETWEEN p_start_date AND p_end_date
    GROUP BY EXTRACT(HOUR FROM r.time)
    ORDER BY hour
  ) t;

  RETURN json_build_object(
    'daily', COALESCE(v_daily, '[]'::JSON),
    'weekly', COALESCE(v_weekly, '[]'::JSON),
    'monthly', COALESCE(v_monthly, '[]'::JSON),
    'byCourse', COALESCE(v_by_course, '[]'::JSON),
    'byHour', COALESCE(v_by_hour, '[]'::JSON)
  );
END;
$$;

COMMENT ON FUNCTION get_sales_stats IS '매장의 매출 통계 조회 (일별/주별/월별/코스별/시간대별)';

-- 정산 완료 처리 함수
CREATE OR REPLACE FUNCTION complete_settlement(
  p_settlement_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE settlements
  SET
    status = 'completed',
    paid_at = now(),
    updated_at = now()
  WHERE id = p_settlement_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION complete_settlement IS '정산 완료 처리 (pending -> completed)';

-- 고객 방문 기록 업데이트 함수
CREATE OR REPLACE FUNCTION update_customer_visit(
  p_shop_id UUID,
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_amount BIGINT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_note_id UUID;
BEGIN
  INSERT INTO customer_notes (
    shop_id, customer_phone, customer_name,
    visit_count, total_spent, last_visit
  )
  VALUES (
    p_shop_id, p_customer_phone, p_customer_name,
    1, p_amount, now()
  )
  ON CONFLICT (shop_id, customer_phone)
  DO UPDATE SET
    customer_name = COALESCE(EXCLUDED.customer_name, customer_notes.customer_name),
    visit_count = customer_notes.visit_count + 1,
    total_spent = customer_notes.total_spent + p_amount,
    last_visit = now(),
    updated_at = now()
  RETURNING id INTO v_note_id;

  RETURN v_note_id;
END;
$$;

COMMENT ON FUNCTION update_customer_visit IS '고객 방문 시 자동으로 방문 기록 업데이트';
