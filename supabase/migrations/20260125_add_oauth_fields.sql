-- OAuth 소셜 로그인을 위한 profiles 테이블 확장
-- 실행 전 백업 권장

-- avatar_url 컬럼 추가 (OAuth에서 프로필 이미지 저장)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

-- auth_provider 컬럼 추가 (인증 방법 추적: phone, google, kakao)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS auth_provider TEXT NULL
CHECK (auth_provider IN ('phone', 'google', 'kakao'));

-- 인덱스 추가 (auth_provider로 검색 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON profiles(auth_provider);

-- 코멘트 추가
COMMENT ON COLUMN profiles.avatar_url IS '소셜 로그인에서 가져온 프로필 이미지 URL';
COMMENT ON COLUMN profiles.auth_provider IS '인증 방법: phone(휴대폰 OTP), google, kakao';

-- 기존 전화번호 인증 사용자에게 auth_provider 설정
UPDATE profiles
SET auth_provider = 'phone'
WHERE phone IS NOT NULL AND auth_provider IS NULL;
