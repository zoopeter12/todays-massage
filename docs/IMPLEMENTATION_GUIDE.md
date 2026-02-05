# todays-massage 구현 가이드

## 개요

이 문서는 최종 비즈니스 모델에 맞춰 기존 프로젝트를 수정하기 위한 가이드입니다. 다음 개발 세션에서 참조하여 구현을 진행합니다.

---

## 목차

1. [기존 코드 수정 사항](#1-기존-코드-수정-사항)
2. [신규 구현 사항](#2-신규-구현-사항)
3. [DB 마이그레이션](#3-db-마이그레이션)
4. [환경 변수 추가](#4-환경-변수-추가)
5. [이용약관 수정](#5-이용약관-수정)
6. [테스트 체크리스트](#6-테스트-체크리스트)

---

## 1. 기존 코드 수정 사항

### 1.1 매장 전화번호 비공개

**파일**: `src/app/(customer)/shops/[id]/page.tsx`

**현재 코드** (168-181줄):
```tsx
{shop.tel && (
  <div className="flex items-start gap-3">
    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
    <div>
      <p className="font-medium mb-1">전화번호</p>
      <a
        href={`tel:${shop.tel}`}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {shop.tel}
      </a>
    </div>
  </div>
)}
```

**수정 방법**: 해당 블록 전체를 제거하거나 주석 처리

**추가 확인 필요 파일**:
- `src/components/customer/ShopCard.tsx` - 매장 카드에 전화번호 표시 여부 확인
- `src/app/(customer)/search/page.tsx` - 검색 결과에 전화번호 표시 여부 확인

---

### 1.2 포인트 적립 로직 수정

**파일**: `src/lib/api/points.ts`

**현재 상태**:
- `earnPoints()` 함수가 예약 완료 시 자동 적립에 사용됨 (74-104줄)
- `calculateEarnAmount()` 함수로 5% 적립률 계산 (181-189줄)

**수정 방법**: 예약 완료 시 자동 적립 로직 제거

1. `earnPoints()` 함수는 유지하되, 예약 완료 시 호출하는 코드 제거
2. 출석체크/룰렛에서의 포인트 적립은 `grantBonusPoints()` 사용으로 유지

**확인 필요 파일**:
- `src/lib/api/reservations.ts` - 예약 완료 시 포인트 적립 호출 부분 확인
- `src/app/api/payment/webhook/route.ts` - 결제 완료 웹훅에서 포인트 적립 여부 확인

---

### 1.3 신규가입 쿠폰 자동 지급

**파일**: `src/lib/api/coupons.ts`

**추가할 함수**:

```typescript
/**
 * 신규 가입 회원에게 환영 쿠폰 자동 지급
 * @param userId - 사용자 ID
 * @returns 생성된 쿠폰 정보
 */
export async function grantWelcomeCoupon(userId: string): Promise<UserCoupon | null> {
  try {
    // 이미 환영 쿠폰을 받았는지 확인
    const { data: existing } = await supabase
      .from('user_coupons')
      .select('id, coupon:coupons!inner(coupon_type)')
      .eq('user_id', userId)
      .eq('coupon.coupon_type', 'welcome')
      .maybeSingle();

    if (existing) {
      console.log('User already has welcome coupon');
      return null;
    }

    // 시스템 환영 쿠폰 조회 또는 생성
    let { data: welcomeCoupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('coupon_type', 'welcome')
      .eq('is_system', true)
      .eq('is_active', true)
      .single();

    if (!welcomeCoupon) {
      // 환영 쿠폰이 없으면 생성
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7일 후 만료

      const { data: newCoupon, error: createError } = await supabase
        .from('coupons')
        .insert({
          name: '신규가입 환영 쿠폰',
          coupon_type: 'welcome',
          discount_type: 'fixed',
          discount_value: 10000,
          min_price: 0,
          max_discount: null,
          valid_until: expiryDate.toISOString(),
          is_active: true,
          is_system: true,
          shop_id: null, // 전체 매장 사용 가능
        })
        .select()
        .single();

      if (createError) throw createError;
      welcomeCoupon = newCoupon;
    }

    // 사용자에게 쿠폰 지급
    const { data: userCoupon, error: grantError } = await supabase
      .from('user_coupons')
      .insert({
        user_id: userId,
        coupon_id: welcomeCoupon.id,
      })
      .select('*, coupon:coupons(*)')
      .single();

    if (grantError) throw grantError;

    return userCoupon;
  } catch (error) {
    console.error('Failed to grant welcome coupon:', error);
    return null;
  }
}
```

**호출 위치**:
- `src/app/api/auth/twilio/verify-otp/route.ts` - OTP 검증 성공 후 신규 사용자 생성 시
- `src/app/auth/callback/route.ts` - OAuth 콜백에서 신규 사용자 생성 시

---

## 2. 신규 구현 사항

### 2.1 다날 PASS 본인인증

#### 2.1.1 클라이언트 라이브러리

**새 파일**: `src/lib/danal/client.ts`

```typescript
/**
 * 다날 PASS 본인인증 클라이언트
 * @see https://docs.danal.co.kr/pass/
 */

interface VerificationRequest {
  phoneNumber: string;
  name?: string;
  birthday?: string;
}

interface VerificationResult {
  success: boolean;
  ci?: string;          // 연계정보 (Connecting Information) - 사이트 간 동일인 확인용
  di?: string;          // 중복가입확인정보 (Duplication Information) - 서비스 내 동일인 확인용
  realName?: string;    // 실명
  gender?: 'male' | 'female';
  birthDate?: string;   // YYYYMMDD
  error?: string;
}

const DANAL_CONFIG = {
  cpId: process.env.DANAL_CP_ID!,
  cpPwd: process.env.DANAL_CP_PWD!,
  returnUrl: process.env.DANAL_RETURN_URL!,
  apiUrl: process.env.DANAL_API_URL || 'https://uas.teledit.com',
};

/**
 * 본인인증 요청 URL 생성
 */
export async function requestVerification(
  request: VerificationRequest
): Promise<{ verificationUrl: string; transactionId: string }> {
  // 1. 다날 API로 인증 요청
  // 2. 인증 URL과 트랜잭션 ID 반환
  // 3. 클라이언트에서 해당 URL로 리다이렉트

  const transactionId = generateTransactionId();

  // TODO: 다날 API 연동 구현
  // const response = await fetch(`${DANAL_CONFIG.apiUrl}/...`, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     CP_CD: DANAL_CONFIG.cpId,
  //     ...
  //   }),
  // });

  return {
    verificationUrl: `${DANAL_CONFIG.apiUrl}/verify?tid=${transactionId}`,
    transactionId,
  };
}

/**
 * 본인인증 결과 검증
 */
export async function verifyIdentity(
  transactionId: string,
  encryptedData: string
): Promise<VerificationResult> {
  try {
    // TODO: 다날 API로 결과 검증
    // 암호화된 데이터 복호화 후 CI/DI 추출

    return {
      success: true,
      ci: '', // 복호화된 CI
      di: '', // 복호화된 DI
      realName: '',
      gender: 'male',
      birthDate: '',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '인증에 실패했습니다.',
    };
  }
}

function generateTransactionId(): string {
  return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
```

#### 2.1.2 API 라우트

**새 파일**: `src/app/api/auth/danal/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requestVerification } from '@/lib/danal/client';

/**
 * POST /api/auth/danal
 * 다날 PASS 본인인증 요청
 */
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, name, birthday } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: '전화번호는 필수입니다.' },
        { status: 400 }
      );
    }

    const result = await requestVerification({ phoneNumber, name, birthday });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Danal verification request failed:', error);
    return NextResponse.json(
      { error: '본인인증 요청에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

**새 파일**: `src/app/api/auth/danal/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdentity } from '@/lib/danal/client';
import { checkBlacklist } from '@/lib/api/blacklist';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/danal/callback
 * 다날 PASS 본인인증 콜백 처리
 */
export async function POST(request: NextRequest) {
  try {
    const { transactionId, encryptedData } = await request.json();

    // 1. 본인인증 결과 검증
    const result = await verifyIdentity(transactionId, encryptedData);

    if (!result.success || !result.di) {
      return NextResponse.json(
        { error: result.error || '인증에 실패했습니다.' },
        { status: 400 }
      );
    }

    // 2. 블랙리스트 확인
    const isBlacklisted = await checkBlacklist(result.di);

    if (isBlacklisted) {
      return NextResponse.json(
        { error: '서비스 이용이 제한된 사용자입니다.' },
        { status: 403 }
      );
    }

    // 3. 사용자 프로필에 인증 정보 저장
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('profiles')
        .update({
          ci: result.ci,
          di: result.di,
          real_name: result.realName,
          gender: result.gender,
          birth_date: result.birthDate,
          verified_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (error) {
    console.error('Danal callback failed:', error);
    return NextResponse.json(
      { error: '인증 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

---

### 2.2 블랙리스트 시스템

**새 파일**: `src/lib/api/blacklist.ts`

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase/client';

interface BlacklistEntry {
  id: string;
  di: string;
  reason: string;
  blocked_at: string;
  blocked_by: string | null;
  original_user_id: string | null;
  created_at: string;
}

/**
 * DI로 블랙리스트 여부 확인
 * @param di - 중복가입확인정보 (본인인증 시 획득)
 * @returns 블랙리스트 여부
 */
export async function checkBlacklist(di: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('blacklist')
    .select('id')
    .eq('di', di)
    .maybeSingle();

  if (error) {
    console.error('Failed to check blacklist:', error);
    return false; // 에러 시 false 반환 (서비스 가용성 우선)
  }

  return !!data;
}

/**
 * 블랙리스트에 추가
 * @param di - 중복가입확인정보
 * @param reason - 차단 사유
 * @param blockedBy - 차단한 관리자 ID
 * @param originalUserId - 원래 사용자 ID (선택)
 */
export async function addToBlacklist(
  di: string,
  reason: string,
  blockedBy: string,
  originalUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const serverSupabase = await createServerClient();

    const { error } = await serverSupabase
      .from('blacklist')
      .insert({
        di,
        reason,
        blocked_by: blockedBy,
        original_user_id: originalUserId,
        blocked_at: new Date().toISOString(),
      });

    if (error) {
      if (error.code === '23505') { // unique violation
        return { success: false, error: '이미 블랙리스트에 등록된 사용자입니다.' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add to blacklist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '블랙리스트 추가에 실패했습니다.',
    };
  }
}

/**
 * 블랙리스트에서 제거
 */
export async function removeFromBlacklist(di: string): Promise<{ success: boolean; error?: string }> {
  try {
    const serverSupabase = await createServerClient();

    const { error } = await serverSupabase
      .from('blacklist')
      .delete()
      .eq('di', di);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Failed to remove from blacklist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '블랙리스트 제거에 실패했습니다.',
    };
  }
}

/**
 * 블랙리스트 목록 조회 (관리자용)
 */
export async function fetchBlacklist(
  page: number = 1,
  limit: number = 20
): Promise<{ data: BlacklistEntry[]; total: number }> {
  const serverSupabase = await createServerClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await serverSupabase
    .from('blacklist')
    .select('*', { count: 'exact' })
    .order('blocked_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
  };
}
```

---

### 2.3 고객 신용점수

**새 파일**: `src/lib/api/credit-score.ts`

```typescript
import { supabase } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/server';
import { addToBlacklist } from './blacklist';

// 신용점수 기본값 및 한도
const CREDIT_SCORE_DEFAULT = 100;
const CREDIT_SCORE_MAX = 100;
const CREDIT_SCORE_MIN = 0;
const CREDIT_SCORE_BLACKLIST_THRESHOLD = 0;

// 점수 변동 상수
export const CREDIT_SCORE_CHANGES = {
  VISIT_COMPLETED: 2,      // 방문 완료 시 +2
  REPORT_RECEIVED: -50,    // 신고 접수 시 -50
  NO_SHOW: -30,            // 노쇼 시 -30
  LATE_CANCELLATION: -10,  // 1시간 이내 취소 -10
} as const;

interface CreditScoreHistory {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  reference_type?: string;  // 'reservation', 'report', etc.
  reference_id?: string;
  created_at: string;
}

/**
 * 사용자 신용점수 조회
 */
export async function getCreditScore(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('credit_score')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to get credit score:', error);
    return CREDIT_SCORE_DEFAULT;
  }

  return data?.credit_score ?? CREDIT_SCORE_DEFAULT;
}

/**
 * 신용점수 업데이트 및 블랙리스트 자동 이동
 * @param userId - 사용자 ID
 * @param delta - 점수 변동 (+/-)
 * @param reason - 변동 사유
 * @param referenceType - 참조 타입 (reservation, report 등)
 * @param referenceId - 참조 ID
 */
export async function updateCreditScore(
  userId: string,
  delta: number,
  reason: string,
  referenceType?: string,
  referenceId?: string
): Promise<{ success: boolean; newScore: number; isBlacklisted: boolean }> {
  const serverSupabase = await createServerClient();

  // 현재 점수 조회
  const { data: profile, error: fetchError } = await serverSupabase
    .from('profiles')
    .select('credit_score, di')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw new Error('사용자 정보를 조회할 수 없습니다.');
  }

  const currentScore = profile?.credit_score ?? CREDIT_SCORE_DEFAULT;
  let newScore = Math.max(CREDIT_SCORE_MIN, Math.min(CREDIT_SCORE_MAX, currentScore + delta));

  // 점수 업데이트
  const { error: updateError } = await serverSupabase
    .from('profiles')
    .update({ credit_score: newScore })
    .eq('id', userId);

  if (updateError) {
    throw new Error('신용점수 업데이트에 실패했습니다.');
  }

  // 변동 이력 저장
  await serverSupabase
    .from('credit_score_history')
    .insert({
      user_id: userId,
      delta,
      reason,
      previous_score: currentScore,
      new_score: newScore,
      reference_type: referenceType,
      reference_id: referenceId,
    });

  // 0점 이하면 블랙리스트로 자동 이동
  let isBlacklisted = false;
  if (newScore <= CREDIT_SCORE_BLACKLIST_THRESHOLD && profile?.di) {
    const blacklistResult = await addToBlacklist(
      profile.di,
      `신용점수 0점 도달 (마지막 사유: ${reason})`,
      'system',
      userId
    );
    isBlacklisted = blacklistResult.success;
  }

  return {
    success: true,
    newScore,
    isBlacklisted,
  };
}

/**
 * 방문 완료 시 신용점수 적립
 */
export async function earnCreditOnVisit(
  userId: string,
  reservationId: string
): Promise<void> {
  await updateCreditScore(
    userId,
    CREDIT_SCORE_CHANGES.VISIT_COMPLETED,
    '방문 완료',
    'reservation',
    reservationId
  );
}

/**
 * 신고 접수 시 신용점수 차감
 */
export async function deductCreditOnReport(
  userId: string,
  reportId: string
): Promise<{ isBlacklisted: boolean }> {
  const result = await updateCreditScore(
    userId,
    CREDIT_SCORE_CHANGES.REPORT_RECEIVED,
    '신고 접수',
    'report',
    reportId
  );

  return { isBlacklisted: result.isBlacklisted };
}

/**
 * 노쇼 시 신용점수 차감
 */
export async function deductCreditOnNoShow(
  userId: string,
  reservationId: string
): Promise<{ isBlacklisted: boolean }> {
  const result = await updateCreditScore(
    userId,
    CREDIT_SCORE_CHANGES.NO_SHOW,
    '예약 노쇼',
    'reservation',
    reservationId
  );

  return { isBlacklisted: result.isBlacklisted };
}

/**
 * 1시간 이내 취소 시 신용점수 차감
 */
export async function deductCreditOnLateCancellation(
  userId: string,
  reservationId: string
): Promise<{ isBlacklisted: boolean }> {
  const result = await updateCreditScore(
    userId,
    CREDIT_SCORE_CHANGES.LATE_CANCELLATION,
    '1시간 이내 예약 취소',
    'reservation',
    reservationId
  );

  return { isBlacklisted: result.isBlacklisted };
}

/**
 * 신용점수 변동 이력 조회
 */
export async function fetchCreditScoreHistory(
  userId: string,
  limit: number = 20
): Promise<CreditScoreHistory[]> {
  const { data, error } = await supabase
    .from('credit_score_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch credit score history:', error);
    return [];
  }

  return data || [];
}
```

---

## 3. DB 마이그레이션

### 3.1 profiles 테이블 확장

**새 파일**: `supabase/migrations/039_add_verification_fields.sql`

```sql
-- ================================================
-- 본인인증 필드 및 신용점수 시스템 추가
-- ================================================

-- 1. profiles 테이블에 본인인증 필드 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ci TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS di TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS real_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 100;

-- 2. 인덱스 생성 (빠른 조회용)
CREATE INDEX IF NOT EXISTS idx_profiles_di ON profiles(di);
CREATE INDEX IF NOT EXISTS idx_profiles_ci ON profiles(ci);
CREATE INDEX IF NOT EXISTS idx_profiles_credit_score ON profiles(credit_score);

-- 3. 신용점수 유효 범위 체크
ALTER TABLE profiles ADD CONSTRAINT credit_score_range
  CHECK (credit_score >= 0 AND credit_score <= 100);

-- 4. 본인인증 완료 사용자만 특정 기능 사용 가능 (RLS에서 활용)
COMMENT ON COLUMN profiles.ci IS '연계정보 - 사이트 간 동일인 확인용';
COMMENT ON COLUMN profiles.di IS '중복가입확인정보 - 서비스 내 동일인 확인용';
COMMENT ON COLUMN profiles.verified_at IS '본인인증 완료 시각';
COMMENT ON COLUMN profiles.credit_score IS '고객 신용점수 (0-100, 기본값 100)';
```

### 3.2 블랙리스트 테이블 생성

**새 파일**: `supabase/migrations/040_create_blacklist.sql`

```sql
-- ================================================
-- 블랙리스트 테이블 생성
-- ================================================

CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  di TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_by UUID REFERENCES profiles(id),
  original_user_id UUID,  -- 블랙리스트 추가 당시 사용자 ID (참조용)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_blacklist_di ON blacklist(di);
CREATE INDEX IF NOT EXISTS idx_blacklist_blocked_at ON blacklist(blocked_at DESC);

-- RLS 활성화
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- 관리자만 블랙리스트 관리 가능
CREATE POLICY "Admins can view blacklist" ON blacklist
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert blacklist" ON blacklist
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR blocked_by = 'system'  -- 시스템 자동 추가 허용
  );

CREATE POLICY "Admins can delete blacklist" ON blacklist
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 코멘트
COMMENT ON TABLE blacklist IS '서비스 이용 제한 사용자 목록 (DI 기반)';
COMMENT ON COLUMN blacklist.di IS '중복가입확인정보 - 재가입해도 동일';
COMMENT ON COLUMN blacklist.original_user_id IS '블랙리스트 추가 당시 사용자 ID (재가입 시 추적용)';
```

### 3.3 신용점수 이력 테이블 생성

**새 파일**: `supabase/migrations/041_create_credit_score_history.sql`

```sql
-- ================================================
-- 신용점수 변동 이력 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS credit_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,           -- 변동량 (+/-)
  previous_score INTEGER NOT NULL,  -- 변동 전 점수
  new_score INTEGER NOT NULL,       -- 변동 후 점수
  reason TEXT NOT NULL,             -- 변동 사유
  reference_type TEXT,              -- 참조 타입 (reservation, report 등)
  reference_id UUID,                -- 참조 ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_credit_score_history_user_id ON credit_score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_score_history_created_at ON credit_score_history(created_at DESC);

-- RLS 활성화
ALTER TABLE credit_score_history ENABLE ROW LEVEL SECURITY;

-- 본인만 자신의 이력 조회 가능
CREATE POLICY "Users can view own credit history" ON credit_score_history
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 이력 조회 가능
CREATE POLICY "Admins can view all credit history" ON credit_score_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 시스템만 이력 추가 가능 (INSERT는 서버에서만)
CREATE POLICY "System can insert credit history" ON credit_score_history
  FOR INSERT WITH CHECK (true);  -- 서버 사이드에서만 호출되므로 항상 허용

COMMENT ON TABLE credit_score_history IS '고객 신용점수 변동 이력';
```

### 3.4 쿠폰 테이블 확장

**새 파일**: `supabase/migrations/042_add_coupon_system_fields.sql`

```sql
-- ================================================
-- 쿠폰 테이블 시스템 쿠폰 필드 추가
-- ================================================

-- 시스템 발급 쿠폰 여부 필드 추가
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'shop';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- shop_id nullable로 변경 (시스템 쿠폰은 shop_id가 없음)
ALTER TABLE coupons ALTER COLUMN shop_id DROP NOT NULL;

-- 쿠폰 타입 체크
ALTER TABLE coupons ADD CONSTRAINT coupon_type_check
  CHECK (coupon_type IN ('welcome', 'referral', 'event', 'shop'));

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_coupon_type ON coupons(coupon_type);
CREATE INDEX IF NOT EXISTS idx_coupons_is_system ON coupons(is_system);

COMMENT ON COLUMN coupons.coupon_type IS '쿠폰 타입: welcome(신규가입), referral(친구초대), event(이벤트), shop(매장)';
COMMENT ON COLUMN coupons.is_system IS '시스템 자동 발급 쿠폰 여부';
```

---

## 4. 환경 변수 추가

`.env.local`에 추가:

```env
# ================================
# 다날 PASS 본인인증
# ================================
DANAL_CP_ID=your_cp_id
DANAL_CP_PWD=your_cp_pwd
DANAL_API_URL=https://uas.teledit.com
DANAL_RETURN_URL=https://yourdomain.com/api/auth/danal/callback

# ================================
# 환경별 URL (선택)
# ================================
# 개발 환경
# DANAL_RETURN_URL=http://localhost:3000/api/auth/danal/callback
# 스테이징
# DANAL_RETURN_URL=https://staging.yourdomain.com/api/auth/danal/callback
```

**보안 주의사항**:
- `DANAL_CP_PWD`는 절대 클라이언트에 노출되면 안 됨
- `NEXT_PUBLIC_` prefix 사용 금지
- Vercel 환경 변수에 등록 필요

---

## 5. 이용약관 수정

**파일**: `src/app/(customer)/terms/page.tsx`

**추가할 문구**:

```markdown
## 제X조 (서비스의 성격 및 책임 범위)

1. **플랫폼 서비스의 성격**
   본 서비스는 이용자와 마사지샵 간의 예약을 중개하는 플랫폼입니다.

2. **당사자 관계**
   회사는 이용자와 마사지샵 간 거래의 당사자가 아니며, 서비스 품질, 안전, 적법성에 대한 책임은 해당 마사지샵에 있습니다.

3. **회사의 역할**
   회사는 중개 서비스 제공에 따른 기술적 지원만을 담당하며, 다음에 해당하지 않습니다:
   - 마사지 서비스의 직접 제공자
   - 마사지샵의 고용주 또는 대리인
   - 이용자와 마사지샵 간 분쟁의 당사자

4. **책임의 제한**
   회사는 다음 사항에 대해 책임을 지지 않습니다:
   - 마사지샵이 제공하는 서비스의 품질
   - 마사지샵의 위생 상태
   - 마사지샵 직원의 자격 또는 행위
   - 이용자와 마사지샵 간의 금전적 분쟁

## 제Y조 (예약 취소 정책)

1. **취소 가능 시간**
   - 예약 시간 1시간 전까지: 전액 환불
   - 예약 시간 1시간 이내: 환불 불가, 신용점수 10점 차감

2. **노쇼(No-show) 정책**
   예약 시간에 연락 없이 방문하지 않은 경우:
   - 환불 불가
   - 신용점수 30점 차감

3. **신용점수 제도**
   - 기본 점수: 100점
   - 방문 완료 시: +2점
   - 1시간 이내 취소: -10점
   - 노쇼: -30점
   - 신고 접수: -50점
   - 0점 도달 시: 서비스 이용 제한

## 제Z조 (본인인증)

1. **본인인증 필수**
   서비스 이용을 위해 다날 PASS를 통한 본인인증이 필요합니다.

2. **정보의 수집 및 이용**
   본인인증 시 다음 정보가 수집됩니다:
   - CI (연계정보): 다른 서비스와의 연계용
   - DI (중복가입확인정보): 재가입 방지용
   - 이름, 생년월일, 성별

3. **이용 제한**
   과거 서비스 이용이 제한된 사용자는 재가입이 불가합니다.
```

---

## 6. 테스트 체크리스트

### 기능 테스트

| 항목 | 테스트 내용 | 상태 |
|------|------------|------|
| **다날 PASS** | 본인인증 요청/결과 처리 | [ ] |
| **블랙리스트** | DI 기반 가입 차단 | [ ] |
| **환영 쿠폰** | 신규가입 시 10,000원 쿠폰 지급 | [ ] |
| **전화번호 숨김** | 매장 상세페이지 전화번호 미표시 | [ ] |
| **취소 정책** | 1시간 기준 취소 가능/불가 분기 | [ ] |
| **신용점수** | 방문 완료 시 +2점 | [ ] |
| **신용점수** | 신고 접수 시 -50점 | [ ] |
| **블랙리스트 이동** | 0점 도달 시 자동 블랙리스트 | [ ] |

### E2E 테스트

```bash
# 새로 추가할 테스트 파일
e2e/
  danal-verification.spec.ts    # 본인인증 플로우
  blacklist.spec.ts             # 블랙리스트 시스템
  credit-score.spec.ts          # 신용점수 시스템
  welcome-coupon.spec.ts        # 환영 쿠폰 지급
```

### 데이터베이스 테스트

```sql
-- 마이그레이션 적용 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('ci', 'di', 'credit_score', 'verified_at');

-- 블랙리스트 테이블 확인
SELECT * FROM blacklist LIMIT 1;

-- 신용점수 이력 테이블 확인
SELECT * FROM credit_score_history LIMIT 1;
```

---

## 우선순위 및 작업 순서

### Phase 1: DB 마이그레이션 (필수)
1. `039_add_verification_fields.sql` 적용
2. `040_create_blacklist.sql` 적용
3. `041_create_credit_score_history.sql` 적용
4. `042_add_coupon_system_fields.sql` 적용

### Phase 2: 기존 코드 수정
1. 매장 전화번호 숨김 처리
2. 환영 쿠폰 지급 함수 추가

### Phase 3: 신규 구현
1. 블랙리스트 API 구현
2. 신용점수 API 구현
3. 다날 PASS 연동 (환경 변수 필요)

### Phase 4: 테스트 및 검증
1. 단위 테스트 작성
2. E2E 테스트 작성
3. 통합 테스트

---

## 참고 문서

- [다날 PASS 연동 가이드](https://docs.danal.co.kr/pass/)
- [프로젝트 현황](./features/IMPLEMENTATION_STATUS_2026_01_30.md)
- [Supabase 설정](./services/SUPABASE_SETUP.md)
- [테스트 가이드](./testing/E2E_TESTING_GUIDE.md)

---

*문서 작성일: 2026-01-31*
*작성자: Claude Code*
