-- ============================================================
-- Reports Table Migration
-- Table for managing review/shop/user reports
-- ============================================================

-- =========================
-- 1. REPORTS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reporter information
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Target information (what is being reported)
  target_type TEXT NOT NULL CHECK (target_type IN ('shop', 'review', 'user', 'chat')),
  target_id UUID NOT NULL,

  -- Report details
  reason TEXT NOT NULL CHECK (reason IN ('profanity', 'false_info', 'spam', 'other')),
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- 2. INDEXES
-- =========================

-- Reporter lookup
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);

-- Target lookup (to check if already reported)
CREATE INDEX IF NOT EXISTS idx_reports_target_type_id ON reports(target_type, target_id);

-- Status filter
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Date ordering
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- =========================
-- 3. ROW LEVEL SECURITY
-- =========================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "reports_select_own" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "reports_select_admin" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert reports
CREATE POLICY "reports_insert_auth" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Only admins can update reports
CREATE POLICY "reports_update_admin" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =========================
-- 4. UPDATED_AT TRIGGER
-- =========================

CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 5. PREVENT DUPLICATE REPORTS
-- =========================

-- Unique constraint: one user can only report the same target once
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_report
  ON reports(reporter_id, target_type, target_id)
  WHERE status IN ('pending', 'reviewing');
