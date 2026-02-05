# 환영쿠폰 및 블랙리스트 체크 테스트 계획

## 📅 테스트 일정
2026-01-31

## 🎯 테스트 목표
1. 신규 회원가입 시 블랙리스트 체크 정상 동작 확인
2. 신규 회원가입 시 환영 쿠폰 자동 지급 확인
3. 에러 핸들링 및 로그 확인

---

## 📋 테스트 시나리오

### 1. 정상 회원가입 (신규 사용자)

#### 사전 조건
- 블랙리스트에 등록되지 않은 전화번호
- 이전에 가입한 적 없는 전화번호

#### 테스트 절차
1. 로그인 페이지 접속
2. 전화번호 입력 (예: 010-1234-5678)
3. OTP 발송 요청
4. 수신된 OTP 입력
5. OTP 검증 요청

#### 예상 결과
✅ 회원가입 성공
- Response:
  ```json
  {
    "success": true,
    "message": "회원가입이 완료되었습니다.",
    "user": {
      "id": "...",
      "phone": "01012345678",
      "isNewUser": true
    },
    "session": { ... }
  }
  ```
- 쿠키 설정: `user_id`, `user_phone`, `logged_in`
- DB 확인:
  - `profiles` 테이블에 신규 레코드 생성
  - `user_coupons` 테이블에 2개 레코드 생성 (5,000원 쿠폰 x2)
- 로그:
  ```
  [Auth] 환영 쿠폰 2장 지급 완료 (User ID: ...)
  ```

#### 확인 사항
- [ ] `user_coupons` 테이블에 쿠폰 2개 생성
- [ ] `coupon_id`가 welcome 타입 쿠폰을 가리킴
- [ ] `expires_at`이 가입일로부터 7일 후로 설정됨
- [ ] `used_at`이 null (미사용 상태)

---

### 2. 블랙리스트 사용자 회원가입 차단

#### 사전 조건
- 블랙리스트에 등록된 전화번호

#### 블랙리스트 등록 방법
```sql
-- 테스트용 사용자 먼저 생성 (또는 기존 사용자 ID 사용)
INSERT INTO profiles (id, phone, role)
VALUES ('test-blacklist-user-id', '01099999999', 'user');

-- 블랙리스트에 추가
INSERT INTO blacklist (di, reason, blocked_by, original_user_id, blocked_at)
VALUES (
  'test-di-value',
  '테스트용 블랙리스트',
  'admin-user-id',
  'test-blacklist-user-id',
  NOW()
);
```

#### 테스트 절차
1. 로그인 페이지 접속
2. 블랙리스트 전화번호 입력 (010-9999-9999)
3. OTP 발송 요청
4. 수신된 OTP 입력
5. OTP 검증 요청

#### 예상 결과
❌ 회원가입 차단
- Response:
  ```json
  {
    "success": false,
    "error": "회원가입이 제한된 사용자입니다. 고객센터로 문의해주세요.",
    "code": "BLACKLISTED"
  }
  ```
- HTTP Status: `403 Forbidden`
- DB 확인:
  - `profiles` 테이블에 신규 레코드 생성되지 않음
  - `user_coupons` 테이블에 신규 레코드 생성되지 않음
- 로그:
  ```
  [Auth] Blacklisted phone attempted registration: 01099999999
  ```

#### 확인 사항
- [ ] 회원가입 차단됨
- [ ] 적절한 에러 메시지 반환
- [ ] DB에 사용자 생성되지 않음
- [ ] 블랙리스트 시도 로그 기록됨

---

### 3. 기존 사용자 로그인 (쿠폰 미지급)

#### 사전 조건
- 이미 가입된 사용자의 전화번호

#### 테스트 절차
1. 로그인 페이지 접속
2. 기존 사용자 전화번호 입력
3. OTP 발송 요청
4. 수신된 OTP 입력
5. OTP 검증 요청

