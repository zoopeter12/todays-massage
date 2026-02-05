# Coupon System Documentation

## Overview

A complete coupon/discount system for the massage booking platform, allowing shop owners to create promotional coupons and customers to download and use them for discounts.

## Features

### For Customers
- **Browse Coupons**: View available coupons on shop detail pages
- **Download Coupons**: Download coupons to personal coupon wallet
- **Coupon Wallet**: Manage downloaded coupons (available, used, expired)
- **Apply Discounts**: Select and apply coupons during booking
- **Automatic Validation**: System validates coupon eligibility and expiration

### For Shop Owners (Partners)
- **Create Coupons**: Generate promotional coupons with various options
- **Manage Coupons**: Edit, activate/deactivate, and delete coupons
- **Usage Tracking**: Monitor coupon usage and remaining quota
- **Flexible Discount Types**: Percentage or fixed amount discounts

## Database Schema

### `coupons` Table
```sql
- id: UUID (PK)
- shop_id: UUID (FK -> shops)
- name: VARCHAR(255)
- discount_type: ENUM('percent', 'fixed')
- discount_value: INTEGER
- min_price: INTEGER (minimum purchase amount)
- max_discount: INTEGER (max discount for percent type)
- usage_limit: INTEGER (NULL = unlimited)
- used_count: INTEGER
- valid_from: TIMESTAMP
- valid_until: TIMESTAMP
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `user_coupons` Table
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- coupon_id: UUID (FK -> coupons)
- used_at: TIMESTAMP (NULL if not used)
- reservation_id: UUID (FK -> reservations)
- created_at: TIMESTAMP
```

## Discount Logic

### Percentage Discount
```typescript
discount = (price * discount_value) / 100
if (max_discount) {
  discount = min(discount, max_discount)
}
```

### Fixed Amount Discount
```typescript
discount = discount_value
```

### Validation Rules
1. **Minimum Price**: `price >= min_price`
2. **Valid Period**: `NOW() between valid_from and valid_until`
3. **Quota Available**: `usage_limit IS NULL OR used_count < usage_limit`
4. **Active Status**: `is_active = true`
5. **Not Already Used**: `used_at IS NULL`

## File Structure

```
C:/a/
├── src/
│   ├── types/
│   │   └── coupons.ts                      # TypeScript interfaces
│   ├── lib/
│   │   └── api/
│   │       └── coupons.ts                  # API functions
│   ├── components/
│   │   └── customer/
│   │       ├── CouponList.tsx              # Shop coupon list
│   │       └── CouponSelector.tsx          # Coupon selection drawer
│   └── app/
│       ├── (customer)/
│       │   └── coupons/
│       │       └── page.tsx                # Customer coupon wallet
│       └── partner/
│           └── coupons/
│               └── page.tsx                # Partner coupon management
└── supabase/
    └── migrations/
        └── create_coupons_tables.sql       # Database schema
```

## Components

### Customer Components

#### `CouponList`
- Displays available coupons on shop detail page
- Shows discount amount, validity, and remaining quota
- Download button with loading state
- Badge showing "사용 가능" for already downloaded coupons

**Props:**
```typescript
{
  shopId: string;
}
```

#### `CouponSelector`
- Sheet/drawer for selecting coupon during booking
- Filters applicable coupons based on min_price
- Shows discount preview
- Radio group for selection

**Props:**
```typescript
{
  userId: string | null;
  shopId: string;
  originalPrice: number;
  selectedCoupon: UserCoupon | null;
  onSelectCoupon: (coupon: UserCoupon | null) => void;
  trigger?: React.ReactNode;
}
```

### Partner Components

#### `PartnerCouponsPage`
- Full coupon management interface
- Create/edit/delete coupons
- Toggle active/inactive status
- Usage statistics and progress bars
- Tabs for active/inactive coupons

## API Functions

### Customer API

#### `fetchShopCoupons(shopId: string)`
Fetch active coupons for a shop.

#### `fetchMyCoupons(userId: string)`
Fetch all coupons in user's wallet.

#### `downloadCoupon(userId: string, couponId: string)`
Download a coupon to user's wallet.

#### `getApplicableCoupons(userId: string, shopId: string, price: number)`
Get user's coupons that can be applied to a booking.

#### `calculateDiscount(coupon: Coupon, originalPrice: number)`
Calculate discount amount for a coupon and price.

