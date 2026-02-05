-- ============================================================
-- Migration: 040_create_blacklist.sql
-- Description: Create blacklist table for blocking malicious users
-- Uses DI (중복가입확인정보) to prevent re-registration
-- ============================================================

-- =========================
-- 1. CREATE TABLE
-- =========================

CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- DI (중복가입확인정보) - 본인인증 시 발급된 고유값
  -- 동일인이 다른 계정으로 가입해도 DI는 같음
  di TEXT UNIQUE NOT NULL,

  -- 차단 사유
  reason TEXT NOT NULL,

  -- 차단 시각
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 차단 처리한 관리자
  blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- 원래 사용자 ID (참조용, 삭제되어도 유지)
  original_user_id UUID,

  -- 추가 메타데이터 (필요시 사용)
  metadata JSONB DEFAULT '{}',

  -- 생성/수정 시각
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE blacklist IS '블랙리스트 - DI 기반 악성 사용자 차단 목록';
COMMENT ON COLUMN blacklist.di IS '중복가입확인정보 - 본인인증 시 발급된 고유값 (동일인 식별)';
COMMENT ON COLUMN blacklist.reason IS '차단 사유 (노쇼 반복, 악성 리뷰, 사기 등)';
COMMENT ON COLUMN blacklist.blocked_at IS '차단 처리 시각';
COMMENT ON COLUMN blacklist.blocked_by IS '차단 처리한 관리자 ID';
COMMENT ON COLUMN blacklist.original_user_id IS '차단 당시 원래 사용자 ID (계정 삭제 후에도 기록 유지)';
COMMENT ON COLUMN blacklist.metadata IS '추가 메타데이터 (증거 자료, 신고 내역 등)';

-- =========================
-- 2. INDEXES
-- =========================

-- DI로 빠른 조회 (UNIQUE 제약으로 자동 생성되지만 명시)
CREATE INDEX IF NOT EXISTS idx_blacklist_di ON blacklist(di);

-- 차단일 기준 정렬
CREATE INDEX IF NOT EXISTS idx_blacklist_blocked_at ON blacklist(blocked_at DESC);

-- 차단 처리자 기준 조회
CREATE INDEX IF NOT EXISTS idx_blacklist_blocked_by ON blacklist(blocked_by) WHERE blocked_by IS NOT NULL;

-- =========================
-- 3. TRIGGERS
-- =========================

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_blacklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blacklist_updated_at ON blacklist;
CREATE TRIGGER trigger_blacklist_updated_at
  BEFORE UPDATE ON blacklist
  FOR EACH ROW
  EXECUTE FUNCTION update_blacklist_updated_at();

-- =========================
-- 4. ROW LEVEL SECURITY
-- =========================

ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "blacklist_select_admin_only" ON blacklist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 관리자만 추가 가능
CREATE POLICY "blacklist_insert_admin_only" ON blacklist
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 관리자만 수정 가능
CREATE POLICY "blacklist_update_admin_only" ON blacklist
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 관리자만 삭제 가능
CREATE POLICY "blacklist_delete_admin_only" ON blacklist
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =========================
-- 5. HELPER FUNCTIONS
-- =========================

-- 블랙리스트 여부 확인 함수
CREATE OR REPLACE FUNCTION is_user_blacklisted(p_di TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM blacklist WHERE di = p_di);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_user_blacklisted IS 'DI로 블랙리스트 여부 확인';

-- 블랙리스트 추가 함수 (관리자용)
CREATE OR REPLACE FUNCTION add_to_blacklist(
  p_di TEXT,
  p_reason TEXT,
  p_original_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_blacklist_id UUID;
BEGIN
  -- 호출자가 관리자인지 확인
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can add to blacklist';
  END IF;

  -- 블랙리스트에 추가
  INSERT INTO blacklist (di, reason, blocked_by, original_user_id, metadata)
  VALUES (p_di, p_reason, v_admin_id, p_original_user_id, p_metadata)
  ON CONFLICT (di) DO UPDATE SET
    reason = EXCLUDED.reason,
    blocked_by = EXCLUDED.blocked_by,
    blocked_at = NOW(),
    metadata = blacklist.metadata || EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_blacklist_id;

  RETURN v_blacklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_to_blacklist IS '블랙리스트 추가 함수 (관리자 전용)';

-- 블랙리스트 제거 함수 (관리자용)
CREATE OR REPLACE FUNCTION remove_from_blacklist(p_di TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- 호출자가 관리자인지 확인
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can remove from blacklist';
  END IF;

  DELETE FROM blacklist WHERE di = p_di;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION remove_from_blacklist IS '블랙리스트 제거 함수 (관리자 전용)';
