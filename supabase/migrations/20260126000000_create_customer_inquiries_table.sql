-- ============================================================
-- Customer Inquiries Table Migration
-- Table for managing customer support inquiries
-- ============================================================

-- =========================
-- 1. CUSTOMER_INQUIRIES TABLE
-- =========================

CREATE TABLE IF NOT EXISTS customer_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User information (nullable for non-members)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,

  -- Inquiry details
  category TEXT NOT NULL CHECK (category IN ('general', 'reservation', 'payment', 'technical', 'complaint')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  response TEXT,
  responded_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- 2. INDEXES
-- =========================

-- User lookup
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_user_id ON customer_inquiries(user_id);

-- Status filter
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON customer_inquiries(status);

-- Category filter
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_category ON customer_inquiries(category);

-- Date ordering
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON customer_inquiries(created_at DESC);

-- Phone lookup (for non-member inquiries)
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_user_phone ON customer_inquiries(user_phone);

-- =========================
-- 3. ROW LEVEL SECURITY
-- =========================

ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

-- Users can view their own inquiries
CREATE POLICY "customer_inquiries_select_own" ON customer_inquiries
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL -- Allow non-authenticated users to view their own inquiries if needed
  );

-- Admins can view all inquiries
CREATE POLICY "customer_inquiries_select_admin" ON customer_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can insert inquiries (including non-members)
CREATE POLICY "customer_inquiries_insert_all" ON customer_inquiries
  FOR INSERT WITH CHECK (true);

-- Only admins can update inquiries
CREATE POLICY "customer_inquiries_update_admin" ON customer_inquiries
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

CREATE TRIGGER trigger_customer_inquiries_updated_at
  BEFORE UPDATE ON customer_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
