# Supabase 설정 완벽 가이드

Today's Massage 프로젝트의 Supabase 설정을 처음부터 끝까지 완벽하게 설정하는 가이드입니다.

## 목차

- [1. Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
- [2. 데이터베이스 마이그레이션](#2-데이터베이스-마이그레이션)
- [3. Row Level Security (RLS) 설정](#3-row-level-security-rls-설정)
- [4. Storage 버킷 설정](#4-storage-버킷-설정)
- [5. Realtime 설정](#5-realtime-설정)
- [6. OAuth 제공자 설정](#6-oauth-제공자-설정)
- [7. API 키 및 환경변수](#7-api-키-및-환경변수)
- [8. 테스트 및 검증](#8-테스트-및-검증)
- [9. 프로덕션 준비](#9-프로덕션-준비)

---

## 1. Supabase 프로젝트 생성

### 1.1 회원가입 및 프로젝트 생성

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. 프로젝트 정보 입력:
   - **Name**: `todays-massage-prod` (프로덕션) 또는 `todays-massage-dev` (개발)
   - **Database Password**: 강력한 비밀번호 생성 (안전한 곳에 저장)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자 대상)
   - **Pricing Plan**: Free 또는 Pro (프로덕션은 Pro 권장)

5. "Create new project" 클릭 (프로젝트 생성 완료까지 약 2분 소요)

### 1.2 체크리스트

- [ ] Supabase 계정 생성 완료
- [ ] 프로젝트 생성 완료 (서울 리전)
- [ ] 데이터베이스 비밀번호 안전하게 저장
- [ ] 프로젝트 URL 확인: `https://[PROJECT_ID].supabase.co`

---

## 2. 데이터베이스 마이그레이션

### 2.1 Supabase CLI 설치

```bash
# npm으로 전역 설치
npm install -g supabase

# 설치 확인
supabase --version
```

### 2.2 프로젝트 초기화 및 로그인

```bash
# 프로젝트 루트 디렉토리에서 실행
cd C:/a

# Supabase 로그인
supabase login

# 브라우저가 열리면 인증 승인
```

### 2.3 프로젝트 연결

```bash
# 프로젝트 연결
supabase link --project-ref [YOUR_PROJECT_ID]

# PROJECT_ID는 대시보드 URL에서 확인:
# https://supabase.com/dashboard/project/[PROJECT_ID]
```

### 2.4 마이그레이션 실행

프로젝트에는 22개의 마이그레이션 파일이 있습니다. **순서대로** 실행해야 합니다.

#### 자동 실행 (권장)

```bash
# 모든 마이그레이션을 자동으로 순서대로 실행
supabase db push

# 실행 확인
supabase db diff
```

#### 수동 실행 (문제 발생 시)

대시보드에서 SQL 편집기를 사용하여 수동 실행:

1. Supabase 대시보드 > SQL Editor
2. "New Query" 클릭
3. 마이그레이션 파일을 **다음 순서로** 복사하여 실행:

**실행 순서**:
```
1. 20260124000000_initial_schema.sql              (기본 스키마)
2. 20240124_add_shop_is_open.sql                  (매장 영업 상태)
3. 20260125000000_guest_reservation_nullable_user.sql (게스트 예약)
4. 20260125000001_add_shop_owner.sql              (매장 소유자)
5. 20260125000002_add_increment_rpc.sql           (증가 함수)
6. 20250125000000_create_reviews_table.sql        (리뷰 테이블)
7. 20240125_staff_and_operating_hours.sql         (직원 및 운영시간)
8. create_coupons_tables.sql                      (쿠폰 시스템)
9. 20260125000003_create_favorites_table.sql      (즐겨찾기)
10. 20260125100000_add_shop_operating_hours_amenities.sql (매장 상세)
11. 20260125100000_create_customer_notes.sql      (고객 메모)
12. 20260125100000_create_point_history_table.sql (포인트 내역)
13. 20260125100000_create_settlements_table.sql   (정산)
14. 20260125200000_create_referral_system.sql     (추천인)
15. 20260125200000_create_chat_tables.sql         (채팅)
16. 20250125_storage_buckets.sql                  (스토리지)
17. 20260125_roulette_tables.sql                  (룰렛 이벤트)
18. 20260125200000_create_attendance_table.sql    (출석체크)
19. 20250125_create_fcm_tables.sql                (FCM 토큰)
20. 20260125_add_oauth_fields.sql                 (OAuth 필드)
21. 20260125300000_create_reports_table.sql       (신고)
```

**주의**: `rollback` 파일은 실행하지 마세요.

### 2.5 마이그레이션 검증

```bash
# 테이블 목록 확인
supabase db remote ls

# 주요 테이블이 생성되었는지 확인:
# - profiles (사용자 프로필)
# - shops (매장)
# - reservations (예약)
# - reviews (리뷰)
# - coupons (쿠폰)
# - fcm_tokens (푸시 알림)
# - chat_rooms, chat_messages (채팅)
```

### 2.6 체크리스트

- [ ] Supabase CLI 설치 완료
- [ ] 프로젝트 연결 완료
- [ ] 모든 마이그레이션 실행 완료
- [ ] 주요 테이블 생성 확인
- [ ] 에러 없이 완료

---

## 3. Row Level Security (RLS) 설정

### 3.1 RLS란?

Row Level Security는 데이터베이스 행 단위로 접근을 제어하는 PostgreSQL 기능입니다. 사용자가 자신의 데이터만 볼 수 있도록 보장합니다.

### 3.2 RLS 활성화 확인

마이그레이션 파일에 RLS 정책이 포함되어 있지만, 수동으로 확인이 필요합니다.

1. Supabase 대시보드 > Authentication > Policies
2. 각 테이블별로 정책 확인

### 3.3 주요 테이블별 RLS 정책

#### profiles 테이블
```sql
-- 자신의 프로필은 누구나 읽을 수 있음
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

#### shops 테이블
```sql
-- 모든 매장은 누구나 볼 수 있음
CREATE POLICY "Shops are viewable by everyone"
ON shops FOR SELECT
USING (true);

-- 매장 소유자만 수정 가능
CREATE POLICY "Shop owners can update shops"
ON shops FOR UPDATE
USING (auth.uid() = owner_id);
```

#### reservations 테이블
```sql
-- 자신의 예약만 볼 수 있음
CREATE POLICY "Users can view own reservations"
ON reservations FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT owner_id FROM shops WHERE id = shop_id
));

-- 예약 생성은 인증된 사용자만
CREATE POLICY "Authenticated users can create reservations"
ON reservations FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 3.4 RLS 테스트

SQL Editor에서 테스트:

```sql
-- RLS가 활성화되어 있는지 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- rowsecurity = true 여야 함
```

### 3.5 체크리스트

- [ ] profiles 테이블 RLS 활성화 확인
- [ ] shops 테이블 RLS 활성화 확인
- [ ] reservations 테이블 RLS 활성화 확인
- [ ] reviews 테이블 RLS 활성화 확인
- [ ] 모든 테이블에 적절한 정책 적용

---

## 4. Storage 버킷 설정

### 4.1 Storage 버킷 개요

프로젝트에서 사용하는 스토리지:
- **avatars**: 사용자 프로필 사진
- **shop-images**: 매장 사진
- **review-images**: 리뷰 사진

### 4.2 마이그레이션으로 생성된 버킷 확인

1. Supabase 대시보드 > Storage
2. 다음 버킷이 자동 생성되어 있어야 함:
   - `avatars`
   - `shop-images`
   - `review-images`

### 4.3 버킷 정책 설정

각 버킷에 대한 접근 정책 확인:

#### avatars 버킷
```sql
-- 누구나 아바타 이미지를 볼 수 있음
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- 자신의 아바타만 삭제 가능
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### shop-images 버킷
```sql
-- 모든 매장 이미지는 공개
CREATE POLICY "Shop images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');

-- 매장 소유자만 업로드 가능 (서버에서 검증)
```

#### review-images 버킷
```sql
-- 리뷰 이미지는 공개
CREATE POLICY "Review images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

-- 리뷰 작성자만 업로드 가능
```

### 4.4 버킷 생성 (마이그레이션 실패 시)

대시보드에서 수동 생성:

1. Storage > "New bucket" 클릭
2. 버킷 정보 입력:
   - **Name**: `avatars`
   - **Public bucket**: 체크 (공개 접근 허용)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

3. 동일하게 `shop-images`, `review-images` 생성

### 4.5 체크리스트

- [ ] avatars 버킷 생성 확인
- [ ] shop-images 버킷 생성 확인
- [ ] review-images 버킷 생성 확인
- [ ] 각 버킷의 Public 설정 확인
- [ ] Storage 정책 활성화 확인

---

## 5. Realtime 설정

### 5.1 Realtime 개요

프로젝트에서 Realtime 사용처:
- **채팅 메시지**: 실시간 채팅
- **예약 상태**: 예약 상태 변경 알림
- **알림**: 실시간 알림 수신

### 5.2 Realtime 활성화

1. Supabase 대시보드 > Settings > API
2. "Realtime" 섹션에서 활성화 확인

### 5.3 테이블별 Realtime 설정

#### chat_messages 테이블
1. Database > Replication
2. `chat_messages` 테이블 찾기
3. "Enable Realtime" 토글 활성화
4. 변경 이벤트 선택:
   - [x] INSERT
   - [x] UPDATE
   - [ ] DELETE (필요시)

#### reservations 테이블
1. `reservations` 테이블 찾기
2. "Enable Realtime" 토글 활성화
3. 변경 이벤트 선택:
   - [x] INSERT
   - [x] UPDATE

### 5.4 Realtime 필터 설정 (선택)

특정 사용자에게만 메시지 전송:

```javascript
// 클라이언트 코드 예시
const subscription = supabase
  .channel('chat')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}` // 특정 채팅방만
    },
    (payload) => {
      console.log('New message:', payload.new)
    }
  )
  .subscribe()
```

### 5.5 체크리스트

- [ ] Realtime 기능 활성화 확인
- [ ] chat_messages 테이블 Realtime 활성화
- [ ] reservations 테이블 Realtime 활성화
- [ ] 클라이언트 구독 코드 확인

---

## 6. OAuth 제공자 설정

자세한 OAuth 설정은 [SUPABASE_OAUTH_SETUP.md](../SUPABASE_OAUTH_SETUP.md)를 참조하세요.

### 6.1 설정할 OAuth 제공자

- [x] 카카오 (Kakao)
- [x] 구글 (Google)
- [ ] 네이버 (Naver) - 커스텀 구현 필요

### 6.2 빠른 설정 체크리스트

#### 카카오
- [ ] Kakao Developers에서 앱 생성
- [ ] REST API 키 확인
- [ ] Redirect URI 추가: `https://[PROJECT_ID].supabase.co/auth/v1/callback`
- [ ] 동의항목 설정 (닉네임 필수, 이메일 선택)
- [ ] Supabase에 Client ID/Secret 입력

#### 구글
- [ ] Google Cloud Console에서 프로젝트 생성
- [ ] OAuth 동의 화면 구성
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] Authorized redirect URI 추가
- [ ] Supabase에 Client ID/Secret 입력

### 6.3 Redirect URLs 설정

Supabase 대시보드 > Authentication > URL Configuration:

- **Site URL**: `http://localhost:3000` (개발) / `https://todaysmassage.com` (프로덕션)
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `https://todaysmassage.com/auth/callback`
  - `https://staging.todaysmassage.com/auth/callback`

### 6.4 체크리스트

- [ ] 카카오 OAuth 설정 완료
- [ ] 구글 OAuth 설정 완료
- [ ] Redirect URLs 추가 완료
- [ ] OAuth 로그인 테스트 완료

---

## 7. API 키 및 환경변수

### 7.1 API 키 확인

Supabase 대시보드 > Settings > API:

1. **Project URL**:
   ```
   https://[PROJECT_ID].supabase.co
   ```
   → `NEXT_PUBLIC_SUPABASE_URL`

2. **anon public key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **service_role secret key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   → `SUPABASE_SERVICE_ROLE_KEY`

### 7.2 환경변수 설정

`.env.local` 파일에 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 7.3 Vercel 환경변수 설정

Vercel 대시보드 > Settings > Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (Sensitive 체크) | Production, Preview |

### 7.4 체크리스트

- [ ] Supabase Project URL 복사
- [ ] Anon Key 복사
- [ ] Service Role Key 복사 (Sensitive!)
- [ ] .env.local에 추가
- [ ] Vercel 환경변수 설정 완료

---

## 8. 테스트 및 검증

### 8.1 데이터베이스 연결 테스트

```bash
# 프로젝트 루트에서 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
# 개발자 도구 콘솔에서 에러 확인
```

### 8.2 인증 테스트

1. **OTP 로그인**
   - [ ] 전화번호 입력
   - [ ] OTP 발송 및 수신
   - [ ] OTP 인증 성공
   - [ ] 프로필 자동 생성 확인

2. **OAuth 로그인**
   - [ ] 카카오 로그인 성공
   - [ ] 구글 로그인 성공
   - [ ] 프로필 정보 동기화 확인

### 8.3 데이터 CRUD 테스트

```javascript
// 개발자 도구 콘솔에서 실행
const { data, error } = await supabase
  .from('shops')
  .select('*')
  .limit(5)

console.log('Shops:', data, error)
```

예상 결과:
- 에러 없이 데이터 조회 성공
- RLS 정책에 따라 접근 제어됨

### 8.4 Storage 업로드 테스트

```javascript
// 파일 업로드 테스트
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`test/${Date.now()}.jpg`, file)

console.log('Upload:', data, error)
```

### 8.5 Realtime 연결 테스트

```javascript
// Realtime 구독 테스트
const channel = supabase
  .channel('test')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'chat_messages' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe((status) => console.log('Status:', status))

// 예상 출력: Status: SUBSCRIBED
```

### 8.6 체크리스트

- [ ] 데이터베이스 연결 성공
- [ ] OTP 로그인 작동
- [ ] OAuth 로그인 작동
- [ ] 데이터 조회 성공
- [ ] Storage 업로드 성공
- [ ] Realtime 구독 성공

---

## 9. 프로덕션 준비

### 9.1 보안 설정 확인

- [ ] RLS가 모든 테이블에 활성화되어 있는지 확인
- [ ] Service Role Key는 서버에서만 사용
- [ ] API Rate Limiting 확인 (Settings > API)
- [ ] Database Password 안전하게 저장

### 9.2 백업 설정

1. Supabase 대시보드 > Database > Backups
2. 자동 백업 설정 확인:
   - Free Plan: 일일 백업 (7일 보관)
   - Pro Plan: 일일 백업 (30일 보관) + PITR

### 9.3 모니터링 설정

1. Settings > Monitoring
2. 알림 설정:
   - [ ] Database 사용량 80% 도달 시
   - [ ] Storage 사용량 80% 도달 시
   - [ ] API 에러율 상승 시

### 9.4 프로덕션 배포 전 최종 체크

- [ ] 개발 환경에서 모든 기능 테스트 완료
- [ ] Supabase Pro Plan으로 업그레이드 (프로덕션)
- [ ] 프로덕션 환경변수 설정 완료
- [ ] OAuth Redirect URL을 프로덕션 도메인으로 변경
- [ ] 백업 설정 확인
- [ ] 모니터링 알림 설정 완료

### 9.5 체크리스트

- [ ] 보안 설정 완료
- [ ] 백업 설정 완료
- [ ] 모니터링 설정 완료
- [ ] 프로덕션 준비 완료

---

## 10. 트러블슈팅

### 10.1 마이그레이션 실패

**증상**: `supabase db push` 실패

**해결 방법**:
```bash
# 1. 현재 상태 확인
supabase db remote ls

# 2. 특정 마이그레이션만 실행
supabase db execute < supabase/migrations/파일명.sql

# 3. 에러 확인
supabase db lint
```

### 10.2 RLS 정책으로 인한 접근 거부

**증상**: `new row violates row-level security policy`

**해결 방법**:
1. SQL Editor에서 정책 확인:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = '테이블명';
   ```
2. 필요시 정책 수정 또는 Service Role Key 사용

### 10.3 Realtime 연결 안 됨

**증상**: Realtime 구독 실패

**해결 방법**:
1. Database > Replication에서 테이블 활성화 확인
2. 클라이언트 코드에서 올바른 채널명 사용 확인
3. 네트워크 방화벽 확인 (WebSocket 연결 필요)

### 10.4 Storage 업로드 실패

**증상**: `new row violates row-level security policy for table "objects"`

**해결 방법**:
1. Storage > Policies에서 버킷 정책 확인
2. 버킷이 Public인지 확인
3. 파일 크기 제한 확인 (기본 5MB)

---

## 관련 문서

- [환경변수 가이드](../ENV_VARIABLES.md)
- [OAuth 설정 가이드](../SUPABASE_OAUTH_SETUP.md)
- [배포 가이드](../DEPLOYMENT.md)
- [Supabase 공식 문서](https://supabase.com/docs)
