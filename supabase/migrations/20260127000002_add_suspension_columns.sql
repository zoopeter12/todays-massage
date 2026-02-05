-- 프로필 테이블에 정지 관련 컬럼 추가
-- status: 사용자 상태 (active, suspended, deleted)
-- suspension_reason: 정지 사유
-- suspended_until: 정지 해제 예정 일시 (null이면 영구 정지)
-- suspended_at: 정지 처리 일시

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- 성능 향상을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_until ON profiles(suspended_until) WHERE status = 'suspended';

-- 기존 사용자들의 status를 active로 설정
UPDATE profiles SET status = 'active' WHERE status IS NULL;

-- 관리자 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'user_suspend', 'user_unsuspend', 'role_change', etc.
  target_type TEXT NOT NULL, -- 'user', 'shop', 'reservation', etc.
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- 코멘트 추가
COMMENT ON TABLE admin_logs IS '관리자 활동 로그 테이블';
COMMENT ON COLUMN profiles.status IS '사용자 상태: active(활성), suspended(정지), deleted(삭제)';
COMMENT ON COLUMN profiles.suspension_reason IS '정지 사유';
COMMENT ON COLUMN profiles.suspended_until IS '정지 해제 예정 일시 (null이면 영구 정지)';
COMMENT ON COLUMN profiles.suspended_at IS '정지 처리 일시';
