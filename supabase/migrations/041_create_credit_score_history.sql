-- ============================================================
-- Migration: 041_create_credit_score_history.sql
-- Description: Create credit_score_history table for tracking score changes
-- Tracks all credit score changes with reasons and references
-- ============================================================

-- =========================
-- 1. CREATE TABLE
-- =========================

CREATE TABLE IF NOT EXISTS credit_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 대상 사용자
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 점수 변동량 (양수: 증가, 음수: 감소)
  delta INTEGER NOT NULL,

  -- 변동 전 점수
  previous_score INTEGER NOT NULL,

  -- 변동 후 점수
  new_score INTEGER NOT NULL,

  -- 변동 사유
  reason TEXT NOT NULL,

  -- 관련 엔티티 타입 (reservation, report, manual 등)
  reference_type TEXT,

  -- 관련 엔티티 ID
  reference_id UUID,

  -- 처리자 (관리자가 수동 조정한 경우)
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- 생성 시각
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE credit_score_history IS '신용점수 변동 이력 - 모든 점수 변경 사항 기록';
COMMENT ON COLUMN credit_score_history.user_id IS '대상 사용자 ID';
COMMENT ON COLUMN credit_score_history.delta IS '점수 변동량 (양수: 증가, 음수: 감소)';
COMMENT ON COLUMN credit_score_history.previous_score IS '변동 전 점수';
COMMENT ON COLUMN credit_score_history.new_score IS '변동 후 점수';
COMMENT ON COLUMN credit_score_history.reason IS '변동 사유 (noshow, cancel, complete, manual_adjust 등)';
COMMENT ON COLUMN credit_score_history.reference_type IS '관련 엔티티 타입 (reservation, report, manual)';
COMMENT ON COLUMN credit_score_history.reference_id IS '관련 엔티티 ID';
COMMENT ON COLUMN credit_score_history.processed_by IS '처리자 ID (수동 조정 시)';

-- =========================
-- 2. INDEXES
-- =========================

-- 사용자별 이력 조회
CREATE INDEX IF NOT EXISTS idx_credit_score_history_user_id
  ON credit_score_history(user_id);

-- 시간순 정렬
CREATE INDEX IF NOT EXISTS idx_credit_score_history_created_at
  ON credit_score_history(created_at DESC);

-- 사용자별 최근 이력 조회 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_credit_score_history_user_created
  ON credit_score_history(user_id, created_at DESC);

-- 참조 타입별 조회
CREATE INDEX IF NOT EXISTS idx_credit_score_history_reference_type
  ON credit_score_history(reference_type)
  WHERE reference_type IS NOT NULL;

-- 참조 ID로 조회 (특정 예약/신고에 대한 점수 변동 확인)
CREATE INDEX IF NOT EXISTS idx_credit_score_history_reference
  ON credit_score_history(reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- =========================
-- 3. ROW LEVEL SECURITY
-- =========================

ALTER TABLE credit_score_history ENABLE ROW LEVEL SECURITY;

-- 본인 이력 조회 가능
CREATE POLICY "credit_score_history_select_own" ON credit_score_history
  FOR SELECT
  USING (user_id = auth.uid());

-- 관리자는 모든 이력 조회 가능
CREATE POLICY "credit_score_history_select_admin" ON credit_score_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 삽입은 시스템(트리거/함수)에서만 가능하도록 SECURITY DEFINER 함수 사용
-- 직접 INSERT는 관리자만 가능
CREATE POLICY "credit_score_history_insert_admin" ON credit_score_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 수정/삭제 금지 (이력은 불변)
-- 관리자도 수정/삭제 불가 (감사 추적 목적)

-- =========================
-- 4. HELPER FUNCTIONS
-- =========================

-- 신용점수 변경 함수 (내부용)
CREATE OR REPLACE FUNCTION adjust_credit_score(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_processed_by UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_current_score INTEGER;
  v_new_score INTEGER;
BEGIN
  -- 현재 점수 조회 (락 획득)
  SELECT credit_score INTO v_current_score
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_score IS NULL THEN
    v_current_score := 100; -- 기본값
  END IF;

  -- 새 점수 계산 (0-100 범위 유지)
  v_new_score := GREATEST(0, LEAST(100, v_current_score + p_delta));

  -- 점수 업데이트
  UPDATE profiles
  SET credit_score = v_new_score,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 이력 기록
  INSERT INTO credit_score_history (
    user_id, delta, previous_score, new_score,
    reason, reference_type, reference_id, processed_by
  ) VALUES (
    p_user_id, p_delta, v_current_score, v_new_score,
    p_reason, p_reference_type, p_reference_id, p_processed_by
  );

  RETURN v_new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION adjust_credit_score IS '신용점수 변경 함수 - 점수 업데이트 및 이력 기록';

-- 노쇼 시 감점 함수
CREATE OR REPLACE FUNCTION deduct_score_for_noshow(
  p_user_id UUID,
  p_reservation_id UUID
)
RETURNS INTEGER AS $$
BEGIN
  -- 노쇼 시 -20점 감점
  RETURN adjust_credit_score(
    p_user_id,
    -20,
    '예약 노쇼',
    'reservation',
    p_reservation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deduct_score_for_noshow IS '노쇼 시 신용점수 감점 (-20점)';

-- 예약 취소 시 감점 함수
CREATE OR REPLACE FUNCTION deduct_score_for_cancel(
  p_user_id UUID,
  p_reservation_id UUID,
  p_hours_before INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
DECLARE
  v_delta INTEGER;
BEGIN
  -- 취소 시점에 따른 감점
  -- 24시간 이상 전: -5점
  -- 12-24시간 전: -10점
  -- 12시간 미만: -15점
  IF p_hours_before >= 24 THEN
    v_delta := -5;
  ELSIF p_hours_before >= 12 THEN
    v_delta := -10;
  ELSE
    v_delta := -15;
  END IF;

  RETURN adjust_credit_score(
    p_user_id,
    v_delta,
    '예약 취소 (예약 ' || p_hours_before || '시간 전)',
    'reservation',
    p_reservation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deduct_score_for_cancel IS '예약 취소 시 신용점수 감점 (시점에 따라 -5~-15점)';

-- 정상 이용 시 회복 함수
CREATE OR REPLACE FUNCTION restore_score_for_complete(
  p_user_id UUID,
  p_reservation_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_current_score INTEGER;
BEGIN
  SELECT credit_score INTO v_current_score
  FROM profiles WHERE id = p_user_id;

  -- 만점이면 변동 없음
  IF v_current_score >= 100 THEN
    RETURN 100;
  END IF;

  -- 정상 이용 시 +5점 회복 (최대 100)
  RETURN adjust_credit_score(
    p_user_id,
    5,
    '예약 정상 이용',
    'reservation',
    p_reservation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_score_for_complete IS '정상 이용 시 신용점수 회복 (+5점, 최대 100)';

-- 관리자 수동 조정 함수
CREATE OR REPLACE FUNCTION admin_adjust_credit_score(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- 호출자가 관리자인지 확인
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can manually adjust credit score';
  END IF;

  RETURN adjust_credit_score(
    p_user_id,
    p_delta,
    '관리자 수동 조정: ' || p_reason,
    'manual',
    NULL,
    v_admin_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_adjust_credit_score IS '관리자 신용점수 수동 조정 함수';
