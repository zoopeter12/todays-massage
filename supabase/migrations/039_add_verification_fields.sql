-- ============================================================
-- Migration: 039_add_verification_fields.sql
-- Description: Add identity verification fields to profiles table
-- Fields: ci, di, real_name, gender, birth_date, verified_at, credit_score
-- ============================================================

-- =========================
-- 1. ADD VERIFICATION COLUMNS
-- =========================

-- CI (연계정보) - 본인확인기관에서 발급하는 고유 식별자
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ci TEXT UNIQUE;
COMMENT ON COLUMN profiles.ci IS '연계정보 (Connecting Information) - 본인확인기관 발급 고유 식별자';

-- DI (중복가입확인정보) - 서비스별 중복가입 확인용 식별자
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS di TEXT UNIQUE;
COMMENT ON COLUMN profiles.di IS '중복가입확인정보 (Duplication Information) - 서비스별 중복가입 확인용';

-- 실명
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS real_name TEXT;
COMMENT ON COLUMN profiles.real_name IS '본인인증으로 확인된 실명';

-- 성별 (male/female만 허용)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
COMMENT ON COLUMN profiles.gender IS '성별 (male/female)';

-- 성별 CHECK 제약조건 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_gender_check'
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_gender_check
      CHECK (gender IS NULL OR gender IN ('male', 'female'));
  END IF;
END $$;

-- 생년월일
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
COMMENT ON COLUMN profiles.birth_date IS '본인인증으로 확인된 생년월일';

-- 본인인증 완료 시각
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
COMMENT ON COLUMN profiles.verified_at IS '본인인증 완료 시각';

-- 신용점수 (0-100, 기본값 100)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 100;
COMMENT ON COLUMN profiles.credit_score IS '신용점수 (0-100, 노쇼/취소 시 감점, 정상이용 시 회복)';

-- 신용점수 범위 CHECK 제약조건 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_credit_score_range'
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_credit_score_range
      CHECK (credit_score IS NULL OR (credit_score >= 0 AND credit_score <= 100));
  END IF;
END $$;

-- =========================
-- 2. INDEXES
-- =========================

-- CI 인덱스 (이미 UNIQUE 제약으로 인해 자동 생성되지만 명시적으로)
CREATE INDEX IF NOT EXISTS idx_profiles_ci ON profiles(ci) WHERE ci IS NOT NULL;

-- DI 인덱스 (블랙리스트 조회 시 사용)
CREATE INDEX IF NOT EXISTS idx_profiles_di ON profiles(di) WHERE di IS NOT NULL;

-- 실명 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_real_name ON profiles(real_name) WHERE real_name IS NOT NULL;

-- 본인인증 여부 확인용 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at ON profiles(verified_at) WHERE verified_at IS NOT NULL;

-- 신용점수 기반 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_credit_score ON profiles(credit_score);

-- =========================
-- 3. HELPER FUNCTIONS
-- =========================

-- 본인인증 완료 함수 (RPC로 호출 가능)
CREATE OR REPLACE FUNCTION complete_identity_verification(
  p_user_id UUID,
  p_ci TEXT,
  p_di TEXT,
  p_real_name TEXT,
  p_gender TEXT,
  p_birth_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_existing_di UUID;
BEGIN
  -- DI 중복 체크 (이미 다른 계정에서 사용 중인지)
  SELECT id INTO v_existing_di FROM profiles WHERE di = p_di AND id != p_user_id;

  IF v_existing_di IS NOT NULL THEN
    RAISE EXCEPTION 'DI already exists for another user';
  END IF;

  -- 프로필 업데이트
  UPDATE profiles SET
    ci = p_ci,
    di = p_di,
    real_name = p_real_name,
    gender = p_gender,
    birth_date = p_birth_date,
    verified_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION complete_identity_verification IS '본인인증 완료 처리 함수 - CI/DI/실명/성별/생년월일 저장';

-- =========================
-- 4. DOCUMENTATION
-- =========================

COMMENT ON TABLE profiles IS '사용자 프로필 - auth.users 확장, 본인인증 정보 포함';
