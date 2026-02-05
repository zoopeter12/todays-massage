-- Verify admin_logs table structure
\d admin_logs

-- Count total logs
SELECT COUNT(*) as total_logs FROM admin_logs;

-- View recent logs
SELECT
  id,
  admin_name,
  action,
  target_type,
  target_id,
  created_at
FROM admin_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check action distribution
SELECT
  action,
  COUNT(*) as count
FROM admin_logs
GROUP BY action
ORDER BY count DESC;

-- Check RLS policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'admin_logs';
