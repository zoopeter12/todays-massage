-- ============================================================
-- Rollback Migration: Remove operating_hours and amenities from shops
-- Created: 2026-01-25
-- WARNING: This will permanently delete operating_hours and amenities data!
-- ============================================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_shops_amenities;
DROP INDEX IF EXISTS idx_shops_operating_hours;

-- Remove columns
ALTER TABLE IF EXISTS shops DROP COLUMN IF EXISTS amenities;
ALTER TABLE IF EXISTS shops DROP COLUMN IF EXISTS operating_hours;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE 'Rollback completed: operating_hours and amenities columns removed from shops table.';
END $$;
