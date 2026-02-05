# Coupon System Testing Guide

## Setup

### 1. Database Migration

Run the database migration to create tables:

```bash
# Apply migration
supabase db push

# Or manually run the SQL file
psql -d your_database < supabase/migrations/create_coupons_tables.sql
```

### 2. Seed Sample Data

Insert sample coupons for testing:

```bash
# Update shop_id in the seed file first
# Then run:
psql -d your_database < supabase/seed/sample_coupons.sql
```

### 3. Verify Installation

Check that tables were created:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('coupons', 'user_coupons');
```

## Test Scenarios

### Partner (Shop Owner) Tests

#### Test 1: Create Percentage Coupon
1. Navigate to `/partner/coupons`
2. Click "쿠폰 생성"
3. Fill in form:
   - Name: "테스트 20% 할인"
   - Type: "퍼센트 할인"
   - Value: 20
   - Min price: 30000
   - Max discount: 10000
   - Usage limit: 50
   - Valid until: 30 days from now
4. Click "생성"
5. **Expected**: Coupon appears in active list

#### Test 2: Create Fixed Amount Coupon
1. Click "쿠폰 생성"
2. Fill in form:
   - Name: "5천원 할인"
   - Type: "정액 할인"
   - Value: 5000
   - Min price: 20000
   - Usage limit: (empty - unlimited)
3. Click "생성"
4. **Expected**: Coupon created with no usage limit shown

#### Test 3: Edit Coupon
1. Click edit button on a coupon
2. Change name and discount value
3. Click "수정"
4. **Expected**: Changes are saved and displayed

#### Test 4: Toggle Active/Inactive
1. Click "비활성화" on an active coupon
2. **Expected**: Coupon moves to "비활성 쿠폰" tab
3. Click "활성화"
4. **Expected**: Coupon returns to "활성 쿠폰" tab

#### Test 5: Delete Coupon
1. Click delete button on a coupon
2. Confirm deletion in dialog
3. **Expected**: Coupon is removed from list

#### Test 6: View Usage Statistics
1. Create a coupon with usage_limit: 10
2. **Expected**: Progress bar shows 0/10
3. Have users download and use coupons
4. **Expected**: Progress bar updates, used_count increments

### Customer Tests

#### Test 7: View Shop Coupons
1. Navigate to a shop detail page
2. Scroll to coupons section
3. **Expected**: Active, non-expired coupons are displayed
4. **Expected**: Coupon cards show:
   - Discount amount prominently
   - Validity period
   - Remaining quota (if limited)
   - Download button

#### Test 8: Download Coupon (Guest)
1. As non-logged-in user, click "다운받기"
2. **Expected**: "로그인 필요" message or redirect to login

#### Test 9: Download Coupon (Logged In)
1. Log in as customer
2. Click "다운받기" on a coupon
3. **Expected**:
   - Toast: "쿠폰이 다운로드되었습니다!"
   - Button changes to "사용 가능" badge
   - Coupon appears in `/coupons` page

#### Test 10: Prevent Duplicate Download
1. Try to download same coupon again
2. **Expected**: Error toast "이미 다운로드한 쿠폰입니다."

#### Test 11: Download Sold Out Coupon
1. Find coupon with usage_limit = used_count
2. Try to download
3. **Expected**: Button disabled, shows "품절" badge

#### Test 12: View Coupon Wallet
1. Navigate to `/coupons`
2. **Expected**: Three tabs with correct categorization:
   - **사용 가능**: Unused, non-expired coupons
   - **사용 완료**: Coupons with used_at set
   - **만료**: Coupons past valid_until

#### Test 13: Select Coupon During Booking
1. Start booking flow for a course
2. Click coupon selector
3. **Expected**: Only applicable coupons shown (min_price <= course price)
4. Select a coupon
5. **Expected**:
   - Discount preview shown
   - Final price updated
   - Sheet closes

#### Test 14: Discount Calculation (Percentage)
1. Course price: 50,000원
2. Coupon: 20% off, max 10,000원
3. **Expected**:
   - Discount: 10,000원 (capped)
   - Final: 40,000원

#### Test 15: Discount Calculation (Fixed)
1. Course price: 30,000원
2. Coupon: 5,000원 off
3. **Expected**:
   - Discount: 5,000원
   - Final: 25,000원

#### Test 16: Min Price Validation
1. Course price: 15,000원
2. Coupon: min_price 20,000원
3. **Expected**: Coupon not shown in selector

#### Test 17: Use Coupon in Booking
1. Select coupon during booking
2. Complete payment
3. **Expected**:
   - Coupon marked as used (used_at set)
   - Coupon linked to reservation (reservation_id set)
   - Coupon moves to "사용 완료" tab
   - Shop's used_count incremented

#### Test 18: Expired Coupon Filtering
1. Wait for a coupon to expire (or set valid_until to past)
2. **Expected**:
   - Not shown in shop coupon list
   - Not shown in coupon selector
   - Appears in "만료" tab in wallet

## Database Validation Tests

### Test 19: Trigger - Increment Used Count
```sql
-- Before
SELECT used_count FROM coupons WHERE id = 'COUPON_ID';

