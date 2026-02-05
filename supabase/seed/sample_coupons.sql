-- Sample coupons for testing
-- Note: Replace shop_id values with actual UUIDs from your database

-- Example 1: Percentage discount with maximum cap
INSERT INTO coupons (
  shop_id,
  name,
  discount_type,
  discount_value,
  min_price,
  max_discount,
  usage_limit,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual shop_id
  '신규 회원 20% 할인',
  'percent',
  20,
  30000,
  10000,
  100,
  NOW(),
  NOW() + INTERVAL '30 days',
  true
);

-- Example 2: Fixed amount discount
INSERT INTO coupons (
  shop_id,
  name,
  discount_type,
  discount_value,
  min_price,
  max_discount,
  usage_limit,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual shop_id
  '5천원 즉시 할인',
  'fixed',
  5000,
  20000,
  NULL,
  50,
  NOW(),
  NOW() + INTERVAL '14 days',
  true
);

-- Example 3: VIP percentage discount without limit
INSERT INTO coupons (
  shop_id,
  name,
  discount_type,
  discount_value,
  min_price,
  max_discount,
  usage_limit,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual shop_id
  'VIP 고객 30% 특별 할인',
  'percent',
  30,
  50000,
  NULL,
  NULL, -- Unlimited
  NOW(),
  NOW() + INTERVAL '60 days',
  true
);

-- Example 4: First-time customer coupon
INSERT INTO coupons (
  shop_id,
  name,
  discount_type,
  discount_value,
  min_price,
  max_discount,
  usage_limit,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual shop_id
  '첫 방문 환영 쿠폰',
  'fixed',
  10000,
  40000,
  NULL,
  200,
  NOW(),
  NOW() + INTERVAL '90 days',
  true
);

-- Example 5: Weekend special
INSERT INTO coupons (
  shop_id,
  name,
  discount_type,
  discount_value,
  min_price,
  max_discount,
  usage_limit,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual shop_id
  '주말 특가 15% 할인',
  'percent',
  15,
  0,
  8000,
  NULL,
  NOW(),
  NOW() + INTERVAL '7 days',
  true
);

-- Example 6: Inactive/expired coupon for testing
INSERT INTO coupons (
  shop_id,
  name,
  discount_type,
  discount_value,
  min_price,
  max_discount,
  usage_limit,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual shop_id
  '종료된 이벤트 쿠폰',
  'percent',
  25,
  30000,
  15000,
  100,
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '1 day',
  false
);

-- Example 7: Nearly sold out coupon (for testing quota)
INSERT INTO coupons (
  shop_id,
  name,
  discount_type,
  discount_value,
  min_price,
  max_discount,
  usage_limit,
  used_count,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual shop_id
  '선착순 10명 특가',
  'fixed',
  15000,
  50000,
  NULL,
  10,
  8, -- Only 2 left!
  NOW(),
  NOW() + INTERVAL '3 days',
  true
);

-- Example 8: High-value percentage discount
INSERT INTO coupons (
  shop_id,
  name,
  discount_type,
  discount_value,
  min_price,
  max_discount,
  usage_limit,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual shop_id
  '프리미엄 코스 35% 할인',
  'percent',
  35,
  100000,
  30000,
  30,
  NOW(),
  NOW() + INTERVAL '45 days',
  true
);

-- Display inserted coupons
SELECT
  name,
  CASE
    WHEN discount_type = 'percent' THEN discount_value || '%'
    ELSE discount_value || '원'
  END as discount,
  min_price,
  max_discount,
  usage_limit,
  used_count,
  CASE WHEN usage_limit IS NOT NULL
    THEN usage_limit - used_count
    ELSE NULL
  END as remaining,
  valid_until::date as expires,
  is_active
FROM coupons
ORDER BY created_at DESC;
