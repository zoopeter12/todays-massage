# 회원가입 환영쿠폰 및 블랙리스트 체크 구현

## 📅 구현일
2026-01-31

## 🎯 구현 내용

### 1. 블랙리스트 체크 (전화번호 기반)

#### 파일: `src/lib/api/blacklist.ts`

새로운 함수 추가: `checkBlacklistByPhone(phone: string)`

**동작 방식:**
1. 전화번호로 `profiles` 테이블에서 사용자 조회
2. 사용자가 존재하면 해당 `user_id`로 `blacklist` 테이블 확인
3. 블랙리스트 항목이 있으면 `true`, 없으면 `false` 반환
4. 에러 발생 시 서비스 가용성 우선으로 `false` 반환

**참고:**
- 현재는 전화번호 기반 임시 구현
- 향후 다날 PASS 연동 시 DI 기반으로 전환 예정

---

### 2. 회원가입 시 블랙리스트 체크

#### 파일: `src/app/api/auth/twilio/verify-otp/route.ts`

**구현 위치:** 신규 사용자 생성 전 (line 87-99)

```typescript
// 블랙리스트 체크 (전화번호 기반 - 다날 PASS 연동 전 임시)
const isBlacklisted = await checkBlacklistByPhone(cleanedPhone);
if (isBlacklisted) {
  console.warn(`[Auth] Blacklisted phone attempted registration: ${cleanedPhone}`);
  return NextResponse.json(
    {
      success: false,
      error: '회원가입이 제한된 사용자입니다. 고객센터로 문의해주세요.',
      code: 'BLACKLISTED',
    },
    { status: 403 }
  );
}
```

**동작 순서:**
1. OTP 검증 성공
2. 기존 사용자 조회
3. 신규 사용자인 경우:
   - 회원가입 허용 여부 확인
   - **블랙리스트 체크** ⭐ (새로 추가)
   - 블랙리스트면 403 에러 반환
   - 정상이면 사용자 생성 진행

---

### 3. 환영 쿠폰 자동 지급

#### 파일: `src/app/api/auth/twilio/verify-otp/route.ts`

**구현 위치:** 프로필 생성 후 (line 133-140)

```typescript
// 3. 환영 쿠폰 지급 (신규 가입자에게 5,000원 쿠폰 2장 지급)
try {
  const welcomeCoupons = await grantWelcomeCoupons(userId);
  console.log(`[Auth] 환영 쿠폰 ${welcomeCoupons.length}장 지급 완료 (User ID: ${userId})`);
} catch (couponError) {
  console.error('[Auth] 환영 쿠폰 지급 실패:', couponError);
  // 쿠폰 지급 실패는 회원가입 성공에 영향을 주지 않도록 함
}
```

**동작:**
- 신규 사용자 생성 후 `grantWelcomeCoupons(userId)` 호출
- 5,000원 쿠폰 2장 자동 지급 (총 10,000원 혜택)
- 쿠폰 지급 실패 시에도 회원가입은 정상 진행

---

### 4. 환영 쿠폰 함수 (기존)

#### 파일: `src/lib/api/coupons.ts`

**함수:** `grantWelcomeCoupons(userId: string)`

**동작 방식:**
1. 이미 환영 쿠폰을 받았는지 확인 (중복 지급 방지)
2. 시스템 환영 쿠폰 템플릿 조회
   - `coupon_type: 'welcome'`
   - `is_system: true`
   - `discount_value: 5000`
3. 템플릿이 없으면 자동 생성
4. 만료일 계산 (가입일로부터 7일 후)
5. `user_coupons` 테이블에 2개 삽입

**쿠폰 정보:**
- 이름: 신규가입 환영 쿠폰
- 유형: welcome
- 할인 타입: fixed (고정 금액)
- 할인 금액: 5,000원
- 최소 주문 금액: 0원 (제한 없음)
- 유효기간: 가입일로부터 7일
- 지급 개수: 2장

---

## 🔄 회원가입 플로우

