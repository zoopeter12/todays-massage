# 환경변수 상세 가이드

Today's Massage 프로젝트에서 사용하는 모든 환경변수에 대한 상세 설명입니다.

## 목차

- [환경변수 개요](#환경변수-개요)
- [필수 환경변수](#필수-환경변수)
- [선택 환경변수](#선택-환경변수)
- [환경별 설정](#환경별-설정)
- [보안 가이드라인](#보안-가이드라인)

---

## 환경변수 개요

### 명명 규칙

| 접두사 | 용도 | 노출 범위 |
|--------|------|-----------|
| `NEXT_PUBLIC_` | 클라이언트에서 접근 가능 | 브라우저에 노출됨 |
| (접두사 없음) | 서버 전용 | 서버에서만 접근 가능 |

### 환경변수 카테고리

| 카테고리 | 필수 여부 | 설명 |
|----------|-----------|------|
| 애플리케이션 설정 | 필수 | 기본 URL, 환경 설정 |
| Supabase | 필수 | 데이터베이스 및 인증 |
| 네이버 지도 | 필수 | 매장 위치 표시 |
| 포트원 결제 | 필수 | 결제 처리 |
| 카카오 알림톡 | 선택 | 예약 알림 발송 |
| Firebase FCM | 선택 | 푸시 알림 |

---

## 필수 환경변수

### 애플리케이션 기본 설정

#### `NEXT_PUBLIC_BASE_URL`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 필수 |
| 타입 | URL |
| 기본값 | `https://todaymassage.com` |

**설명**: 애플리케이션의 기본 URL입니다. 알림톡 버튼 링크, SEO 메타데이터, 사이트맵 생성 등에 사용됩니다.

**환경별 값**:
- 개발: `http://localhost:3000`
- 스테이징: `https://staging.todaysmassage.com`
- 프로덕션: `https://todaysmassage.com`

---

### Supabase 설정

#### `NEXT_PUBLIC_SUPABASE_URL`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 필수 |
| 타입 | URL |
| 예시 | `https://abcdefghij.supabase.co` |

**설명**: Supabase 프로젝트의 API URL입니다.

**발급 방법**:
1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings > API > Project URL 복사

---

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 필수 |
| 타입 | JWT 토큰 |
| 보안 등급 | 공개 가능 |

**설명**: Supabase 익명(anon) 키입니다. 클라이언트에서 Row Level Security(RLS) 정책에 따라 데이터에 접근할 때 사용됩니다.

**발급 방법**:
1. Supabase 대시보드 > Settings > API
2. Project API keys > `anon` `public` 키 복사

---

#### `SUPABASE_SERVICE_ROLE_KEY`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 필수 |
| 타입 | JWT 토큰 |
| 보안 등급 | 비공개 (서버 전용) |

**설명**: Supabase 서비스 역할 키입니다. RLS를 우회하여 모든 데이터에 접근할 수 있으므로 서버 측에서만 사용해야 합니다.

**발급 방법**:
1. Supabase 대시보드 > Settings > API
2. Project API keys > `service_role` 키 복사

**주의사항**:
- 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요
- 클라이언트 코드에서 사용하지 마세요
- Git에 커밋하지 마세요

---

### 네이버 지도 API

#### `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 필수 |
| 타입 | 문자열 |
| 예시 | `abc123xyz` |

**설명**: 네이버 클라우드 플랫폼(NCP)의 Maps API 클라이언트 ID입니다.

**SDK 파라미터** (2025년 최신):
- 파라미터명: `ncpKeyId` (구버전 `ncpClientId`에서 변경됨)
- SDK URL: `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID`

**발급 방법**:
1. [NCloud 콘솔](https://console.ncloud.com) 접속
2. Services > AI·NAVER API > Application 선택
3. Application 등록
4. Web Dynamic Map, Geocoding 서비스 활성화
5. 서비스 환경에서 도메인 등록
6. 인증 정보에서 Client ID 복사

**NCP 콘솔 도메인 등록 방법**:

1. NCloud 콘솔 접속 후 해당 Application 선택
2. "서비스 환경" > "Web 서비스 URL" 섹션으로 이동
3. 도메인 등록 시 **포트 번호 포함**하여 입력

| 환경 | 올바른 등록 예시 |
|------|-----------------|
| 개발 | `http://localhost:3000` |
| 프로덕션 | `https://todaysmassage.com` |
| Vercel Preview | `https://*.vercel.app` |

4. 필수 서비스 활성화 확인:
   - Web Dynamic Map (필수)
   - Geocoding (주소 검색 기능 사용 시 필수)

**인증 실패 시 확인사항**:
- 브라우저 콘솔에서 상세 에러 메시지 확인
- 도메인이 포트 포함하여 등록되었는지 확인
- Client ID가 올바른지 확인
- 서비스(Web Dynamic Map 등)가 활성화되었는지 확인
- 결제 수단이 NCP 계정에 등록되었는지 확인

**Graceful Degradation**:
- 인증 실패 시 앱은 지도 대신 에러 메시지와 "목록으로 보기" 버튼 표시
- 2초 후 자동으로 목록 모드로 전환
- 사용자는 목록 뷰에서 계속 매장 검색 가능

---

### 포트원 결제

#### `NEXT_PUBLIC_PORTONE_STORE_ID`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 필수 |
| 타입 | 문자열 |
| 예시 | `store-12345678-abcd-...` |

**설명**: 포트원 스토어 ID입니다.

**발급 방법**:
1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. 연동 관리 > 연동 정보
3. Store ID 복사

---

#### `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 필수 |
| 타입 | 문자열 |
| 예시 | `channel-key-12345...` |

**설명**: 결제 채널별 고유 키입니다. 각 PG사별로 다른 채널 키가 발급됩니다.

**발급 방법**:
1. 포트원 관리자 콘솔 > 연동 관리
2. PG 설정에서 사용할 채널 선택
3. 채널 키 복사

---

#### `PORTONE_API_SECRET`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 필수 |
| 타입 | 문자열 |
| 보안 등급 | 비공개 (서버 전용) |

**설명**: 포트원 API 시크릿입니다. 서버 측에서 결제 검증 시 사용됩니다.

**발급 방법**:
1. 포트원 관리자 콘솔 > 연동 관리 > API Keys
2. V2 API Secret 생성 및 복사

**주의사항**:
- 서버 측 결제 검증에만 사용
- 클라이언트에 노출 금지

---

## 선택 환경변수

### 카카오 알림톡

알림톡 기능을 사용하지 않는 경우 설정하지 않아도 됩니다.

#### `KAKAO_ALIMTALK_BASE_URL`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 알림톡 사용 시 필수 |
| 타입 | URL |

**설명**: 알림톡 API 서버 URL입니다.

**서비스별 URL**:
| 서비스 | URL |
|--------|-----|
| 카카오 i 커넥트 | `https://api.kakaoi.ai` |
| 알리고 | `https://kakaoapi.aligo.in` |
| 솔라피 | `https://api.solapi.com` |

---

#### `KAKAO_SENDER_KEY`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 알림톡 사용 시 필수 |
| 타입 | 문자열 |

**설명**: 카카오 비즈니스 채널의 발신 프로필 키입니다.

---

#### `KAKAO_ACCESS_TOKEN`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 알림톡 사용 시 필수 |
| 타입 | 문자열 |

**설명**: 알림톡 API 인증용 액세스 토큰입니다.

---

#### `KAKAO_CHANNEL_ID`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 알림톡 사용 시 필수 |
| 타입 | 문자열 |

**설명**: 카카오톡 채널 ID입니다.

---

#### `KAKAO_SENDER_NO`

| 속성 | 값 |
|------|-----|
| 필수 여부 | SMS 대체 발송 사용 시 필수 |
| 타입 | 문자열 (숫자만) |
| 예시 | `0212345678` |

**설명**: SMS 대체 발송 시 사용할 발신자 전화번호입니다. 하이픈 없이 입력합니다.

---

#### `KAKAO_FALLBACK_ENABLED`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 선택 |
| 타입 | boolean (`true` / `false`) |
| 기본값 | `false` |

**설명**: 알림톡 발송 실패 시 SMS로 대체 발송할지 여부입니다.

---

### Firebase Cloud Messaging (FCM)

푸시 알림 기능을 사용하지 않는 경우 설정하지 않아도 됩니다.

#### Firebase Admin SDK (서버용)

| 변수명 | 설명 |
|--------|------|
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `FIREBASE_CLIENT_EMAIL` | 서비스 계정 이메일 |
| `FIREBASE_PRIVATE_KEY` | 서비스 계정 비공개 키 |

**발급 방법**:
1. [Firebase 콘솔](https://console.firebase.google.com) 접속
2. 프로젝트 설정 > 서비스 계정
3. "새 비공개 키 생성" 클릭
4. 다운로드된 JSON 파일에서 각 값 추출

**`FIREBASE_PRIVATE_KEY` 설정 시 주의**:
- JSON 파일의 `private_key` 값을 복사
- 줄바꿈(`\n`)을 그대로 유지
- Vercel에서는 따옴표 없이 입력

---

#### Firebase 클라이언트 SDK (브라우저용)

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API 키 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 인증 도메인 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 프로젝트 ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | 스토리지 버킷 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 메시징 발신자 ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 앱 ID |

**발급 방법**:
1. Firebase 콘솔 > 프로젝트 설정 > 일반
2. "앱 추가" > 웹 앱 선택
3. 앱 등록 후 표시되는 firebaseConfig 값 사용

---

#### `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

| 속성 | 값 |
|------|-----|
| 필수 여부 | 웹 푸시 사용 시 필수 |
| 타입 | 문자열 |

**설명**: 웹 푸시 알림에 사용되는 VAPID 공개 키입니다.

**발급 방법**:
1. Firebase 콘솔 > 프로젝트 설정 > Cloud Messaging
2. 웹 구성 > 키 쌍 생성
3. 공개 키 복사

---

#### `FCM_API_SECRET_KEY`

| 속성 | 값 |
|------|-----|
| 필수 여부 | FCM API 사용 시 필수 |
| 타입 | 문자열 (32자 이상 권장) |
| 보안 등급 | 비공개 |

**설명**: 서버 간 FCM API 호출 시 인증에 사용되는 시크릿 키입니다.

**생성 방법**:
```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
-join ((1..32) | ForEach-Object { '{0:X2}' -f (Get-Random -Maximum 256) })
```

---

## 환경별 설정

### 개발 환경 (Development)

```env
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 스테이징 환경 (Staging)

```env
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://staging.todaysmassage.com
```

### 프로덕션 환경 (Production)

```env
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://todaysmassage.com
```

---

## 보안 가이드라인

### 절대 노출하면 안 되는 변수

다음 변수들은 서버 전용이며 절대 클라이언트에 노출되어서는 안 됩니다:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PORTONE_API_SECRET`
- `KAKAO_ACCESS_TOKEN`
- `FIREBASE_PRIVATE_KEY`
- `FCM_API_SECRET_KEY`

### 보안 체크리스트

- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 서버 전용 변수에 `NEXT_PUBLIC_` 접두사가 없는지 확인
- [ ] 프로덕션 배포 전 모든 시크릿 키 교체
- [ ] Vercel 환경변수에서 민감한 변수는 "Sensitive" 옵션 활성화
- [ ] 정기적으로 API 키 및 시크릿 로테이션

### API 키 로테이션 권장 주기

| 키 종류 | 권장 주기 |
|---------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` | 6개월 |
| `PORTONE_API_SECRET` | 6개월 |
| `KAKAO_ACCESS_TOKEN` | 만료 시 갱신 |
| `FIREBASE_PRIVATE_KEY` | 1년 |
| `FCM_API_SECRET_KEY` | 6개월 |

---

## 문제 해결

### 환경변수가 인식되지 않는 경우

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 변수명에 오타가 없는지 확인
3. 개발 서버 재시작: `npm run dev`

### 클라이언트에서 환경변수가 undefined인 경우

- `NEXT_PUBLIC_` 접두사가 있는지 확인
- 빌드 후 반영되므로 `npm run build` 후 확인

### Vercel에서 환경변수가 적용되지 않는 경우

1. Vercel 대시보드에서 환경변수 설정 확인
2. 올바른 환경(Production/Preview/Development) 선택 확인
3. 새로 배포하여 변경사항 적용

### 네이버 지도가 표시되지 않는 경우

네이버 지도 인증 실패 시 브라우저 콘솔에 상세한 디버깅 정보가 출력됩니다.

**1. 인증 실패 에러**

```
네이버 지도 API 인증 실패
현재 환경 정보:
- Client ID: xxx
- 현재 URL: http://localhost:3000/search
- 호스트명: localhost
```

**해결 방법**:
- NCP 콘솔에서 도메인 등록 확인 (`http://localhost` - 포트 제외)
- Client ID가 올바른지 확인
- Web Dynamic Map 서비스 활성화 확인

**2. SDK 로딩 타임아웃**

```
[NaverMap] SDK 로딩 타임아웃 (10초 초과)
```

**해결 방법**:
- 네트워크 연결 상태 확인
- 브라우저 캐시 삭제 (Ctrl+Shift+Del)
- 개발 서버 재시작

**3. Graceful Degradation 동작**

인증 실패 시 앱은 다음과 같이 처리합니다:
- 지도 영역에 에러 메시지 표시
- "새로고침" 및 "목록으로 보기" 버튼 제공
- 사용자는 목록 뷰에서 정상적으로 매장 검색 가능

**4. 디버깅 팁**

```bash
# 개발 서버 실행 후 브라우저 콘솔 확인
npm run dev

# 콘솔에서 다음 로그 확인:
# - "네이버 지도 SDK 로딩 시작" - SDK 로딩 시작
# - "[NaverMap] SDK loaded after XXXms" - 로딩 성공
# - "네이버 지도 API 인증 실패" - 인증 실패 (원인 확인 필요)
```
