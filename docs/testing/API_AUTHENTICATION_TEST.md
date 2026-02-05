# 알림톡 API 인증 테스트 가이드

## 개요
알림톡 API에 API Key 인증이 추가되었습니다. POST 요청 시 `x-api-key` 헤더에 유효한 API Key를 포함해야 합니다.

## 환경 설정

### 1. 환경변수 설정
`.env.local` 파일에 다음 환경변수를 추가하세요:

```bash
# 알림톡 API 시크릿 키 (32자 이상 권장)
ALIMTALK_API_SECRET_KEY=your-alimtalk-api-secret-key-here
```

### 2. API Key 생성 방법
OpenSSL을 사용하여 안전한 랜덤 키를 생성할 수 있습니다:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (Git Bash)
openssl rand -hex 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

## API 인증 동작

### 인증이 필요한 엔드포인트
- `POST /api/notifications/alimtalk` - 알림톡 발송 (인증 필수)

### 인증이 필요하지 않은 엔드포인트
- `GET /api/notifications/alimtalk` - 헬스체크 (인증 불필요)

## 테스트 방법

### 1. cURL 테스트

#### ✅ 인증 성공 (올바른 API Key)
```bash
curl -X POST http://localhost:3000/api/notifications/alimtalk \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-alimtalk-api-secret-key-here" \
  -d '{
    "type": "booking_confirmation",
    "data": {
      "customerName": "홍길동",
      "customerPhone": "01012345678",
      "shopName": "편안한 마사지",
      "serviceName": "스웨디시 마사지",
      "bookingDate": "2024-03-20",
      "bookingTime": "14:00",
      "bookingId": "BOOK-20240320-001"
    }
  }'
```

#### ❌ 인증 실패 (API Key 없음)
```bash
curl -X POST http://localhost:3000/api/notifications/alimtalk \
  -H "Content-Type: application/json" \
  -d '{
    "type": "booking_confirmation",
    "data": {
      "customerName": "홍길동",
      "customerPhone": "01012345678",
      "shopName": "편안한 마사지",
      "serviceName": "스웨디시 마사지",
      "bookingDate": "2024-03-20",
      "bookingTime": "14:00",
      "bookingId": "BOOK-20240320-001"
    }
  }'
```

**예상 응답:**
```json
{
  "success": false,
  "message": "인증에 실패했습니다",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "유효한 API Key가 필요합니다"
  }
}
```

#### ❌ 인증 실패 (잘못된 API Key)
```bash
curl -X POST http://localhost:3000/api/notifications/alimtalk \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-api-key" \
  -d '{
    "type": "booking_confirmation",
    "data": {
      "customerName": "홍길동",
      "customerPhone": "01012345678",
      "shopName": "편안한 마사지",
      "serviceName": "스웨디시 마사지",
      "bookingDate": "2024-03-20",
      "bookingTime": "14:00",
      "bookingId": "BOOK-20240320-001"
    }
  }'
```

**예상 응답:**
```json
{
  "success": false,
  "message": "인증에 실패했습니다",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "유효한 API Key가 필요합니다"
  }
}
```

#### ✅ 헬스체크 (인증 불필요)
```bash
curl -X GET http://localhost:3000/api/notifications/alimtalk
```

**예상 응답:**
```json
{
  "status": "configured",
  "message": "알림톡 서비스가 설정되어 있습니다",
  "config": {
    "KAKAO_ALIMTALK_BASE_URL": true,
    "KAKAO_SENDER_KEY": true,
    "KAKAO_ACCESS_TOKEN": true,
    "KAKAO_CHANNEL_ID": true,
    "KAKAO_SENDER_NO": true,
    "KAKAO_FALLBACK_ENABLED": false
  },
  "supportedTypes": [
    "booking_confirmation",
    "booking_cancellation",
    "booking_reminder",
    "partner_new_booking",
    "partner_cancellation"
  ]
}
```

### 2. JavaScript/TypeScript 클라이언트 예제

```typescript
// 알림톡 발송 함수
async function sendAlimtalk(type: string, data: any) {
  const response = await fetch('/api/notifications/alimtalk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ALIMTALK_API_SECRET_KEY || '',
    },
    body: JSON.stringify({ type, data }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('알림톡 발송 실패:', result);
    throw new Error(result.message);
  }

  return result;
}

// 사용 예시
try {
  const result = await sendAlimtalk('booking_confirmation', {
    customerName: '홍길동',
    customerPhone: '01012345678',
    shopName: '편안한 마사지',
    serviceName: '스웨디시 마사지',
    bookingDate: '2024-03-20',
    bookingTime: '14:00',
    bookingId: 'BOOK-20240320-001',
  });

  console.log('알림톡 발송 성공:', result);
} catch (error) {
  console.error('알림톡 발송 실패:', error);
}
```

### 3. Next.js Server Action 예제

```typescript
// app/actions/notifications.ts
'use server';

export async function sendBookingConfirmation(bookingData: any) {
  const apiKey = process.env.ALIMTALK_API_SECRET_KEY;

  if (!apiKey) {
    throw new Error('ALIMTALK_API_SECRET_KEY가 설정되지 않았습니다');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/alimtalk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      type: 'booking_confirmation',
      data: bookingData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}
```

## 보안 권장사항

### 1. API Key 관리
- ✅ 환경변수로만 관리 (절대 코드에 하드코딩 금지)
- ✅ `.env.local` 파일을 `.gitignore`에 추가 (이미 추가됨)
- ✅ 프로덕션과 개발 환경에서 다른 키 사용
- ✅ 주기적으로 API Key 교체

### 2. Vercel 배포 시 환경변수 설정
```bash
# Vercel CLI 사용
vercel env add ALIMTALK_API_SECRET_KEY production

# 또는 Vercel Dashboard
# Project Settings > Environment Variables
# Name: ALIMTALK_API_SECRET_KEY
# Value: your-production-api-secret-key
# Environments: Production, Preview, Development
```

### 3. 로그 모니터링
인증 실패 시 로그가 기록됩니다:
- 환경변수 미설정: "ALIMTALK_API_SECRET_KEY 환경변수가 설정되지 않았습니다"
- 인증 실패: "유효하지 않은 API Key"

## HTTP 상태 코드

| 상태 코드 | 설명 | 예시 |
|---------|------|------|
| 200 | 알림톡 발송 성공 | 정상 처리 |
| 400 | 잘못된 요청 | 유효하지 않은 알림 타입, 필수 필드 누락 |
| 401 | 인증 실패 | API Key 없음, 잘못된 API Key |
| 500 | 서버 오류 | 알림톡 발송 실패, 환경 설정 오류 |

## 트러블슈팅

### 문제: "인증에 실패했습니다" 오류
**원인:**
- `.env.local`에 `ALIMTALK_API_SECRET_KEY`가 설정되지 않음
- 요청 헤더에 `x-api-key`가 포함되지 않음
- API Key가 일치하지 않음

**해결방법:**
1. `.env.local` 파일 확인
2. 개발 서버 재시작 (`npm run dev`)
3. 요청 헤더에 올바른 API Key 포함

### 문제: Vercel 배포 후 인증 실패
**원인:**
- Vercel 환경변수가 설정되지 않음

**해결방법:**
1. Vercel Dashboard → Project Settings → Environment Variables
2. `ALIMTALK_API_SECRET_KEY` 추가
3. 재배포

## 추가 참고사항

- API Key는 서버 측에서만 사용해야 합니다 (클라이언트 노출 금지)
- Next.js Server Actions 또는 API Routes에서만 사용
- HTTPS를 통해서만 API 호출 (프로덕션 환경)