#### 예상 결과
✅ 로그인 성공 (쿠폰 미지급)
- Response:
  ```json
  {
    "success": true,
    "message": "로그인되었습니다.",
    "user": {
      "id": "...",
      "phone": "...",
      "isNewUser": false
    },
    "session": { ... }
  }
  ```
- DB 확인:
  - `user_coupons` 테이블에 신규 레코드 생성되지 않음

#### 확인 사항
- [ ] 로그인 성공
- [ ] `isNewUser: false`
- [ ] 환영 쿠폰 지급되지 않음

---

### 4. 중복 쿠폰 방지

#### 사전 조건
- 이미 환영 쿠폰을 받은 사용자

#### 테스트 절차
1. 신규 가입하여 환영 쿠폰 2개 받음
2. 로그아웃
3. 동일 전화번호로 다시 로그인

#### 예상 결과
✅ 로그인 성공, 중복 쿠폰 미지급
- `user_coupons` 테이블 조회 시 2개만 존재 (중복 없음)

#### 확인 사항
- [ ] 쿠폰 개수가 2개로 유지됨
- [ ] 중복 지급되지 않음

---

### 5. 쿠폰 지급 실패 시 회원가입 영향 없음

#### 사전 조건
- `grantWelcomeCoupons` 함수가 에러를 발생시키도록 임시 수정
  ```typescript
  // 테스트용 임시 수정
  export async function grantWelcomeCoupons(userId: string): Promise<UserCoupon[]> {
    throw new Error('Test coupon error');
  }
  ```

#### 테스트 절차
1. 신규 전화번호로 회원가입 시도

#### 예상 결과
✅ 회원가입 성공 (쿠폰 미지급)
- Response: `success: true`
- DB 확인:
  - `profiles` 테이블에 사용자 생성됨
  - `user_coupons` 테이블에 쿠폰 없음
- 로그:
  ```
  [Auth] 환영 쿠폰 지급 실패: Error: Test coupon error
  ```

#### 확인 사항
- [ ] 회원가입 성공
- [ ] 쿠폰 미지급
- [ ] 에러 로그 기록됨
- [ ] 사용자는 정상적으로 로그인 가능

---

### 6. 블랙리스트 체크 실패 시 서비스 계속 진행

#### 사전 조건
- `checkBlacklistByPhone` 함수가 에러를 발생시키도록 임시 수정
  ```typescript
  // 테스트용 임시 수정
  export async function checkBlacklistByPhone(phone: string): Promise<boolean> {
    throw new Error('Database error');
  }
  ```

#### 테스트 절차
1. 신규 전화번호로 회원가입 시도

#### 예상 결과
✅ 회원가입 성공 (블랙리스트 체크 건너뛰기)
- Response: `success: true`
- 로그:
  ```
  Failed to check blacklist by phone: Error: Database error
  ```

#### 확인 사항
- [ ] 회원가입 성공 (가용성 우선)
- [ ] 에러 로그 기록됨
- [ ] 사용자 정상 생성됨

---

## 🔍 수동 검증 항목

### 데이터베이스 확인

#### 1. profiles 테이블
```sql
SELECT * FROM profiles
WHERE phone = '01012345678'
ORDER BY created_at DESC
LIMIT 1;
```

**예상 결과:**
- `id`: UUID
- `phone`: '01012345678'
- `role`: 'user'
- `created_at`: 현재 시간

#### 2. user_coupons 테이블
```sql
SELECT uc.*, c.name, c.discount_value, c.coupon_type
FROM user_coupons uc
JOIN coupons c ON uc.coupon_id = c.id
WHERE uc.user_id = 'USER_ID_HERE'
ORDER BY uc.created_at DESC;
```

**예상 결과:**
- 2개 레코드
- `coupon.name`: '신규가입 환영 쿠폰'
- `coupon.discount_value`: 5000
- `coupon.coupon_type`: 'welcome'
- `expires_at`: 가입일 + 7일
- `used_at`: null

#### 3. blacklist 테이블
```sql
SELECT * FROM blacklist
WHERE original_user_id IN (
  SELECT id FROM profiles WHERE phone = '01099999999'
);
```

