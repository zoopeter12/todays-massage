# Supabase SQL 실행 가이드

Supabase 대시보드에서 데이터베이스 마이그레이션 SQL을 실행하는 방법을 안내합니다.

> **최종 업데이트:** 2026-01-29
> **검증 상태:** 앱 기능 테스트 완료, DB 마이그레이션 대기 중

---

## 필요한 테이블 목록

다음 테이블들이 Supabase에 생성되어야 앱이 완전하게 동작합니다:

| # | 테이블명 | 관련 기능 | 우선순위 |
|---|----------|----------|----------|
| 1 | profiles | 사용자 프로필 | 필수 (기본) |
| 2 | shops | 매장 정보 | 필수 (기본) |
| 3 | courses | 코스 정보 | 필수 (기본) |
| 4 | reservations | 예약 | 필수 (기본) |
| 5 | point_history | 포인트 내역 | 높음 |
| 6 | attendance | 출석체크 | 높음 |
| 7 | favorites | 찜하기 | 중간 |
| 8 | reviews | 리뷰 | 중간 |
| 9 | coupons, coupon_usages | 쿠폰 | 중간 |
| 10 | chat_rooms, chat_messages | 채팅 | 중간 |
| 11 | settlements | 정산 | 중간 |
| 12 | reports | 신고 관리 | 낮음 |
| 13 | notices, faqs, banners | 콘텐츠 관리 | 낮음 |
| 14 | system_settings | 시스템 설정 | 낮음 |
| 15 | admin_logs | 관리자 로그 | 낮음 |

---

## 마이그레이션 파일 실행 순서

아래 순서대로 실행해야 외래키 참조 오류가 발생하지 않습니다:

```
1. supabase/run_all.sql (기본 테이블 + 테스트 데이터)
   또는 개별 실행:
   - 20260124000000_initial_schema.sql
   - 20240124_add_shop_is_open.sql

2. 20260125000001_add_shop_owner.sql (shops 테이블 owner_id 컬럼)
3. 20250125000000_create_reviews_table.sql (리뷰)
4. 20260125000003_create_favorites_table.sql (찜하기)
5. 20260125100000_create_point_history_table.sql (포인트 - attendance 선행 조건)
6. 20260125200000_create_attendance_table.sql (출석체크)
7. create_coupons_tables.sql (쿠폰)
8. 20260125200000_create_chat_tables.sql (채팅)
9. 20260125100000_create_settlements_table.sql (정산)
10. 20260125300000_create_reports_table.sql (신고)
11. 20260126000000_create_content_tables.sql (공지/FAQ/배너)
12. 20260126100000_create_system_settings_table.sql (시스템 설정)
13. 20260127000001_create_admin_logs_table.sql (관리자 로그)
```

---

## 빠른 시작 (기본 기능만)

기본 기능만 빠르게 설정하려면 `supabase/run_all.sql` 파일을 실행하세요.
이 파일에는 profiles, shops, courses, reservations 테이블과 테스트 데이터가 포함되어 있습니다.

---

## 1단계: Supabase 대시보드 접속

