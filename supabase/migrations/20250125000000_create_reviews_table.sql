-- Create reviews table for customer reviews and ratings
-- Migration: 20250125000000_create_reviews_table.sql

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  owner_reply TEXT,
  owner_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Ensure one review per user per shop
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_shop_unique ON reviews(user_id, shop_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Anyone can view reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews
  FOR SELECT
  USING (true);

-- 2. Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own reviews (not owner replies)
CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    owner_reply IS NOT DISTINCT FROM OLD.owner_reply AND
    owner_replied_at IS NOT DISTINCT FROM OLD.owner_replied_at
  );

-- 4. Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Shop owners can add replies to reviews
-- Note: You'll need to add owner_id column to shops table first
-- This policy assumes shops table has owner_id column
CREATE POLICY "Shop owners can reply to reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = reviews.shop_id
      AND shops.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = reviews.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Add helpful comments
COMMENT ON TABLE reviews IS 'Customer reviews and ratings for shops';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.comment IS 'Review text content';
COMMENT ON COLUMN reviews.images IS 'Array of image URLs attached to review';
COMMENT ON COLUMN reviews.owner_reply IS 'Shop owner response to review';
COMMENT ON COLUMN reviews.owner_replied_at IS 'Timestamp when owner replied';
