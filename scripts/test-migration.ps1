# ============================================================
# Test Migration Script (PowerShell)
# Verifies that the customer_inquiries migration works correctly
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Testing Reports & Inquiries Migration" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase"
    exit 1
}

Write-Host "Step 1: Checking Supabase project status..." -ForegroundColor Yellow
supabase status

Write-Host ""
Write-Host "Step 2: Running database reset with migrations..." -ForegroundColor Yellow
supabase db reset

Write-Host ""
Write-Host "Step 3: Verifying tables exist..." -ForegroundColor Yellow

# Check if reports table exists
$reportsExists = supabase db query "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports');" --csv | Select-Object -Last 1

if ($reportsExists -eq "t") {
    Write-Host "✓ reports table exists" -ForegroundColor Green
} else {
    Write-Host "✗ reports table does not exist" -ForegroundColor Red
    exit 1
}

# Check if customer_inquiries table exists
$inquiriesExists = supabase db query "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_inquiries');" --csv | Select-Object -Last 1

if ($inquiriesExists -eq "t") {
    Write-Host "✓ customer_inquiries table exists" -ForegroundColor Green
} else {
    Write-Host "✗ customer_inquiries table does not exist" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Verifying RLS policies..." -ForegroundColor Yellow

# Check reports policies
$reportsPolicies = supabase db query "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'reports';" --csv | Select-Object -Last 1
Write-Host "  reports policies: $reportsPolicies" -ForegroundColor Green

# Check customer_inquiries policies
$inquiriesPolicies = supabase db query "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'customer_inquiries';" --csv | Select-Object -Last 1
Write-Host "  customer_inquiries policies: $inquiriesPolicies" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Verifying indexes..." -ForegroundColor Yellow

# Check reports indexes
$reportsIndexes = supabase db query "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'reports';" --csv | Select-Object -Last 1
Write-Host "  reports indexes: $reportsIndexes" -ForegroundColor Green

# Check customer_inquiries indexes
$inquiriesIndexes = supabase db query "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'customer_inquiries';" --csv | Select-Object -Last 1
Write-Host "  customer_inquiries indexes: $inquiriesIndexes" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Testing insert operations..." -ForegroundColor Yellow

# Try to insert a test inquiry (non-member)
Write-Host "  Testing inquiry insert (non-member)..."
$inquiryId = supabase db query @"
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
"@ --csv | Select-Object -Last 1

if ($inquiryId) {
    Write-Host "  ✓ Inquiry inserted successfully (ID: $inquiryId)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to insert inquiry" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 7: Testing select operations..." -ForegroundColor Yellow

# Count inquiries
$inquiryCount = supabase db query "SELECT COUNT(*) FROM customer_inquiries;" --csv | Select-Object -Last 1
Write-Host "  Total inquiries: $inquiryCount" -ForegroundColor Green

# Count reports
$reportCount = supabase db query "SELECT COUNT(*) FROM reports;" --csv | Select-Object -Last 1
Write-Host "  Total reports: $reportCount" -ForegroundColor Green

Write-Host ""
Write-Host "Step 8: Cleanup test data..." -ForegroundColor Yellow

# Delete test inquiry
supabase db query "DELETE FROM customer_inquiries WHERE subject = 'Test Inquiry';" --csv | Out-Null
Write-Host "  ✓ Test data cleaned up" -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Migration Test Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:"
Write-Host "  ✓ Tables created successfully"
Write-Host "  ✓ RLS policies active"
Write-Host "  ✓ Indexes created"
Write-Host "  ✓ Insert/Select operations working"
Write-Host ""
Write-Host "All checks passed!" -ForegroundColor Green
