-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'shop', 'reservation', 'settlement', 'content', 'config'
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_target_type ON admin_logs(target_type);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- Enable RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin can view all logs
CREATE POLICY "Admin can view all logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: System can insert logs (service role)
CREATE POLICY "System can insert logs" ON admin_logs
  FOR INSERT WITH CHECK (true);

-- Add comment
COMMENT ON TABLE admin_logs IS 'Stores all administrative actions for audit trail';
COMMENT ON COLUMN admin_logs.action IS 'Action performed (e.g., user.suspend, shop.approve, config.update)';
COMMENT ON COLUMN admin_logs.target_type IS 'Type of target entity (user, shop, reservation, settlement, content, config)';
COMMENT ON COLUMN admin_logs.details IS 'Additional context and details about the action';
