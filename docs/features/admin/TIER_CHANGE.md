# 매장 등급(Tier) 변경 기능 DB 연결 구현 완료

## 📋 구현 내용

### 1. 데이터베이스 마이그레이션
**파일**: `C:/a/supabase/migrations/20260127000003_add_tier_columns.sql`

```sql
-- 매장 테이블에 등급 관련 컬럼 추가
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'vip')),
ADD COLUMN IF NOT EXISTS tier_changed_at TIMESTAMPTZ;

-- 인덱스 추가 (등급별 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_shops_tier ON shops(tier);

-- 기존 데이터에 기본값 설정
UPDATE shops SET tier = 'basic' WHERE tier IS NULL;
```

**추가된 컬럼**:
- `tier`: TEXT (기본값: 'basic', 체크 제약: 'basic' | 'premium' | 'vip')
- `tier_changed_at`: TIMESTAMPTZ (등급 변경 시각 기록)

---

### 2. API 함수 추가
**파일**: `C:/a/src/lib/api/shops.ts`

```typescript
/**
 * Update shop tier (admin only)
 * - Updates tier and tier_changed_at timestamp
 * - Returns success status
 */
export async function updateShopTier(
  shopId: string,
  newTier: 'basic' | 'premium' | 'vip'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('shops')
    .update({
      tier: newTier,
      tier_changed_at: new Date().toISOString(),
    })
    .eq('id', shopId);

  if (error) {
    console.error('Failed to update shop tier:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
```

---

### 3. 타입 정의 업데이트
**파일**: `C:/a/src/types/supabase.ts`

```typescript
export interface Shop {
  // ... 기존 필드
  tier: 'basic' | 'premium' | 'vip';
  tier_changed_at: string | null;
}

export interface ShopInsert {
  // ... 기존 필드
  tier?: 'basic' | 'premium' | 'vip';
  tier_changed_at?: string | null;
}

export interface ShopUpdate {
  // ... 기존 필드
  tier?: 'basic' | 'premium' | 'vip';
  tier_changed_at?: string | null;
}
```

---

### 4. Toast 알림 시스템 추가

#### 4-1. Toast Hook 생성
**파일**: `C:/a/src/hooks/use-toast.ts`
- Toast 상태 관리
- Toast 추가/제거/업데이트 기능

#### 4-2. Toast UI 컴포넌트
**파일**: `C:/a/src/components/ui/toast.tsx`
- Radix UI Toast 기반 컴포넌트
- 성공/에러 variant 지원

**파일**: `C:/a/src/components/ui/toaster.tsx`
- Toast Provider 및 Viewport

#### 4-3. Layout에 Toaster 추가
**파일**: `C:/a/src/app/(admin)/layout.tsx`
```tsx
import { Toaster } from '@/components/ui/toaster';

// ...
<Toaster />
```

---

### 5. 페이지 기능 업데이트
**파일**: `C:/a/src/app/(admin)/admin/shops/page.tsx`

**변경 사항**:

```typescript
// 1. Import 추가
import { useToast } from '@/hooks/use-toast';
import { updateShopTier } from '@/lib/api/shops';

// 2. Toast hook 사용
const { toast } = useToast();

// 3. handleTierChange 함수 구현
async function handleTierChange() {
  if (!selectedShop) return;

  try {
    const result = await updateShopTier(selectedShop.id, selectedTier);

    if (result.success) {
      // 성공 토스트 표시
      toast({
        title: '등급 변경 완료',
        description: `${selectedShop.name} 매장의 등급이 ${getTierLabel(selectedTier)}로 변경되었습니다.`,
      });

      // 목록 새로고침
      await fetchShops();

      // 다이얼로그 닫기
      setIsTierOpen(false);
      setSelectedShop(null);
    } else {
      throw new Error(result.error || '등급 변경에 실패했습니다.');
    }
  } catch (error) {
    console.error('Failed to change tier:', error);
    toast({
      title: '등급 변경 실패',
      description: error instanceof Error ? error.message : '등급 변경 중 오류가 발생했습니다.',
      variant: 'destructive',
    });
  }
}

// 4. 헬퍼 함수 추가
function getTierLabel(tier: ShopTier): string {
  const labels: Record<ShopTier, string> = {
    basic: '기본',
    premium: '프리미엄',
    vip: 'VIP',
  };
  return labels[tier];
}
```

