# 🔐 자동화에 필요한 토큰/키 목록

## ✅ 이미 있는 것
- [x] GitHub 계정 (zoopeter12)
- [x] Supabase 키
- [x] PortOne 키

## ❌ 필요한 것 (1회 생성 필요)

### 1. Vercel API Token
**생성 방법:**
1. https://vercel.com/account/tokens 접속
2. GitHub (zoopeter12)로 로그인
3. "Create Token" 클릭
4. 이름: `todays-massage-deploy`
5. 만료: Never
6. Scope: Full Access
7. 토큰 복사

**사용처:** GitHub Actions 자동 배포

---

### 2. Google Play Console 서비스 계정
**생성 방법:**
1. https://play.google.com/console 접속 (fallinhjw@gmail.com)
2. 설정 > API 액세스
3. "서비스 계정 만들기" → Google Cloud Console 이동
4. 서비스 계정 생성 → JSON 키 다운로드
5. Play Console에서 권한 부여

**사용처:** AAB 자동 업로드

---

### 3. Apple App Store Connect API Key
**생성 방법:**
1. https://appstoreconnect.apple.com 접속
2. 사용자 및 액세스 > 키
3. "+" 버튼으로 API 키 생성
4. .p8 파일 다운로드

**사용처:** iOS 앱 자동 업로드

---

## 🎯 권장 순서

1. **Vercel Token** 생성 (5분)
   - 이것만 있으면 웹 배포 + PWA URL 확보

2. **Play Console 계정 확인** (10분)
   - 개발자 등록 여부 확인
   - 서비스 계정 생성

3. **Apple Developer 계정** (필요시)
   - $99/년 결제 필요
   - Mac 환경 필요

---

## 📝 토큰 저장 위치

생성된 토큰은 아래 파일에 추가:
- `.credentials` (로컬)
- GitHub Secrets (자동화용)
