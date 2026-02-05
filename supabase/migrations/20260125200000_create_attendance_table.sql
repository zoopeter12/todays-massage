-- ============================================================
-- Attendance Check Migration
-- 출석체크 테이블 및 연속 출석 보너스 시스템
-- Includes: Table, Indexes, RLS policies, Functions
-- ============================================================

-- =========================
-- 1. TABLE
-- =========================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 참조 (profiles 테이블 외래키)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 출석 날짜 (DATE 타입으로 1일 1회 제한 용이)
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 기본 적립 포인트
  base_points INTEGER NOT NULL DEFAULT 10,

  -- 연속 출석일 (1일차부터 시작)
  streak_days INTEGER NOT NULL DEFAULT 1,

  -- 연속 출석 보너스 포인트
  bonus_points INTEGER NOT NULL DEFAULT 0,

  -- 총 적립 포인트 (base + bonus)
  total_points INTEGER NOT NULL GENERATED ALWAYS AS (base_points + bonus_points) STORED,

  -- 생성일시
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 제약조건: 사용자별 날짜 고유 (1일 1회 제한)
  CONSTRAINT unique_user_date UNIQUE (user_id, check_date),

  -- 제약조건: 포인트는 양수
  CONSTRAINT check_positive_points CHECK (base_points > 0 AND bonus_points >= 0),

  -- 제약조건: 연속일은 1 이상
  CONSTRAINT check_positive_streak CHECK (streak_days >= 1)
);

-- 테이블 코멘트
COMMENT ON TABLE attendance IS '사용자 출석체크 내역';
COMMENT ON COLUMN attendance.check_date IS '출석 날짜 (1일 1회)';
COMMENT ON COLUMN attendance.streak_days IS '연속 출석일 (1~)';
COMMENT ON COLUMN attendance.bonus_points IS '연속 출석 보너스 (7일, 14일, 30일 등)';

-- =========================
-- 2. INDEXES
-- =========================

-- 사용자별 출석 조회 (가장 빈번한 쿼리)
CREATE INDEX idx_attendance_user_id ON attendance(user_id);

-- 사용자별 최근 출석 조회 (내림차순)
CREATE INDEX idx_attendance_user_date ON attendance(user_id, check_date DESC);

-- 특정 날짜 출석 조회 (통계용)
CREATE INDEX idx_attendance_date ON attendance(check_date);

-- 연속 출석일 통계 (리더보드용)
CREATE INDEX idx_attendance_streak ON attendance(streak_days DESC);

-- =========================
-- 3. ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 출석 내역만 조회 가능
CREATE POLICY "attendance_select_own" ON attendance
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 본인 출석만 등록 가능 (오늘 날짜만)
CREATE POLICY "attendance_insert_own" ON attendance
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND check_date = CURRENT_DATE
  );

-- UPDATE/DELETE: 출석 기록은 수정/삭제 불가 (감사 추적)
-- 정책 없음 = 불가

-- 관리자용 전체 조회 정책
CREATE POLICY "attendance_select_admin" ON attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =========================
-- 4. FUNCTIONS
-- =========================

