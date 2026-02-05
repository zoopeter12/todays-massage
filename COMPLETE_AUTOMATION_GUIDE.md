# 🚀 오늘의마사지 - 완전 자동화 배포 가이드

## 📋 개요

이 가이드를 따라 **1회 설정**하면, 이후 `git push`만으로 다음이 **자동 실행**됩니다:

1. ✅ Vercel 웹 배포
2. ✅ PWABuilder로 Android APK/AAB 생성
3. ✅ Google Play Store 업로드 (선택적)

---

## 🎯 사용자가 해야 할 일 (1회성, 총 15분)

### Step 1: Vercel 토큰 생성 (5분)

1. **[Vercel 토큰 페이지](https://vercel.com/account/tokens)** 접속
2. GitHub (zoopeter12)로 로그인
3. **"Create Token"** 클릭:
   - Token Name: `todays-massage-gh-actions`
   - Scope: `Full Account`
   - Expiration: `No Expiration`
4. **토큰 복사** (한 번만 표시됨!)

### Step 2: GitHub Secrets 설정 (5분)

1. **[Repository Settings](https://github.com/zoopeter12/todays-massage/settings/secrets/actions)** 접속
2. **"New repository secret"** 클릭하여 다음 추가:

| Secret Name | 값 | 설명 |
|-------------|-----|------|
| `VERCEL_TOKEN` | (Step 1에서 복사한 토큰) | Vercel 배포용 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dhgoxmjhhqgeozscilqz.supabase.co` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase 대시보드에서 복사) | Supabase |

### Step 3: Vercel 프로젝트 연결 (5분)

1. **[Vercel Dashboard](https://vercel.com/new)** 접속
2. "Import Git Repository" 클릭
3. `zoopeter12/todays-massage` 선택
4. **환경변수 추가** (위 표 참조)
5. **"Deploy"** 클릭

---

## 🤖 자동화 동작 방식

설정 완료 후:

```
git push origin main
    ↓
GitHub Actions 자동 시작
    ↓
[Job 1] Vercel 배포 → https://todays-massage.vercel.app
    ↓
[Job 2] PWA 검증
    ↓
[Job 3] PWABuilder API → Android APK/AAB 생성
    ↓
[Job 4] Capacitor 빌드 (백업)
    ↓
[Job 5] (선택) Play Store 업로드
```

---

## 📱 Google Play Store 자동 업로드 (선택적)

### 서비스 계정 생성

1. [Google Play Console](https://play.google.com/console) 접속
2. **설정 → API 액세스** 이동
3. **"서비스 계정 만들기"** 클릭 → Google Cloud Console 이동
4. 서비스 계정 생성:
   - 이름: `github-actions-deploy`
   - 역할: `Service Account User`
5. **JSON 키 다운로드**
6. Play Console에서 권한 부여:
   - **앱 정보 수정**
   - **프로덕션 출시 관리**

### GitHub Secret 추가

| Secret Name | 값 |
|-------------|-----|
| `PLAY_STORE_SERVICE_ACCOUNT_JSON` | (다운로드한 JSON 파일 전체 내용) |

---

## 🍎 App Store 배포 (iOS)

iOS 배포는 다음 요구사항이 있습니다:

1. **Apple Developer 계정** ($99/년)
2. **Mac 컴퓨터** 또는 클라우드 Mac 서비스

### 권장 옵션

1. **Codemagic** (클라우드 빌드)
   - https://codemagic.io
   - Mac 없이 iOS 빌드 가능
   - 무료 플랜 있음

2. **GitHub Actions + Mac Runner**
   - `runs-on: macos-latest` 사용
   - Xcode 자동 설정

---

## ✅ 체크리스트

- [ ] Vercel 토큰 생성
- [ ] GitHub Secrets 설정 (VERCEL_TOKEN)
- [ ] Vercel 프로젝트 생성 및 환경변수 설정
- [ ] `git push` 테스트
- [ ] GitHub Actions 워크플로우 실행 확인
- [ ] APK Artifact 다운로드 확인

---

## 🆘 문제 해결

### Vercel 배포 실패

```bash
# 로컬에서 테스트
cd C:\a
npm run build
```

### PWABuilder API 실패

PWABuilder API가 실패하면 Capacitor 빌드가 자동으로 실행됩니다.

### GitHub Actions 로그 확인

https://github.com/zoopeter12/todays-massage/actions

---

## 🔗 중요 링크

- [GitHub Repository](https://github.com/zoopeter12/todays-massage)
- [GitHub Actions](https://github.com/zoopeter12/todays-massage/actions)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Google Play Console](https://play.google.com/console)
- [Apple Developer](https://developer.apple.com)

---

## 📊 예상 타임라인

| 단계 | 소요 시간 |
|------|-----------|
| 1회 설정 | 15분 |
| Vercel 배포 | 2-5분 (자동) |
| Android APK 생성 | 5-10분 (자동) |
| Play Store 심사 | 1-3일 |
| App Store 심사 | 1-7일 |

**완료 후 예상 총 시간: 코드 푸시 후 10분 이내 APK 생성!**