**예상 결과:**
- 블랙리스트 사용자는 1개 레코드 존재
- `reason`: 차단 사유
- `blocked_at`: 차단 시간

---

## 📊 로그 확인

### 정상 회원가입 로그
```
[Auth] 환영 쿠폰 2장 지급 완료 (User ID: abc-123-def)
[Auth] Supabase 세션 생성 성공
```

### 블랙리스트 차단 로그
```
[Auth] Blacklisted phone attempted registration: 01099999999
```

### 쿠폰 지급 실패 로그
```
[Auth] 환영 쿠폰 지급 실패: Error: ...
```

### 블랙리스트 체크 실패 로그
```
Failed to check blacklist by phone: Error: ...
```

---

## 🧪 API 테스트 (Postman/Insomnia)

### 정상 회원가입
```http
POST /api/auth/twilio/verify-otp
Content-Type: application/json

{
  "phone": "010-1234-5678",
  "code": "123456",
  "registrationAllowed": true
}
```

### 블랙리스트 차단
```http
POST /api/auth/twilio/verify-otp
Content-Type: application/json

{
  "phone": "010-9999-9999",
  "code": "123456",
  "registrationAllowed": true
}
```

---

## ✅ 테스트 체크리스트

### 기능 테스트
- [ ] 신규 회원가입 시 쿠폰 2개 지급
- [ ] 블랙리스트 사용자 회원가입 차단
- [ ] 기존 사용자 로그인 시 쿠폰 미지급
- [ ] 중복 쿠폰 방지
- [ ] 쿠폰 만료일 7일 설정

### 에러 핸들링
- [ ] 쿠폰 지급 실패 시 회원가입 성공
- [ ] 블랙리스트 체크 실패 시 회원가입 성공

### 데이터베이스
- [ ] profiles 테이블 정상 생성
- [ ] user_coupons 테이블 2개 레코드
- [ ] 쿠폰 타입이 'welcome'
- [ ] 쿠폰 금액이 5,000원

### 로그
- [ ] 쿠폰 지급 성공 로그
- [ ] 블랙리스트 차단 로그
- [ ] 에러 로그 기록

### 보안
- [ ] 블랙리스트 사용자 차단
- [ ] 적절한 에러 메시지 (개인정보 노출 없음)
- [ ] 로그에 민감 정보 노출 없음

---

## 🐛 예상 문제점 및 해결 방안

### 1. 쿠폰 템플릿이 없는 경우
**문제:** 첫 회원가입 시 welcome 쿠폰 템플릿이 없음
**해결:** `grantWelcomeCoupons` 함수가 자동으로 템플릿 생성

### 2. 블랙리스트 테이블이 비어있는 경우
**문제:** 모든 사용자가 정상 가입됨
**해결:** 정상 동작 (블랙리스트가 없으면 제한 없음)

### 3. 다날 PASS 연동 전 DI 값이 없는 경우
**문제:** DI 기반 블랙리스트 체크 불가
**해결:** 현재는 전화번호 기반으로 임시 구현

---

## 📝 테스트 결과 기록

### 테스트 수행일: _________

| 시나리오 | 결과 | 비고 |
|---------|------|------|
| 1. 정상 회원가입 | ⬜ PASS / ⬜ FAIL | |
| 2. 블랙리스트 차단 | ⬜ PASS / ⬜ FAIL | |
| 3. 기존 사용자 로그인 | ⬜ PASS / ⬜ FAIL | |
| 4. 중복 쿠폰 방지 | ⬜ PASS / ⬜ FAIL | |
| 5. 쿠폰 실패 시 회원가입 | ⬜ PASS / ⬜ FAIL | |
| 6. 블랙리스트 체크 실패 | ⬜ PASS / ⬜ FAIL | |

### 발견된 이슈

1.
2.
3.

### 개선 사항

1.
2.
3.

---

**테스트 담당자:** _________
**검토자:** _________
**승인자:** _________
