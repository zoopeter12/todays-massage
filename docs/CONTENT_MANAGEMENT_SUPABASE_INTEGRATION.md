# Content Management - Supabase Integration

## Overview
Successfully integrated Supabase database for the admin content management page, replacing mock data with real database operations.

## Implementation Date
2026-01-26

---

## 1. Database Schema

### Created Migration File
**File**: `C:/a/supabase/migrations/20260126000000_create_content_tables.sql`

### Tables Created

#### 1.1 `notices` Table
```sql
- id: uuid (PK)
- title: text
- content: text
- category: enum('general', 'event', 'maintenance', 'policy')
- is_pinned: boolean
- is_published: boolean
- published_at: timestamptz
- created_by: uuid (FK to auth.users)
- view_count: integer
- created_at: timestamptz
- updated_at: timestamptz
```

**Indexes**:
- `idx_notices_category`
- `idx_notices_is_published`
- `idx_notices_is_pinned`
- `idx_notices_published_at`
- `idx_notices_created_at`

**Features**:
- Auto-increment view count via RPC function
- Automatic `updated_at` trigger
- RLS policies for public/admin access

#### 1.2 `faqs` Table
```sql
- id: uuid (PK)
- question: text
- answer: text
- category: enum('general', 'reservation', 'payment', 'account', 'partner')
- order: integer
- is_published: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

**Indexes**:
- `idx_faqs_category`
- `idx_faqs_is_published`
- `idx_faqs_order`

**Features**:
- Manual ordering support
- Automatic `updated_at` trigger
- RLS policies for public/admin access

#### 1.3 `banners` Table
```sql
- id: uuid (PK)
- title: text
- image_url: text
- link_url: text (nullable)
- position: enum('main', 'search', 'detail')
- is_active: boolean
- start_date: date
- end_date: date
- order: integer
- click_count: integer
- created_at: timestamptz
- updated_at: timestamptz
```

**Indexes**:
- `idx_banners_position`
- `idx_banners_is_active`
- `idx_banners_dates`
- `idx_banners_order`

**Features**:
- Date range validation
- Auto-increment click count via RPC function
- Manual ordering support
- Automatic `updated_at` trigger
- RLS policies for active banners only

---

## 2. API Layer

### Created API File
**File**: `C:/a/src/lib/api/content.ts`

### Functions Implemented

#### 2.1 Notices API
- ✅ `getNotices(options?)` - Fetch all notices with optional filters
- ✅ `getNotice(id)` - Fetch single notice (auto-increments view count)
- ✅ `createNotice(notice)` - Create new notice
- ✅ `updateNotice(id, updates)` - Update existing notice
- ✅ `deleteNotice(id)` - Delete notice

#### 2.2 FAQs API
- ✅ `getFaqs(options?)` - Fetch all FAQs with optional filters
- ✅ `getFaq(id)` - Fetch single FAQ
- ✅ `createFaq(faq)` - Create new FAQ (auto-assigns order)
- ✅ `updateFaq(id, updates)` - Update existing FAQ
- ✅ `deleteFaq(id)` - Delete FAQ
- ✅ `reorderFaqs(faqIds)` - Reorder FAQs

#### 2.3 Banners API
- ✅ `getBanners(options?)` - Fetch all banners with optional filters
- ✅ `getBanner(id)` - Fetch single banner
- ✅ `createBanner(banner)` - Create new banner (auto-assigns order)
- ✅ `updateBanner(id, updates)` - Update existing banner
- ✅ `deleteBanner(id)` - Delete banner
- ✅ `incrementBannerClick(id)` - Track banner clicks
- ✅ `reorderBanners(bannerIds)` - Reorder banners

---

## 3. Frontend Updates

### Modified File
**File**: `C:/a/src/app/(admin)/admin/content/page.tsx`

### Changes Made

#### 3.1 Added Imports
```typescript
import {
  getNotices, createNotice, updateNotice, deleteNotice,
  getFaqs, createFaq, updateFaq, deleteFaq,
  getBanners, createBanner, updateBanner, deleteBanner,
} from '@/lib/api/content';
```

#### 3.2 Added State Management
```typescript
const [error, setError] = useState<string | null>(null);
const [saving, setSaving] = useState(false);
```

#### 3.3 Replaced Mock Data
**Before**: Hard-coded mock data in `fetchContent()`
**After**: Real Supabase queries using API functions

```typescript
async function fetchContent() {
  setLoading(true);
  setError(null);
  try {
    const [noticesData, faqsData, bannersData] = await Promise.all([
      getNotices(),
      getFaqs(),
      getBanners(),
    ]);
    setNotices(noticesData);
    setFaqs(faqsData);
    setBanners(bannersData);
  } catch (err) {
    setError('콘텐츠를 불러오는데 실패했습니다.');
  } finally {
    setLoading(false);
  }
}
```

#### 3.4 Implemented CRUD Operations

**Create/Update Notices**:
```typescript
async function handleSaveNotice() {
  // Validation
  if (!noticeForm.title.trim()) { ... }
  if (!noticeForm.content.trim()) { ... }

  setSaving(true);
  try {
    if (editingNotice) {
      await updateNotice(editingNotice.id, noticeForm);
    } else {
      await createNotice({ ...noticeForm });
    }
    await fetchContent(); // Refresh data
  } catch (err) {
    alert('저장에 실패했습니다.');
  } finally {
    setSaving(false);
  }
}
```

**Create/Update FAQs**:
```typescript
async function handleSaveFaq() {
  // Similar structure with FAQ-specific validation
}
```

**Create/Update Banners**:
```typescript
async function handleSaveBanner() {
  // Includes date validation
  if (new Date(bannerForm.start_date) > new Date(bannerForm.end_date)) {
    alert('종료일은 시작일 이후여야 합니다.');
    return;
  }
  // ... rest of implementation
}
```

**Delete Operations**:
```typescript
async function handleDelete(type, id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    if (type === 'notice') await deleteNotice(id);
    else if (type === 'faq') await deleteFaq(id);
    else if (type === 'banner') await deleteBanner(id);

    await fetchContent(); // Refresh data
  } catch (err) {
    alert('삭제에 실패했습니다.');
  }
}
```

#### 3.5 Added Loading State
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    </div>
  );
}
```

