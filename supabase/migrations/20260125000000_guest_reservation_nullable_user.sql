-- ============================================================
-- Migration: Allow guest (non-member) reservations
--
-- Problem: reservations.user_id was NOT NULL with FK to profiles(id),
--   causing FK violation when guest users (without auth) try to book.
--
-- Solution: Make user_id nullable. Guest reservations store NULL.
--   The FK constraint is preserved for logged-in users.
-- ============================================================

-- Drop the existing NOT NULL constraint on user_id
ALTER TABLE reservations ALTER COLUMN user_id DROP NOT NULL;

-- Update the index to handle NULL values properly (partial index for non-null user_id)
DROP INDEX IF EXISTS idx_reservations_user_id;
CREATE INDEX idx_reservations_user_id ON reservations(user_id) WHERE user_id IS NOT NULL;

-- Add an index for finding guest reservations
CREATE INDEX idx_reservations_guest ON reservations(created_at) WHERE user_id IS NULL;
