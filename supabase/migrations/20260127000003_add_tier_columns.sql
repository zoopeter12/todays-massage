-- ============================================================
-- Add tier columns to shops table
-- ============================================================

-- 매장 테이블에 등급 관련 컬럼 추가
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'vip')),
ADD COLUMN IF NOT EXISTS tier_changed_at TIMESTAMPTZ;

-- 인덱스 추가 (등급별 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_shops_tier ON shops(tier);

-- 기존 데이터에 기본값 설정
UPDATE shops SET tier = 'basic' WHERE tier IS NULL;
