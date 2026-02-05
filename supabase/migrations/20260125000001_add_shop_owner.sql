-- Add owner_id column to shops table to link shops with their owner (partner)
ALTER TABLE shops ADD COLUMN owner_id UUID REFERENCES profiles(id);

-- Create index for efficient lookups by owner
CREATE INDEX idx_shops_owner_id ON shops(owner_id);

-- Update seed data: assign the demo shop to the demo partner user
-- (This assumes the demo partner profile exists with id matching auth user)