#### `useCoupon(userCouponId: string, reservationId: string)`
Mark a coupon as used for a reservation.

### Partner API

#### `fetchPartnerCoupons(shopId: string)`
Fetch all coupons for partner's shop.

#### `createCoupon(shopId: string, formData: CouponFormData)`
Create a new coupon.

#### `updateCoupon(couponId: string, updates: Partial<CouponFormData>)`
Update an existing coupon.

#### `deleteCoupon(couponId: string)`
Delete a coupon.

## Usage Examples

### Display Coupons on Shop Page

```tsx
import { CouponList } from '@/components/customer/CouponList';

<CouponList shopId={shop.id} />
```

### Select Coupon During Booking

```tsx
import { CouponSelector } from '@/components/customer/CouponSelector';

const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);

<CouponSelector
  userId={user?.id || null}
  shopId={shop.id}
  originalPrice={course.price_discount || course.price_original}
  selectedCoupon={selectedCoupon}
  onSelectCoupon={setSelectedCoupon}
/>
```

### Calculate Final Price

```typescript
import { calculateDiscount } from '@/lib/api/coupons';

const discount = selectedCoupon?.coupon
  ? calculateDiscount(selectedCoupon.coupon, originalPrice)
  : 0;
const finalPrice = originalPrice - discount;
```

## Security (RLS Policies)

### Coupons Table
- **SELECT**: Anyone can view active, non-expired coupons
- **ALL**: Shop owners can manage their own coupons

### User Coupons Table
- **SELECT**: Users view their own coupons
- **INSERT**: Users can download coupons
- **UPDATE**: Users can mark coupons as used
- **SELECT**: Shop owners can view usage of their coupons

## Database Triggers

### `increment_coupon_used_count`
Automatically increments `coupons.used_count` when a user coupon is marked as used.

### `update_coupons_updated_at`
Updates `coupons.updated_at` timestamp on every update.

## Design Features

### Coupon Card Design
- **Border**: Dashed border with primary color
- **Background**: Gradient from primary/5 to transparent
- **Decorative Circles**: Perforation effect on left and right edges
- **Typography**: Large discount value, clear validity period
- **Icons**: Ticket icon for coupon branding

### Color Scheme
- Primary color for discount amounts and active elements
- Muted foreground for secondary information
- Badge colors for status (available, used, expired)

## Integration with Booking Flow

1. Customer browses shop and views coupons
2. Customer downloads desired coupons
3. During booking, customer selects applicable coupon
4. System calculates discount and shows final price
5. Payment is processed with discounted amount
6. Coupon is marked as used and linked to reservation

## Future Enhancements

- [ ] First-time user coupons (auto-issued)
- [ ] Referral coupons
- [ ] Birthday/special occasion coupons
- [ ] Coupon analytics dashboard for partners
- [ ] Push notifications for expiring coupons
- [ ] Coupon sharing/gifting
- [ ] Bulk coupon operations
- [ ] Coupon templates for quick creation
- [ ] A/B testing for coupon effectiveness

## Testing Checklist

- [ ] Create coupon (percent type)
- [ ] Create coupon (fixed type)
- [ ] Download coupon as customer
- [ ] Prevent duplicate downloads
- [ ] Apply coupon with min_price validation
- [ ] Calculate discount correctly (percent with max_discount)
- [ ] Calculate discount correctly (fixed)
- [ ] Use coupon in booking
- [ ] Verify used_count increment
- [ ] Check expired coupons filtering
- [ ] Test usage_limit (sold out state)
- [ ] Toggle coupon active/inactive
- [ ] Edit coupon
- [ ] Delete coupon
- [ ] RLS: Users can't see other users' coupons
- [ ] RLS: Users can't modify other users' coupons
- [ ] RLS: Partners can only manage their own coupons

## Performance Considerations

- **Indexes**: Created on shop_id, is_active, valid_until, user_id, coupon_id
- **Query Optimization**: Filters applied at database level
- **Caching**: React Query caches coupon data with appropriate invalidation
- **Pagination**: Consider adding for shops with many coupons

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support in dialogs and forms
- Screen reader friendly coupon information
- Clear focus indicators
- Sufficient color contrast for discount amounts

## Monitoring

Key metrics to track:
- Coupon download rate
- Coupon usage rate (used / downloaded)
- Average discount per booking
- Most popular coupons
- Expired unused coupons
- Revenue impact of coupons
