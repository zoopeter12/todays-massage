-- FCM (Firebase Cloud Messaging) 관련 테이블 마이그레이션
-- 실행: Supabase Dashboard > SQL Editor 또는 supabase db push

-- ============================================
-- 1. FCM 토큰 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('web', 'android', 'ios')),
  device_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(user_id, is_active) WHERE is_active = true;

-- 토큰 유니크 제약 (동일 토큰 중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fcm_tokens_unique_token ON fcm_tokens(token);

-- RLS (Row Level Security) 정책
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 토큰만 조회/수정 가능
CREATE POLICY "Users can view own tokens" ON fcm_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON fcm_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON fcm_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Service Role은 모든 토큰 접근 가능 (서버 사이드용)
CREATE POLICY "Service role full access" ON fcm_tokens
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================
-- 2. 알림 히스토리 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_unread ON notification_history(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at DESC);

-- RLS 정책
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notification_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON notification_history
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================
-- 3. 알림 설정 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_updates BOOLEAN NOT NULL DEFAULT true,
  payment_notifications BOOLEAN NOT NULL DEFAULT true,
  review_reminders BOOLEAN NOT NULL DEFAULT true,
  promotions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 정책
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON notification_settings
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================
-- 4. 자동 업데이트 트리거
-- ============================================
-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- fcm_tokens 테이블 트리거
DROP TRIGGER IF EXISTS update_fcm_tokens_updated_at ON fcm_tokens;
CREATE TRIGGER update_fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- notification_settings 테이블 트리거
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 5. 유용한 함수들
-- ============================================

-- 사용자의 활성 FCM 토큰 목록 조회
CREATE OR REPLACE FUNCTION get_user_fcm_tokens(p_user_id UUID)
RETURNS TABLE (token TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ft.token
  FROM fcm_tokens ft
  WHERE ft.user_id = p_user_id
    AND ft.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 읽지 않은 알림 개수 조회
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM notification_history
  WHERE user_id = p_user_id
    AND is_read = false;
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 알림 읽음 처리
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notification_history
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 모든 알림 읽음 처리
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notification_history
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid()
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 6. 오래된 데이터 정리 (선택적)
-- ============================================

-- 90일 이상 된 알림 히스토리 삭제 (주기적 실행 필요)
-- CREATE OR REPLACE FUNCTION cleanup_old_notifications()
-- RETURNS INTEGER AS $$
-- DECLARE
--   deleted_count INTEGER;
-- BEGIN
--   DELETE FROM notification_history
--   WHERE sent_at < now() - INTERVAL '90 days';
--   GET DIAGNOSTICS deleted_count = ROW_COUNT;
--   RETURN deleted_count;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 30일 이상 미사용 토큰 비활성화
-- CREATE OR REPLACE FUNCTION deactivate_stale_tokens()
-- RETURNS INTEGER AS $$
-- DECLARE
--   updated_count INTEGER;
-- BEGIN
--   UPDATE fcm_tokens
--   SET is_active = false
--   WHERE last_used_at < now() - INTERVAL '30 days'
--     AND is_active = true;
--   GET DIAGNOSTICS updated_count = ROW_COUNT;
--   RETURN updated_count;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
