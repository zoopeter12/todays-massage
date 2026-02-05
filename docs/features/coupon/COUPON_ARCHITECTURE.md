# Coupon System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      COUPON SYSTEM                              │
│                                                                 │
│  ┌──────────────┐                        ┌──────────────┐      │
│  │   CUSTOMER   │                        │   PARTNER    │      │
│  │   FEATURES   │                        │   FEATURES   │      │
│  └──────────────┘                        └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CUSTOMER SIDE                          PARTNER SIDE                   │
│  ┌──────────────────┐                   ┌──────────────────┐          │
│  │ Shop Detail Page │                   │ Partner Dashboard│          │
│  │   CouponList     │                   │   Coupon Mgmt    │          │
│  └────────┬─────────┘                   └────────┬─────────┘          │
│           │                                      │                     │
│           ▼                                      ▼                     │
│  ┌──────────────────┐                   ┌──────────────────┐          │
│  │  Coupon Wallet   │                   │  Create/Edit     │          │
│  │   /coupons       │                   │  /partner/coupons│          │
│  └────────┬─────────┘                   └────────┬─────────┘          │
│           │                                      │                     │
│           ▼                                      ▼                     │
│  ┌──────────────────┐                   ┌──────────────────┐          │
│  │ Booking Flow     │                   │  Usage Analytics │          │
│  │ CouponSelector   │                   │  Stats Dashboard │          │
│  └────────┬─────────┘                   └────────┬─────────┘          │
│           │                                      │                     │
└───────────┼──────────────────────────────────────┼─────────────────────┘
            │                                      │
            │                                      │
┌───────────┼──────────────────────────────────────┼─────────────────────┐
│           │              API LAYER               │                     │
├───────────┼──────────────────────────────────────┼─────────────────────┤
│           ▼                                      ▼                     │
│  ┌──────────────────────┐            ┌──────────────────────┐        │
│  │ Customer API         │            │ Partner API          │        │
│  │                      │            │                      │        │
│  │ - fetchShopCoupons   │            │ - fetchPartnerCoupons│        │
│  │ - fetchMyCoupons     │            │ - createCoupon       │        │
│  │ - downloadCoupon     │            │ - updateCoupon       │        │
│  │ - getApplicable      │            │ - deleteCoupon       │        │
│  │ - useCoupon          │            │                      │        │
│  │ - calculateDiscount  │            │                      │        │
│  └──────────┬───────────┘            └──────────┬───────────┘        │
│             │                                   │                     │
└─────────────┼───────────────────────────────────┼─────────────────────┘
              │                                   │
              │                                   │
┌─────────────┼───────────────────────────────────┼─────────────────────┐
│             │         DATABASE LAYER            │                     │
├─────────────┼───────────────────────────────────┼─────────────────────┤
│             ▼                                   ▼                     │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                 SUPABASE / POSTGRESQL                    │        │
│  │                                                          │        │
│  │  ┌──────────────┐              ┌──────────────────┐    │        │
│  │  │   coupons    │──────────────│  user_coupons    │    │        │
│  │  │              │  1        M  │                  │    │        │
│  │  │ - id         │              │ - id             │    │        │
│  │  │ - shop_id    │              │ - user_id        │    │        │
│  │  │ - name       │              │ - coupon_id      │    │        │
│  │  │ - type       │              │ - used_at        │    │        │
│  │  │ - value      │              │ - reservation_id │    │        │
│  │  │ - min_price  │              │                  │    │        │
│  │  │ - max_disc   │              │                  │    │        │
│  │  │ - usage_limit│              │                  │    │        │
│  │  │ - used_count │◀─ Trigger ───┤                  │    │        │
│  │  │ - valid_from │              │                  │    │        │
│  │  │ - valid_until│              │                  │    │        │
│  │  │ - is_active  │              │                  │    │        │
│  │  └──────────────┘              └──────────────────┘    │        │
│  │                                                          │        │
│  │  TRIGGERS:                                              │        │
│  │  - increment_coupon_used_count                          │        │
│  │  - update_coupons_updated_at                            │        │
│  │                                                          │        │
│  │  RLS POLICIES:                                          │        │
│  │  - Public view active coupons                           │        │
│  │  - Users manage own coupons                             │        │
│  │  - Partners manage shop coupons                         │        │
│  └──────────────────────────────────────────────────────────┘        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOMER FLOW                              │
└─────────────────────────────────────────────────────────────────┘

Shop Detail Page
    └── CouponList
            ├── CouponCard (x N)
            │       ├── Ticket Icon
            │       ├── Discount Display
            │       ├── Validity Info
            │       ├── Quota Badge
            │       └── Download Button
            └── Empty State

