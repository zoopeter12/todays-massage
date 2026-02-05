-- ============================================================
-- Favorites Table Migration
-- 사용자 찜/좋아요 기능을 위한 테이블
-- Includes: Indexes, RLS policies, Unique constraint
-- ============================================================

-- =========================
-- 1. TABLE
-- =========================

-- favorites: 사용자의 샵 찜하기/좋아요 목록
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 동일 사용자가 같은 샵을 중복 찜하기 방지
  CONSTRAINT favorites_user_shop_unique UNIQUE (user_id, shop_id)
);

-- 테이블 코멘트
COMMENT ON TABLE favorites IS '사용자 찜하기/좋아요 목록';
COMMENT ON COLUMN favorites.id IS '찜하기 고유 ID';
COMMENT ON COLUMN favorites.user_id IS '찜한 사용자 ID (profiles 참조)';
COMMENT ON COLUMN favorites.shop_id IS '찜한 샵 ID (shops 참조)';
COMMENT ON COLUMN favorites.created_at IS '찜한 일시';

-- =========================
-- 2. INDEXES
-- =========================

-- user_id 인덱스: 특정 사용자의 찜 목록 조회 최적화
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- shop_id 인덱스: 특정 샵의 찜 수 조회 최적화
CREATE INDEX IF NOT EXISTS idx_favorites_shop_id ON favorites(shop_id);

-- created_at 인덱스: 최신순 정렬 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- 복합 인덱스: user_id + created_at (사용자별 최신 찜 목록 조회)
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at DESC);

-- =========================
-- 3. ROW LEVEL SECURITY (RLS)
-- =========================

-- RLS 활성화
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- SELECT: 모든 사용자가 찜 데이터 조회 가능 (인기 샵 표시 등)
CREATE POLICY "favorites_select_all" ON favorites
  FOR SELECT USING (true);

-- INSERT: 인증된 사용자만 본인의 찜 추가 가능
CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- UPDATE: 찜 데이터는 수정 불가 (삭제 후 재생성 패턴)
-- UPDATE 정책 없음 (의도적)

-- DELETE: 본인이 찜한 항목만 삭제 가능
CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- =========================
-- 4. HELPER FUNCTIONS (Optional)
-- =========================

-- 특정 샵의 찜 수 조회 함수
CREATE OR REPLACE FUNCTION get_favorites_count(target_shop_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM favorites
  WHERE shop_id = target_shop_id;
$$ LANGUAGE sql STABLE;

-- 사용자가 특정 샵을 찜했는지 확인하는 함수
CREATE OR REPLACE FUNCTION is_favorited(target_user_id UUID, target_shop_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM favorites
    WHERE user_id = target_user_id
      AND shop_id = target_shop_id
  );
$$ LANGUAGE sql STABLE;

-- 찜 토글 함수 (찜 추가/삭제를 하나의 함수로)
CREATE OR REPLACE FUNCTION toggle_favorite(target_shop_id UUID)
RETURNS JSON AS $$
DECLARE
  current_user_id UUID := auth.uid();
  existing_favorite UUID;
  result JSON;
BEGIN
  -- 인증 확인
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- 기존 찜 확인
  SELECT id INTO existing_favorite
  FROM favorites
  WHERE user_id = current_user_id
    AND shop_id = target_shop_id;

  IF existing_favorite IS NOT NULL THEN
    -- 찜 삭제
    DELETE FROM favorites WHERE id = existing_favorite;
    result := json_build_object(
      'success', true,
      'action', 'removed',
      'is_favorited', false
    );
  ELSE
    -- 찜 추가
    INSERT INTO favorites (user_id, shop_id)
    VALUES (current_user_id, target_shop_id);
    result := json_build_object(
      'success', true,
      'action', 'added',
      'is_favorited', true
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 코멘트
COMMENT ON FUNCTION get_favorites_count(UUID) IS '특정 샵의 총 찜 수를 반환';
COMMENT ON FUNCTION is_favorited(UUID, UUID) IS '사용자가 특정 샵을 찜했는지 확인';
COMMENT ON FUNCTION toggle_favorite(UUID) IS '찜 추가/삭제 토글 (인증된 사용자용)';