-- 4.1 연속 출석 보너스 계산 함수
CREATE OR REPLACE FUNCTION calculate_streak_bonus(p_streak_days INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- 연속 출석 보너스 규칙
  -- 7일 연속: 50P
  -- 14일 연속: 100P
  -- 21일 연속: 150P
  -- 30일 연속: 300P
  -- 그 외: 0P
  RETURN CASE
    WHEN p_streak_days = 30 THEN 300
    WHEN p_streak_days = 21 THEN 150
    WHEN p_streak_days = 14 THEN 100
    WHEN p_streak_days = 7 THEN 50
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4.2 출석체크 함수 (트랜잭션 보장)
CREATE OR REPLACE FUNCTION check_attendance(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attendance_id UUID,
  streak_days INTEGER,
  base_points INTEGER,
  bonus_points INTEGER,
  total_points INTEGER,
  is_already_checked BOOLEAN
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_existing_id UUID;
  v_last_streak INTEGER := 0;
  v_new_streak INTEGER;
  v_base INTEGER := 10;
  v_bonus INTEGER;
  v_new_id UUID;
BEGIN
  -- 오늘 이미 출석했는지 확인
  SELECT a.id INTO v_existing_id
  FROM attendance a
  WHERE a.user_id = p_user_id AND a.check_date = v_today;

  IF v_existing_id IS NOT NULL THEN
    -- 이미 출석한 경우, 기존 정보 반환
    RETURN QUERY
    SELECT
      TRUE,
      '이미 오늘 출석체크를 완료했습니다.'::TEXT,
      a.id,
      a.streak_days,
      a.base_points,
      a.bonus_points,
      a.base_points + a.bonus_points,
      TRUE
    FROM attendance a
    WHERE a.id = v_existing_id;
    RETURN;
  END IF;

  -- 어제 출석 기록 확인 (연속 출석 계산)
  SELECT a.streak_days INTO v_last_streak
  FROM attendance a
  WHERE a.user_id = p_user_id AND a.check_date = v_yesterday;

  -- 연속 출석일 계산
  IF v_last_streak IS NOT NULL THEN
    v_new_streak := v_last_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- 연속 출석 보너스 계산
  v_bonus := calculate_streak_bonus(v_new_streak);

  -- 출석 기록 생성
  INSERT INTO attendance (user_id, check_date, base_points, streak_days, bonus_points)
  VALUES (p_user_id, v_today, v_base, v_new_streak, v_bonus)
  RETURNING id INTO v_new_id;

  -- 포인트 적립 (point_history에 기록)
  PERFORM earn_points(
    p_user_id,
    v_base + v_bonus,
    CASE
      WHEN v_bonus > 0 THEN
        format('출석체크 %s일차 (+%sP 연속 출석 보너스)', v_new_streak, v_bonus)
      ELSE
        format('출석체크 %s일차', v_new_streak)
    END,
    NULL,
    'bonus'
  );

  RETURN QUERY
  SELECT
    TRUE,
    CASE
      WHEN v_bonus > 0 THEN
        format('출석체크 완료! %s일 연속 출석 보너스 %sP 추가 적립!', v_new_streak, v_bonus)::TEXT
      ELSE
        format('출석체크 완료! %s일차 출석입니다.', v_new_streak)::TEXT
    END,
    v_new_id,
    v_new_streak,
    v_base,
    v_bonus,
    v_base + v_bonus,
    FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 사용자의 월별 출석 현황 조회 함수
CREATE OR REPLACE FUNCTION get_monthly_attendance(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  check_date DATE,
  streak_days INTEGER,
  total_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.check_date,
    a.streak_days,
    a.base_points + a.bonus_points AS total_points
  FROM attendance a
  WHERE a.user_id = p_user_id
    AND EXTRACT(YEAR FROM a.check_date) = p_year
    AND EXTRACT(MONTH FROM a.check_date) = p_month
  ORDER BY a.check_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.4 사용자의 출석 통계 조회 함수
CREATE OR REPLACE FUNCTION get_attendance_stats(p_user_id UUID)
RETURNS TABLE (
  total_days INTEGER,
  current_streak INTEGER,
  max_streak INTEGER,
  total_points_earned BIGINT,
  this_month_days INTEGER
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_first_of_month DATE := date_trunc('month', v_today)::DATE;
BEGIN
  RETURN QUERY
  WITH streak_calc AS (
    SELECT
      a.check_date,
      a.streak_days,
      a.base_points + a.bonus_points AS pts
    FROM attendance a
    WHERE a.user_id = p_user_id
    ORDER BY a.check_date DESC
  ),
  current AS (
    SELECT
      CASE
        WHEN EXISTS (SELECT 1 FROM streak_calc WHERE check_date = v_today)
          THEN (SELECT streak_days FROM streak_calc WHERE check_date = v_today)
        WHEN EXISTS (SELECT 1 FROM streak_calc WHERE check_date = v_today - INTERVAL '1 day')
          THEN (SELECT streak_days FROM streak_calc WHERE check_date = v_today - INTERVAL '1 day')
        ELSE 0
      END AS curr_streak
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM streak_calc),
    (SELECT curr_streak::INTEGER FROM current),
    (SELECT COALESCE(MAX(streak_days), 0)::INTEGER FROM streak_calc),
    (SELECT COALESCE(SUM(pts), 0)::BIGINT FROM streak_calc),
    (SELECT COUNT(*)::INTEGER FROM streak_calc WHERE check_date >= v_first_of_month);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.5 오늘 출석 여부 확인 함수
CREATE OR REPLACE FUNCTION has_checked_today(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM attendance
    WHERE user_id = p_user_id AND check_date = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =========================
-- 5. GRANT PERMISSIONS
-- =========================

-- RPC 함수 권한 설정
GRANT EXECUTE ON FUNCTION calculate_streak_bonus(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_attendance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_attendance(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_checked_today(UUID) TO authenticated;