Coupon Wallet (/coupons)
    └── Tabs
            ├── Available Tab
            │       └── MyCouponCard (x N)
            ├── Used Tab
            │       └── MyCouponCard (x N)
            └── Expired Tab
                    └── MyCouponCard (x N)

Booking Flow
    └── CouponSelector (Sheet)
            ├── RadioGroup
            │       ├── "No Coupon" Option
            │       └── CouponOption (x N)
            │               ├── Coupon Details
            │               └── Discount Preview
            └── Final Price Summary

┌─────────────────────────────────────────────────────────────────┐
│                      PARTNER FLOW                               │
└─────────────────────────────────────────────────────────────────┘

Partner Coupons (/partner/coupons)
    ├── Header
    │       └── Create Button
    ├── Tabs
    │       ├── Active Tab
    │       │       └── CouponCard (x N)
    │       └── Inactive Tab
    │               └── CouponCard (x N)
    ├── Create Dialog
    │       └── CouponForm
    ├── Edit Dialog
    │       └── CouponForm
    └── Delete Confirmation
            └── AlertDialog
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT QUERY CACHE                            │
└─────────────────────────────────────────────────────────────────┘

Query Keys:
    ['shop-coupons', shopId]           → Shop's active coupons
    ['my-coupons', userId]             → User's coupon wallet
    ['applicable-coupons', params]     → Bookable coupons
    ['partner-coupons', shopId]        → Partner's all coupons

Mutations:
    downloadCoupon
        ├── Optimistic Update: Add to local state
        ├── On Success: Invalidate ['shop-coupons'], ['my-coupons']
        └── On Error: Rollback, show toast

    createCoupon
        ├── On Success: Invalidate ['partner-coupons']
        └── On Error: Show toast

    updateCoupon
        ├── Optimistic Update: Update in cache
        ├── On Success: Invalidate ['partner-coupons']
        └── On Error: Rollback, show toast

    deleteCoupon
        ├── Optimistic Update: Remove from cache
        ├── On Success: Invalidate ['partner-coupons']
        └── On Error: Rollback, show toast

    useCoupon
        ├── On Success: Invalidate ['my-coupons']
        └── On Error: Show toast
```

## Discount Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 DISCOUNT CALCULATION LOGIC                      │
└─────────────────────────────────────────────────────────────────┘

Input: Coupon + Original Price
    │
    ▼
┌────────────────────┐
│ Validate Min Price │  price < min_price? → Return 0
└────────┬───────────┘
         │ ✓
         ▼
┌────────────────────┐
│  Check Discount    │  Type: 'percent' or 'fixed'?
│      Type          │
└────────┬───────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    PERCENT           FIXED
┌────────────┐    ┌────────────┐
│ Calculate: │    │ discount = │
│ (price *   │    │   value    │
│  value)/100│    └─────┬──────┘
└─────┬──────┘          │
      │                 │
      ▼                 │
┌────────────┐          │
│ Apply Max? │          │
│ min(disc,  │          │
│  max_disc) │          │
└─────┬──────┘          │
      │                 │
      └────────┬────────┘
               │
               ▼
        ┌─────────────┐
        │ Cap at      │
        │ price       │
        │ (never > 0) │
        └──────┬──────┘
               │
               ▼
          Final Discount
```

## Booking Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BOOKING WITH COUPON                          │
└─────────────────────────────────────────────────────────────────┘

1. User Browses Shop
    └── Views available coupons
        └── Downloads desired coupon
            └── Added to user_coupons table

2. User Starts Booking
    └── Selects course
        └── Opens CouponSelector
            └── Fetches applicable coupons
                ├── Filter by min_price
                ├── Filter by validity
                └── Filter by not-used

3. User Selects Coupon
    └── Calculates discount
        └── Shows final price
            └── User confirms

4. Payment Processing
    └── Amount = original - discount
        └── Payment succeeds
            └── Mark coupon as used
                ├── Set used_at = NOW()
                ├── Set reservation_id
                └── Trigger increments used_count

5. Confirmation
    └── Booking created
        └── Coupon moved to "Used" tab
            └── Receipt shows discount applied
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  ROW LEVEL SECURITY (RLS)                       │
└─────────────────────────────────────────────────────────────────┘

