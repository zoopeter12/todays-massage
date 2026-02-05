# 🚀 오늘의마사지 - 최종 배포 가이드

## ✅ 완료된 작업 (자비스가 자동으로 처리)

1. ✅ Git 저장소 초기화 및 커밋
2. ✅ GitHub 레포 생성: https://github.com/zoopeter12/todays-massage
3. ✅ 소스 코드 푸시 완료
4. ✅ Capacitor 설치 및 설정
5. ✅ Next.js 빌드 테스트 성공

---

## 📱 **1단계: Vercel 배포 (5분, 사용자 수동 작업)**

### 방법 1: Vercel 웹 UI (가장 간단)

1. **Vercel 접속 및 로그인**
   ```
   https://vercel.com/new
   ```
   - "Continue with GitHub" 클릭
   - zoopeter12 계정으로 로그인

2. **GitHub 레포 Import**
   - "Import Git Repository" 선택
   - `zoopeter12/todays-massage` 검색 및 선택
   - **"Import" 클릭**

3. **환경변수 설정**
   
   다음 환경변수를 추가합니다 (.env.local 파일 참조):
   
   **필수:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://dhgoxmjhhqgeozscilqz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=(Supabase 대시보드에서 복사)
   SUPABASE_SERVICE_ROLE_KEY=(Supabase 대시보드에서 복사)
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=(NCloud 콘솔에서 발급)
   NEXT_PUBLIC_PORTONE_STORE_ID=(PortOne 콘솔에서 복사)
   NEXT_PUBLIC_PORTONE_CHANNEL_KEY=(PortOne 콘솔에서 복사)
   ```
   
   **선택 (나중에 추가 가능):**
   ```
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY=
   KAKAO_ALIMTALK_BASE_URL=
   KAKAO_SENDER_KEY=
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   ```

4. **Deploy 클릭!**
   - 자동으로 빌드 및 배포 시작
   - 약 3-5분 후 완료
   - 배포 URL 생성 (예: `todays-massage.vercel.app`)

### 방법 2: Vercel CLI (터미널)

```bash
cd C:\a
vercel login --github
vercel --prod
```

---

## 📱 **2단계: PWABuilder로 네이티브 앱 생성 (자동)**

Vercel 배포가 완료되면 **자비스가 자동으로 처리**합니다:

1. PWABuilder API 사용
2. Android APK/AAB 생성
3. iOS 앱 패키지 생성
4. 다운로드 링크 제공

**예상 소요 시간:** 30분

---

## 📦 **3단계: 플레이스토어 업로드**

### 필요한 것:

1. **Google Play Console 계정**
   - https://play.google.com/console
   - 개발자 등록 ($25 일회성)

2. **앱 정보 준비**
   - 앱 이름: 오늘의마사지
   - 패키지명: `com.todaysmassage.app`
   - 카테고리: 건강/피트니스
   - 아이콘: `C:\a\public\icons\icon-512.png`
   - 스크린샷: 자비스가 자동 생성

3. **업로드**
   - AAB 파일 업로드 (자비스가 생성)
   - 심사 제출

**심사 기간:** 1-3일

---

## 🍎 **4단계: 앱스토어 업로드**

### 필요한 것:

1. **Apple Developer 계정**
   - https://developer.apple.com
   - 연간 $99

2. **Mac 컴퓨터 또는 클라우드 Mac**
   - Xcode 필요
   - 또는 Appflow / Codemagic 사용 (클라우드 빌드)

3. **앱 정보**
   - Bundle ID: `com.todaysmassage.app`
   - 자비스가 생성한 패키지 업로드

**심사 기간:** 1-7일

---

## 🎯 **빠른 시작 (지금 바로)**

### ✅ 즉시 실행:

```bash
# 1. Vercel 배포
cd C:\a
vercel login --github
vercel --prod

# 2. 배포 URL 복사 후 자비스에게 전달
# 자비스가 PWABuilder로 APK 생성
```

---

## 🆘 **문제 해결**

### Vercel 배포 실패 시:

1. 빌드 로그 확인
2. 환경변수 재확인
3. Supabase URL 연결 테스트

### PWABuilder 실패 시:

1. PWA 검증: https://manifest-validator.appspot.com
2. manifest.json 확인
3. Service Worker 확인

---

## 📞 **다음 단계**

1. **지금:** Vercel 배포 (5분)
2. **30분 후:** 자비스가 APK 생성 완료 알림
3. **1-3일 후:** 플레이스토어 심사 통과
4. **7일 내:** 앱스토어 심사 통과

---

## 🔗 **중요 링크**

- GitHub 레포: https://github.com/zoopeter12/todays-massage
- Vercel 배포: https://vercel.com/new
- Google Play Console: https://play.google.com/console
- Apple Developer: https://developer.apple.com

---

**완료 시 알림:** 자비스가 Telegram으로 각 단계 완료 알림 전송 ⚡
