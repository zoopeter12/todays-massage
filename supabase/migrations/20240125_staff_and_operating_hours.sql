-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo TEXT,
  specialties TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add operating_hours column to shops table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'operating_hours'
  ) THEN
    ALTER TABLE shops ADD COLUMN operating_hours JSONB DEFAULT '{
      "monday": {"open": "09:00", "close": "21:00"},
      "tuesday": {"open": "09:00", "close": "21:00"},
      "wednesday": {"open": "09:00", "close": "21:00"},
      "thursday": {"open": "09:00", "close": "21:00"},
      "friday": {"open": "09:00", "close": "21:00"},
      "saturday": {"open": "09:00", "close": "21:00"},
      "sunday": null,
      "is_24h": false,
      "break_time": null
    }'::jsonb;
  END IF;
END $$;

-- Add staff_id to bookings table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'staff_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_shop_id ON staff(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_shop_date ON bookings(shop_id, start_time);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff table
CREATE POLICY "Staff are viewable by everyone"
  ON staff FOR SELECT
  USING (true);

CREATE POLICY "Shop owners can manage their staff"
  ON staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = staff.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Add some sample data (optional, for testing)
-- INSERT INTO staff (shop_id, name, specialties, is_active)
-- SELECT
--   '00000000-0000-0000-0000-000000000001'::uuid,
--   '김미영',
--   ARRAY['스웨디시', '아로마', '딥티슈'],
--   true
-- WHERE NOT EXISTS (SELECT 1 FROM staff LIMIT 1);
