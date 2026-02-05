-- Rollback script for staff and operating hours migration
-- Use this ONLY if you need to undo the changes
-- WARNING: This will delete all staff data and operating hours

-- Drop triggers
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop RLS policies
DROP POLICY IF EXISTS "Staff are viewable by everyone" ON staff;
DROP POLICY IF EXISTS "Shop owners can manage their staff" ON staff;

-- Drop indexes
DROP INDEX IF EXISTS idx_staff_shop_id;
DROP INDEX IF EXISTS idx_staff_is_active;
DROP INDEX IF EXISTS idx_bookings_staff_id;
DROP INDEX IF EXISTS idx_bookings_start_time;
DROP INDEX IF EXISTS idx_bookings_shop_date;

-- Remove foreign key from bookings table
ALTER TABLE IF EXISTS bookings DROP COLUMN IF EXISTS staff_id;

-- Remove operating_hours from shops table
ALTER TABLE IF EXISTS shops DROP COLUMN IF EXISTS operating_hours;

-- Drop staff table
DROP TABLE IF EXISTS staff;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE 'Rollback completed. Staff table dropped, staff_id removed from bookings, operating_hours removed from shops.';
END $$;
