-- ============================================================
-- Add notification_settings to profiles table
-- Stores user notification preferences as JSONB
-- ============================================================

-- Add notification_settings column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "newReservation": true,
  "reservationChange": true,
  "customerMessage": false,
  "marketing": false
}'::jsonb;

-- Create index for notification settings queries
CREATE INDEX IF NOT EXISTS idx_profiles_notification_settings
ON profiles USING GIN (notification_settings);

-- Add comment for documentation
COMMENT ON COLUMN profiles.notification_settings IS 'User notification preferences: newReservation, reservationChange, customerMessage, marketing';
