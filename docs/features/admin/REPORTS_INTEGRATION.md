# Supabase Integration - Reports & Inquiries

## Changes Made

### 1. Database Migration
**File**: `C:/a/supabase/migrations/20260126000000_create_customer_inquiries_table.sql`

Created the `customer_inquiries` table with:
- User information (nullable for non-members)
- Category, subject, content fields
- Attachments array support
- Status tracking (pending → in_progress → resolved → closed)
- Response tracking with admin info
- Proper RLS policies (users can view their own, admins can view/update all)
- Indexes for performance

The `reports` table already existed from previous migration: `20260125300000_create_reports_table.sql`

### 2. Updated Admin Reports Page
**File**: `C:/a/src/app/(admin)/admin/reports/page.tsx`

**Changes**:
- Added Supabase client import
- Replaced mock data with real Supabase queries
- Implemented `fetchData()` to:
  - Fetch reports with joined reporter profile data
  - Fetch customer inquiries with joined user profile data
  - Calculate statistics from real data
- Implemented `handleResolveReport()` to:
  - Update report status (resolved/dismissed)
  - Record resolution text
  - Track who resolved it and when
- Implemented `handleRespondInquiry()` to:
  - Update inquiry status to 'resolved'
  - Save admin response
  - Track who responded and when

### 3. Type Definitions
**File**: `C:/a/src/types/database-helpers.ts`

Created helper types for better type safety:
- `ReportWithReporter`: Report with joined reporter profile
- `CustomerInquiryWithUser`: CustomerInquiry with joined user profile

## Database Schema

### Reports Table (Already Existed)
```sql
- id: UUID (PK)
- reporter_id: UUID (FK → profiles)
- target_type: TEXT (shop|review|user|chat)
- target_id: UUID
- reason: TEXT (profanity|false_info|spam|other)
- description: TEXT
- evidence_urls: TEXT[]
- status: TEXT (pending|reviewing|resolved|dismissed)
- resolution: TEXT
- resolved_by: UUID (FK → profiles)
- resolved_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Customer Inquiries Table (New)
```sql
- id: UUID (PK)
- user_id: UUID (FK → profiles, nullable)
- user_name: TEXT
- user_phone: TEXT
- category: TEXT (general|reservation|payment|technical|complaint)
- subject: TEXT
- content: TEXT
- attachments: TEXT[]
- status: TEXT (pending|in_progress|resolved|closed)
- response: TEXT
- responded_by: UUID (FK → profiles)
- responded_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Features

### Reports Management
1. **List View**
   - Shows all reports with reporter and target info
   - Filter by status (all/pending/reviewing/resolved/dismissed)
   - Search by reporter name, target name, or reason
   - Displays status badges with color coding

2. **Detail View**
   - Full report details
   - Evidence URLs (if any)
   - Status and resolution tracking
   - Admin can resolve or dismiss reports
   - Admin can add resolution notes

### Customer Inquiries Management
1. **List View**
   - Shows all inquiries with user info
   - Search by user name, subject, or content
   - Category badges (general/reservation/payment/technical/complaint)
   - Status tracking (pending/in_progress/resolved/closed)

2. **Detail View**
   - Full inquiry details
   - Previous response (if any)
   - Admin can respond to pending/in-progress inquiries
   - Response is saved with timestamp and admin info

### Statistics Dashboard
- Total reports count
- Pending reports count (pending + reviewing)
- Total inquiries count
- Pending inquiries count (pending + in_progress)

## Next Steps (Optional Enhancements)

1. **Target Name Resolution**
   - Currently `target_name` is null in reports
   - Could fetch actual names from shops/reviews/users tables based on target_type and target_id

2. **Email Notifications**
   - Send email when inquiry is answered
   - Send email when report is resolved

3. **Pagination**
   - Add pagination for large datasets
   - Implement cursor-based pagination for better performance

4. **Attachments**
   - Implement file upload for inquiry attachments
   - Use Supabase Storage for file handling

5. **Analytics**
   - Add charts for report/inquiry trends
   - Category distribution pie charts
   - Response time tracking

## Testing Checklist

- [ ] Run migration: `supabase db reset` or push to production
- [ ] Test report listing
- [ ] Test report filtering by status
- [ ] Test report search
- [ ] Test report resolution (resolved/dismissed)
- [ ] Test inquiry listing
- [ ] Test inquiry search
- [ ] Test inquiry response submission
- [ ] Verify RLS policies (users can only see their own, admins see all)
- [ ] Test with non-member inquiries (user_id is null)
