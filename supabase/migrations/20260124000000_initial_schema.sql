-- ============================================================
-- Initial Schema Migration
-- Tables: profiles, shops, courses, reservations
-- Includes: Indexes, RLS policies
-- ============================================================

-- =========================
-- 1. TABLES
-- =========================

-- profiles: user profile extending auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  nickname TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- shops: business/store listings
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat FLOAT8,
  lng FLOAT8,
  address TEXT,
  tel TEXT,
  category TEXT,
  images TEXT[] DEFAULT '{}',
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- courses: service courses offered by shops
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_original INT NOT NULL DEFAULT 0,
  price_discount INT,
  duration INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reservations: user bookings for courses at shops
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- 2. INDEXES
-- =========================

-- Geolocation indexes for spatial queries on shops
CREATE INDEX IF NOT EXISTS idx_shops_lat ON shops(lat);
CREATE INDEX IF NOT EXISTS idx_shops_lng ON shops(lng);

-- Composite index for bounding-box geolocation queries
CREATE INDEX IF NOT EXISTS idx_shops_lat_lng ON shops(lat, lng);

-- Category filter index
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category);

-- Foreign key indexes for courses and reservations (query performance)
CREATE INDEX IF NOT EXISTS idx_courses_shop_id ON courses(shop_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_shop_id ON reservations(shop_id);
CREATE INDEX IF NOT EXISTS idx_reservations_course_id ON reservations(course_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- =========================
-- 3. ROW LEVEL SECURITY (RLS)
-- =========================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Development-phase policies: allow all operations
-- NOTE: Replace these with proper policies before production deployment

-- profiles policies
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "profiles_insert_all" ON profiles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON profiles
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "profiles_delete_all" ON profiles
  FOR DELETE USING (true);

-- shops policies
CREATE POLICY "shops_select_all" ON shops
  FOR SELECT USING (true);
CREATE POLICY "shops_insert_all" ON shops
  FOR INSERT WITH CHECK (true);
CREATE POLICY "shops_update_all" ON shops
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "shops_delete_all" ON shops
  FOR DELETE USING (true);

-- courses policies
CREATE POLICY "courses_select_all" ON courses
  FOR SELECT USING (true);
CREATE POLICY "courses_insert_all" ON courses
  FOR INSERT WITH CHECK (true);
CREATE POLICY "courses_update_all" ON courses
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "courses_delete_all" ON courses
  FOR DELETE USING (true);

-- reservations policies
CREATE POLICY "reservations_select_all" ON reservations
  FOR SELECT USING (true);
CREATE POLICY "reservations_insert_all" ON reservations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_update_all" ON reservations
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "reservations_delete_all" ON reservations
  FOR DELETE USING (true);

-- =========================
-- 4. UPDATED_AT TRIGGER (profiles)
-- =========================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