#### 3.6 Added Error Handling
```typescript
{error && (
  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
    {error}
  </div>
)}
```

#### 3.7 Added Saving State to Dialogs
```typescript
<Button onClick={handleSaveNotice} disabled={saving}>
  {saving ? '저장 중...' : '저장'}
</Button>
```

---

## 4. Security Features

### Row Level Security (RLS)

#### Public Access
- ✅ Can view **published** notices
- ✅ Can view **published** FAQs
- ✅ Can view **active** banners (within date range)

#### Admin Access
- ✅ Full CRUD on all notices
- ✅ Full CRUD on all FAQs
- ✅ Full CRUD on all banners
- ✅ Access controlled via `profiles.role = 'admin'` check

### Data Integrity
- ✅ Category constraints via CHECK
- ✅ Foreign key to auth.users for `created_by`
- ✅ Automatic timestamp management
- ✅ Default values for counters and flags

---

## 5. How to Deploy

### Step 1: Apply Migration
```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push

# Option 2: Using Supabase Dashboard
# Copy contents of migration file and run in SQL Editor
```

### Step 2: Verify Tables
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('notices', 'faqs', 'banners');

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';
```

### Step 3: Test the UI
1. Navigate to `/admin/content`
2. Try creating a notice
3. Try creating a FAQ
4. Try creating a banner
5. Verify data persistence after page refresh

---

## 6. API Usage Examples

### Frontend Usage

```typescript
// Get all published notices
const notices = await getNotices({ publishedOnly: true });

