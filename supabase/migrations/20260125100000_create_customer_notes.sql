-- ============================================================
-- Customer Notes Migration (CRM)
-- Purpose: Partners can add notes and tags to customers
-- ============================================================

-- =========================
-- 1. TABLE: customer_notes
-- =========================

CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Shop that owns this note (FK to shops)
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Customer being noted (FK to profiles - the user)
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Note content
  note TEXT,

  -- Tags array (VIP, Regular, New, Problem, etc.)
  tags TEXT[] DEFAULT '{}',

  -- VIP status flag for quick filtering
  is_vip BOOLEAN NOT NULL DEFAULT false,

  -- Visit count (can be auto-incremented or manually set)
  visit_count INT NOT NULL DEFAULT 0,

  -- Last visit date for quick reference
  last_visit_at TIMESTAMPTZ,

  -- Customer preferences (JSON for flexibility)
  -- e.g., {"preferred_therapist": "uuid", "pressure": "strong", "allergies": ["nuts"]}
  preferences JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure one note per customer per shop
  UNIQUE(shop_id, customer_id)
);

-- Add table comment
COMMENT ON TABLE customer_notes IS 'CRM notes and tags for shop customers, managed by partners';

-- =========================
-- 2. INDEXES
-- =========================

-- Shop lookup (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_customer_notes_shop_id
  ON customer_notes(shop_id);

-- Customer lookup
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id
  ON customer_notes(customer_id);

-- Composite index for shop + customer lookup (covers UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_customer_notes_shop_customer
  ON customer_notes(shop_id, customer_id);

-- VIP filter (for VIP customer lists)
CREATE INDEX IF NOT EXISTS idx_customer_notes_is_vip
  ON customer_notes(shop_id, is_vip)
  WHERE is_vip = true;

-- Tags search using GIN index (for array containment queries)
CREATE INDEX IF NOT EXISTS idx_customer_notes_tags
  ON customer_notes USING GIN(tags);

-- Last visit date for sorting recent customers
CREATE INDEX IF NOT EXISTS idx_customer_notes_last_visit
  ON customer_notes(shop_id, last_visit_at DESC NULLS LAST);

-- =========================
-- 3. ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is owner of the shop
CREATE OR REPLACE FUNCTION is_shop_owner(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shops
    WHERE id = p_shop_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT: Partners can view their shop's customer notes
CREATE POLICY "customer_notes_select_shop_owner" ON customer_notes
  FOR SELECT
  USING (is_shop_owner(shop_id));

-- INSERT: Partners can create notes for their shop's customers
CREATE POLICY "customer_notes_insert_shop_owner" ON customer_notes
  FOR INSERT
  WITH CHECK (is_shop_owner(shop_id));

-- UPDATE: Partners can update their shop's customer notes
CREATE POLICY "customer_notes_update_shop_owner" ON customer_notes
  FOR UPDATE
  USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

-- DELETE: Partners can delete their shop's customer notes
CREATE POLICY "customer_notes_delete_shop_owner" ON customer_notes
  FOR DELETE
  USING (is_shop_owner(shop_id));

-- =========================
-- 4. UPDATED_AT TRIGGER
-- =========================

-- Reuse existing trigger function from initial schema
CREATE TRIGGER trigger_customer_notes_updated_at
  BEFORE UPDATE ON customer_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 5. UTILITY FUNCTIONS
-- =========================

-- Function: Upsert customer note (create or update)
CREATE OR REPLACE FUNCTION upsert_customer_note(
  p_shop_id UUID,
  p_customer_id UUID,
  p_note TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_is_vip BOOLEAN DEFAULT NULL,
  p_preferences JSONB DEFAULT NULL
)
RETURNS customer_notes AS $$
DECLARE
  v_result customer_notes;
BEGIN
  INSERT INTO customer_notes (shop_id, customer_id, note, tags, is_vip, preferences)
  VALUES (
    p_shop_id,
    p_customer_id,
    COALESCE(p_note, ''),
    COALESCE(p_tags, '{}'),
    COALESCE(p_is_vip, false),
    COALESCE(p_preferences, '{}')
  )
  ON CONFLICT (shop_id, customer_id)
  DO UPDATE SET
    note = COALESCE(p_note, customer_notes.note),
    tags = COALESCE(p_tags, customer_notes.tags),
    is_vip = COALESCE(p_is_vip, customer_notes.is_vip),
    preferences = COALESCE(p_preferences, customer_notes.preferences),
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment visit count and update last_visit_at
CREATE OR REPLACE FUNCTION record_customer_visit(
  p_shop_id UUID,
  p_customer_id UUID
)
RETURNS customer_notes AS $$
DECLARE
  v_result customer_notes;
BEGIN
  INSERT INTO customer_notes (shop_id, customer_id, visit_count, last_visit_at)
  VALUES (p_shop_id, p_customer_id, 1, now())
  ON CONFLICT (shop_id, customer_id)
  DO UPDATE SET
    visit_count = customer_notes.visit_count + 1,
    last_visit_at = now(),
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add tags to customer (append, avoid duplicates)
CREATE OR REPLACE FUNCTION add_customer_tags(
  p_shop_id UUID,
  p_customer_id UUID,
  p_new_tags TEXT[]
)
RETURNS TEXT[] AS $$
DECLARE
  v_result TEXT[];
BEGIN
  UPDATE customer_notes
  SET
    tags = (SELECT array_agg(DISTINCT t) FROM unnest(tags || p_new_tags) t),
    updated_at = now()
  WHERE shop_id = p_shop_id AND customer_id = p_customer_id
  RETURNING tags INTO v_result;

  IF v_result IS NULL THEN
    -- Create new record if not exists
    INSERT INTO customer_notes (shop_id, customer_id, tags)
    VALUES (p_shop_id, p_customer_id, p_new_tags)
    RETURNING tags INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Remove tags from customer
CREATE OR REPLACE FUNCTION remove_customer_tags(
  p_shop_id UUID,
  p_customer_id UUID,
  p_remove_tags TEXT[]
)
RETURNS TEXT[] AS $$
DECLARE
  v_result TEXT[];
BEGIN
  UPDATE customer_notes
  SET
    tags = (SELECT array_agg(t) FROM unnest(tags) t WHERE NOT t = ANY(p_remove_tags)),
    updated_at = now()
  WHERE shop_id = p_shop_id AND customer_id = p_customer_id
  RETURNING tags INTO v_result;

  RETURN COALESCE(v_result, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
