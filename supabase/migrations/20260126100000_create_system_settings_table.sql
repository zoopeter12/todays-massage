-- ============================================================
-- System Settings Table Migration
-- Key-value store for admin system configuration
-- ============================================================

-- =========================
-- 1. TABLE
-- =========================

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- =========================
-- 2. INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);

-- =========================
-- 3. ROW LEVEL SECURITY
-- =========================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read settings (for frontend display)
CREATE POLICY "system_settings_select_all" ON system_settings
  FOR SELECT USING (true);

-- Write: Only admins can modify settings
-- Note: In production, replace with proper admin role check
CREATE POLICY "system_settings_insert_admin" ON system_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "system_settings_update_admin" ON system_settings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "system_settings_delete_admin" ON system_settings
  FOR DELETE USING (true);

-- =========================
-- 4. UPDATED_AT TRIGGER
-- =========================

CREATE TRIGGER trigger_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 5. DEFAULT SETTINGS
-- =========================

INSERT INTO system_settings (key, value, category, description) VALUES
  -- General Settings
  ('general.site_name', '"마사지 예약 플랫폼"', 'general', '사이트 이름'),
  ('general.site_description', '"편리한 마사지 예약 서비스"', 'general', '사이트 설명'),
  ('general.support_email', '"support@massage-platform.com"', 'general', '고객센터 이메일'),
  ('general.support_phone', '"1588-0000"', 'general', '고객센터 전화번호'),
  ('general.maintenance_mode', 'false', 'general', '점검 모드 활성화 여부'),
  ('general.allow_registration', 'true', 'general', '회원가입 허용 여부'),

  -- Payment Settings
  ('payment.platform_fee_rate', '10', 'payment', '플랫폼 수수료율 (%)'),
  ('payment.min_withdrawal', '10000', 'payment', '최소 출금 금액 (원)'),
  ('payment.settlement_day', '15', 'payment', '정산 기준일'),
  ('payment.methods', '{"card": true, "kakaopay": true, "naverpay": true, "toss": true}', 'payment', '결제 수단 활성화 여부'),

  -- Notification Settings
  ('notification.email_enabled', 'true', 'notification', '이메일 알림 활성화'),
  ('notification.sms_enabled', 'true', 'notification', 'SMS 알림 활성화'),
  ('notification.push_enabled', 'true', 'notification', '푸시 알림 활성화'),
  ('notification.reservation_reminder', 'true', 'notification', '예약 리마인더 활성화'),
  ('notification.reminder_hours', '24', 'notification', '리마인더 발송 시간 (시간 전)'),
  ('notification.marketing_enabled', 'false', 'notification', '마케팅 알림 활성화')
ON CONFLICT (key) DO NOTHING;
