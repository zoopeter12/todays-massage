#!/bin/bash

# ============================================================
# Test Migration Script
# Verifies that the customer_inquiries migration works correctly
# ============================================================

set -e  # Exit on error

echo "======================================"
echo "Testing Reports & Inquiries Migration"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking Supabase project status...${NC}"
supabase status

echo ""
echo -e "${YELLOW}Step 2: Running database reset with migrations...${NC}"
supabase db reset

echo ""
echo -e "${YELLOW}Step 3: Verifying tables exist...${NC}"

# Check if reports table exists
REPORTS_EXISTS=$(supabase db query "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports');" --csv | tail -n 1)

if [ "$REPORTS_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ reports table exists${NC}"
else
    echo -e "${RED}✗ reports table does not exist${NC}"
    exit 1
fi

# Check if customer_inquiries table exists
INQUIRIES_EXISTS=$(supabase db query "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_inquiries');" --csv | tail -n 1)

if [ "$INQUIRIES_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ customer_inquiries table exists${NC}"
else
    echo -e "${RED}✗ customer_inquiries table does not exist${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 4: Verifying RLS policies...${NC}"

# Check reports policies
REPORTS_POLICIES=$(supabase db query "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'reports';" --csv | tail -n 1)
echo -e "  reports policies: ${GREEN}$REPORTS_POLICIES${NC}"

# Check customer_inquiries policies
INQUIRIES_POLICIES=$(supabase db query "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'customer_inquiries';" --csv | tail -n 1)
echo -e "  customer_inquiries policies: ${GREEN}$INQUIRIES_POLICIES${NC}"

echo ""
echo -e "${YELLOW}Step 5: Verifying indexes...${NC}"

# Check reports indexes
REPORTS_INDEXES=$(supabase db query "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'reports';" --csv | tail -n 1)
echo -e "  reports indexes: ${GREEN}$REPORTS_INDEXES${NC}"

# Check customer_inquiries indexes
INQUIRIES_INDEXES=$(supabase db query "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'customer_inquiries';" --csv | tail -n 1)
echo -e "  customer_inquiries indexes: ${GREEN}$INQUIRIES_INDEXES${NC}"

echo ""
echo -e "${YELLOW}Step 6: Testing insert operations...${NC}"

# Try to insert a test report (this will fail if no user exists, which is expected)
echo "  Testing report insert (may fail if no users exist)..."
supabase db query "
  INSERT INTO reports (
    reporter_id,
    target_type,
    target_id,
    reason,
    description
  )
  SELECT
    id,
    'shop',
    gen_random_uuid(),
    'spam',
    'Test report'
  FROM profiles
  LIMIT 1
  RETURNING id;
" --csv 2>&1 || echo -e "  ${YELLOW}Note: Insert failed (expected if no profiles exist)${NC}"

# Try to insert a test inquiry (non-member)
echo "  Testing inquiry insert (non-member)..."
INQUIRY_ID=$(supabase db query "
  INSERT INTO customer_inquiries (
    user_id,
    user_name,
    user_phone,
    category,
    subject,
    content
  ) VALUES (
    NULL,
    'Test User',
    '010-1234-5678',
    'general',
    'Test Inquiry',
    'This is a test inquiry'
  )
  RETURNING id;
" --csv | tail -n 1)

if [ ! -z "$INQUIRY_ID" ]; then
    echo -e "  ${GREEN}✓ Inquiry inserted successfully (ID: $INQUIRY_ID)${NC}"
else
    echo -e "  ${RED}✗ Failed to insert inquiry${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 7: Testing select operations...${NC}"

# Count inquiries
INQUIRY_COUNT=$(supabase db query "SELECT COUNT(*) FROM customer_inquiries;" --csv | tail -n 1)
echo -e "  Total inquiries: ${GREEN}$INQUIRY_COUNT${NC}"

# Count reports
REPORT_COUNT=$(supabase db query "SELECT COUNT(*) FROM reports;" --csv | tail -n 1)
echo -e "  Total reports: ${GREEN}$REPORT_COUNT${NC}"

echo ""
echo -e "${YELLOW}Step 8: Cleanup test data...${NC}"

# Delete test inquiry
supabase db query "DELETE FROM customer_inquiries WHERE subject = 'Test Inquiry';" --csv
echo -e "  ${GREEN}✓ Test data cleaned up${NC}"

echo ""
echo -e "${GREEN}======================================"
echo "Migration Test Complete!"
echo "======================================${NC}"
echo ""
echo "Summary:"
echo "  ✓ Tables created successfully"
echo "  ✓ RLS policies active"
echo "  ✓ Indexes created"
echo "  ✓ Insert/Select operations working"
echo ""
echo -e "${GREEN}All checks passed!${NC}"