```
1. 사용자가 OTP 인증 완료
   ↓
2. 기존 사용자 조회
   ↓
3. [신규 사용자]
   ├─ 회원가입 허용 여부 확인 (registrationAllowed)
   ├─ ⭐ 블랙리스트 체크 (checkBlacklistByPhone)
   │   └─ 블랙리스트면 403 에러 반환
   ├─ Supabase Auth 사용자 생성 (auth.users)
   ├─ 프로필 생성 (profiles)
   └─ ⭐ 환영 쿠폰 지급 (grantWelcomeCoupons)
       └─ 5,000원 쿠폰 2장 지급
   ↓
4. 세션 생성 및 쿠키 설정
   ↓
5. 로그인 완료
```

---

## ✅ 테스트 시나리오

### 1. 정상 회원가입
- 전화번호: 새로운 번호
- 예상 결과:
  - 회원가입 성공
  - 환영 쿠폰 2장 자동 지급
  - 로그: "환영 쿠폰 2장 지급 완료"

### 2. 블랙리스트 사용자
- 전화번호: 블랙리스트에 등록된 번호
- 예상 결과:
  - 403 에러 반환
  - 에러 메시지: "회원가입이 제한된 사용자입니다. 고객센터로 문의해주세요."
  - code: "BLACKLISTED"
  - 로그: "Blacklisted phone attempted registration: [phone]"

### 3. 중복 쿠폰 방지
- 이미 환영 쿠폰을 받은 사용자가 재가입 시도
- 예상 결과:
  - 쿠폰 중복 지급 방지
  - 빈 배열 반환

---

## 🔒 보안 고려사항

### 블랙리스트 체크
- 전화번호 기반 임시 구현 (다날 PASS DI 연동 전)
- 블랙리스트 체크 실패 시 서비스 가용성 우선 (false 반환)
- 블랙리스트 등록 시도 로그 기록

### 에러 핸들링
- 블랙리스트 체크 에러: 서비스 계속 진행 (가용성 우선)
- 쿠폰 지급 실패: 회원가입 성공에 영향 없음
- 모든 에러는 콘솔 로그 기록

---

## 📊 데이터베이스 의존성

### 테이블
1. `profiles` - 사용자 프로필
2. `blacklist` - 블랙리스트 (DI 또는 user_id 기반)
3. `coupons` - 쿠폰 템플릿
4. `user_coupons` - 사용자별 쿠폰

### 필드
- `blacklist.original_user_id` - 블랙리스트 사용자 ID
- `coupons.coupon_type` - 쿠폰 타입 ('welcome')
- `coupons.is_system` - 시스템 쿠폰 여부
- `user_coupons.expires_at` - 쿠폰 만료일

---

## 🚀 향후 개선 사항

### 1. 다날 PASS 연동 (우선순위: 높음)
- DI 기반 블랙리스트 체크로 전환
- `checkBlacklist(di)` 함수 사용
- 전화번호 변경으로 우회 방지

### 2. 쿠폰 지급 알림 (우선순위: 중간)
- 환영 쿠폰 지급 시 푸시 알림
- 카카오 알림톡 발송

### 3. 쿠폰 사용 통계 (우선순위: 낮음)
- 환영 쿠폰 사용률 추적
- A/B 테스트 (쿠폰 금액/개수 최적화)

---

## 📝 변경 파일 목록

1. `src/lib/api/blacklist.ts`
   - ✅ `checkBlacklistByPhone()` 함수 추가

2. `src/app/api/auth/twilio/verify-otp/route.ts`
   - ✅ 블랙리스트 체크 로직 추가
   - ✅ 환영 쿠폰 지급 로직 추가
   - ✅ Import 추가: `checkBlacklistByPhone`, `grantWelcomeCoupons`

3. `src/lib/api/coupons.ts`
   - ✅ `grantWelcomeCoupons()` 함수 (이미 존재)

---

## ✅ 완료 상태

- [x] 블랙리스트 체크 함수 구현
- [x] 회원가입 시 블랙리스트 체크 통합
- [x] 환영 쿠폰 자동 지급 통합
- [x] 에러 핸들링 구현
- [x] TypeScript 타입 체크 통과
- [x] 문서 작성

**구현 완료일:** 2026-01-31
