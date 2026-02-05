-- Migration: Add is_open column to shops table
-- Date: 2024-01-24
-- Description: Add boolean column to track shop operating status for partner app

-- Add is_open column with default value true
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true NOT NULL;

-- Add index for faster queries filtering by is_open status
CREATE INDEX IF NOT EXISTS idx_shops_is_open ON shops(is_open);

-- Update existing shops to be open by default
UPDATE shops
SET is_open = true
WHERE is_open IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN shops.is_open IS 'Indicates whether the shop is currently open for business and accepting reservations';
