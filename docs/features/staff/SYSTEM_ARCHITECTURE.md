# System Architecture - Staff & Operating Hours

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐         ┌──────────────────────┐        │
│  │   Partner Dashboard  │         │   Customer Booking   │        │
│  ├──────────────────────┤         ├──────────────────────┤        │
│  │ /partner/staff       │         │ TimeSlotSelector     │        │
│  │ /partner/            │         │ StaffSelector        │        │
│  │  operating-hours     │         │ BookingDrawer        │        │
│  └──────────────────────┘         └──────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API/LOGIC LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌────────────┐│
│  │  lib/api/staff.ts   │  │ lib/api/             │  │ lib/utils/ ││
│  ├─────────────────────┤  │  operating-hours.ts  │  │  time.ts   ││
│  │ • fetchStaff        │  ├──────────────────────┤  ├────────────┤│
│  │ • createStaff       │  │ • fetchOperating     │  │ • Time     ││
│  │ • updateStaff       │  │   Hours              │  │   parsing  ││
│  │ • deleteStaff       │  │ • updateOperating    │  │ • Duration ││
│  │ • toggleActive      │  │   Hours              │  │   calc     ││
│  │ • fetchActive       │  │ • isShopOpenNow      │  │ • Overlap  ││
│  │   Staff             │  │ • getAvailableSlots  │  │   detect   ││
│  └─────────────────────┘  └──────────────────────┘  └────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            TanStack React Query (Cache Layer)                │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Query Keys:                                                  │  │
│  │ • ['staff', shopId]                                          │  │
│  │ • ['active-staff', shopId]                                   │  │
│  │ • ['operating-hours', shopId]                                │  │
│  │ • ['available-slots', shopId, date, duration]                │  │
│  │                                                              │  │
│  │ Mutations:                                                   │  │
│  │ • createStaff, updateStaff, deleteStaff                      │  │
│  │ • toggleStaffActive                                          │  │
│  │ • updateOperatingHours                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Supabase Client (lib/supabase/client)           │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ • Real-time subscriptions                                    │  │
│  │ • Automatic retry logic                                      │  │
│  │ • Connection pooling                                         │  │
│  │ • Row Level Security enforcement                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  staff table     │  │  shops table     │  │ bookings table  │  │
│  ├──────────────────┤  ├──────────────────┤  ├─────────────────┤  │
│  │ • id (PK)        │  │ • id (PK)        │  │ • id (PK)       │  │
│  │ • shop_id (FK)   │  │ • owner_id       │  │ • shop_id (FK)  │  │
│  │ • name           │  │ • operating_     │  │ • course_id     │  │
│  │ • photo          │  │   hours (JSONB)  │  │ • staff_id (FK) │  │
│  │ • specialties[]  │  │ • ...            │  │ • start_time    │  │
│  │ • is_active      │  └──────────────────┘  │ • duration      │  │
│  │ • created_at     │                        │ • status        │  │
│  │ • updated_at     │                        └─────────────────┘  │
│  └──────────────────┘                                              │
│                                                                     │
│  Indexes:                                                           │
│  • idx_staff_shop_id          • idx_bookings_staff_id              │
│  • idx_staff_is_active        • idx_bookings_start_time            │
│  • idx_bookings_shop_date                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Time Slot Availability Check

```
User selects date & course
         │
         ▼
┌──────────────────────┐
│ TimeSlotSelector     │
│ Component            │
└──────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ getAvailableSlots(shopId, date, duration)   │
└──────────────────────────────────────────────┘
         │
         ├─► Fetch operating hours
         │   └─► Get day's open/close times
         │
         ├─► Generate base time slots (30min intervals)
         │   └─► Apply operating hours constraints
         │
         ├─► Fetch existing bookings for date
         │   └─► Calculate occupied time ranges
         │
         ├─► Apply break time
         │   └─► Mark break period as occupied
         │
         ├─► Check overlaps for each slot
         │   └─► Slot + duration vs occupied ranges
         │
         ▼
┌──────────────────────────────────────────────┐
│ Return TimeSlot[] with availability flags   │
└──────────────────────────────────────────────┘
         │
         ▼
Display slots in 4-column grid
(Available: blue, Unavailable: gray + strikethrough)
```

### 2. Staff Management Flow

```
Partner creates staff
         │
         ▼
┌──────────────────────┐
│ Staff Form Dialog    │
│ • Name               │
│ • Photo URL          │
│ • Specialties        │
└──────────────────────┘
         │
         ▼
Validate input
         │
         ├─► Name required
         ├─► At least 1 specialty
         │
         ▼
┌──────────────────────────────┐
│ createStaff(staffData)       │
└──────────────────────────────┘
         │
         ▼
Insert into database
         │
         ├─► Generate UUID
         ├─► Set shop_id
         ├─► Default is_active = true
         │
         ▼
┌──────────────────────────────┐
│ Invalidate React Query cache │
└──────────────────────────────┘
         │
         ▼
UI auto-updates with new staff
```

