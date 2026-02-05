-- ============================================================
-- 오늘의마사지 - 전체 마이그레이션 + 테스트 데이터 시딩
-- Supabase Dashboard SQL Editor에서 이 파일 전체를 실행하세요
-- URL: https://supabase.com/dashboard/project/dhgoxmjhhqgeozscilqz/sql/new
-- ============================================================

-- =========================
-- 1. TABLES
-- =========================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  nickname TEXT,
  phone TEXT,
  notification_settings JSONB DEFAULT '{"newReservation": true, "reservationChange": true, "customerMessage": false, "marketing": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_original INT NOT NULL DEFAULT 0,
  price_discount INT,
  duration INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_shops_lat ON shops(lat);
CREATE INDEX IF NOT EXISTS idx_shops_lng ON shops(lng);
CREATE INDEX IF NOT EXISTS idx_shops_lat_lng ON shops(lat, lng);
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category);
CREATE INDEX IF NOT EXISTS idx_courses_shop_id ON courses(shop_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_shop_id ON reservations(shop_id);
CREATE INDEX IF NOT EXISTS idx_reservations_course_id ON reservations(course_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- =========================
-- 3. ROW LEVEL SECURITY
-- =========================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_all" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "profiles_delete_all" ON profiles FOR DELETE USING (true);

CREATE POLICY "shops_select_all" ON shops FOR SELECT USING (true);
CREATE POLICY "shops_insert_all" ON shops FOR INSERT WITH CHECK (true);
CREATE POLICY "shops_update_all" ON shops FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "shops_delete_all" ON shops FOR DELETE USING (true);

CREATE POLICY "courses_select_all" ON courses FOR SELECT USING (true);
CREATE POLICY "courses_insert_all" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "courses_update_all" ON courses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "courses_delete_all" ON courses FOR DELETE USING (true);

CREATE POLICY "reservations_select_all" ON reservations FOR SELECT USING (true);
CREATE POLICY "reservations_insert_all" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_update_all" ON reservations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "reservations_delete_all" ON reservations FOR DELETE USING (true);

-- =========================
-- 4. TRIGGER
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

-- =========================
-- 5. ADD is_open COLUMN
-- =========================

ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shops_is_open ON shops(is_open);
COMMENT ON COLUMN shops.is_open IS 'Indicates whether the shop is currently open for business';

-- =========================
-- 5.1 ADD notification_settings COLUMN
-- =========================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"newReservation": true, "reservationChange": true, "customerMessage": false, "marketing": false}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_profiles_notification_settings ON profiles USING GIN (notification_settings);
COMMENT ON COLUMN profiles.notification_settings IS 'User notification preferences: newReservation, reservationChange, customerMessage, marketing';

-- =========================
-- 6. SEED TEST DATA
-- =========================

INSERT INTO shops (id, name, lat, lng, address, tel, category, images, is_open) VALUES
  ('a1b2c3d4-1111-4000-8000-000000000001', '힐링터치 마사지', 37.5665, 126.9780, '서울특별시 중구 명동길 14', '02-1234-5678', '스웨디시', ARRAY['https://picsum.photos/seed/shop1/400/300'], true),
  ('a1b2c3d4-2222-4000-8000-000000000002', '바디밸런스 스파', 37.5512, 126.9882, '서울특별시 용산구 이태원로 45', '02-2345-6789', '타이마사지', ARRAY['https://picsum.photos/seed/shop2/400/300'], true),
  ('a1b2c3d4-3333-4000-8000-000000000003', '골든핸즈 마사지', 37.4979, 127.0276, '서울특별시 강남구 강남대로 328', '02-3456-7890', '스포츠마사지', ARRAY['https://picsum.photos/seed/shop3/400/300'], true),
  ('a1b2c3d4-4444-4000-8000-000000000004', '릴랙스존 아로마', 37.5172, 127.0473, '서울특별시 송파구 올림픽로 300', '02-4567-8901', '아로마테라피', ARRAY['https://picsum.photos/seed/shop4/400/300'], true),
  ('a1b2c3d4-5555-4000-8000-000000000005', '프리미엄 테라피', 37.5563, 126.9220, '서울특별시 마포구 홍대입구 23', '02-5678-9012', '스웨디시', ARRAY['https://picsum.photos/seed/shop5/400/300'], true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO courses (id, shop_id, name, price_original, price_discount, duration) VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', '스웨디시 60분', 80000, 59000, 60),
  ('b1b2c3d4-0002-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', '스웨디시 90분', 120000, 89000, 90),
  ('b1b2c3d4-0003-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', '딥티슈 60분', 90000, 69000, 60),
  ('b1b2c3d4-0001-4000-8000-000000000002', 'a1b2c3d4-2222-4000-8000-000000000002', '타이마사지 60분', 70000, 49000, 60),
  ('b1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-2222-4000-8000-000000000002', '타이마사지 90분', 100000, 75000, 90),
  ('b1b2c3d4-0003-4000-8000-000000000002', 'a1b2c3d4-2222-4000-8000-000000000002', '발마사지 40분', 50000, 35000, 40),
  ('b1b2c3d4-0001-4000-8000-000000000003', 'a1b2c3d4-3333-4000-8000-000000000003', '스포츠마사지 60분', 90000, 65000, 60),
  ('b1b2c3d4-0002-4000-8000-000000000003', 'a1b2c3d4-3333-4000-8000-000000000003', '스포츠마사지 90분', 130000, 99000, 90),
  ('b1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-3333-4000-8000-000000000003', '근막이완 50분', 75000, 55000, 50),
  ('b1b2c3d4-0001-4000-8000-000000000004', 'a1b2c3d4-4444-4000-8000-000000000004', '아로마 전신 60분', 85000, 62000, 60),
  ('b1b2c3d4-0002-4000-8000-000000000004', 'a1b2c3d4-4444-4000-8000-000000000004', '아로마 전신 90분', 125000, 95000, 90),
  ('b1b2c3d4-0003-4000-8000-000000000004', 'a1b2c3d4-4444-4000-8000-000000000004', '페이셜 아로마 30분', 45000, 32000, 30),
  ('b1b2c3d4-0001-4000-8000-000000000005', 'a1b2c3d4-5555-4000-8000-000000000005', '프리미엄 스웨디시 60분', 100000, 75000, 60),
  ('b1b2c3d4-0002-4000-8000-000000000005', 'a1b2c3d4-5555-4000-8000-000000000005', '프리미엄 스웨디시 90분', 150000, 110000, 90),
  ('b1b2c3d4-0003-4000-8000-000000000005', 'a1b2c3d4-5555-4000-8000-000000000005', '커플 마사지 60분', 180000, 139000, 60)
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 7. REFRESH POSTGREST CACHE
-- =========================
NOTIFY pgrst, 'reload schema';

-- =========================
-- 8. VERIFY
-- =========================
SELECT 'shops' as table_name, count(*) as row_count FROM shops
UNION ALL
SELECT 'courses', count(*) FROM courses
UNION ALL
SELECT 'reservations', count(*) FROM reservations;
