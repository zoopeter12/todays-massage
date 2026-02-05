-- ============================================================
-- Migration: Add operating_hours and amenities columns to shops table
-- Created: 2026-01-25
-- Description:
--   - operating_hours: JSONB column for business hours per day
--   - amenities: JSONB column for shop amenities/features
-- ============================================================

-- =========================
-- 1. ADD OPERATING_HOURS COLUMN (if not exists)
-- =========================
-- Structure based on C:/a/src/types/staff.ts OperatingHours interface:
-- {
--   monday: { open: string, close: string } | null,
--   tuesday: { open: string, close: string } | null,
--   ...
--   sunday: { open: string, close: string } | null,
--   is_24h: boolean,
--   break_time: { start: string, end: string } | null
-- }

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'operating_hours'
  ) THEN
    ALTER TABLE shops ADD COLUMN operating_hours JSONB DEFAULT '{
      "monday": {"open": "10:00", "close": "22:00"},
      "tuesday": {"open": "10:00", "close": "22:00"},
      "wednesday": {"open": "10:00", "close": "22:00"},
      "thursday": {"open": "10:00", "close": "22:00"},
      "friday": {"open": "10:00", "close": "22:00"},
      "saturday": {"open": "10:00", "close": "22:00"},
      "sunday": null,
      "is_24h": false,
      "break_time": null
    }'::jsonb;

    RAISE NOTICE 'Column operating_hours added to shops table';
  ELSE
    RAISE NOTICE 'Column operating_hours already exists in shops table';
  END IF;
END $$;

-- =========================
-- 2. ADD AMENITIES COLUMN
-- =========================
-- Structure based on C:/a/src/types/filters.ts ShopAmenities interface:
-- {
--   parking: boolean,
--   shower: boolean,
--   women_only: boolean,
--   couple_room: boolean,
--   unisex: boolean,
--   late_night: boolean
-- }
-- Using JSONB for flexibility and easy querying with GIN index

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'amenities'
  ) THEN
    ALTER TABLE shops ADD COLUMN amenities JSONB DEFAULT '{
      "parking": false,
      "shower": false,
      "women_only": false,
      "couple_room": false,
      "unisex": true,
      "late_night": false
    }'::jsonb;

    RAISE NOTICE 'Column amenities added to shops table';
  ELSE
    RAISE NOTICE 'Column amenities already exists in shops table';
  END IF;
END $$;

-- =========================
-- 3. CREATE GIN INDEXES FOR JSONB QUERYING
-- =========================
-- GIN indexes enable efficient queries like:
--   WHERE amenities @> '{"parking": true}'
--   WHERE operating_hours @> '{"is_24h": true}'

CREATE INDEX IF NOT EXISTS idx_shops_amenities
  ON shops USING GIN (amenities);

CREATE INDEX IF NOT EXISTS idx_shops_operating_hours
  ON shops USING GIN (operating_hours);

-- =========================
-- 4. ADD COMMENT FOR DOCUMENTATION
-- =========================

COMMENT ON COLUMN shops.operating_hours IS
  'Business operating hours per day. Structure: {day: {open: "HH:MM", close: "HH:MM"} | null, is_24h: boolean, break_time: {start, end} | null}';

COMMENT ON COLUMN shops.amenities IS
  'Shop amenities/features. Structure: {parking, shower, women_only, couple_room, unisex, late_night: boolean}';

-- =========================
-- 5. VERIFICATION QUERY (for manual testing)
-- =========================
-- Run this after migration to verify:
-- SELECT
--   column_name,
--   data_type,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'shops'
--   AND column_name IN ('operating_hours', 'amenities');
