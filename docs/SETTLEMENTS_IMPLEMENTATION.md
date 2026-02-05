# Settlements Implementation

## Overview
This document describes the real Supabase integration for the admin settlements page, replacing the previous mock data implementation.

## Database Structure

### Tables
- **settlements**: Stores settlement records for each shop
  - `id`: UUID (primary key)
  - `shop_id`: UUID (foreign key to shops)
  - `period_start`: DATE
  - `period_end`: DATE
  - `total_sales`: BIGINT (total revenue in period)
  - `platform_fee`: BIGINT (10% platform fee)
  - `net_amount`: BIGINT (amount to be paid to partner)
  - `status`: TEXT ('pending' | 'completed')
  - `paid_at`: TIMESTAMPTZ (when settlement was completed)
  - `created_at`: TIMESTAMPTZ
  - `updated_at`: TIMESTAMPTZ

### Database Functions

#### 1. `generate_settlement()`
Generates a settlement record for a specific shop and period.

```sql
SELECT generate_settlement(
  p_shop_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_platform_fee_rate NUMERIC DEFAULT 0.10
)
```

**How it works:**
1. Calculates total sales from completed reservations in the period
2. Applies platform fee rate (default 10%)
3. Creates or updates settlement record
4. Returns settlement ID

**Example:**
```sql
SELECT generate_settlement(
  'shop-uuid-here'::UUID,
  '2026-01-01'::DATE,
  '2026-01-31'::DATE,
  0.10
);
```

#### 2. `complete_settlement()`
Marks a settlement as completed and records the payment timestamp.

```sql
SELECT complete_settlement(p_settlement_id UUID)
```

**How it works:**
1. Updates settlement status from 'pending' to 'completed'
2. Sets `paid_at` to current timestamp
3. Returns true if successful

**Example:**
```sql
SELECT complete_settlement('settlement-uuid-here'::UUID);
```

#### 3. `get_sales_stats()`
Retrieves detailed sales statistics for a shop.

```sql
SELECT get_sales_stats(
  p_shop_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
```

Returns JSON with:
- Daily sales breakdown
- Weekly sales breakdown
- Monthly sales breakdown
- Sales by course
- Sales by hour of day

## API Functions

Located in `src/lib/api/settlements.ts`:

### 1. `fetchAllSettlements(statusFilter)`
Fetches all settlements with shop details (Admin only).

```typescript
const { settlements, stats } = await fetchAllSettlements('all' | 'pending' | 'completed');
```

**Returns:**
- `settlements`: Array of settlement records with shop names
- `stats`: Aggregated statistics (totalSales, totalFee, pendingAmount, completedAmount)

### 2. `generateSettlement(shopId, periodStart, periodEnd, platformFeeRate)`
Generates a settlement for a specific shop and period.

```typescript
const settlementId = await generateSettlement(
  'shop-uuid',
  '2026-01-01',
  '2026-01-31',
  0.10
);
```

### 3. `completeSettlement(settlementId)`
Completes a pending settlement.

```typescript
const success = await completeSettlement('settlement-uuid');
```

### 4. `generateAllShopsSettlements(periodStart, periodEnd)`
Generates settlements for all shops at once (batch operation).

```typescript
const count = await generateAllShopsSettlements('2026-01-01', '2026-01-31');
// Returns number of settlements created
```

### 5. `getSettlementById(settlementId)`
Fetches detailed information for a single settlement.

```typescript
const settlement = await getSettlementById('settlement-uuid');
```

## Admin Page

Located in `src/app/(admin)/admin/settlements/page.tsx`.

### Features

1. **Real-time Statistics Cards**
   - Total Sales (all settlements)
   - Platform Fee (10% of total sales)
   - Pending Amount (sum of pending settlements)
   - Completed Amount (sum of completed settlements)

2. **Settlement Filtering**
   - By status (all, pending, completed)
   - By shop name (search)

3. **Settlement Table**
   - Shop name
   - Settlement period
   - Total sales
   - Platform fee (10%)
   - Net amount to be paid
   - Status badge
   - Action buttons (View Details, Process)

4. **Settlement Processing**
   - Click "정산" button on pending settlements
   - Confirm payment details
   - Process settlement (status changes to completed)
   - Timestamp recorded

## How to Use

### For Admins

#### Monthly Settlement Process