---

## 🧪 테스트 방법

### 1. 개발 환경 시작
```bash
cd C:/a

# Supabase 로컬 서버 시작
npx supabase start

# Next.js 개발 서버 시작
npm run dev
```

### 2. 관리자 페이지 접속
```
http://localhost:3000/admin/shops
```

### 3. 등급 변경 테스트

#### 3-1. 매장 등급 변경
1. 매장 목록에서 왕관 아이콘(👑) 버튼 클릭
2. 등급 선택 다이얼로그에서 원하는 등급 선택:
   - **기본**: 일반 노출
   - **프리미엄**: 검색 상위 노출, 배지 표시
   - **VIP**: 최상위 노출, 특별 배지, 광고 지원
3. "변경" 버튼 클릭
4. 성공 시:
   - ✅ Toast 알림 표시 ("등급 변경 완료")
   - ✅ 목록 자동 새로고침
   - ✅ 다이얼로그 자동 닫힘
5. 실패 시:
   - ❌ 에러 Toast 표시 (빨간색 배경)

#### 3-2. DB 확인
```bash
# Supabase Studio에서 확인
npx supabase db studio

# 또는 SQL로 직접 확인
npx supabase db execute "SELECT id, name, tier, tier_changed_at FROM shops LIMIT 10;"
```

#### 3-3. 예상 결과
```
┌──────────────┬────────────┬─────────┬─────────────────────────┐
│ id           │ name       │ tier    │ tier_changed_at         │
├──────────────┼────────────┼─────────┼─────────────────────────┤
│ uuid-here    │ 테스트매장  │ premium │ 2026-01-27 12:34:56+00  │
└──────────────┴────────────┴─────────┴─────────────────────────┘
```

---

## 📦 설치된 패키지

```bash
npm install @radix-ui/react-toast class-variance-authority
```

---

## 🎯 구현된 기능

✅ **DB 마이그레이션**: shops 테이블에 tier, tier_changed_at 컬럼 추가
✅ **API 함수**: updateShopTier() 구현
✅ **타입 정의**: Shop, ShopInsert, ShopUpdate에 tier 필드 추가
✅ **Toast 알림**: 성공/실패 피드백 표시
✅ **UI 연동**: 기존 Select 컴포넌트 재사용
✅ **에러 처리**: try-catch로 에러 핸들링
✅ **목록 새로고침**: 변경 후 자동 목록 업데이트

---

## 🚀 다음 단계 (선택 사항)

### 1. 등급별 혜택 적용
- 검색 결과 정렬 시 tier 우선순위 반영
- Premium/VIP 배지 표시

### 2. 등급 변경 히스토리
- 변경 이력 테이블 생성
- 관리자 로그 연동

### 3. 등급별 요금제
- 결제 시스템 연동
- 자동 등급 갱신/만료

---

## 📝 참고 사항

- **기존 UI/UX**: 완전히 유지 (Select 컴포넌트 재사용)
- **알림 방식**: alert() → Toast로 변경 (더 현대적인 UX)
- **에러 처리**: 상세한 에러 메시지 표시
- **타입 안정성**: TypeScript로 tier 값 제약 ('basic' | 'premium' | 'vip')
- **DB 제약**: CHECK 제약조건으로 잘못된 값 방지
- **인덱스**: tier 컬럼 인덱스로 검색 성능 최적화

---

## 🐛 트러블슈팅

### Toast가 표시되지 않는 경우
1. Toaster 컴포넌트가 Layout에 추가되었는지 확인
2. npm 패키지가 설치되었는지 확인: `@radix-ui/react-toast`

### 마이그레이션 실패 시
```bash
# 마이그레이션 다시 실행
npx supabase db reset
```

### 타입 에러 발생 시
- TypeScript 서버 재시작: VSCode에서 `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

---

**구현 완료일**: 2026-01-27