-- User uses coupon
UPDATE user_coupons
SET used_at = NOW(), reservation_id = 'RESERVATION_ID'
WHERE id = 'USER_COUPON_ID';

-- After
SELECT used_count FROM coupons WHERE id = 'COUPON_ID';
-- Expected: Incremented by 1
```

### Test 20: Constraint - Usage Count Limit
```sql
-- Try to set used_count > usage_limit
UPDATE coupons
SET used_count = 11
WHERE usage_limit = 10;

-- Expected: Error due to CHECK constraint
```

### Test 21: Constraint - Unique User Coupon
```sql
-- Try to insert duplicate user coupon
INSERT INTO user_coupons (user_id, coupon_id)
VALUES ('USER_ID', 'COUPON_ID');

INSERT INTO user_coupons (user_id, coupon_id)
VALUES ('USER_ID', 'COUPON_ID');

-- Expected: Second insert fails with unique constraint violation
```

### Test 22: RLS - User Cannot See Other Users' Coupons
```sql
-- As User A, try to query User B's coupons
SET request.jwt.claims.sub = 'USER_A_ID';
SELECT * FROM user_coupons WHERE user_id = 'USER_B_ID';

-- Expected: Empty result (RLS blocks it)
```

### Test 23: RLS - Shop Owner Can View Own Coupon Usage
```sql
-- As shop owner
SET request.jwt.claims.sub = 'SHOP_OWNER_USER_ID';
SELECT * FROM user_coupons
WHERE coupon_id IN (
  SELECT id FROM coupons WHERE shop_id IN (
    SELECT id FROM shops WHERE user_id = current_setting('request.jwt.claims.sub')::uuid
  )
);