1. **Generate Settlements** (end of month)
   ```typescript
   // Generate settlements for all shops for January 2026
   await generateAllShopsSettlements('2026-01-01', '2026-01-31');
   ```

2. **Review Settlements**
   - Navigate to Admin → Settlements page
   - Review all pending settlements
   - Check amounts and shop details

3. **Process Payments**
   - Click "정산" button on each pending settlement
   - Verify payment details
   - Confirm settlement processing
   - Status changes to "completed"

4. **Export Records**
   - Click "내역 다운로드" button
   - Generate CSV/Excel for accounting

### For Partners

Partners can view their own settlements in their partner dashboard:
- `fetchSettlements(shopId, page, limit)` - paginated view
- `fetchSettlementDetail(id)` - detailed breakdown
- Includes booking details that make up the settlement

## Data Flow

```
1. User makes a reservation
   ↓
2. Reservation is completed (status = 'completed')
   ↓
3. Admin generates settlements for period
   → generate_settlement() aggregates completed reservations
   → Calculates: total_sales, platform_fee, net_amount
   ↓
4. Settlement record created (status = 'pending')
   ↓
5. Admin reviews and processes settlement
   → complete_settlement() updates status to 'completed'
   → Records paid_at timestamp
   ↓
6. Partner receives payment
```

## Platform Fee Structure

Currently set to **10%** of total sales.

To change the platform fee rate:
1. Update the default value in database function
2. Pass custom rate when calling `generateSettlement()`

```typescript
// Custom 15% fee rate
await generateSettlement(shopId, periodStart, periodEnd, 0.15);
```

## Security

### Row Level Security (RLS)

**settlements table:**
- Partners can SELECT their own shop's settlements only
- Only service_role can INSERT/UPDATE (system-generated)

**Implementation:**
```sql
-- Partners can view their own settlements
CREATE POLICY "settlements_select_own_shop" ON settlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = settlements.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Only system can create/update settlements
CREATE POLICY "settlements_insert_service" ON settlements
  FOR INSERT WITH CHECK (auth.uid() IS NULL);
```

## Testing

Use the provided test script `test-settlements.sql` to verify:
1. Tables exist
2. Functions exist
3. Current settlement data
4. Sample reservation data

Run with:
```bash
psql -h your-supabase-host -U postgres -d postgres -f test-settlements.sql
```

## Migration

The settlements system was created in migration:
- `supabase/migrations/20260125100000_create_settlements_table.sql`

Includes:
- Table creation
- Indexes for performance
- RLS policies
- Trigger functions
- Business logic functions (generate_settlement, complete_settlement, get_sales_stats)

## Future Enhancements

### Recommended Features

1. **Bank Account Management**
   - Add bank details to shops table
   - Display real bank info instead of mock data

2. **Automated Settlement Generation**
   - Cron job to auto-generate settlements monthly
   - Email notifications to admins

3. **Settlement Reports**
   - CSV/Excel export functionality
   - PDF invoices for partners

4. **Dispute Management**
   - Allow partners to flag settlement discrepancies
   - Admin review and adjustment workflow

5. **Multi-currency Support**
   - Support international payments
   - Currency conversion rates

6. **Payment Integration**
   - Direct bank transfer API integration
   - Automatic payment processing

7. **Detailed Breakdown**
   - Show individual reservations in settlement
   - Refund tracking
   - Coupon/discount impact

## Troubleshooting

### No settlements showing up

**Cause:** No completed reservations exist in the database.

**Solution:**
1. Check if reservations exist: `SELECT COUNT(*) FROM reservations WHERE status = 'completed';`
2. If none, create test reservations or change status of existing ones
3. Run `generate_settlement()` function

### Settlement amount is 0

**Cause:** Reservations don't have completed status or dates don't match.

**Solution:**
1. Verify reservation dates are within settlement period
2. Ensure reservation status is exactly 'completed'
3. Check courses have valid prices

### Can't complete settlement

**Cause:** RLS policy prevents direct updates, must use function.

**Solution:**
Always use `complete_settlement()` function instead of direct UPDATE:
```typescript
// ✅ Correct
await completeSettlement(settlementId);

// ❌ Incorrect
await supabase.from('settlements').update({ status: 'completed' });
```

## Support

For issues or questions:
1. Check migration file for schema details
2. Review test script for sample queries
3. Examine API functions for correct usage patterns
4. Check browser console for error messages
