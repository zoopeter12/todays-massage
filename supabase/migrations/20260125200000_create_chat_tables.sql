-- ============================================================
-- Chat System Migration
-- Tables: chat_rooms, chat_messages
-- Features: Real-time messaging, read receipts, room management
-- ============================================================

-- =========================
-- 1. TABLES
-- =========================

-- chat_rooms: conversation rooms between customer and shop
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Metadata
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- Read tracking (last read timestamp per participant)
  customer_last_read_at TIMESTAMPTZ DEFAULT now(),
  shop_last_read_at TIMESTAMPTZ DEFAULT now(),

  -- Unread counts (denormalized for performance)
  customer_unread_count INT NOT NULL DEFAULT 0,
  shop_unread_count INT NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure unique room per customer-shop pair
  UNIQUE(customer_id, shop_id)
);

-- chat_messages: individual messages within a chat room
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,

  -- Sender info
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'partner')),

  -- Message content
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),

  -- Read status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- 2. INDEXES
-- =========================

-- Chat room indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer_id ON chat_rooms(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_shop_id ON chat_rooms(shop_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON chat_rooms(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer_shop ON chat_rooms(customer_id, shop_id);

-- Chat message indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(room_id, is_read) WHERE is_read = false;

-- =========================
-- 3. ROW LEVEL SECURITY (RLS)
-- =========================

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_rooms policies (development phase - allow all)
CREATE POLICY "chat_rooms_select_all" ON chat_rooms
  FOR SELECT USING (true);
CREATE POLICY "chat_rooms_insert_all" ON chat_rooms
  FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_rooms_update_all" ON chat_rooms
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "chat_rooms_delete_all" ON chat_rooms
  FOR DELETE USING (true);

-- chat_messages policies (development phase - allow all)
CREATE POLICY "chat_messages_select_all" ON chat_messages
  FOR SELECT USING (true);
CREATE POLICY "chat_messages_insert_all" ON chat_messages
  FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_messages_update_all" ON chat_messages
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "chat_messages_delete_all" ON chat_messages
  FOR DELETE USING (true);

-- =========================
-- 4. TRIGGERS
-- =========================

-- Update chat_room updated_at on modification
CREATE TRIGGER trigger_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 5. FUNCTIONS
-- =========================

-- Function to update room metadata when a new message is sent
CREATE OR REPLACE FUNCTION update_chat_room_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    -- Increment unread count for the recipient
    customer_unread_count = CASE
      WHEN NEW.sender_type = 'partner' THEN customer_unread_count + 1
      ELSE customer_unread_count
    END,
    shop_unread_count = CASE
      WHEN NEW.sender_type = 'customer' THEN shop_unread_count + 1
      ELSE shop_unread_count
    END,
    updated_at = now()
  WHERE id = NEW.room_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_room_on_message();

-- Function to mark messages as read and reset unread count
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_room_id UUID,
  p_reader_type TEXT
)
RETURNS void AS $$
BEGIN
  -- Mark all unread messages as read (messages sent by the OTHER party)
  UPDATE chat_messages
  SET
    is_read = true,
    read_at = now()
  WHERE
    room_id = p_room_id
    AND is_read = false
    AND sender_type != p_reader_type;

  -- Reset unread count for the reader
  UPDATE chat_rooms
  SET
    customer_unread_count = CASE WHEN p_reader_type = 'customer' THEN 0 ELSE customer_unread_count END,
    shop_unread_count = CASE WHEN p_reader_type = 'partner' THEN 0 ELSE shop_unread_count END,
    customer_last_read_at = CASE WHEN p_reader_type = 'customer' THEN now() ELSE customer_last_read_at END,
    shop_last_read_at = CASE WHEN p_reader_type = 'partner' THEN now() ELSE shop_last_read_at END
  WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- 6. REALTIME CONFIGURATION
-- =========================

-- Enable realtime for chat tables
-- Note: Run these in Supabase Dashboard if ALTER PUBLICATION is not available
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