### 3. Booking Creation with Staff

```
Customer selects:
  • Course
  • Date
  • Time slot
  • Staff (optional)
         │
         ▼
┌────────────────────────────────┐
│ Build booking object:          │
│ {                              │
│   shop_id,                     │
│   course_id,                   │
│   start_time: date + time,     │
│   course_duration,             │
│   staff_id: selected or null,  │
│   ...                          │
│ }                              │
└────────────────────────────────┘
         │
         ▼
Validate booking
         │
         ├─► Check time not in past
         ├─► Verify slot still available
         ├─► Confirm staff is active (if selected)
         │
         ▼
Insert into bookings table
         │
         ▼
┌────────────────────────────────┐
│ Booking created successfully   │
│ • Email confirmation           │
│ • Update availability cache    │
│ • Notify assigned staff        │
└────────────────────────────────┘
```

---

## Component Hierarchy

```
App Router Pages
│
├── /partner/staff
│   │
│   ├── StaffManagementPage (main page component)
│   │   │
│   │   ├── Staff Card (for each staff)
│   │   │   ├── Photo/Avatar
│   │   │   ├── Name & Status
│   │   │   ├── Specialty Badges
│   │   │   ├── Active Toggle
│   │   │   └── Edit/Delete Buttons
│   │   │
│   │   └── Staff Form Dialog
│   │       ├── Name Input
│   │       ├── Photo URL Input
│   │       ├── Specialty Toggles
│   │       └── Submit/Cancel Buttons
│   │
│
├── /partner/operating-hours
│   │
│   ├── OperatingHoursPage (main page component)
│   │   │
│   │   ├── Basic Settings Card
│   │   │   ├── 24-hour Toggle
│   │   │   └── Break Time Section
│   │   │       ├── Break Time Toggle
│   │   │       ├── Start Time Select
│   │   │       └── End Time Select
│   │   │
│   │   ├── Day Schedule Card
│   │   │   └── For each day:
│   │   │       ├── Open/Closed Checkbox
│   │   │       ├── Opening Time Select
│   │   │       └── Closing Time Select
│   │   │
│   │   └── Save Button
│   │
│
└── /customer/booking (or wherever booking happens)
    │
    ├── BookingDrawer/Modal
    │   │
    │   ├── Course Display
    │   │
    │   ├── TimeSlotSelector
    │   │   ├── Calendar (date picker)
    │   │   │   └── DatePicker Component
    │   │   │
    │   │   └── Time Slot Grid
    │   │       └── Time Slot Buttons (4 cols)
    │   │           ├── Available (clickable, blue)
    │   │           └── Unavailable (disabled, gray)
    │   │
    │   ├── StaffSelector
    │   │   ├── "No Preference" Card
    │   │   │   └── RadioButton
    │   │   │
    │   │   └── Staff Cards (for each active staff)
    │   │       ├── RadioButton
    │   │       ├── Photo/Avatar
    │   │       ├── Name
    │   │       └── Specialty Badges
    │   │
    │   ├── Booking Summary
    │   │   ├── Course info
    │   │   ├── Date & Time
    │   │   ├── Staff assignment
    │   │   └── Total price
    │   │
    │   └── Confirm Button
    │
```

---

## State Management Flow

```
React Component State
         │
         ├── Local State (useState)
         │   ├── Form inputs
         │   ├── Dialog open/close
         │   ├── Selected values
         │   └── UI-only state
         │
         └── Server State (React Query)
             │
             ├── Queries (Cached Data)
             │   ├── ['staff', shopId]
             │   ├── ['active-staff', shopId]
             │   ├── ['operating-hours', shopId]
             │   └── ['available-slots', shopId, date, duration]
             │
             └── Mutations (Write Operations)
                 ├── Optimistic Updates
                 ├── Automatic Cache Invalidation
                 ├── Retry Logic
                 └── Error Handling
```

---

## Security Architecture

```
┌──────────────────────────────────────────────┐
│         Client Request (Browser)             │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│      Supabase Client (with Auth Token)      │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│         Row Level Security (RLS)             │
├──────────────────────────────────────────────┤
│                                              │
│  Staff Table Policies:                      │
│  ┌──────────────────────────────────────┐   │
│  │ SELECT: Anyone can view              │   │
│  │ INSERT/UPDATE/DELETE:                │   │
│  │   Only shop owners for their staff   │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Shops Table Policies:                      │
│  ┌──────────────────────────────────────┐   │
│  │ SELECT: Public info viewable         │   │
│  │ UPDATE: Only owner can modify        │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Bookings Table Policies:                   │
│  ┌──────────────────────────────────────┐   │
│  │ SELECT: Shop owner & customer        │   │
│  │ INSERT: Authenticated users          │   │
│  │ UPDATE: Shop owner for status        │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│         Database Operation Executed          │
└──────────────────────────────────────────────┘
```