coupons TABLE:
    SELECT:
        ├── Anyone: WHERE is_active = true AND valid_until >= NOW()
        └── Partners: WHERE shop_id IN (user's shops)

    INSERT/UPDATE/DELETE:
        └── Partners: WHERE shop_id IN (user's shops)

user_coupons TABLE:
    SELECT:
        ├── Users: WHERE user_id = auth.uid()
        └── Partners: WHERE coupon_id IN (user's shop's coupons)

    INSERT:
        └── Users: WITH CHECK user_id = auth.uid()

    UPDATE:
        └── Users: WHERE user_id = auth.uid()
                   WITH CHECK user_id = auth.uid()

    DELETE:
        └── Blocked (coupons should not be deleted after download)

DATABASE CONSTRAINTS:
    ├── CHECK: discount_value > 0
    ├── CHECK: min_price >= 0
    ├── CHECK: valid_until > valid_from
    ├── CHECK: used_count <= usage_limit
    ├── CHECK: used coupon has reservation_id
    └── UNIQUE: (user_id, coupon_id) - prevent duplicates
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│                   PERFORMANCE STRATEGY                          │
└─────────────────────────────────────────────────────────────────┘

DATABASE INDEXES:
    coupons:
        ├── idx_coupons_shop_id (shop_id)
        ├── idx_coupons_active (is_active) WHERE is_active = true
        └── idx_coupons_valid_until (valid_until)

    user_coupons:
        ├── idx_user_coupons_user_id (user_id)
        ├── idx_user_coupons_coupon_id (coupon_id)
        └── idx_user_coupons_used_at (used_at)

QUERY OPTIMIZATION:
    ├── Filter at database level (WHERE clauses)
    ├── Use indexes for fast lookups
    ├── Minimize JOINs where possible
    └── Use select() with specific columns

FRONTEND CACHING:
    ├── React Query automatic caching
    ├── Smart invalidation on mutations
    ├── Optimistic updates for instant UI
    └── Background refetching

LAZY LOADING:
    ├── Tabs load only when selected
    ├── Dialogs render only when opened
    └── Images lazy loaded
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING                              │
└─────────────────────────────────────────────────────────────────┘

VALIDATION LAYERS:

1. Frontend Validation:
    ├── Form validation (required fields)
    ├── Type checking (TypeScript)
    ├── Range validation (min/max values)
    └── Business rules (min_price check)

2. API Validation:
    ├── User authentication check
    ├── Coupon availability check
    ├── Quota remaining check
    └── Duplicate download check

3. Database Constraints:
    ├── CHECK constraints
    ├── FOREIGN KEY constraints
    ├── UNIQUE constraints
    └── NOT NULL constraints

ERROR MESSAGES:
    ├── User-friendly toast notifications
    ├── Specific error descriptions
    ├── Actionable suggestions
    └── Fallback generic messages

RECOVERY STRATEGIES:
    ├── Optimistic rollback on failure
    ├── Retry logic for network errors
    ├── Cache invalidation on errors
    └── Graceful degradation
```

## Monitoring & Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│                  KEY METRICS TO TRACK                           │
└─────────────────────────────────────────────────────────────────┘

CUSTOMER METRICS:
    ├── Coupon discovery rate (views / shop visits)
    ├── Download conversion (downloads / views)
    ├── Usage rate (used / downloaded)
    ├── Average time to use (used_at - created_at)
    └── Redemption by coupon type

PARTNER METRICS:
    ├── Coupons created per shop
    ├── Active campaigns
    ├── Most downloaded coupons
    ├── ROI per coupon (revenue vs discount)
    └── Customer acquisition via coupons

BUSINESS METRICS:
    ├── Total discount amount
    ├── Bookings with coupons vs without
    ├── Average order value (AOV) with coupons
    ├── Revenue impact
    └── Customer lifetime value (LTV)

TECHNICAL METRICS:
    ├── API response time
    ├── Query performance
    ├── Error rates
    ├── Cache hit ratio
    └── Database load
```

## Future Architecture Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                   SCALABILITY ROADMAP                           │
└─────────────────────────────────────────────────────────────────┘

PHASE 2:
    ├── Coupon templates for quick creation
    ├── Bulk coupon operations
    ├── Scheduled activation/deactivation
    ├── A/B testing framework
    └── Analytics dashboard

PHASE 3:
    ├── Auto-applied coupons (best match)
    ├── Personalized coupon recommendations
    ├── Machine learning for optimal pricing
    ├── Coupon sharing/referral system
    └── Integration with marketing automation

PHASE 4:
    ├── Multi-currency support
    ├── Geo-targeted coupons
    ├── Time-based restrictions (weekends, etc.)
    ├── Loyalty program integration
    └── Partner network cross-promotions
```

---

This architecture is designed for:
- ✅ **Scalability**: Handles growing user base and coupon volume
- ✅ **Performance**: Optimized queries and caching strategies
- ✅ **Security**: Multi-layer validation and RLS policies
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Extensibility**: Easy to add new features

**Last Updated**: 2026-01-25
