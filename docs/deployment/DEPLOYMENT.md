# Vercel 배포 가이드

Today's Massage 프로젝트의 Vercel 배포 및 환경 설정 가이드입니다.

## 목차

- [사전 준비](#사전-준비)
- [Vercel 프로젝트 설정](#vercel-프로젝트-설정)
- [환경변수 설정](#환경변수-설정)
- [배포 프로세스](#배포-프로세스)
- [환경별 배포](#환경별-배포)
- [도메인 설정](#도메인-설정)
- [배포 후 검증](#배포-후-검증)
- [문제 해결](#문제-해결)

---

## 사전 준비

### 필수 계정 및 서비스

배포 전 다음 서비스들의 설정이 완료되어야 합니다:

| 서비스 | 용도 | 필수 여부 |
|--------|------|-----------|
| [Vercel](https://vercel.com) | 호스팅 | 필수 |
| [Supabase](https://supabase.com) | 데이터베이스 | 필수 |
| [NCloud](https://console.ncloud.com) | 네이버 지도 | 필수 |
| [포트원](https://admin.portone.io) | 결제 | 필수 |
| [카카오 비즈니스](https://business.kakao.com) | 알림톡 | 선택 |
| [Firebase](https://console.firebase.google.com) | 푸시 알림 | 선택 |

### 환경변수 준비

`.env.example` 파일을 참고하여 모든 필수 환경변수 값을 준비하세요. 상세 설명은 `docs/ENV_VARIABLES.md`를 참조하세요.

---

## Vercel 프로젝트 설정

### 1. 프로젝트 연결

#### Vercel CLI 사용 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel link

# 로그인 및 프로젝트 선택
```

#### Vercel 대시보드 사용

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 가져오기

### 2. 프레임워크 설정

Vercel이 자동으로 Next.js를 감지하지만, 다음 설정이 적용되어 있는지 확인하세요:

| 설정 | 값 |
|------|-----|
| Framework Preset | Next.js |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### 3. Node.js 버전

`package.json`에 Node.js 버전을 명시하거나 Vercel 설정에서 지정:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 환경변수 설정

### Vercel 대시보드에서 설정

1. Vercel 대시보드 > 프로젝트 선택
2. Settings > Environment Variables
3. 각 변수 추가

### 환경변수 입력 방법

#### 일반 변수

```
Name: NEXT_PUBLIC_BASE_URL
Value: https://todaysmassage.com
Environment: Production
```

#### 민감한 변수 (Sensitive)

`SUPABASE_SERVICE_ROLE_KEY`, `PORTONE_API_SECRET` 등 민감한 변수는 "Sensitive" 체크박스를 활성화하세요. 이렇게 하면 설정 후 값을 다시 볼 수 없습니다.

#### 멀티라인 변수 (FIREBASE_PRIVATE_KEY)

1. Vercel 대시보드에서 직접 입력 시 줄바꿈 포함하여 입력
2. 또는 `\n`을 실제 줄바꿈으로 유지한 채 입력

```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```

### 환경별 변수 설정

Vercel에서는 세 가지 환경을 제공합니다:

| 환경 | 용도 | 브랜치 |
|------|------|--------|
| Production | 프로덕션 | `main` |
| Preview | 스테이징/테스트 | 기타 브랜치 |
| Development | 로컬 개발 | - |

#### 환경별 차이점 설정

| 변수 | Production | Preview | Development |
|------|------------|---------|-------------|
| `NEXT_PUBLIC_BASE_URL` | `https://todaysmassage.com` | `https://staging.todaysmassage.com` | `http://localhost:3000` |

**설정 방법**:
1. 환경변수 추가 시 "Environment" 드롭다운에서 적용할 환경 선택
2. 같은 변수를 다른 값으로 각 환경에 추가

### 필수 환경변수 체크리스트

#### Production 환경 필수

```
[x] NEXT_PUBLIC_BASE_URL
[x] NEXT_PUBLIC_SUPABASE_URL
[x] NEXT_PUBLIC_SUPABASE_ANON_KEY
[x] SUPABASE_SERVICE_ROLE_KEY
[x] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
[x] NEXT_PUBLIC_PORTONE_STORE_ID
[x] NEXT_PUBLIC_PORTONE_CHANNEL_KEY
[x] PORTONE_API_SECRET
```

#### 알림톡 사용 시 추가

```
[ ] KAKAO_ALIMTALK_BASE_URL
[ ] KAKAO_SENDER_KEY
[ ] KAKAO_ACCESS_TOKEN
[ ] KAKAO_CHANNEL_ID
[ ] KAKAO_SENDER_NO
[ ] KAKAO_FALLBACK_ENABLED
```

#### FCM 사용 시 추가

```
[ ] FIREBASE_PROJECT_ID
[ ] FIREBASE_CLIENT_EMAIL
[ ] FIREBASE_PRIVATE_KEY
[ ] NEXT_PUBLIC_FIREBASE_API_KEY
[ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
[ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
[ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
[ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
[ ] NEXT_PUBLIC_FIREBASE_APP_ID
[ ] NEXT_PUBLIC_FIREBASE_VAPID_KEY
[ ] FCM_API_SECRET_KEY
```

---

## 배포 프로세스

### 자동 배포 (권장)

GitHub 연결 시 자동 배포가 설정됩니다:

- `main` 브랜치 푸시 -> Production 배포
- 다른 브랜치 푸시 -> Preview 배포
- PR 생성 -> Preview 배포 + 댓글로 URL 제공

### 수동 배포

#### Vercel CLI 사용

```bash
# Preview 배포
vercel

# Production 배포
vercel --prod
```

#### 대시보드에서 재배포

1. Vercel 대시보드 > Deployments
2. 원하는 배포 선택 > ... 메뉴 > Redeploy

---

## 환경별 배포

### Development (로컬)

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### Staging (Preview)

```bash
# staging 브랜치 생성 및 푸시
git checkout -b staging
git push origin staging
```

Vercel이 자동으로 Preview 환경에 배포합니다.

### Production

```bash
# main 브랜치에 머지
git checkout main
git merge staging
git push origin main
```

---

## 도메인 설정

### 커스텀 도메인 추가

1. Vercel 대시보드 > Settings > Domains
2. 도메인 입력: `todaysmassage.com`
3. DNS 설정 안내에 따라 도메인 제공업체에서 설정

### DNS 설정

| 레코드 타입 | 호스트 | 값 |
|-------------|--------|-----|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

### SSL 인증서

Vercel에서 자동으로 Let's Encrypt SSL 인증서를 발급합니다.

---

## 배포 후 검증

### 체크리스트

#### 기본 기능

- [ ] 홈페이지 로딩 확인
- [ ] 로그인/회원가입 동작 확인
- [ ] 매장 검색 및 지도 표시 확인
- [ ] 예약 프로세스 확인

#### 결제 테스트

- [ ] 테스트 결제 진행
- [ ] 결제 검증 API 동작 확인
- [ ] 결제 완료 알림 수신 확인

#### 알림 테스트 (해당 시)

- [ ] 알림톡 발송 테스트
- [ ] 푸시 알림 수신 테스트

### 모니터링

#### Vercel Analytics

1. Vercel 대시보드 > Analytics
2. Web Vitals 지표 확인
3. 에러 발생 시 Functions 로그 확인

#### 로그 확인

```bash
# 실시간 로그 확인
vercel logs --follow
```

---

## 문제 해결

### 빌드 실패

#### TypeScript 에러

```bash
# 로컬에서 타입 체크
npm run build
```

#### 의존성 문제

```bash
# 캐시 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 환경변수 관련 문제

#### "undefined" 에러

1. Vercel 대시보드에서 환경변수 설정 확인
2. 변수명 오타 확인
3. 적용 환경(Production/Preview) 확인
4. 재배포 실행

#### FIREBASE_PRIVATE_KEY 파싱 에러

```
Error: Failed to parse private key
```

**해결 방법**:
1. Vercel 대시보드에서 직접 값 입력 (CLI 대신)
2. 줄바꿈이 올바르게 포함되어 있는지 확인

### 도메인 문제

#### SSL 인증서 발급 실패

1. DNS 설정이 올바른지 확인
2. DNS 전파 대기 (최대 48시간)
3. Vercel 대시보드에서 "Refresh" 클릭

### API 관련 문제

#### 네이버 지도 로딩 실패

1. NCloud 콘솔에서 도메인 등록 확인
2. `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 값 확인

#### 결제 실패

1. 포트원 콘솔에서 연동 상태 확인
2. 테스트/실거래 모드 확인
3. API Secret 값 확인

---

## 롤백

### 이전 배포로 롤백

1. Vercel 대시보드 > Deployments
2. 롤백할 배포 선택
3. ... 메뉴 > Promote to Production

### CLI로 롤백

```bash
# 특정 배포로 롤백
vercel rollback [DEPLOYMENT_URL]
```

---

## 보안 권장 사항

1. **환경변수 보안**: 민감한 변수는 "Sensitive" 설정
2. **브랜치 보호**: main 브랜치에 직접 푸시 금지 설정
3. **배포 보호**: Production 배포 시 승인 필요 설정 고려
4. **정기 점검**: 분기별 환경변수 및 키 로테이션

---

## 외부 서비스 설정

배포 전 다음 외부 서비스들의 설정이 완료되어야 합니다. 각 서비스별 상세 가이드를 참조하세요.

### Supabase (필수)

데이터베이스, 인증, Storage, Realtime 등 핵심 백엔드 기능을 제공합니다.

**설정 항목**:
- 데이터베이스 마이그레이션 실행
- Row Level Security (RLS) 정책 설정
- Storage 버킷 생성
- Realtime 활성화
- OAuth 제공자 연동

👉 상세 가이드: [Supabase 설정 가이드](./services/SUPABASE_SETUP.md)

### 네이버 지도 API (필수)

매장 위치 표시 및 지도 검색 기능에 사용됩니다.

**주의사항**:
- 도메인 사전 등록 필수
- localhost와 프로덕션 도메인 모두 등록
- HTTPS 도메인만 지원

### 포트원 결제 (필수)

결제 처리 및 검증에 사용됩니다.

**설정 항목**:
- PG사 연동
- 테스트/실거래 모드 설정
- Webhook 설정 (선택)

### Firebase Cloud Messaging (선택)

웹 푸시 알림 기능에 사용됩니다.

**설정 항목**:
- Cloud Messaging API 활성화
- Service Account 키 생성
- VAPID 키 생성
- Service Worker 설정

👉 상세 가이드: [Firebase FCM 설정 가이드](./services/FIREBASE_FCM_SETUP.md)

### 카카오 알림톡 (선택)

예약 알림, 상태 변경 알림 등을 카카오톡으로 발송합니다.

**설정 항목**:
- 카카오 비즈니스 채널 생성
- 발신 프로필 생성
- 알림톡 대행사 연동
- 템플릿 등록 및 검수

👉 상세 가이드: [카카오 알림톡 설정 가이드](./services/KAKAO_ALIMTALK_SETUP.md)

---

## 배포 전 종합 체크리스트

모든 설정을 완료했는지 확인하려면 종합 체크리스트를 사용하세요.

👉 **[배포 전 종합 체크리스트](./DEPLOYMENT_MASTER_CHECKLIST.md)** (인쇄 가능)

---

## 관련 문서

### 필수 문서
- [배포 전 종합 체크리스트](./DEPLOYMENT_MASTER_CHECKLIST.md) ⭐ **배포 전 필독**
- [환경변수 상세 가이드](./ENV_VARIABLES.md)
- [Supabase OAuth 설정](./SUPABASE_OAUTH_SETUP.md)

### 서비스별 설정 가이드
- [Supabase 설정 완벽 가이드](./services/SUPABASE_SETUP.md)
- [Firebase FCM 설정 가이드](./services/FIREBASE_FCM_SETUP.md)
- [카카오 알림톡 설정 가이드](./services/KAKAO_ALIMTALK_SETUP.md)

### 외부 문서
- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 공식 문서](https://supabase.com/docs)
