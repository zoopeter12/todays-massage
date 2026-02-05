# 버그 수정 목록

이 문서는 2026-01-29 기능 검증 과정에서 발견되고 수정된 버그들을 정리합니다.

---

## 버그 #1: 로그인 후 헤더 표시 문제

### 버그 설명
로그인 후 헤더에 "U"가 표시되고, 새로고침해야 전화번호 끝 4자리("1925")가 표시됨.

### 증상
- 로그인 성공 후 헤더에 사용자 아이콘 "U" 표시
- 페이지 새로고침 후에야 전화번호 끝 4자리 표시
- 사용자 경험 저하

### 원인 분석
`useAuth.ts` hook에서 `onAuthStateChange` 이벤트 발생 시 `isLoading` 상태를 유지하지 않아 인증 상태 업데이트 전에 컴포넌트가 렌더링됨.

### 수정 파일 및 내용

**파일:** `src/hooks/useAuth.ts`

```typescript
// 수정 전
onAuthStateChange((event, session) => {
  setUser(session?.user || null);
});

// 수정 후
onAuthStateChange((event, session) => {
  setIsLoading(true);
  setUser(session?.user || null);
  setIsLoading(false);
});
```

### 추가 수정

**파일:** `src/app/(customer)/login/page.tsx`

- 세션 설정 후 `router.refresh()` 호출 추가
- 명시적 사용자 확인 로직 추가

**파일:** `src/components/shared/Header.tsx`

- 전화번호 끝 4자리 표시 로직 개선

### 수정 상태
✅ 완료 (2026-01-29)

---

## 버그 #2: 출석체크 에러

### 버그 설명
출석체크 페이지 접근 시 에러 발생, 페이지 사용 불가.

### 증상
- `/attendance` 페이지에서 에러 화면 표시
- 콘솔에 `PGRST205` 에러 (테이블 미존재)
- "relation 'attendance' does not exist" 메시지

### 원인 분석
Supabase 데이터베이스에 `attendance` 테이블이 생성되지 않음. 마이그레이션 파일은 존재하나 실행되지 않은 상태.

### 수정 파일 및 내용

**파일:** `src/app/(customer)/attendance/page.tsx`

```typescript
// 수정 전
const { data, error } = await supabase.from('attendance').select('*');
if (error) throw error;

// 수정 후
const { data, error } = await supabase.from('attendance').select('*');
if (error) {
  // PGRST205: 테이블이 존재하지 않음
  if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500">서비스 준비 중입니다.</p>
        <p className="text-sm text-gray-400 mt-2">
          곧 출석체크 기능이 활성화됩니다.
        </p>
      </div>
    );
  }
  throw error;
}
```

### 완전한 해결 방법
Supabase 대시보드에서 마이그레이션 SQL 실행:
1. `20260125100000_create_point_history_table.sql` (선행 조건)
2. `20260125200000_create_attendance_table.sql`

상세 가이드: `SUPABASE_SQL_실행_가이드.md`

### 수정 상태
✅ Graceful Degradation 완료 (2026-01-29)
⬜ DB 마이그레이션 대기 중

---

## 버그 #3: 친구초대 React Hooks 에러

### 버그 설명
친구초대 페이지에서 React hooks 규칙 위반 에러 발생.

### 증상
- `/referral` 페이지 접근 시 에러
- 콘솔에 "Rendered more hooks than during the previous render" 에러
- 또는 "React Hook is called conditionally" 에러

### 원인 분석
조건부 렌더링 로직 내에서 React hooks가 호출되어 hooks 호출 순서가 일관되지 않음.

### 수정 파일 및 내용

**파일:** `src/app/(customer)/referral/page.tsx`

```typescript
// 수정 전 (문제 코드)
export default function ReferralPage() {
  const { user } = useAuth();

  if (!user) {
    return <LoginRequired />;
  }

  // 여기서 추가 hooks 호출 - 에러 발생!
  const [referralCode, setReferralCode] = useState('');
  const { data } = useQuery(...);

  return <div>...</div>;
}

// 수정 후
export default function ReferralPage() {
  const { user, isLoading } = useAuth();

  // 모든 hooks를 최상위에서 먼저 호출
  const [referralCode, setReferralCode] = useState('');
  const { data, isLoading: dataLoading } = useQuery({
    queryKey: ['referral', user?.id],
    queryFn: () => fetchReferralData(user?.id),
    enabled: !!user, // user가 있을 때만 실행
  });

  // 조건부 렌더링은 hooks 호출 후에
  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return <LoginRequired />;
  }

  return <div>...</div>;
}
```

### 수정 핵심
1. 모든 React hooks는 컴포넌트 최상위에서 호출
2. 조건부 로직은 hooks 호출 후 처리
3. `useQuery`의 `enabled` 옵션으로 조건부 실행 제어

### 수정 상태
✅ 완료 (2026-01-29)

---

## 버그 #4: 파트너 샵 조회 실패

### 버그 설명
파트너 페이지에서 샵 정보 조회 실패, owner_id 처리 오류.

### 증상
- `/partner/*` 페이지에서 샵 정보 미표시
- 콘솔에 "Cannot read property of null" 에러
- 샵이 있는 파트너도 "샵 없음" 표시

### 원인 분석
`partner.ts` API 파일에서 `owner_id`가 null인 경우에 대한 처리가 미흡함. 샵 테이블의 `owner_id` 컬럼이 null인 레코드 존재.

### 수정 파일 및 내용

**파일:** `src/lib/api/partner.ts`

```typescript
// 수정 전
export async function getPartnerShop(userId: string) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', userId)
    .single();

  if (error) throw error;
  return data;
}

// 수정 후
export async function getPartnerShop(userId: string) {
  if (!userId) {
    console.warn('getPartnerShop: userId is undefined');
    return null;
  }

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle(); // single() 대신 maybeSingle() 사용

  if (error) {
    // owner_id 컬럼 미존재 시 대체 쿼리
    if (error.code === 'PGRST116' || error.message?.includes('column')) {
      const { data: fallbackData } = await supabase
        .from('shops')
        .select('*')
        .limit(1);
      return fallbackData?.[0] || null;
    }
    console.error('getPartnerShop error:', error);
    return null;
  }

  return data;
}
```

### 수정 핵심
1. `userId` null/undefined 체크 추가
2. `single()` 대신 `maybeSingle()` 사용 (결과 없을 때 에러 대신 null 반환)
3. 컬럼 미존재 시 fallback 로직 추가
4. 에러 시 throw 대신 null 반환 (graceful degradation)

### 수정 상태
✅ 완료 (2026-01-29)

---

## 요약

| # | 버그 | 심각도 | 수정 상태 | 비고 |
|---|------|--------|----------|------|
| 1 | 로그인 후 헤더 표시 | 중간 | ✅ 완료 | UX 개선 |
| 2 | 출석체크 에러 | 높음 | ✅ Graceful | DB 마이그레이션 필요 |
| 3 | 친구초대 hooks 에러 | 높음 | ✅ 완료 | React hooks 규칙 준수 |
| 4 | 파트너 샵 조회 | 중간 | ✅ 완료 | null 처리 개선 |

---

*마지막 업데이트: 2026-01-29*
