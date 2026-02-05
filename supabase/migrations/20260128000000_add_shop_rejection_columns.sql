-- ============================================================
-- Add rejection columns to shops table
-- Columns: status, rejection_reason, rejected_at
-- ============================================================

-- 매장 상태 컬럼 추가 (pending, approved, rejected, suspended)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 반려 사유 컬럼 추가
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 반려 일시 컬럼 추가
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- 인덱스 추가 (상태별 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);

-- 기존 데이터 마이그레이션: is_open 기준으로 status 설정
UPDATE shops SET status = 'approved' WHERE is_open = true AND status IS NULL;
UPDATE shops SET status = 'pending' WHERE is_open = false AND status IS NULL;

-- 주석: 이후 is_open 컬럼은 운영시간 내 영업 상태(open/close)로 사용
-- status 컬럼은 매장 승인 상태(pending/approved/rejected/suspended)로 사용
