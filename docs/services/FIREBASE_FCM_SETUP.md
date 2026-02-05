# Firebase Cloud Messaging (FCM) 설정 가이드

Today's Massage 프로젝트의 푸시 알림 기능을 위한 Firebase Cloud Messaging 완벽 설정 가이드입니다.

## 목차

- [1. Firebase 프로젝트 생성](#1-firebase-프로젝트-생성)
- [2. Cloud Messaging 활성화](#2-cloud-messaging-활성화)
- [3. 웹 앱 추가 및 설정](#3-웹-앱-추가-및-설정)
- [4. Service Account 키 생성](#4-service-account-키-생성)
- [5. 환경변수 설정](#5-환경변수-설정)
- [6. Service Worker 설정](#6-service-worker-설정)
- [7. FCM 토큰 관리](#7-fcm-토큰-관리)
- [8. 테스트 및 검증](#8-테스트-및-검증)
- [9. 프로덕션 배포](#9-프로덕션-배포)

---

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속

1. [Firebase Console](https://console.firebase.google.com) 접속
2. Google 계정으로 로그인
3. "프로젝트 추가" 클릭

### 1.2 프로젝트 생성

**1단계: 프로젝트 정보 입력**
- **프로젝트 이름**: `todays-massage` 또는 원하는 이름
- 고유 프로젝트 ID 자동 생성됨 (예: `todays-massage-a1b2c`)
- "계속" 클릭

**2단계: Google 애널리틱스 (선택)**
- 필요한 경우 Google 애널리틱스 사용 설정 켜기
- 또는 비활성화 (나중에 추가 가능)
- "계속" 클릭

**3단계: 계정 선택 (애널리틱스 활성화 시)**
- 기본 계정 선택 또는 새 계정 만들기
- 약관 동의
- "프로젝트 만들기" 클릭

### 1.3 체크리스트

- [ ] Firebase 프로젝트 생성 완료
- [ ] 프로젝트 ID 확인: `_______________`
- [ ] Firebase Console 대시보드 접속 확인

---

## 2. Cloud Messaging 활성화

### 2.1 Cloud Messaging API 활성화

1. Firebase Console > 프로젝트 선택
2. 왼쪽 메뉴 > "빌드" > "Cloud Messaging" (또는 "Messaging")
3. 첫 접속 시 자동으로 API 활성화됨

### 2.2 Google Cloud Console에서 추가 설정

FCM v1 API를 사용하려면 Google Cloud에서 활성화 필요:

1. Firebase Console > 프로젝트 설정 (⚙️ 아이콘)
2. "서비스 계정" 탭 클릭
3. "Google Cloud Console에서 권한 관리" 클릭
4. APIs & Services > Library
5. "Cloud Messaging API" 검색
6. "사용 설정" 클릭 (이미 활성화되어 있을 수 있음)

### 2.3 체크리스트

- [ ] Cloud Messaging 활성화 확인
- [ ] Google Cloud에서 API 활성화 확인

---

## 3. 웹 앱 추가 및 설정

### 3.1 웹 앱 추가

1. Firebase Console > 프로젝트 개요
2. "앱 추가" > 웹 앱 아이콘 (</>) 클릭
3. 앱 정보 입력:
   - **앱 닉네임**: `Today's Massage Web`
   - **Firebase 호스팅 설정**: 체크 안 함 (Vercel 사용)
4. "앱 등록" 클릭

### 3.2 Firebase SDK 구성 정보 복사

앱 등록 후 표시되는 `firebaseConfig` 객체 정보 저장:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "todays-massage-xxxxx.firebaseapp.com",
  projectId: "todays-massage-xxxxx",
  storageBucket: "todays-massage-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

이 정보는 환경변수로 사용됩니다.

### 3.3 VAPID 키 생성

웹 푸시 알림에 필요한 VAPID 키 생성:

1. Firebase Console > 프로젝트 설정 > Cloud Messaging 탭
2. "웹 구성" 섹션으로 스크롤
3. "웹 푸시 인증서" 섹션에서:
   - "키 쌍 생성" 클릭
   - 생성된 공개 키 복사 (예: `BGt7sX...`)

### 3.4 체크리스트

- [ ] 웹 앱 등록 완료
- [ ] Firebase Config 정보 저장
- [ ] VAPID 공개 키 생성 및 저장

---

## 4. Service Account 키 생성

서버에서 FCM 메시지를 발송하려면 Service Account 키가 필요합니다.

### 4.1 서비스 계정 키 생성

1. Firebase Console > 프로젝트 설정 (⚙️)
2. "서비스 계정" 탭 클릭
3. "새 비공개 키 생성" 클릭
4. "키 생성" 확인 클릭
5. JSON 파일 자동 다운로드됨 (예: `todays-massage-xxxxx-firebase-adminsdk-xxxxx-123456.json`)

### 4.2 JSON 파일 내용 확인

다운로드한 JSON 파일을 열면 다음과 같은 내용이 있습니다:

```json
{
  "type": "service_account",
  "project_id": "todays-massage-xxxxx",
  "private_key_id": "123abc...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@todays-massage-xxxxx.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

환경변수로 사용할 값:
- `project_id` → `FIREBASE_PROJECT_ID`
- `private_key` → `FIREBASE_PRIVATE_KEY`
- `client_email` → `FIREBASE_CLIENT_EMAIL`

### 4.3 주의사항

⚠️ **중요**: 이 JSON 파일은 민감한 정보를 포함하고 있습니다.
- Git에 절대 커밋하지 마세요
- 안전한 곳에 보관하세요
- 프로젝트에 직접 포함하지 마세요 (환경변수로 사용)

### 4.4 체크리스트

- [ ] Service Account JSON 파일 다운로드
- [ ] project_id, private_key, client_email 확인
- [ ] JSON 파일을 안전한 곳에 백업

---

## 5. 환경변수 설정

### 5.1 로컬 개발 환경 (.env.local)

프로젝트 루트의 `.env.local` 파일에 추가:

```env
# Firebase Admin SDK (서버사이드)
FIREBASE_PROJECT_ID=todays-massage-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@todays-massage-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"

# Firebase 클라이언트 SDK (브라우저)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=todays-massage-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=todays-massage-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=todays-massage-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# VAPID 키
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BGt7sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# FCM API 시크릿 키 (서버 간 통신 인증용)
FCM_API_SECRET_KEY=your-random-secret-key-here-32chars
```

### 5.2 FIREBASE_PRIVATE_KEY 주의사항

`FIREBASE_PRIVATE_KEY`는 줄바꿈 문자(`\n`)를 포함하고 있습니다.

**올바른 형식**:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**로컬에서는 따옴표로 감싸야 합니다.**

### 5.3 FCM_API_SECRET_KEY 생성

서버 간 통신 인증을 위한 임의의 시크릿 키 생성:

**Linux/Mac**:
```bash
openssl rand -hex 32
```

**Windows (PowerShell)**:
```powershell
-join ((1..32) | ForEach-Object { '{0:X2}' -f (Get-Random -Maximum 256) })
```

생성된 값을 `FCM_API_SECRET_KEY`에 설정하세요.

### 5.4 Vercel 환경변수 설정

Vercel 대시보드 > Settings > Environment Variables:

| Variable | Value | Environment | Sensitive |
|----------|-------|-------------|-----------|
| `FIREBASE_PROJECT_ID` | `todays-massage-xxxxx` | Production, Preview | ❌ |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...` | Production, Preview | ❌ |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN...` | Production, Preview | ✅ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | Production, Preview, Development | ❌ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `xxx.firebaseapp.com` | Production, Preview, Development | ❌ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `todays-massage-xxxxx` | Production, Preview, Development | ❌ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `xxx.appspot.com` | Production, Preview, Development | ❌ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | Production, Preview, Development | ❌ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123...` | Production, Preview, Development | ❌ |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | `BGt7sX...` | Production, Preview, Development | ❌ |
| `FCM_API_SECRET_KEY` | `your-random-secret` | Production, Preview | ✅ |

**FIREBASE_PRIVATE_KEY 입력 시 주의**:
1. Vercel 대시보드에서 직접 입력 (CLI 사용 시 문제 발생 가능)
2. 따옴표 없이 입력
3. 줄바꿈(`\n`)을 실제 줄바꿈으로 변환하여 입력 가능
4. 또는 JSON에서 복사한 그대로 입력 (`\n` 포함)

### 5.5 체크리스트

- [ ] .env.local에 모든 Firebase 환경변수 추가
- [ ] FIREBASE_PRIVATE_KEY 형식 확인
- [ ] FCM_API_SECRET_KEY 생성 및 추가
- [ ] Vercel 환경변수 설정 완료
- [ ] Sensitive 변수 보호 설정 확인

---

## 6. Service Worker 설정

### 6.1 Service Worker란?

Service Worker는 백그라운드에서 실행되어 푸시 알림을 수신하고 처리하는 JavaScript 파일입니다.

### 6.2 firebase-messaging-sw.js 파일 생성

프로젝트의 `public/firebase-messaging-sw.js` 파일 생성:

```javascript
// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase 초기화
firebase.initializeApp({
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "todays-massage-xxxxx.firebaseapp.com",
  projectId: "todays-massage-xxxxx",
  storageBucket: "todays-massage-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png', // PWA 아이콘 경로
    badge: '/badge-72x72.png',
    data: payload.data
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // 이미 열린 창이 있으면 포커스
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
```

### 6.3 주의사항

⚠️ **중요**: `firebase-messaging-sw.js` 파일의 Firebase Config는 하드코딩되어야 합니다.
- 환경변수를 사용할 수 없습니다 (Service Worker는 Node.js 환경이 아님)
- 빌드 시 동적으로 생성하거나 수동으로 업데이트해야 합니다

### 6.4 동적 Service Worker 생성 (권장)

빌드 시 환경변수를 사용하여 Service Worker 생성:

`scripts/generate-sw.js` 파일 생성:

```javascript
// scripts/generate-sw.js
const fs = require('fs');
const path = require('path');

const swTemplate = `
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
`;

const outputPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
fs.writeFileSync(outputPath, swTemplate.trim());
console.log('✅ Service Worker generated successfully');
```

`package.json`에 스크립트 추가:

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-sw.js",
    "dev": "node scripts/generate-sw.js && next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### 6.5 체크리스트

- [ ] `public/firebase-messaging-sw.js` 파일 생성
- [ ] Firebase Config 값 확인
- [ ] Service Worker 생성 스크립트 추가 (선택)
- [ ] 아이콘 파일 준비 (`/icon-192x192.png`, `/badge-72x72.png`)

---

## 7. FCM 토큰 관리

### 7.1 토큰 발급 및 저장

클라이언트에서 FCM 토큰을 발급받고 Supabase에 저장해야 합니다.

**예시 코드** (`lib/firebase/fcm.ts`):

```typescript
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// FCM 토큰 발급
export async function requestFCMToken() {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      console.log('FCM Token:', token);
      // Supabase에 저장
      await saveFCMToken(token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
}

// Supabase에 FCM 토큰 저장
async function saveFCMToken(token: string) {
  const { data, error } = await supabase
    .from('fcm_tokens')
    .upsert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      token: token,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving FCM token:', error);
  }
}

// 포그라운드 메시지 수신
export function onForegroundMessage(callback: (payload: any) => void) {
  return onMessage(messaging, callback);
}
```

### 7.2 권한 요청

사용자에게 알림 권한을 요청해야 합니다:

```typescript
// 알림 권한 요청
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    console.log('Notification permission granted');
    // FCM 토큰 발급
    await requestFCMToken();
    return true;
  } else {
    console.log('Notification permission denied');
    return false;
  }
}
```

### 7.3 토큰 갱신

FCM 토큰은 만료되거나 갱신될 수 있으므로 주기적으로 확인:

```typescript
import { onTokenRefresh } from 'firebase/messaging';

// 토큰 갱신 모니터링
onTokenRefresh(messaging, async () => {
  console.log('Token refreshed');
  const newToken = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  });
  if (newToken) {
    await saveFCMToken(newToken);
  }
});
```

### 7.4 체크리스트

- [ ] FCM 토큰 발급 함수 구현
- [ ] Supabase에 토큰 저장 구현
- [ ] 알림 권한 요청 구현
- [ ] 토큰 갱신 로직 구현

---

## 8. 테스트 및 검증

### 8.1 로컬 환경 테스트

**1. Service Worker 등록 확인**
1. `npm run dev`로 개발 서버 실행
2. 브라우저 개발자 도구 > Application > Service Workers
3. `firebase-messaging-sw.js` 등록 확인

**2. 알림 권한 요청 테스트**
```javascript
// 개발자 도구 콘솔에서 실행
await requestNotificationPermission();
// 브라우저에서 알림 권한 팝업 표시 확인
```

**3. FCM 토큰 발급 테스트**
```javascript
const token = await requestFCMToken();
console.log('FCM Token:', token);
// 토큰이 성공적으로 발급되는지 확인
```

### 8.2 Firebase Console에서 테스트 메시지 발송

1. Firebase Console > Cloud Messaging
2. "첫 번째 캠페인 보내기" 클릭
3. "Firebase 알림 메시지" 선택
4. 알림 정보 입력:
   - **제목**: 테스트 알림
   - **텍스트**: 푸시 알림 테스트입니다
5. "테스트 메시지 전송" 클릭
6. FCM 토큰 입력 (위에서 발급받은 토큰)
7. "테스트" 클릭

**확인사항**:
- [ ] 브라우저에서 알림 수신
- [ ] 알림 클릭 시 지정된 URL로 이동
- [ ] 백그라운드 알림 수신 (탭이 백그라운드에 있을 때)

### 8.3 서버에서 메시지 발송 테스트

API Route를 통해 메시지 발송 테스트:

`app/api/fcm/send-test/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  const { token } = await request.json();

  try {
    const message = {
      notification: {
        title: '서버 테스트 알림',
        body: '서버에서 발송된 테스트 메시지입니다',
      },
      data: {
        url: '/notifications',
      },
      token: token,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**테스트 실행**:
```bash
curl -X POST http://localhost:3000/api/fcm/send-test \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_FCM_TOKEN_HERE"}'
```

### 8.4 체크리스트

- [ ] Service Worker 정상 등록
- [ ] 알림 권한 요청 작동
- [ ] FCM 토큰 발급 성공
- [ ] Firebase Console에서 테스트 메시지 수신
- [ ] 서버에서 메시지 발송 성공
- [ ] 백그라운드 알림 수신 확인
- [ ] 알림 클릭 시 URL 이동 확인

---

## 9. 프로덕션 배포

### 9.1 프로덕션 체크리스트

배포 전 확인사항:

- [ ] Vercel 환경변수 설정 완료
- [ ] `FIREBASE_PRIVATE_KEY` 올바르게 설정 (줄바꿈 포함)
- [ ] Service Worker가 프로덕션 빌드에 포함되는지 확인
- [ ] HTTPS 환경에서만 작동 (Vercel은 자동으로 HTTPS)
- [ ] PWA 아이콘 파일 준비

### 9.2 도메인 추가 (Firebase Console)

Firebase에 프로덕션 도메인 추가:

1. Firebase Console > 프로젝트 설정
2. "승인된 도메인" 섹션
3. "도메인 추가" 클릭
4. 도메인 입력: `todaysmassage.com`, `www.todaysmassage.com`
5. 저장

### 9.3 배포 후 검증

1. **Service Worker 등록 확인**
   - 프로덕션 사이트 접속
   - 개발자 도구 > Application > Service Workers
   - `firebase-messaging-sw.js` 활성화 확인

2. **FCM 토큰 발급 확인**
   - 알림 권한 요청
   - 토큰 발급 및 저장 확인

3. **실제 메시지 발송 테스트**
   - 예약 생성 → 알림 수신 확인
   - 채팅 메시지 → 알림 수신 확인

### 9.4 모니터링 설정

Firebase Console > Cloud Messaging > Reports:
- 발송 성공률 모니터링
- 에러 로그 확인
- 토큰 갱신 추적

### 9.5 체크리스트

- [ ] 프로덕션 환경변수 설정 완료
- [ ] Firebase에 도메인 추가 완료
- [ ] Service Worker 프로덕션 배포 확인
- [ ] 실제 알림 발송 테스트 성공
- [ ] 모니터링 설정 완료

---

## 10. 트러블슈팅

### 10.1 Service Worker 등록 실패

**증상**: `firebase-messaging-sw.js` 파일을 찾을 수 없음

**해결 방법**:
1. `public/firebase-messaging-sw.js` 파일이 존재하는지 확인
2. Next.js 빌드 시 `public` 폴더가 올바르게 복사되는지 확인
3. 브라우저 캐시 삭제 후 재시도

### 10.2 FCM 토큰 발급 실패

**증상**: `getToken()` 호출 시 에러 발생

**해결 방법**:
1. VAPID 키가 올바른지 확인
2. Firebase Console에서 Cloud Messaging API가 활성화되어 있는지 확인
3. 브라우저가 알림을 지원하는지 확인 (HTTPS 필요)
4. Service Worker가 등록되어 있는지 확인

### 10.3 FIREBASE_PRIVATE_KEY 파싱 에러

**증상**: `Error: Failed to parse private key`

**해결 방법**:
1. Vercel 환경변수에서 직접 값 입력 (CLI 대신)
2. 줄바꿈 문자(`\n`)가 올바르게 포함되어 있는지 확인
3. 로컬에서는 따옴표로 감싸기: `"-----BEGIN..."`

### 10.4 알림이 수신되지 않음

**증상**: 메시지 발송은 성공하지만 알림이 표시되지 않음

**해결 방법**:
1. 브라우저 알림 권한 확인 (설정 > 권한)
2. 방해 금지 모드 비활성화
3. FCM 토큰이 최신인지 확인
4. Firebase Console에서 메시지 전달 상태 확인

### 10.5 백그라운드 알림 안 됨

**증상**: 포그라운드에서는 알림이 오지만 백그라운드에서는 안 옴

**해결 방법**:
1. Service Worker의 `onBackgroundMessage` 핸들러 확인
2. `self.registration.showNotification()` 호출 확인
3. 브라우저 개발자 도구 > Application > Service Workers에서 에러 확인

---

## 관련 문서

- [환경변수 가이드](../ENV_VARIABLES.md)
- [배포 가이드](../DEPLOYMENT.md)
- [Firebase 공식 문서](https://firebase.google.com/docs/cloud-messaging)
- [PWA 가이드](../SEO-PWA-IMPLEMENTATION.md)
