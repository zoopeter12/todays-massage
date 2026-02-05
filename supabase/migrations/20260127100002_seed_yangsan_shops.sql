-- ============================================================
-- Seed Yangsan Region Shops Migration
-- Date: 2027-01-27
-- Description: Insert sample shop data for Yangsan region testing
-- Coordinates: Yangsan center approximately (35.3350, 129.0370)
-- ============================================================

-- Insert 3 sample shops in Yangsan region
INSERT INTO shops (
  name,
  lat,
  lng,
  address,
  tel,
  category,
  images,
  view_count,
  is_open,
  created_at
) VALUES
  (
    '양산 타이마사지',
    35.3350,
    129.0370,
    '경상남도 양산시 중앙로 123',
    '055-1234-5678',
    '스파/마사지',
    ARRAY[
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800',
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'
    ],
    156,
    true,
    now() - interval '20 days'
  ),
  (
    '양산 스웨디시 스파',
    35.3380,
    129.0350,
    '경상남도 양산시 물금읍 중앙로 45',
    '055-2345-6789',
    '스파/마사지',
    ARRAY[
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800'
    ],
    289,
    true,
    now() - interval '35 days'
  ),
  (
    '양산 아로마테라피',
    35.3320,
    129.0400,
    '경상남도 양산시 북정동 234-5',
    '055-3456-7890',
    '스파/마사지',
    ARRAY[
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
      'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800'
    ],
    412,
    true,
    now() - interval '50 days'
  );

-- Add sample courses for Yangsan shops
INSERT INTO courses (shop_id, name, price_original, price_discount, duration)
SELECT
  s.id,
  course_data.name,
  course_data.price_original,
  course_data.price_discount,
  course_data.duration
FROM shops s
CROSS JOIN LATERAL (
  VALUES
    ('타이 전통 마사지', 90000, 75000, 90),
    ('발 마사지', 50000, 42000, 60),
    ('전신 오일 마사지', 110000, 95000, 120)
) AS course_data(name, price_original, price_discount, duration)
WHERE s.name = '양산 타이마사지'

UNION ALL

SELECT
  s.id,
  course_data.name,
  course_data.price_original,
  course_data.price_discount,
  course_data.duration
FROM shops s
CROSS JOIN LATERAL (
  VALUES
    ('스웨디시 마사지', 100000, 85000, 90),
    ('딥티슈 마사지', 120000, 100000, 90),
    ('핫스톤 마사지', 130000, 110000, 120)
) AS course_data(name, price_original, price_discount, duration)
WHERE s.name = '양산 스웨디시 스파'

UNION ALL

SELECT
  s.id,
  course_data.name,
  course_data.price_original,
  course_data.price_discount,
  course_data.duration
FROM shops s
CROSS JOIN LATERAL (
  VALUES
    ('아로마 테라피 기본', 80000, 68000, 60),
    ('아로마 전신 케어', 120000, 95000, 90),
    ('힐링 아로마 패키지', 150000, 125000, 120)
) AS course_data(name, price_original, price_discount, duration)
WHERE s.name = '양산 아로마테라피';

-- Verify insertion
DO $$
DECLARE
  yangsan_shop_count INT;
  yangsan_course_count INT;
  total_shop_count INT;
  total_course_count INT;
BEGIN
  -- Count Yangsan shops
  SELECT COUNT(*) INTO yangsan_shop_count
  FROM shops
  WHERE name LIKE '양산%';

  -- Count Yangsan courses
  SELECT COUNT(*) INTO yangsan_course_count
  FROM courses
  WHERE shop_id IN (
    SELECT id FROM shops WHERE name LIKE '양산%'
  );

  -- Count total
  SELECT COUNT(*) INTO total_shop_count FROM shops;
  SELECT COUNT(*) INTO total_course_count FROM courses;

  RAISE NOTICE 'Yangsan seed data inserted successfully:';
  RAISE NOTICE '  - Yangsan Shops: %', yangsan_shop_count;
  RAISE NOTICE '  - Yangsan Courses: %', yangsan_course_count;
  RAISE NOTICE '  - Total Shops: %', total_shop_count;
  RAISE NOTICE '  - Total Courses: %', total_course_count;
END $$;
