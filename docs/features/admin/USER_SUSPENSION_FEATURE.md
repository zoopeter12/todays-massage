# 회원 정지 기능 구현

## 개요
관리자 페이지에서 회원을 정지/해제할 수 있는 기능을 구현했습니다.

## 구현된 파일

### 1. API 함수 (`C:/a/src/lib/api/users.ts`)
새로 생성된 파일로 사용자 정지/해제 관련 API 함수를 제공합니다.

**주요 함수:**
- `suspendUser(userId, reason, suspendedUntil?)` - 사용자 정지 처리
- `unsuspendUser(userId)` - 사용자 정지 해제
- `getUserStatus(userId)` - 사용자 상태 조회

### 2. 데이터베이스 마이그레이션 (`C:/a/supabase/migrations/20260127000002_add_suspension_columns.sql`)
profiles 테이블에 정지 관련 컬럼 추가:
- `status` - 사용자 상태 (active, suspended, deleted)
- `suspension_reason` - 정지 사유
- `suspended_until` - 정지 해제 예정 일시 (null이면 영구 정지)
- `suspended_at` - 정지 처리 일시

**추가 기능:**
- admin_logs 테이블 생성 (관리자 활동 로그 기록)
- 성능 향상을 위한 인덱스 추가

### 3. 타입 정의 업데이트 (`C:/a/src/types/supabase.ts`)
Profile 인터페이스에 정지 관련 필드 추가:
```typescript
export interface Profile {
  // ... 기존 필드
  status: 'active' | 'suspended' | 'deleted';
  suspension_reason: string | null;
  suspended_until: string | null;
  suspended_at: string | null;
}
```

### 4. 관리자 페이지 수정 (`C:/a/src/app/(admin)/admin/users/page.tsx`)
**추가된 기능:**
- 사용자 정지 처리 (handleSuspend)
- 사용자 정지 해제 (handleUnsuspend)
- 정지 상태 배지 표시 (getStatusBadge)
- 상세 정보 다이얼로그에 정지 정보 표시
- 정지 해제 버튼 추가
- 관리자 활동 로그 자동 기록

## 주요 기능

### 1. 사용자 정지
1. 관리자 페이지에서 사용자 목록 조회
2. 사용자 행의 "정지" 버튼(Ban 아이콘) 클릭
3. 정지 사유 입력
4. "정지 처리" 버튼 클릭
5. DB에 정지 정보 저장 및 관리자 로그 기록
6. 사용자 목록 자동 새로고침

### 2. 사용자 정지 해제
1. 정지된 사용자 클릭 → 상세 정보 다이얼로그 열기
2. "정지 해제" 버튼 클릭
3. 확인 다이얼로그에서 승인
4. DB에서 정지 정보 제거 및 관리자 로그 기록
5. 사용자 목록 자동 새로고침

### 3. 정지 상태 표시
- 사용자 목록에 "정지됨" 배지 표시 (빨간색)
- 상세 정보 다이얼로그에 정지 정보 자세히 표시:
  - 정지 사유
  - 정지 처리 일시
  - 정지 해제 예정 일시 (있는 경우)

### 4. 관리자 활동 로그
모든 정지/해제 작업은 자동으로 admin_logs 테이블에 기록됩니다:
- 관리자 ID 및 이름
- 작업 유형 (user_suspend / user_unsuspend)
- 대상 사용자 ID
- 추가 상세 정보 (닉네임, 전화번호, 정지 사유 등)

## 테스트 방법

### 1. 데이터베이스 마이그레이션 적용
```bash
cd C:/a
npx supabase db reset --local
# 또는 원격 DB에 적용
npx supabase db push
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 관리자 페이지 접속
```
http://localhost:3000/admin/users
```

### 4. 테스트 시나리오

#### 시나리오 1: 사용자 정지
1. 관리자로 로그인
2. 회원관리 페이지 접속
3. 일반 회원 선택 (admin 제외)
4. 빨간색 정지 버튼(Ban 아이콘) 클릭
5. 정지 사유 입력: "테스트 정지"
6. "정지 처리" 버튼 클릭
7. **확인사항:**
   - 성공 알림 메시지 표시
   - 사용자 목록에서 해당 회원 옆에 "정지됨" 배지 표시
   - DB profiles 테이블 확인:
     ```sql
     SELECT id, nickname, status, suspension_reason, suspended_at
     FROM profiles
     WHERE status = 'suspended';
     ```

#### 시나리오 2: 사용자 정지 해제
1. 정지된 사용자 클릭 → 상세 정보 열기
2. "정지 상태" 섹션 확인 (정지 사유, 정지일 표시)
3. "정지 해제" 버튼 클릭
4. 확인 다이얼로그에서 "확인" 클릭
5. **확인사항:**
   - 성공 알림 메시지 표시
   - 사용자 목록에서 "정지됨" 배지 사라짐
   - DB profiles 테이블 확인:
     ```sql
     SELECT id, nickname, status, suspension_reason
     FROM profiles
     WHERE id = 'USER_ID';
     ```
   - status가 'active', suspension_reason이 null

#### 시나리오 3: 관리자 로그 확인
1. DB admin_logs 테이블 조회:
   ```sql
   SELECT * FROM admin_logs
   ORDER BY created_at DESC
   LIMIT 10;
   ```
2. **확인사항:**
   - 정지/해제 작업이 모두 기록됨
   - admin_id, action, target_id 정확히 기록됨
   - details 컬럼에 추가 정보 (닉네임, 전화번호, 정지 사유) 저장됨

### 5. 데이터베이스 직접 확인
```sql
-- 정지된 사용자 목록
SELECT id, nickname, phone, status, suspension_reason, suspended_at
FROM profiles
WHERE status = 'suspended';

-- 관리자 로그 조회
SELECT
  al.created_at,
  al.admin_name,
  al.action,
  al.details
FROM admin_logs al
WHERE al.action IN ('user_suspend', 'user_unsuspend')
ORDER BY al.created_at DESC;
```

## 주의사항

1. **관리자 정지 불가**: admin 역할을 가진 사용자는 정지 버튼이 표시되지 않습니다.
2. **로그인 필수**: 정지/해제 작업 시 관리자 로그인 상태를 확인합니다.
3. **정지 사유 필수**: 정지 처리 시 사유를 반드시 입력해야 합니다.
4. **활동 로그**: 모든 정지/해제 작업은 admin_logs 테이블에 자동으로 기록됩니다.

## 향후 개선 사항

1. **기간 지정 정지**: 정지 해제 일시를 설정하여 자동 해제 기능 추가
2. **Toast 알림**: alert 대신 Toast UI 컴포넌트 사용
3. **정지 사유 템플릿**: 자주 사용하는 정지 사유를 선택할 수 있는 드롭다운 추가
4. **정지 이력 조회**: 사용자별 정지/해제 이력을 확인할 수 있는 UI 추가
5. **로그인 차단**: 정지된 사용자의 로그인을 자동으로 차단하는 미들웨어 추가

## 문제 해결

### 마이그레이션 실패 시
```bash
# 로컬 DB 초기화 후 재시도
npx supabase db reset --local
```

### 타입 오류 발생 시
```bash
# TypeScript 캐시 삭제 후 재시작
rm -rf .next
npm run dev
```

### DB 컬럼이 없다는 오류
- 마이그레이션이 제대로 적용되었는지 확인
- Supabase 대시보드에서 profiles 테이블 구조 확인
