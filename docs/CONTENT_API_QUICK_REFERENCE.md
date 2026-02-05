# Content API - Quick Reference

Quick reference guide for using the content management API.

---

## Import

```typescript
import {
  // Notices
  getNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,

  // FAQs
  getFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,

  // Banners
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  incrementBannerClick,
  reorderBanners,
} from '@/lib/api/content';
```

---

## Notices

### Get All Notices
```typescript
// Get all notices
const notices = await getNotices();

// Get only published notices
const published = await getNotices({ publishedOnly: true });

// Get latest 10 notices
const latest = await getNotices({ limit: 10 });

// Combine options
const latestPublished = await getNotices({
  publishedOnly: true,
  limit: 5
});
```

### Get Single Notice
```typescript
const notice = await getNotice('notice-id');
// Note: Automatically increments view_count
```

### Create Notice
```typescript
const newNotice = await createNotice({
  title: '공지사항 제목',
  content: '공지사항 내용입니다.',
  category: 'general', // 'general' | 'event' | 'maintenance' | 'policy'
  is_pinned: false,
  is_published: true,
  published_at: new Date().toISOString(),
  created_by: '', // Auto-set by API
  view_count: 0,
});
```

### Update Notice
```typescript
await updateNotice('notice-id', {
  is_pinned: true,
  is_published: false,
});
```

### Delete Notice
```typescript
await deleteNotice('notice-id');
```

---

## FAQs

### Get All FAQs
```typescript
// Get all FAQs
const faqs = await getFaqs();

// Get only published FAQs
const published = await getFaqs({ publishedOnly: true });

// Get FAQs by category
const paymentFaqs = await getFaqs({
  category: 'payment'
});

// Combine options
const publishedReservation = await getFaqs({
  publishedOnly: true,
  category: 'reservation'
});
```

**Categories**: `'general'` | `'reservation'` | `'payment'` | `'account'` | `'partner'`

### Get Single FAQ
```typescript
const faq = await getFaq('faq-id');
```

### Create FAQ
```typescript
const newFaq = await createFaq({
  question: '질문 내용',
  answer: '답변 내용',
  category: 'general',
  order: 0, // Auto-assigned if not provided
  is_published: true,
});
```

### Update FAQ
```typescript
await updateFaq('faq-id', {
  answer: '수정된 답변',
  order: 5,
});
```

### Delete FAQ
```typescript
await deleteFaq('faq-id');
```

### Reorder FAQs
```typescript
// Pass array of FAQ IDs in desired order
await reorderFaqs([
  'faq-id-3',
  'faq-id-1',
  'faq-id-2',
]);
```

---

## Banners

### Get All Banners
```typescript
// Get all banners
const banners = await getBanners();

// Get only active banners (within date range)
const active = await getBanners({ activeOnly: true });

// Get banners by position
const mainBanners = await getBanners({
  position: 'main'
});

// Combine options
const activeMainBanners = await getBanners({
  activeOnly: true,
  position: 'main'
});
```

**Positions**: `'main'` | `'search'` | `'detail'`

### Get Single Banner
```typescript
const banner = await getBanner('banner-id');
```

### Create Banner
```typescript
const newBanner = await createBanner({
  title: '배너 제목',
  image_url: 'https://example.com/banner.jpg',
  link_url: 'https://example.com/event', // Optional
  position: 'main',
  is_active: true,
  start_date: '2026-01-26',
  end_date: '2026-02-26',
  order: 0, // Auto-assigned if not provided
  click_count: 0,
});
```

### Update Banner
```typescript
await updateBanner('banner-id', {
  is_active: false,
  end_date: '2026-03-01',
});
```

### Delete Banner
```typescript
await deleteBanner('banner-id');
```

### Track Banner Click
```typescript
// Call when user clicks banner
await incrementBannerClick('banner-id');
```

### Reorder Banners
```typescript
// Pass array of banner IDs in desired order
await reorderBanners([
  'banner-id-2',
  'banner-id-1',
  'banner-id-3',
]);
```

---

## Error Handling

All API functions throw errors on failure. Always use try-catch:

```typescript
try {
  const notices = await getNotices();
  // Success
} catch (error) {
  console.error('Failed to fetch notices:', error);
  // Handle error (show toast, alert, etc.)
}
```

---

## Common Patterns

### Fetch and Display
```typescript
useEffect(() => {
  async function loadContent() {
    try {
      const data = await getNotices();
      setNotices(data);
    } catch (error) {
      setError('Failed to load');
    }
  }
  loadContent();
}, []);
```

### Create with Validation
```typescript
async function handleCreate() {
  if (!form.title.trim()) {
    alert('Title required');
    return;
  }

  try {
    const created = await createNotice(form);
    alert('Created!');
    // Refresh list
    await loadContent();
  } catch (error) {
    alert('Failed to create');
  }
}
```

### Update with Optimistic UI
```typescript
async function handleToggle(id: string, currentValue: boolean) {
  // Optimistic update
  setNotices(prev =>
    prev.map(n => n.id === id ? { ...n, is_published: !currentValue } : n)
  );

  try {
    await updateNotice(id, { is_published: !currentValue });
  } catch (error) {
    // Rollback on error
    setNotices(prev =>
      prev.map(n => n.id === id ? { ...n, is_published: currentValue } : n)
    );
    alert('Update failed');
  }
}
```

### Delete with Confirmation
```typescript
async function handleDelete(id: string) {
  if (!confirm('Are you sure?')) return;

  try {
    await deleteNotice(id);
    // Remove from UI
    setNotices(prev => prev.filter(n => n.id !== id));
  } catch (error) {
    alert('Delete failed');
  }
}
```

---

## Response Types

### Notice
```typescript
interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'event' | 'maintenance' | 'policy';
  is_pinned: boolean;
  is_published: boolean;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  view_count: number;
}
```

### FAQ
```typescript
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'reservation' | 'payment' | 'account' | 'partner';
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
```

### Banner
```typescript
interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: 'main' | 'search' | 'detail';
  is_active: boolean;
  start_date: string; // YYYY-MM-DD format
  end_date: string;   // YYYY-MM-DD format
  order: number;
  click_count: number;
  created_at: string;
}
```

---

## Database Direct Access (Advanced)

If you need custom queries, use Supabase client directly:

```typescript
import { supabase } from '@/lib/supabase/client';

// Custom query
const { data, error } = await supabase
  .from('notices')
  .select('title, view_count')
  .eq('category', 'event')
  .gt('view_count', 100)
  .order('view_count', { ascending: false })
  .limit(10);
```

---

## Performance Tips

1. **Use options to filter**: Don't fetch all data if you only need published items
2. **Implement pagination**: For large datasets, use limit + offset
3. **Cache results**: Use React Query or SWR for automatic caching
4. **Debounce searches**: Wait for user to stop typing before searching
5. **Optimistic updates**: Update UI immediately, rollback on error

---

## Related Documentation

- Main Integration Guide: `CONTENT_MANAGEMENT_SUPABASE_INTEGRATION.md`
- Type Definitions: `src/types/admin.ts`
- Supabase Client: `src/lib/supabase/client.ts`
- Migration File: `supabase/migrations/20260126000000_create_content_tables.sql`
