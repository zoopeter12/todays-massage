-- ============================================================
-- Migration: Add increment RPC function
--
-- Problem: Updating view_count with read-then-write pattern
--   causes race conditions under concurrent access.
--
-- Solution: Atomic increment via RPC function using
--   UPDATE ... SET view_count = view_count + 1
-- ============================================================

CREATE OR REPLACE FUNCTION increment(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE shops SET view_count = view_count + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