---

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              React Query Cache Layers                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cache Key                          Stale Time   GC Time   │
│  ────────────────────────────────   ──────────   ───────   │
│  ['staff', shopId]                  60s          5min      │
│  ['active-staff', shopId]           60s          5min      │
│  ['operating-hours', shopId]        5min         10min     │
│  ['available-slots', ...]           30s          2min      │
│                                                             │
│  Invalidation Triggers:                                    │
│  • Staff CRUD → Invalidate staff queries                   │
│  • Hours update → Invalidate hours & slots                 │
│  • Booking creation → Invalidate slots for date            │
│  • Manual refresh → Force refetch                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
API Call
   │
   ├─► Success
   │   ├─► Update cache
   │   ├─► Show success toast
   │   └─► Update UI
   │
   └─► Error
       │
       ├─► Network Error
       │   ├─► Retry (3 attempts)
       │   └─► Show "Connection issue" toast
       │
       ├─► Auth Error (401/403)
       │   ├─► Redirect to login
       │   └─► Clear local cache
       │
       ├─► Validation Error (400)
       │   ├─► Show specific field errors
       │   └─► Keep form data
       │
       ├─► Not Found (404)
       │   ├─► Show "Resource not found"
       │   └─► Invalidate cache
       │
       └─► Server Error (500)
           ├─► Log to error service
           ├─► Show generic error message
           └─► Allow manual retry
```

---

## Performance Optimization Points

### Database Level
```
• Indexed columns: shop_id, staff_id, start_time
• JSONB indexes on operating_hours (if needed)
• Connection pooling enabled
• Query result caching
```

### API Level
```
• React Query caching (60s default)
• Optimistic updates (instant UI feedback)
• Request deduplication
• Automatic background refetching
```

### Component Level
```
• React.memo for staff cards
• Virtual scrolling (if > 50 staff)
• Lazy image loading
• Debounced search inputs
```

### Network Level
```
• CDN for static assets
• Image optimization (WebP, sizing)
• Gzip compression
• HTTP/2 multiplexing
```

---

## Monitoring & Observability

```
┌──────────────────────────────────────────────┐
│              Metrics to Track                │
├──────────────────────────────────────────────┤
│                                              │
│  API Performance:                            │
│  • getAvailableSlots latency (p50, p95)      │
│  • Database query times                      │
│  • Cache hit rates                           │
│                                              │
│  User Actions:                               │
│  • Staff create/update/delete counts         │
│  • Operating hours update frequency          │
│  • Time slot selection patterns              │
│  • Staff selection rate (vs auto-assign)     │
│                                              │
│  Errors:                                     │
│  • API failure rates by endpoint             │
│  • Validation error types                    │
│  • Network timeout frequency                 │
│                                              │
│  Business Metrics:                           │
│  • Most popular time slots                   │
│  • Staff utilization rates                   │
│  • Booking success rate                      │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                     Vercel Edge                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Next.js 14 App (Static + SSR)            │  │
│  │  • Partner pages (SSR with auth check)           │  │
│  │  • Customer components (Client-side)             │  │
│  │  • API routes (if any)                           │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│                 Supabase Cloud                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                 │  │
│  │  • staff table                                   │  │
│  │  • shops table (with operating_hours)            │  │
│  │  • bookings table (with staff_id)                │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Realtime Engine                     │  │
│  │  • Live updates for bookings                     │  │
│  │  • WebSocket connections                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Auth Service                        │  │
│  │  • JWT tokens                                    │  │
│  │  • Row Level Security                            │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## File Structure Map

```
C:/a/
├── src/
│   ├── types/
│   │   └── staff.ts ──────────────► Type definitions
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── staff.ts ──────────► Staff CRUD
│   │   │   └── operating-hours.ts ► Hours & slots
│   │   │
│   │   ├── supabase/
│   │   │   └── client.ts ─────────► DB connection
│   │   │
│   │   └── utils/
│   │       └── time.ts ───────────► Time utilities
│   │
│   ├── app/
│   │   ├── partner/
│   │   │   ├── staff/
│   │   │   │   └── page.tsx ──────► Staff management
│   │   │   │
│   │   │   └── operating-hours/
│   │   │       └── page.tsx ──────► Hours config
│   │   │
│   │   └── test/
│   │       └── components/
│   │           └── page.tsx ──────► Testing UI
│   │
│   └── components/
│       ├── ui/ ───────────────────► shadcn components
│       │
│       └── customer/
│           ├── TimeSlotSelector.tsx
│           ├── StaffSelector.tsx
│           └── BookingDrawerExample.tsx
│
├── supabase/
│   └── migrations/
│       └── 20240125_staff_and_operating_hours.sql
│
└── Documentation/
    ├── STAFF_OPERATING_HOURS_README.md
    ├── QUICKSTART.md
    ├── IMPLEMENTATION_SUMMARY.md
    └── SYSTEM_ARCHITECTURE.md (this file)
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-25
**Status**: Production Ready
