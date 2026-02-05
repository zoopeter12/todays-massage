-- 카카오 알림톡 로그 테이블 생성
-- 발송 내역을 영구 저장하고 모니터링할 수 있도록 함

CREATE TABLE IF NOT EXISTS alimtalk_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT,
  template_code TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_alimtalk_logs_booking ON alimtalk_logs(booking_id);
CREATE INDEX idx_alimtalk_logs_template ON alimtalk_logs(template_code);
CREATE INDEX idx_alimtalk_logs_status ON alimtalk_logs(status);
CREATE INDEX idx_alimtalk_logs_sent_at ON alimtalk_logs(sent_at DESC);
CREATE INDEX idx_alimtalk_logs_recipient ON alimtalk_logs(recipient_phone);

-- RLS 활성화
ALTER TABLE alimtalk_logs ENABLE ROW LEVEL SECURITY;

-- Admin은 모든 로그 조회 가능
CREATE POLICY "Admin can view alimtalk logs" ON alimtalk_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Shop owner는 자신의 샵 예약 관련 로그만 조회 가능
CREATE POLICY "Shop owner can view own shop logs" ON alimtalk_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN shops s ON b.shop_id = s.id
      JOIN profiles p ON s.id = p.shop_id
      WHERE b.id::TEXT = alimtalk_logs.booking_id
        AND p.id = auth.uid()
        AND p.role = 'shop_owner'
    )
  );

-- 시스템(서버)은 로그 삽입 가능 (인증 없이도 가능하도록)
CREATE POLICY "System can insert logs" ON alimtalk_logs
  FOR INSERT WITH CHECK (true);

-- 코멘트 추가
COMMENT ON TABLE alimtalk_logs IS '카카오 알림톡 발송 로그';
COMMENT ON COLUMN alimtalk_logs.booking_id IS '예약 ID (없을 수 있음)';
COMMENT ON COLUMN alimtalk_logs.template_code IS '알림톡 템플릿 코드';
COMMENT ON COLUMN alimtalk_logs.recipient_phone IS '수신자 전화번호';
COMMENT ON COLUMN alimtalk_logs.status IS '발송 상태: success, failed, pending';
COMMENT ON COLUMN alimtalk_logs.message_id IS '카카오 메시지 ID';
COMMENT ON COLUMN alimtalk_logs.error_code IS '에러 코드';
COMMENT ON COLUMN alimtalk_logs.error_message IS '에러 메시지';
COMMENT ON COLUMN alimtalk_logs.request_payload IS '요청 데이터 (JSON)';
COMMENT ON COLUMN alimtalk_logs.response_payload IS '응답 데이터 (JSON)';
COMMENT ON COLUMN alimtalk_logs.sent_at IS '발송 시각';
