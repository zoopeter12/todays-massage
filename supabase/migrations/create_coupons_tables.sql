-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_price INTEGER NOT NULL DEFAULT 0 CHECK (min_price >= 0),
  max_discount INTEGER CHECK (max_discount IS NULL OR max_discount > 0),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_date_range CHECK (valid_until > valid_from),
  CONSTRAINT usage_count_limit CHECK (usage_limit IS NULL OR used_count <= usage_limit)
);

-- Create user_coupons table (user's downloaded coupons)
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Prevent duplicate downloads
  CONSTRAINT unique_user_coupon UNIQUE (user_id, coupon_id),

  -- Used coupon must have reservation_id
  CONSTRAINT used_coupon_has_reservation CHECK (
    (used_at IS NULL AND reservation_id IS NULL) OR
    (used_at IS NOT NULL AND reservation_id IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coupons_shop_id ON coupons(shop_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_used_at ON user_coupons(used_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- Create function to increment used_count when coupon is used
CREATE OR REPLACE FUNCTION increment_coupon_used_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.used_at IS NOT NULL AND OLD.used_at IS NULL THEN
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE id = NEW.coupon_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incrementing used_count
CREATE TRIGGER trigger_increment_coupon_used_count
  AFTER UPDATE ON user_coupons
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_used_count();

-- Enable Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons table

-- Public can view active coupons
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND valid_until >= NOW());

-- Shop owners can manage their coupons
CREATE POLICY "Shop owners can manage their coupons"
  ON coupons FOR ALL
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for user_coupons table

-- Users can view their own coupons
CREATE POLICY "Users can view their own coupons"
  ON user_coupons FOR SELECT
  USING (user_id = auth.uid());

-- Users can download coupons (insert)
CREATE POLICY "Users can download coupons"
  ON user_coupons FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can use their coupons (update to set used_at and reservation_id)
CREATE POLICY "Users can use their coupons"
  ON user_coupons FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Shop owners can view user coupons for their shop's coupons (for analytics)
CREATE POLICY "Shop owners can view their coupon usage"
  ON user_coupons FOR SELECT
  USING (
    coupon_id IN (
      SELECT id FROM coupons WHERE shop_id IN (
        SELECT id FROM shops WHERE user_id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE coupons IS 'Coupons created by shop owners for discounts';
COMMENT ON TABLE user_coupons IS 'User downloaded and used coupons tracking';

COMMENT ON COLUMN coupons.discount_type IS 'Type of discount: percent or fixed amount';
COMMENT ON COLUMN coupons.discount_value IS 'Discount value in percent or KRW';
COMMENT ON COLUMN coupons.min_price IS 'Minimum purchase price required to use coupon';
COMMENT ON COLUMN coupons.max_discount IS 'Maximum discount amount for percent type coupons';
COMMENT ON COLUMN coupons.usage_limit IS 'Maximum number of times coupon can be downloaded (NULL = unlimited)';
COMMENT ON COLUMN coupons.used_count IS 'Number of times coupon has been used';

COMMENT ON COLUMN user_coupons.used_at IS 'Timestamp when coupon was used';
COMMENT ON COLUMN user_coupons.reservation_id IS 'Reservation where coupon was applied';