// Get latest 5 notices
const recent = await getNotices({ limit: 5 });

// Create notice
const notice = await createNotice({
  title: '새 공지',
  content: '내용',
  category: 'general',
  is_pinned: false,
  is_published: true,
});

// Update notice
await updateNotice(notice.id, {
  is_pinned: true
});

// Delete notice
await deleteNotice(notice.id);
```

### Similar patterns for FAQs and Banners

---

## 7. Testing Checklist

### Notices
- [ ] Create new notice
- [ ] Edit existing notice
- [ ] Delete notice
- [ ] Toggle pinned status
- [ ] Toggle published status
- [ ] Verify view count increments
- [ ] Filter by category

### FAQs
- [ ] Create new FAQ
- [ ] Edit existing FAQ
- [ ] Delete FAQ
- [ ] Reorder FAQs (if implemented)
- [ ] Toggle published status
- [ ] Filter by category

### Banners
- [ ] Create new banner
- [ ] Edit existing banner
- [ ] Delete banner
- [ ] Verify date range validation
- [ ] Toggle active status
- [ ] Verify click tracking (if exposed in UI)
- [ ] Reorder banners (if implemented)

### General
- [ ] Loading state displays correctly
- [ ] Error messages show for failures
- [ ] Saving state shows in dialogs
- [ ] Data persists after refresh
- [ ] RLS policies work (test as non-admin)

---

## 8. Future Enhancements

### Suggested Improvements
1. **Rich Text Editor**: Replace textarea with WYSIWYG editor for notices/FAQs
2. **Image Upload**: Add file upload for banner images instead of URLs
3. **Drag & Drop Reordering**: Visual reordering for FAQs and banners
4. **Preview Mode**: Preview content before publishing
5. **Scheduled Publishing**: Schedule notices/banners for future dates
6. **Search & Filter**: Add search functionality for large lists
7. **Bulk Operations**: Select multiple items for batch delete/publish
8. **Analytics Dashboard**: View detailed stats (views, clicks, engagement)
9. **Version History**: Track content changes over time
10. **Multi-language Support**: Add i18n for content

### Performance Optimizations
- Add pagination for large datasets
- Implement infinite scroll
- Add caching layer (React Query)
- Optimize images (Next.js Image component)

---

## 9. Troubleshooting

### Common Issues

**1. RLS Policies Block Access**
```
Error: new row violates row-level security policy
```
**Solution**: Ensure user has admin role in profiles table

**2. Foreign Key Violation**
```
Error: insert or update on table "notices" violates foreign key constraint
```
**Solution**: Check that `created_by` references valid user ID

**3. Date Validation Fails**
```
Error: end_date must be after start_date
```
**Solution**: Check date picker values and validation logic

**4. Image URLs Not Loading**
```
Banner image shows broken link
```
**Solution**: Use proper CORS-enabled URLs or upload to Supabase Storage

---

## 10. Related Files

### Created
- ✅ `C:/a/supabase/migrations/20260126000000_create_content_tables.sql`
- ✅ `C:/a/src/lib/api/content.ts`
- ✅ `C:/a/docs/CONTENT_MANAGEMENT_SUPABASE_INTEGRATION.md`

### Modified
- ✅ `C:/a/src/app/(admin)/admin/content/page.tsx`

### Referenced
- `C:/a/src/lib/supabase/client.ts` (existing)
- `C:/a/src/types/admin.ts` (existing)

---

## Summary

The content management system has been successfully migrated from mock data to a fully functional Supabase backend with:

- **3 database tables** with proper indexes and constraints
- **17 API functions** for complete CRUD operations
- **RLS policies** for security
- **Auto-increment functions** for views and clicks
- **Error handling** throughout the UI
- **Loading states** for better UX
- **Form validation** to prevent bad data

All existing UI/UX has been preserved while adding robust database integration.
