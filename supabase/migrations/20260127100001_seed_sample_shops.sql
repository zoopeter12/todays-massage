-- ============================================================
-- Seed Sample Shops Migration
-- Date: 2027-01-27
-- Description: Insert sample shop data for banner fallback functionality
-- ============================================================

-- Insert 5 sample shops with diverse categories in Seoul locations
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
    '강남 프리미엄 스파',
    37.4979,
    127.0276,
    '서울특별시 강남구 테헤란로 123',
    '02-1234-5678',
    '스파/마사지',
    ARRAY[
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
    ],
    245,
    true,
    now() - interval '30 days'
  ),
  (
    '홍대 헤어살롱 블루',
    37.5563,
    126.9224,
    '서울특별시 마포구 홍익로 45',
    '02-2345-6789',
    '헤어살롱',
    ARRAY[
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
      'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800'
    ],
    512,
    true,
    now() - interval '60 days'
  ),
  (
    '여의도 네일아트',
    37.5219,
    126.9245,
    '서울특별시 영등포구 여의대로 88',
    '02-3456-7890',
    '네일아트',
    ARRAY[
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800',
      'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800',
      'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800'
    ],
    378,
    true,
    now() - interval '45 days'
  ),
  (
    '이태원 뷰티클리닉',
    37.5344,
    126.9944,
    '서울특별시 용산구 이태원로 234',
    '02-4567-8901',
    '피부관리',
    ARRAY[
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800'
    ],
    623,
    true,
    now() - interval '90 days'
  ),
  (
    '잠실 필라테스 스튜디오',
    37.5133,
    127.1028,
    '서울특별시 송파구 올림픽로 289',
    '02-5678-9012',
    '필라테스',
    ARRAY[
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800',
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800'
    ],
    189,
    true,
    now() - interval '15 days'
  );

-- Add sample courses for each shop
INSERT INTO courses (shop_id, name, price_original, price_discount, duration)
SELECT
  s.id,
  CASE s.category
    WHEN '스파/마사지' THEN '전신 아로마 마사지'
    WHEN '헤어살롱' THEN '커트 + 펌'
    WHEN '네일아트' THEN '젤네일 기본'
    WHEN '피부관리' THEN '프리미엄 안티에이징'
    WHEN '필라테스' THEN '1:1 개인 레슨'
  END,
  CASE s.category
    WHEN '스파/마사지' THEN 120000
    WHEN '헤어살롱' THEN 85000
    WHEN '네일아트' THEN 45000
    WHEN '피부관리' THEN 150000
    WHEN '필라테스' THEN 65000
  END,
  CASE s.category
    WHEN '스파/마사지' THEN 99000
    WHEN '헤어살롱' THEN 75000
    WHEN '네일아트' THEN 38000
    WHEN '피부관리' THEN 120000
    WHEN '필라테스' THEN 55000
  END,
  CASE s.category
    WHEN '스파/마사지' THEN 90
    WHEN '헤어살롱' THEN 120
    WHEN '네일아트' THEN 60
    WHEN '피부관리' THEN 75
    WHEN '필라테스' THEN 50
  END
FROM shops s
WHERE s.name IN (
  '강남 프리미엄 스파',
  '홍대 헤어살롱 블루',
  '여의도 네일아트',
  '이태원 뷰티클리닉',
  '잠실 필라테스 스튜디오'
);

-- Verify insertion
DO $$
DECLARE
  shop_count INT;
  course_count INT;
BEGIN
  SELECT COUNT(*) INTO shop_count FROM shops;
  SELECT COUNT(*) INTO course_count FROM courses;

  RAISE NOTICE 'Seed data inserted successfully:';
  RAISE NOTICE '  - Shops: %', shop_count;
  RAISE NOTICE '  - Courses: %', course_count;
END $$;