1. [Supabase 웹사이트](https://supabase.com)에 접속
2. 계정에 로그인
3. 해당 프로젝트 클릭하여 대시보드 열기

---

## 2단계: SQL Editor 열기

**좌측 네비게이션 메뉴에서:**
- "SQL Editor" 클릭 (또는 쿼리 아이콘 선택)
- 새로운 쿼리 탭 열기: "New Query" 또는 "+" 버튼 클릭

---

## 3단계: 마이그레이션 SQL 실행 (순서 중요!)

### 첫 번째: Point History 테이블 생성

**파일:** `20260125100000_create_point_history_table.sql`

아래 SQL을 복사하여 SQL Editor에 붙여넣기:

```sql
-- ============================================================
-- Point History Migration
-- 포인트 적립/사용/만료 내역 관리 테이블
-- Includes: Enum type, Table, Indexes, RLS policies, Functions
-- ============================================================

-- =========================
-- 1. ENUM TYPE
-- =========================

-- 포인트 유형: earn(적립), use(사용), expire(만료), bonus(보너스)
CREATE TYPE point_type AS ENUM ('earn', 'use', 'expire', 'bonus');

-- =========================
-- 2. TABLE
-- =========================

CREATE TABLE IF NOT EXISTS point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 참조 (profiles 테이블 외래키)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 포인트 금액 (양수: 적립/보너스, 음수: 사용/만료)
  amount INTEGER NOT NULL,

  -- 포인트 유형
  type point_type NOT NULL,

  -- 설명 (적립 사유, 사용처 등)
  description TEXT NOT NULL DEFAULT '',

  -- 연관 예약 (예약 완료 시 포인트 적립 등)
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,

  -- 포인트 만료일 (적립 시점 + 12개월)
  expired_at TIMESTAMPTZ,

  -- 생성일시
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 제약조건: 적립/보너스는 양수, 사용/만료는 음수
  CONSTRAINT check_amount_sign CHECK (
    (type IN ('earn', 'bonus') AND amount > 0) OR
    (type IN ('use', 'expire') AND amount < 0)
  ),

  -- 제약조건: 적립/보너스 포인트는 만료일 필수
  CONSTRAINT check_expired_at CHECK (
    (type IN ('earn', 'bonus') AND expired_at IS NOT NULL) OR
    (type IN ('use', 'expire') AND expired_at IS NULL)
  )
);

-- 테이블 코멘트
COMMENT ON TABLE point_history IS '포인트 적립/사용/만료 내역';
COMMENT ON COLUMN point_history.amount IS '포인트 금액 (양수: 적립, 음수: 사용/만료)';
COMMENT ON COLUMN point_history.expired_at IS '포인트 만료일 (적립 시점 + 12개월)';

-- =========================
-- 3. INDEXES
-- =========================

-- 사용자별 포인트 조회 (가장 빈번한 쿼리)
CREATE INDEX idx_point_history_user_id ON point_history(user_id);

-- 사용자별 최근 내역 조회 (내림차순)
CREATE INDEX idx_point_history_user_created ON point_history(user_id, created_at DESC);

-- 포인트 유형별 조회
CREATE INDEX idx_point_history_type ON point_history(type);

-- 만료 대상 포인트 조회 (배치 처리용)
CREATE INDEX idx_point_history_expired_at ON point_history(expired_at)
  WHERE type IN ('earn', 'bonus') AND expired_at IS NOT NULL;

-- 예약 연관 포인트 조회
CREATE INDEX idx_point_history_reservation_id ON point_history(reservation_id)
  WHERE reservation_id IS NOT NULL;

-- =========================
-- 4. ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 포인트 내역만 조회 가능
CREATE POLICY "point_history_select_own" ON point_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 인증된 사용자만 삽입 가능 (서버사이드 로직용)
-- 주의: 실제 운영에서는 service_role만 삽입 가능하도록 제한 권장
CREATE POLICY "point_history_insert_authenticated" ON point_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: 포인트 내역은 수정 불가 (감사 추적 목적)
-- 정책 없음 = UPDATE 불가

-- DELETE: 포인트 내역은 삭제 불가 (감사 추적 목적)
-- 정책 없음 = DELETE 불가

-- 관리자용 전체 조회 정책 (role = 'admin')
CREATE POLICY "point_history_select_admin" ON point_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 관리자용 삽입 정책
CREATE POLICY "point_history_insert_admin" ON point_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =========================
-- 5. FUNCTIONS
-- =========================

-- 5.1 사용자별 포인트 잔액 조회 함수
CREATE OR REPLACE FUNCTION get_point_balance(p_user_id UUID)
RETURNS TABLE (
  total_earned BIGINT,
  total_used BIGINT,
  total_expired BIGINT,
  total_bonus BIGINT,
  available BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN ph.type = 'earn' THEN ph.amount ELSE 0 END), 0)::BIGINT AS total_earned,
    COALESCE(SUM(CASE WHEN ph.type = 'use' THEN ABS(ph.amount) ELSE 0 END), 0)::BIGINT AS total_used,
    COALESCE(SUM(CASE WHEN ph.type = 'expire' THEN ABS(ph.amount) ELSE 0 END), 0)::BIGINT AS total_expired,
    COALESCE(SUM(CASE WHEN ph.type = 'bonus' THEN ph.amount ELSE 0 END), 0)::BIGINT AS total_bonus,
    COALESCE(SUM(ph.amount), 0)::BIGINT AS available
  FROM point_history ph
  WHERE ph.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.2 사용 가능한 포인트만 조회 (만료되지 않은 적립 포인트)
CREATE OR REPLACE FUNCTION get_available_points(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_available BIGINT;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_available
  FROM point_history
  WHERE user_id = p_user_id;

  RETURN v_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.3 포인트 적립 함수 (12개월 유효기간 자동 설정)
CREATE OR REPLACE FUNCTION earn_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reservation_id UUID DEFAULT NULL,
  p_type point_type DEFAULT 'earn'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_expired_at TIMESTAMPTZ;
BEGIN
  -- 유효성 검사
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive for earning points';
  END IF;

  IF p_type NOT IN ('earn', 'bonus') THEN
    RAISE EXCEPTION 'Type must be earn or bonus for earning points';
  END IF;

  -- 만료일 계산 (12개월 후)
  v_expired_at := now() + INTERVAL '12 months';

  INSERT INTO point_history (user_id, amount, type, description, reservation_id, expired_at)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reservation_id, v_expired_at)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 포인트 사용 함수
CREATE OR REPLACE FUNCTION use_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reservation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_available BIGINT;
BEGIN
  -- 유효성 검사
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive for using points';
  END IF;

  -- 잔액 확인
  SELECT get_available_points(p_user_id) INTO v_available;

  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient points. Available: %, Requested: %', v_available, p_amount;
  END IF;

  -- 포인트 사용 (음수로 저장)
  INSERT INTO point_history (user_id, amount, type, description, reservation_id, expired_at)
  VALUES (p_user_id, -p_amount, 'use', p_description, p_reservation_id, NULL)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 만료 포인트 처리 함수 (배치 작업용)
CREATE OR REPLACE FUNCTION process_expired_points()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
  v_expired_amount BIGINT;
BEGIN
  -- 만료일이 지난 적립 포인트가 있는 사용자별로 처리
  FOR v_user IN
    SELECT DISTINCT user_id
    FROM point_history
    WHERE type IN ('earn', 'bonus')
    AND expired_at < now()
    AND expired_at > now() - INTERVAL '1 day' -- 오늘 만료된 것만
  LOOP
    -- 해당 사용자의 만료 포인트 합계 계산
    SELECT COALESCE(SUM(amount), 0)
    INTO v_expired_amount
    FROM point_history
    WHERE user_id = v_user.user_id
    AND type IN ('earn', 'bonus')
    AND expired_at < now()
    AND expired_at > now() - INTERVAL '1 day';

    -- 만료 기록 생성
    IF v_expired_amount > 0 THEN
      INSERT INTO point_history (user_id, amount, type, description, expired_at)
      VALUES (
        v_user.user_id,
        -v_expired_amount,
        'expire',
        '포인트 유효기간 만료',
        NULL
      );

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- 6. GRANT PERMISSIONS
-- =========================

-- RPC 함수 권한 설정
GRANT EXECUTE ON FUNCTION get_point_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION earn_points(UUID, INTEGER, TEXT, UUID, point_type) TO authenticated;
GRANT EXECUTE ON FUNCTION use_points(UUID, INTEGER, TEXT, UUID) TO authenticated;
-- process_expired_points는 service_role만 실행 가능 (기본값)
```

**실행 방법:**
1. 위 SQL을 모두 복사
2. SQL Editor의 빈 쿼리 창에 붙여넣기
3. 우측 상단 "Run" 또는 "Execute" 버튼 클릭 (Ctrl+Enter)
4. 실행 결과 확인 (하단에 상태 표시)

---

### 두 번째: Attendance 테이블 생성

**파일:** `20260125200000_create_attendance_table.sql`

아래 SQL을 복사하여 SQL Editor에 붙여넣기:

```sql
-- ============================================================
-- Attendance Check Migration
-- 출석체크 테이블 및 연속 출석 보너스 시스템
-- Includes: Table, Indexes, RLS policies, Functions
-- ============================================================

-- =========================
-- 1. TABLE
-- =========================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 참조 (profiles 테이블 외래키)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 출석 날짜 (DATE 타입으로 1일 1회 제한 용이)
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 기본 적립 포인트
  base_points INTEGER NOT NULL DEFAULT 10,

  -- 연속 출석일 (1일차부터 시작)
  streak_days INTEGER NOT NULL DEFAULT 1,

  -- 연속 출석 보너스 포인트
  bonus_points INTEGER NOT NULL DEFAULT 0,

  -- 총 적립 포인트 (base + bonus)
  total_points INTEGER NOT NULL GENERATED ALWAYS AS (base_points + bonus_points) STORED,

  -- 생성일시
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 제약조건: 사용자별 날짜 고유 (1일 1회 제한)
  CONSTRAINT unique_user_date UNIQUE (user_id, check_date),

  -- 제약조건: 포인트는 양수
  CONSTRAINT check_positive_points CHECK (base_points > 0 AND bonus_points >= 0),

  -- 제약조건: 연속일은 1 이상
  CONSTRAINT check_positive_streak CHECK (streak_days >= 1)
);

-- 테이블 코멘트
COMMENT ON TABLE attendance IS '사용자 출석체크 내역';
COMMENT ON COLUMN attendance.check_date IS '출석 날짜 (1일 1회)';
COMMENT ON COLUMN attendance.streak_days IS '연속 출석일 (1~)';
COMMENT ON COLUMN attendance.bonus_points IS '연속 출석 보너스 (7일, 14일, 30일 등)';

-- =========================
-- 2. INDEXES
-- =========================

-- 사용자별 출석 조회 (가장 빈번한 쿼리)
CREATE INDEX idx_attendance_user_id ON attendance(user_id);

-- 사용자별 최근 출석 조회 (내림차순)
CREATE INDEX idx_attendance_user_date ON attendance(user_id, check_date DESC);

-- 특정 날짜 출석 조회 (통계용)
CREATE INDEX idx_attendance_date ON attendance(check_date);

-- 연속 출석일 통계 (리더보드용)
CREATE INDEX idx_attendance_streak ON attendance(streak_days DESC);

-- =========================
-- 3. ROW LEVEL SECURITY (RLS)
-- =========================

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 출석 내역만 조회 가능
CREATE POLICY "attendance_select_own" ON attendance
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 본인 출석만 등록 가능 (오늘 날짜만)
CREATE POLICY "attendance_insert_own" ON attendance
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND check_date = CURRENT_DATE
  );

-- UPDATE/DELETE: 출석 기록은 수정/삭제 불가 (감사 추적)
-- 정책 없음 = 불가

-- 관리자용 전체 조회 정책
CREATE POLICY "attendance_select_admin" ON attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =========================
-- 4. FUNCTIONS
-- =========================

-- 4.1 연속 출석 보너스 계산 함수
CREATE OR REPLACE FUNCTION calculate_streak_bonus(p_streak_days INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- 연속 출석 보너스 규칙
  -- 7일 연속: 50P
  -- 14일 연속: 100P
  -- 21일 연속: 150P
  -- 30일 연속: 300P
  -- 그 외: 0P
  RETURN CASE
    WHEN p_streak_days = 30 THEN 300
    WHEN p_streak_days = 21 THEN 150
    WHEN p_streak_days = 14 THEN 100
    WHEN p_streak_days = 7 THEN 50
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4.2 출석체크 함수 (트랜잭션 보장)
CREATE OR REPLACE FUNCTION check_attendance(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  attendance_id UUID,
  streak_days INTEGER,
  base_points INTEGER,
  bonus_points INTEGER,
  total_points INTEGER,
  is_already_checked BOOLEAN
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_existing_id UUID;
  v_last_streak INTEGER := 0;
  v_new_streak INTEGER;
  v_base INTEGER := 10;
  v_bonus INTEGER;
  v_new_id UUID;
BEGIN
  -- 오늘 이미 출석했는지 확인
  SELECT a.id INTO v_existing_id
  FROM attendance a
  WHERE a.user_id = p_user_id AND a.check_date = v_today;

  IF v_existing_id IS NOT NULL THEN
    -- 이미 출석한 경우, 기존 정보 반환
    RETURN QUERY
    SELECT
      TRUE,
      '이미 오늘 출석체크를 완료했습니다.'::TEXT,
      a.id,
      a.streak_days,
      a.base_points,
      a.bonus_points,
      a.base_points + a.bonus_points,
      TRUE
    FROM attendance a
    WHERE a.id = v_existing_id;
    RETURN;
  END IF;

  -- 어제 출석 기록 확인 (연속 출석 계산)
  SELECT a.streak_days INTO v_last_streak
  FROM attendance a
  WHERE a.user_id = p_user_id AND a.check_date = v_yesterday;

  -- 연속 출석일 계산
  IF v_last_streak IS NOT NULL THEN
    v_new_streak := v_last_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- 연속 출석 보너스 계산
  v_bonus := calculate_streak_bonus(v_new_streak);

  -- 출석 기록 생성
  INSERT INTO attendance (user_id, check_date, base_points, streak_days, bonus_points)
  VALUES (p_user_id, v_today, v_base, v_new_streak, v_bonus)
  RETURNING id INTO v_new_id;

  -- 포인트 적립 (point_history에 기록)
  PERFORM earn_points(
    p_user_id,
    v_base + v_bonus,
    CASE
      WHEN v_bonus > 0 THEN
        format('출석체크 %s일차 (+%sP 연속 출석 보너스)', v_new_streak, v_bonus)
      ELSE
        format('출석체크 %s일차', v_new_streak)
    END,
    NULL,
    'bonus'
  );

  RETURN QUERY
  SELECT
    TRUE,
    CASE
      WHEN v_bonus > 0 THEN
        format('출석체크 완료! %s일 연속 출석 보너스 %sP 추가 적립!', v_new_streak, v_bonus)::TEXT
      ELSE
        format('출석체크 완료! %s일차 출석입니다.', v_new_streak)::TEXT
    END,
    v_new_id,
    v_new_streak,
    v_base,
    v_bonus,
    v_base + v_bonus,
    FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 사용자의 월별 출석 현황 조회 함수
CREATE OR REPLACE FUNCTION get_monthly_attendance(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  check_date DATE,
  streak_days INTEGER,
  total_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.check_date,
    a.streak_days,
    a.base_points + a.bonus_points AS total_points
  FROM attendance a
  WHERE a.user_id = p_user_id
    AND EXTRACT(YEAR FROM a.check_date) = p_year
    AND EXTRACT(MONTH FROM a.check_date) = p_month
  ORDER BY a.check_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.4 사용자의 출석 통계 조회 함수
CREATE OR REPLACE FUNCTION get_attendance_stats(p_user_id UUID)
RETURNS TABLE (
  total_days INTEGER,
  current_streak INTEGER,
  max_streak INTEGER,
  total_points_earned BIGINT,
  this_month_days INTEGER
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_first_of_month DATE := date_trunc('month', v_today)::DATE;
BEGIN
  RETURN QUERY
  WITH streak_calc AS (
    SELECT
      a.check_date,
      a.streak_days,
      a.base_points + a.bonus_points AS pts
    FROM attendance a
    WHERE a.user_id = p_user_id
    ORDER BY a.check_date DESC
  ),
  current AS (
    SELECT
      CASE
        WHEN EXISTS (SELECT 1 FROM streak_calc WHERE check_date = v_today)
          THEN (SELECT streak_days FROM streak_calc WHERE check_date = v_today)
        WHEN EXISTS (SELECT 1 FROM streak_calc WHERE check_date = v_today - INTERVAL '1 day')
          THEN (SELECT streak_days FROM streak_calc WHERE check_date = v_today - INTERVAL '1 day')
        ELSE 0
      END AS curr_streak
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM streak_calc),
    (SELECT curr_streak::INTEGER FROM current),
    (SELECT COALESCE(MAX(streak_days), 0)::INTEGER FROM streak_calc),
    (SELECT COALESCE(SUM(pts), 0)::BIGINT FROM streak_calc),
    (SELECT COUNT(*)::INTEGER FROM streak_calc WHERE check_date >= v_first_of_month);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.5 오늘 출석 여부 확인 함수
CREATE OR REPLACE FUNCTION has_checked_today(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM attendance
    WHERE user_id = p_user_id AND check_date = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =========================
-- 5. GRANT PERMISSIONS
-- =========================

-- RPC 함수 권한 설정
GRANT EXECUTE ON FUNCTION calculate_streak_bonus(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_attendance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_attendance(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_attendance_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_checked_today(UUID) TO authenticated;
```

**실행 방법:**
1. 새로운 쿼리 탭 열기 ("+" 버튼)
2. 위 SQL을 모두 복사하여 붙여넣기
3. "Run" 버튼 클릭
4. 완료 확인

---

## 실행 확인 방법

### 첫 번째 마이그레이션 확인

**Point History 테이블:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name = 'point_history';
```

**생성된 함수 확인:**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'get_%';
```

### 두 번째 마이그레이션 확인

**Attendance 테이블:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name = 'attendance';
```

**생성된 함수 확인:**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'check_%'
OR routine_name LIKE 'get_attendance%';
```

---

## 주의 사항

- **순서 준수**: Point History(첫 번째) 반드시 Attendance(두 번째) 전에 실행
- **Dependencies**: Attendance의 `check_attendance` 함수에서 Point History의 `earn_points` 함수 호출
- **Profiles 테이블**: 두 마이그레이션 모두 `profiles` 테이블 존재 필수
- **Reservations 테이블**: Point History에서 선택적 외래키 참조

---

## 문제 해결

**오류: "REFERENCES profiles(id)"**
- Supabase에 기본 `profiles` 테이블이 없는 경우
- 먼저 프로필 테이블 생성 필요

**오류: "function earn_points does not exist"**
- Attendance 마이그레이션 실행 전에 Point History 마이그레이션 완료 필수

**Syntax 오류**
- 코피/붙여넣기 시 특수문자 손상 확인
- SQL 주석 줄은 제거해도 무관

