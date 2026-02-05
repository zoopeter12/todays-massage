# 관리자 활동 로그 사용 가이드

## 📚 목차
1. [기본 사용법](#기본-사용법)
2. [헬퍼 함수 사용](#헬퍼-함수-사용)
3. [실전 예제](#실전-예제)
4. [API 레퍼런스](#api-레퍼런스)

## 기본 사용법

### 직접 로그 생성

```typescript
import { createAdminLog } from '@/lib/api/admin-logs';

// 관리자 작업 시 로그 기록
await createAdminLog({
  adminId: currentUser.id,
  adminName: currentUser.name,
  action: 'user.suspend',
  targetType: 'user',
  targetId: 'user-123',
  details: {
    reason: '스팸 행위',
    duration: '7days'
  }
});
```

### 로그 조회

```typescript
import { getAdminLogs } from '@/lib/api/admin-logs';

// 최근 50개 로그 조회
const { logs, total } = await getAdminLogs({ limit: 50 });

// 특정 관리자의 로그만 조회
const { logs } = await getAdminLogs({
  adminId: 'admin-uuid',
  limit: 20
});

// 날짜 범위로 조회
const { logs } = await getAdminLogs({
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});

// 특정 작업만 조회
const { logs } = await getAdminLogs({
  action: 'user.suspend'
});
```

## 헬퍼 함수 사용

더 편리한 로그 기록을 위해 헬퍼 함수를 제공합니다.

### 회원 관련 로그

```typescript
import { userLog } from '@/lib/utils/admin-log-helper';

// 회원 정지
await userLog.suspend(userId, '부적절한 리뷰 작성', adminId, adminName);

// 회원 삭제
await userLog.delete(userId, '본인 요청', adminId, adminName);

// 권한 변경
await userLog.roleChange(userId, 'customer', 'partner', adminId, adminName);
```

### 매장 관련 로그

```typescript
import { shopLog } from '@/lib/utils/admin-log-helper';

// 매장 승인
await shopLog.approve(shopId, '모든 서류 확인 완료', adminId, adminName);

// 매장 반려
await shopLog.reject(shopId, '사업자등록증 미제출', adminId, adminName);

// 매장 정지
await shopLog.suspend(shopId, '허위 정보 게재', adminId, adminName);
```

### 정산 관련 로그

```typescript
import { settlementLog } from '@/lib/utils/admin-log-helper';

// 정산 처리
await settlementLog.process(
  settlementId,
  500000,
  { bank: '국민은행', account: '123456789' },
  adminId,
  adminName
);

// 정산 승인
await settlementLog.approve(settlementId, 500000, adminId, adminName);

// 정산 반려
await settlementLog.reject(settlementId, '계좌 정보 불일치', adminId, adminName);
```

### 콘텐츠 관련 로그

```typescript
import { contentLog } from '@/lib/utils/admin-log-helper';

// 공지사항 생성
await contentLog.create('notice', noticeId, '시스템 점검 안내', adminId, adminName);

// 공지사항 수정
await contentLog.update(
  'notice',
  noticeId,
  { title: '변경된 제목', content: '변경된 내용' },
  adminId,
  adminName
);

// 공지사항 삭제
await contentLog.delete('notice', noticeId, '구시스템 점검 안내', adminId, adminName);

// 공지사항 게시
await contentLog.publish('notice', noticeId, '시스템 점검 안내', adminId, adminName);
```

### 신고 관련 로그

```typescript
import { reportLog } from '@/lib/utils/admin-log-helper';

// 신고 처리
await reportLog.resolve(
  reportId,
  'warning_issued',
  '해당 매장에 경고 조치',
  adminId,
  adminName
);

// 신고 기각
await reportLog.dismiss(reportId, '증거 불충분', adminId, adminName);
```

### 시스템 설정 로그

```typescript
import { configLog } from '@/lib/utils/admin-log-helper';

// 설정 변경
await configLog.update('commission_rate', 10, 12, adminId, adminName);

// 점검 모드 전환
await configLog.maintenanceMode(true, adminId, adminName);
```

## 실전 예제

### 예제 1: 회원 정지 처리

```typescript
// src/app/(admin)/admin/users/actions.ts
import { createClient } from '@/lib/supabase/client';
import { userLog } from '@/lib/utils/admin-log-helper';

export async function suspendUser(
  userId: string,
  reason: string,
  durationDays: number | null,
  adminId: string,
  adminName: string
) {
  const supabase = createClient();

  try {
    // 1. 회원 상태 변경
    const suspensionUntil = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspension_until: suspensionUntil
      })
      .eq('id', userId);

    if (error) throw error;

    // 2. 로그 기록
    await userLog.suspend(userId, reason, adminId, adminName);

    return { success: true };
  } catch (error) {
    console.error('Failed to suspend user:', error);
    return { success: false, error: String(error) };
  }
}
```

### 예제 2: 매장 승인 처리

```typescript
// src/app/(admin)/admin/shops/actions.ts
import { createClient } from '@/lib/supabase/client';
import { shopLog } from '@/lib/utils/admin-log-helper';

export async function approveShop(
  shopId: string,
  notes: string,
  adminId: string,
  adminName: string
) {
  const supabase = createClient();

  try {
    // 1. 매장 상태 변경
    const { error } = await supabase
      .from('shops')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', shopId);

    if (error) throw error;

    // 2. 로그 기록
    await shopLog.approve(shopId, notes, adminId, adminName);

    // 3. 파트너에게 알림 전송 (선택적)
    // await sendNotification(...)

    return { success: true };
  } catch (error) {
    console.error('Failed to approve shop:', error);
    return { success: false, error: String(error) };
  }
}
```

### 예제 3: 설정 변경 시 자동 로그

```typescript
// src/lib/api/settings.ts
import { createClient } from '@/lib/supabase/client';
import { configLog } from '@/lib/utils/admin-log-helper';

export async function updateGeneralSettings(
  settings: GeneralSettings,
  adminId?: string
) {
  const supabase = createClient();

  try {
    // 1. 기존 설정 조회
    const { data: oldSettings } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', 'general');

    // 2. 설정 업데이트
    const updates = [
      { key: 'general.siteName', value: settings.siteName },
      { key: 'general.siteDescription', value: settings.siteDescription },
      // ... 기타 설정
    ];

    for (const update of updates) {
      await supabase
        .from('system_settings')
        .upsert({
          ...update,
          category: 'general',
          updated_by: adminId,
          updated_at: new Date().toISOString()
        });
    }

    // 3. 변경사항 로그 기록
    if (adminId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', adminId)
        .single();

      for (const update of updates) {
        const oldValue = oldSettings?.find(s => s.key === update.key)?.value;
        if (oldValue !== update.value) {
          await configLog.update(
            update.key,
            oldValue,
            update.value,
            adminId,
            profile?.nickname || '관리자'
          );
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: String(error) };
  }
}
```

### 예제 4: 로그 조회 및 필터링 UI

```typescript
// src/app/(admin)/admin/settings/components/LogsFilter.tsx
'use client';

import { useState } from 'react';
import { getAdminLogs } from '@/lib/api/admin-logs';

export function LogsFilter() {
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: ''
  });

  async function handleFilter() {
    const { logs, total } = await getAdminLogs({
      action: filters.action || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      limit: 50
    });

    // UI 업데이트
    console.log(`Found ${total} logs`, logs);
  }

  return (
    <div className="flex gap-4">
      <select
        value={filters.action}
        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
      >
        <option value="">모든 작업</option>
        <option value="user.suspend">회원 정지</option>
        <option value="shop.approve">매장 승인</option>
        <option value="settlement.process">정산 처리</option>
      </select>

      <input
        type="date"
        value={filters.startDate}
        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
      />

      <input
        type="date"
        value={filters.endDate}
        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
      />

      <button onClick={handleFilter}>필터 적용</button>
    </div>
  );
}
```

## API 레퍼런스

### createAdminLog

관리자 작업 로그를 생성합니다.

```typescript
function createAdminLog(input: CreateLogInput): Promise<{
  success: boolean;
  error?: string;
}>

interface CreateLogInput {
  adminId: string;           // 관리자 ID
  adminName: string;         // 관리자 이름
  action: string;            // 작업 유형
  targetType?: string;       // 대상 타입 (선택)
  targetId?: string;         // 대상 ID (선택)
  details?: Record<string, unknown>;  // 상세 정보 (선택)
}
```

**작업 유형 (action)**
- `user.*`: 회원 관리 (suspend, delete, role_change)
- `shop.*`: 매장 관리 (approve, reject, suspend)
- `settlement.*`: 정산 관리 (process, approve, reject)
- `content.*`: 콘텐츠 관리 (create, update, delete, publish)
- `report.*`: 신고 관리 (resolve, dismiss)
- `config.*`: 설정 관리 (update)
- `system.*`: 시스템 관리 (maintenance)

### getAdminLogs

로그를 조회합니다.

```typescript
function getAdminLogs(options?: GetLogsOptions): Promise<GetLogsResponse>

interface GetLogsOptions {
  limit?: number;      // 조회 개수 (기본: 50)
  offset?: number;     // 시작 위치 (기본: 0)
  action?: string;     // 작업 유형 필터
  adminId?: string;    // 관리자 ID 필터
  startDate?: string;  // 시작 날짜 필터 (ISO 8601)
  endDate?: string;    // 종료 날짜 필터 (ISO 8601)
}

interface GetLogsResponse {
  logs: AdminLog[];    // 로그 목록
  total: number;       // 전체 개수
  error?: string;      // 에러 메시지
}
```

### getAdminLogStats

작업 유형별 통계를 조회합니다.

```typescript
function getAdminLogStats(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  stats: Record<string, number>;
  error?: string;
}>

// 예제 결과
{
  stats: {
    'user.suspend': 15,
    'shop.approve': 23,
    'settlement.process': 8,
    ...
  }
}
```

## 모범 사례

### 1. 항상 로그 기록하기
중요한 관리자 작업 후에는 반드시 로그를 기록하세요.

```typescript
// ❌ 나쁜 예
await updateUser(userId, data);
// 로그 없음

// ✅ 좋은 예
await updateUser(userId, data);
await userLog.roleChange(userId, oldRole, newRole, adminId, adminName);
```

### 2. 충분한 상세 정보 제공
나중에 감사(audit)할 때 필요한 정보를 details에 포함하세요.

```typescript
// ❌ 최소한의 정보
await userLog.suspend(userId, '정책 위반');

// ✅ 충분한 정보
await userLog.suspend(userId, '스팸 리뷰 5건 작성 - 정책 2.3 위반', adminId, adminName);
```

### 3. 에러 처리
로그 기록 실패가 주 작업을 방해하지 않도록 하세요.

```typescript
try {
  await updateShopStatus(shopId, 'approved');

  // 로그 기록은 실패해도 괜찮음
  await shopLog.approve(shopId, notes, adminId, adminName)
    .catch(err => console.error('Failed to log:', err));

  return { success: true };
} catch (error) {
  return { success: false, error };
}
```

### 4. 민감정보 마스킹
로그에 민감 정보를 저장할 때는 마스킹하세요.

```typescript
// 계좌번호 마스킹
const maskedAccount = account.slice(-4).padStart(account.length, '*');

await settlementLog.process(
  settlementId,
  amount,
  { bank: '국민은행', account: maskedAccount },
  adminId,
  adminName
);
```

## 문제 해결

### 로그가 생성되지 않음

1. RLS 정책 확인
2. 권한 확인
3. 콘솔 로그 확인

```typescript
const result = await createAdminLog({...});
console.log('Log creation result:', result);
```

### 로그 조회 시 빈 결과

1. 관리자 권한 확인
2. RLS 정책 확인
3. 데이터 존재 여부 확인

```sql
-- Supabase SQL Editor에서 직접 확인
SELECT COUNT(*) FROM admin_logs;
```

## 추가 리소스

- [README_ADMIN_LOGS.md](../README_ADMIN_LOGS.md) - 전체 시스템 개요
- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeScript 타입 정의](../src/types/admin.ts)
