-- ============================================================
-- Seed Sample Banner Data
-- Description: Insert sample banners for testing and demonstration
-- ============================================================

-- Insert 3 sample banners for the 'main' position
INSERT INTO public.banners (title, image_url, link_url, position, is_active, start_date, end_date, "order")
VALUES
  (
    '신규 가입 이벤트',
    'https://placehold.co/800x400/8B5CF6/FFFFFF?text=Banner+1%3A+Welcome+Event',
    '/events/welcome',
    'main',
    true,
    '2024-01-01',
    '2030-12-31',
    1
  ),
  (
    '봄맞이 특별 할인',
    'https://placehold.co/800x400/EC4899/FFFFFF?text=Banner+2%3A+Spring+Sale',
    '/promotions/spring',
    'main',
    true,
    '2024-01-01',
    '2030-12-31',
    2
  ),
  (
    '인기 코스 추천',
    'https://placehold.co/800x400/10B981/FFFFFF?text=Banner+3%3A+Popular+Courses',
    '/courses/popular',
    'main',
    true,
    '2024-01-01',
    '2030-12-31',
    3
  );

-- Verify insertion
DO $$
DECLARE
  banner_count INT;
BEGIN
  SELECT COUNT(*) INTO banner_count FROM public.banners WHERE position = 'main' AND is_active = true;
  RAISE NOTICE 'Successfully seeded % active main banners', banner_count;
END $$;