-- Expected: Can see all user_coupons for their shop's coupons
```

## Edge Cases

### Test 24: Coupon with No Min Price
1. Create coupon with min_price = 0
2. **Expected**: Applicable to any booking amount

### Test 25: Percentage > 100%
1. Try to create coupon with discount_value = 150 (percent type)
2. **Expected**: Should be prevented by application validation

### Test 26: Discount Exceeds Original Price
1. Course: 10,000원
2. Fixed coupon: 15,000원
3. **Expected**: Discount capped at 10,000원, final price = 0원

### Test 27: Multiple Coupons (Not Allowed)
1. Try to select multiple coupons for single booking
2. **Expected**: Only one coupon can be selected (radio group)

### Test 28: Concurrent Downloads (Race Condition)
1. Two users download last remaining coupon simultaneously
2. **Expected**: Only one succeeds, other gets "품절" error

### Test 29: Expired but Unused Coupon
1. User downloads coupon
2. Coupon expires before use
3. **Expected**:
   - Cannot be used in booking
   - Shows in "만료" tab

### Test 30: Invalid Date Range
1. Try to create coupon with valid_until < valid_from
2. **Expected**: Database CHECK constraint error

## Performance Tests

### Test 31: Large Coupon List
1. Create 100+ coupons for a shop
2. Load shop page
3. **Expected**: Coupons load quickly with proper indexing

### Test 32: Large User Coupon Wallet
1. Download 50+ coupons as a user
2. Navigate to `/coupons`
3. **Expected**: Fast categorization and rendering

### Test 33: Concurrent Coupon Usage
1. 10 users use same coupon simultaneously
2. **Expected**: All succeed, used_count = 10

## UI/UX Tests

### Test 34: Mobile Responsive
1. Test all coupon pages on mobile viewport
2. **Expected**:
   - Coupon cards stack properly
   - Forms are usable
   - Drawer/sheet works on mobile

### Test 35: Loading States
1. Network throttling
2. **Expected**:
   - Loading spinners shown
   - Buttons disabled during mutations
   - Skeleton loaders for content

### Test 36: Error Handling
1. Disconnect network
2. Try to download coupon
3. **Expected**: Error toast with helpful message

### Test 37: Empty States
1. Shop with no coupons
2. **Expected**: Friendly empty state with icon

1. User with no downloaded coupons
2. **Expected**: Helpful message suggesting to browse shops

### Test 38: Accessibility
1. Keyboard navigation through coupon forms
2. Screen reader testing
3. **Expected**:
   - All interactive elements focusable
   - Proper ARIA labels
   - Semantic HTML

## Integration Tests

### Test 39: End-to-End Booking with Coupon
1. Partner creates coupon
2. Customer downloads coupon
3. Customer books with coupon
4. Payment processed with discount
5. Coupon marked as used
6. **Expected**: Full flow completes successfully

### Test 40: Coupon Analytics
1. Create coupon
2. Multiple users download
3. Some users use it
4. **Expected**: Partner can see:
   - Total downloads
   - Usage rate
   - Remaining quota

## Regression Tests

Run these after any code changes:

- [ ] All CRUD operations work
- [ ] RLS policies enforced
- [ ] Triggers fire correctly
- [ ] Discount calculations accurate
- [ ] UI renders without errors
- [ ] No console errors
- [ ] Type checking passes
- [ ] Database constraints enforced

## Automated Testing Script

```typescript
// Example Jest/Vitest test
describe('Coupon System', () => {
  test('calculateDiscount - percentage with max', () => {
    const coupon: Coupon = {
      discount_type: 'percent',
      discount_value: 20,
      max_discount: 10000,
      min_price: 0,
      // ... other fields
    };

    const discount = calculateDiscount(coupon, 60000);
    expect(discount).toBe(10000); // 20% of 60000 = 12000, capped at 10000
  });

  test('calculateDiscount - fixed amount', () => {
    const coupon: Coupon = {
      discount_type: 'fixed',
      discount_value: 5000,
      min_price: 0,
      // ... other fields
    };

    const discount = calculateDiscount(coupon, 30000);
    expect(discount).toBe(5000);
  });

  test('calculateDiscount - below min price', () => {
    const coupon: Coupon = {
      discount_type: 'percent',
      discount_value: 10,
      min_price: 30000,
      // ... other fields
    };

    const discount = calculateDiscount(coupon, 20000);
    expect(discount).toBe(0);
  });
});
```

## Monitoring Checklist

After deployment, monitor:

- [ ] Coupon creation rate
- [ ] Download success rate
- [ ] Usage rate (used / downloaded)
- [ ] Error rates (API calls)
- [ ] Performance metrics (page load, API latency)
- [ ] User feedback/support tickets

## Known Issues / Limitations

Document any known issues here:

1. **Multiple coupons**: Currently only one coupon per booking
2. **Coupon stacking**: Not supported
3. **Automatic coupons**: Must be manually downloaded
4. **Notification**: No automatic notifications for expiring coupons

## Future Testing Needs

As new features are added:

- [ ] Coupon templates
- [ ] Bulk operations
- [ ] Analytics dashboard
- [ ] Referral coupons
- [ ] Auto-applied coupons
- [ ] Coupon sharing/gifting
