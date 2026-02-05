-- ============================================================
-- Verification Script for Reports & Inquiries Integration
-- Run these queries to verify the integration is working correctly
-- ============================================================

-- =========================
-- 1. TABLE EXISTENCE
-- =========================

-- Check if tables exist
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('reports', 'customer_inquiries')
ORDER BY table_name;

-- Expected: 2 rows (reports, customer_inquiries)

-- =========================
-- 2. COLUMN VERIFICATION
-- =========================

-- Verify reports table columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reports'
ORDER BY ordinal_position;

-- Verify customer_inquiries table columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_inquiries'
ORDER BY ordinal_position;

-- =========================
-- 3. INDEX VERIFICATION
-- =========================

-- Check reports indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'reports'
ORDER BY indexname;

-- Check customer_inquiries indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'customer_inquiries'
ORDER BY indexname;

-- =========================
-- 4. RLS POLICY VERIFICATION
-- =========================

-- Check reports RLS policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'reports'
ORDER BY policyname;

-- Expected: 4 policies (select_own, select_admin, insert_auth, update_admin)

-- Check customer_inquiries RLS policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'customer_inquiries'
ORDER BY policyname;

-- Expected: 4 policies (select_own, select_admin, insert_all, update_admin)

-- =========================
-- 5. DATA VERIFICATION
-- =========================

-- Count records in each table
SELECT
  'reports' AS table_name,
  COUNT(*) AS record_count
FROM reports
UNION ALL
SELECT
  'customer_inquiries',
  COUNT(*)
FROM customer_inquiries;

-- Status distribution for reports
SELECT
  status,
  COUNT(*) AS count
FROM reports
GROUP BY status
ORDER BY count DESC;

-- Status distribution for inquiries
SELECT
  status,
  COUNT(*) AS count
FROM customer_inquiries
GROUP BY status
ORDER BY count DESC;

-- Category distribution for inquiries
SELECT
  category,
  COUNT(*) AS count
FROM customer_inquiries
GROUP BY category
ORDER BY count DESC;

-- =========================
-- 6. FOREIGN KEY VERIFICATION
-- =========================

-- Check reports foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'reports'
ORDER BY tc.constraint_name;

-- Check customer_inquiries foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'customer_inquiries'
ORDER BY tc.constraint_name;

-- =========================
-- 7. SAMPLE DATA QUERIES
-- =========================

-- Get recent reports with reporter info
SELECT
  r.id,
  r.status,
  r.reason,
  r.target_type,
  p.nickname AS reporter_name,
  r.created_at
FROM reports r
LEFT JOIN profiles p ON p.id = r.reporter_id
ORDER BY r.created_at DESC
LIMIT 10;

-- Get recent inquiries with user info
SELECT
  ci.id,
  ci.status,
  ci.category,
  ci.subject,
  COALESCE(p.nickname, ci.user_name) AS user_name,
  ci.created_at
FROM customer_inquiries ci
LEFT JOIN profiles p ON p.id = ci.user_id
ORDER BY ci.created_at DESC
LIMIT 10;

-- =========================
-- 8. ADMIN STATS QUERY
-- =========================

-- Stats query (similar to what the admin page uses)
SELECT
  (SELECT COUNT(*) FROM reports) AS total_reports,
  (SELECT COUNT(*) FROM reports WHERE status IN ('pending', 'reviewing')) AS pending_reports,
  (SELECT COUNT(*) FROM customer_inquiries) AS total_inquiries,
  (SELECT COUNT(*) FROM customer_inquiries WHERE status IN ('pending', 'in_progress')) AS pending_inquiries;

-- =========================
-- 9. TEST DATA INSERTION (Optional)
-- =========================

-- Insert test report (replace <user_id> with actual user ID)
-- INSERT INTO reports (
--   reporter_id,
--   target_type,
--   target_id,
--   reason,
--   description
-- ) VALUES (
--   '<user_id>',
--   'shop',
--   gen_random_uuid(),
--   'spam',
--   'Test report for verification'
-- );

-- Insert test inquiry (member)
-- INSERT INTO customer_inquiries (
--   user_id,
--   user_name,
--   user_phone,
--   category,
--   subject,
--   content
-- ) VALUES (
--   '<user_id>',
--   'Test User',
--   '010-1234-5678',
--   'general',
--   'Test inquiry',
--   'This is a test inquiry for verification'
-- );

-- Insert test inquiry (non-member)
-- INSERT INTO customer_inquiries (
--   user_id,
--   user_name,
--   user_phone,
--   category,
--   subject,
--   content
-- ) VALUES (
--   NULL,
--   'Guest User',
--   '010-9876-5432',
--   'technical',
--   'Guest inquiry test',
--   'This is a non-member inquiry test'
-- );

-- =========================
-- 10. CLEANUP TEST DATA (Optional)
-- =========================

-- Delete test reports
-- DELETE FROM reports WHERE description = 'Test report for verification';

-- Delete test inquiries
-- DELETE FROM customer_inquiries WHERE subject LIKE '%test%' OR subject LIKE '%Test%';
