# Supabase OAuth 설정 가이드

## 1. Supabase 대시보드 설정

### 1.1 Authentication > Providers 접속
- Supabase Dashboard: https://supabase.com/dashboard
- 프로젝트 선택 > Authentication > Providers

### 1.2 카카오 (Kakao) 설정

1. **Kakao Developers 콘솔 접속**
   - https://developers.kakao.com
   - 애플리케이션 추가 또는 기존 앱 선택

2. **앱 키 확인**
   - 앱 설정 > 앱 키 > REST API 키 복사

3. **카카오 로그인 활성화**
   - 카카오 로그인 > 활성화 설정 ON
   - Redirect URI 추가: `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback`

4. **동의항목 설정**
   - 카카오 로그인 > 동의항목
   - 닉네임: 필수 동의
   - 프로필 사진: 선택 동의
   - 카카오계정(이메일): 선택 동의 (이메일 제공 동의 필요 시)

5. **Supabase에 설정**
   - Providers > Kakao 활성화
   - Client ID: REST API 키
   - Client Secret: 앱 설정 > 보안 > Client Secret 생성 후 입력

### 1.3 네이버 (Naver) 설정

1. **Naver Developers 콘솔 접속**
   - https://developers.naver.com
   - Application > 애플리케이션 등록

2. **앱 등록**
   - 애플리케이션 이름: 오늘의마사지
   - 사용 API: 네이버 로그인
   - 제공 정보: 회원이름, 프로필 사진, 이메일 (선택)

3. **환경 설정**
   - 서비스 URL: https://your-domain.com
   - Callback URL: `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback`

4. **Supabase에 설정**
   - Providers > 현재 Naver 미지원
   - **대안**: Custom OAuth 또는 API Route 직접 구현

> **참고**: Supabase는 현재 Naver를 기본 Provider로 지원하지 않습니다.
> 네이버 로그인은 별도의 API Route 구현이 필요합니다.

### 1.4 구글 (Google) 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com
   - 프로젝트 선택 또는 생성

2. **OAuth 동의 화면 구성**
   - APIs & Services > OAuth consent screen
   - User Type: External
   - 앱 정보 입력

3. **OAuth 2.0 클라이언트 ID 생성**
   - APIs & Services > Credentials
   - Create Credentials > OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback`

4. **Supabase에 설정**
   - Providers > Google 활성화
   - Client ID: 생성된 클라이언트 ID
   - Client Secret: 생성된 클라이언트 비밀번호

## 2. 환경 변수

```env
# .env.local (이미 설정되어 있어야 함)
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR_PROJECT>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_ANON_KEY>

# OAuth Redirect URL (프론트엔드에서 사용)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Supabase 대시보드 URL 설정

Authentication > URL Configuration:
- Site URL: `http://localhost:3000` (개발) / `https://your-domain.com` (프로덕션)
- Redirect URLs에 추가:
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`

## 4. 테스트 체크리스트

- [ ] 카카오 로그인 테스트
- [ ] 구글 로그인 테스트
- [ ] 프로필 자동 생성 확인
- [ ] 기존 OTP 로그인과 병행 작동 확인
- [ ] 로그아웃 후 재로그인 테스트

## 5. 프로덕션 배포 전 확인사항

1. 모든 Provider의 Redirect URI를 프로덕션 URL로 업데이트
2. Supabase Site URL을 프로덕션 도메인으로 변경
3. 각 Provider의 앱 검수 완료 (카카오: 비즈앱 전환, 구글: 앱 게시)
