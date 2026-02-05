/**
 * OTP 인증 코드 테이블 생성
 *
 * @description
 * Twilio SMS OTP 인증을 위한 테이블입니다.
 * 전화번호별로 OTP 코드를 저장하고, 만료 시간 및 시도 횟수를 관리합니다.
 *
 * @table otp_codes
 * @columns
 * - id: 고유 식별자 (UUID)
 * - phone: 전화번호 (Primary Key 역할)
 * - code: OTP 인증 코드 (6자리)
 * - expires_at: 만료 시간 (5분 후)
 * - attempts: 검증 시도 횟수 (최대 5회)
 * - created_at: 생성 시간
 * - updated_at: 수정 시간
 */

-- OTP 코드 테이블 생성
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (전화번호 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);

-- 인덱스 생성 (만료 시간 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- 만료된 OTP 자동 삭제 함수
CREATE OR REPLACE FUNCTION delete_expired_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 만료된 OTP 자동 삭제 스케줄러 (매 시간마다 실행)
-- Supabase에서는 pg_cron 또는 외부 스케줄러 필요
-- 또는 API 호출 시 수동으로 삭제 처리 가능

-- Row Level Security (RLS) 설정
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 서버 측에서만 접근 가능 (service_role)
-- 클라이언트에서는 직접 접근 불가
CREATE POLICY "otp_codes는 서버에서만 접근 가능"
  ON otp_codes
  FOR ALL
  USING (false); -- 모든 클라이언트 접근 차단

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_otp_codes_updated_at
  BEFORE UPDATE ON otp_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 테이블 설명 추가
COMMENT ON TABLE otp_codes IS 'Twilio SMS OTP 인증 코드 저장 테이블';
COMMENT ON COLUMN otp_codes.phone IS '전화번호 (010-1234-5678 형식, 하이픈 제거)';
COMMENT ON COLUMN otp_codes.code IS '6자리 OTP 인증 코드';
COMMENT ON COLUMN otp_codes.expires_at IS 'OTP 만료 시간 (5분 후)';
COMMENT ON COLUMN otp_codes.attempts IS '검증 시도 횟수 (최대 5회)';
