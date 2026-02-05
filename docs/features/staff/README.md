# Staff Management & Operating Hours System

## Overview
Complete implementation of staff management, operating hours configuration, and real-time booking time slot availability system.

## Quick Start (5 Minutes)

### 1. Database Setup
```bash
cd C:/a
supabase migration up
# Or: psql -d your_database -f supabase/migrations/20240125_staff_and_operating_hours.sql
```

### 2. Install Dependencies
```bash
npm install date-fns
npx shadcn@latest add checkbox calendar radio-group alert
```

### 3. Test the Features
1. Navigate to `/partner/operating-hours` - Set shop operating hours
2. Navigate to `/partner/staff` - Add staff members
3. Test customer booking flow with TimeSlotSelector and StaffSelector

### 4. Quick Integration
```tsx
import { TimeSlotSelector } from '@/components/customer/TimeSlotSelector';
import { StaffSelector } from '@/components/customer/StaffSelector';

<TimeSlotSelector shopId={shopId} courseDuration={90} ... />
<StaffSelector shopId={shopId} selectedStaffId={staffId} ... />
```

> **Note**: Replace hardcoded SHOP_ID in partner pages with your auth context.

## Features Implemented

### 1. Staff Management (`/partner/staff`)
- Create, read, update, delete staff members
- Staff profile with photo, name, and specialties
- Active/inactive status toggle
- Specialty tags: 스웨디시, 타이, 아로마, 딥티슈, 스포츠, 발
- Beautiful card-based UI with animations

### 2. Operating Hours (`/partner/operating-hours`)
- 24-hour operation toggle
- Day-by-day schedule configuration
- Break time settings (e.g., lunch break)
- Closed day support
- Time selection in 30-minute increments
- Validation for logical time ranges

### 3. Real-time Time Slot Availability
- Dynamic slot generation based on operating hours
- Existing booking conflict detection
- Course duration overlap prevention
- Break time exclusion
- 30-minute interval slots
- Visual available/unavailable indication

### 4. Customer-Facing Components
- **TimeSlotSelector**: Date and time selection with availability
- **StaffSelector**: Staff member selection with profiles
- Integration ready for BookingDrawer

## File Structure

```
C:/a/
├── src/
│   ├── types/
│   │   └── staff.ts                    # TypeScript types
│   ├── lib/
│   │   └── api/
│   │       ├── staff.ts                # Staff CRUD operations
│   │       └── operating-hours.ts      # Hours & slot availability
│   ├── app/
│   │   └── partner/
│   │       ├── staff/
│   │       │   └── page.tsx            # Staff management page
│   │       └── operating-hours/
│   │           └── page.tsx            # Operating hours page
│   └── components/
│       └── customer/
│           ├── TimeSlotSelector.tsx    # Time slot picker
│           └── StaffSelector.tsx       # Staff selector
└── supabase/
    └── migrations/
        └── 20240125_staff_and_operating_hours.sql
```

## Database Schema

### `staff` table
```sql
- id: UUID (PK)
- shop_id: UUID (FK -> shops)
- name: TEXT
- photo: TEXT (nullable)
- specialties: TEXT[]
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `shops.operating_hours` column
```json
{
  "monday": { "open": "09:00", "close": "21:00" },
  "tuesday": { "open": "09:00", "close": "21:00" },
  "wednesday": { "open": "09:00", "close": "21:00" },
  "thursday": { "open": "09:00", "close": "21:00" },
  "friday": { "open": "09:00", "close": "21:00" },
  "saturday": { "open": "09:00", "close": "21:00" },
  "sunday": null,  // Closed
  "is_24h": false,
  "break_time": { "start": "12:00", "end": "13:00" }
}
```

### `bookings.staff_id` column
```sql
- staff_id: UUID (FK -> staff, nullable)
```

## API Functions

### Staff Management
```typescript
// Fetch all staff for a shop
fetchStaff(shopId: string): Promise<Staff[]>

// Fetch only active staff
fetchActiveStaff(shopId: string): Promise<Staff[]>

// Create new staff member
createStaff(data: CreateStaffData): Promise<Staff>

// Update staff information
updateStaff(id: string, data: UpdateStaffData): Promise<Staff>

// Delete staff member
deleteStaff(id: string): Promise<void>

// Toggle active status
toggleStaffActive(id: string, isActive: boolean): Promise<Staff>
```

### Operating Hours
```typescript
// Fetch operating hours
fetchOperatingHours(shopId: string): Promise<OperatingHours | null>

// Update operating hours
updateOperatingHours(shopId: string, hours: OperatingHours): Promise<OperatingHours>

// Check if shop is currently open
isShopOpenNow(hours: OperatingHours): boolean

// Get available time slots for booking
getAvailableSlots(
  shopId: string,
  date: string,      // YYYY-MM-DD
  courseDuration: number  // minutes
): Promise<TimeSlot[]>

// Helper: Format time for display
formatTime(time24: string): string  // "14:00" -> "오후 2:00"

// Helper: Generate time options
generateTimeOptions(): string[]  // ["00:00", "00:30", ..., "23:30"]
```

## Usage Examples

### 1. Using TimeSlotSelector in BookingDrawer
```tsx
import { TimeSlotSelector } from '@/components/customer/TimeSlotSelector';

function BookingDrawer() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');

  return (
    <TimeSlotSelector
      shopId={shopId}
      courseDuration={selectedCourse.duration}
      selectedDate={selectedDate}
      selectedTime={selectedTime}
      onDateChange={setSelectedDate}
      onTimeChange={setSelectedTime}
    />
  );
}
```

### 2. Using StaffSelector
```tsx
import { StaffSelector } from '@/components/customer/StaffSelector';

function BookingDrawer() {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  return (
    <StaffSelector
      shopId={shopId}
      selectedStaffId={selectedStaffId}
      onStaffChange={setSelectedStaffId}
    />
  );
}
```

### 3. Creating a Booking with Staff
```typescript
const booking = {
  shop_id: shopId,
  course_id: courseId,
  start_time: `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`,
  course_duration: courseDuration,
  staff_id: selectedStaffId,  // Can be null
  // ... other fields
};
```

## Time Slot Availability Algorithm

The `getAvailableSlots` function implements sophisticated availability checking:

1. **Fetch Operating Hours**: Get shop schedule for the selected date
2. **Check Day Status**: Verify shop is open on selected day
3. **Generate Base Slots**: Create 30-minute interval slots
4. **Fetch Existing Bookings**: Query all bookings for the date
5. **Mark Occupied Ranges**: Calculate time ranges occupied by bookings
6. **Apply Break Time**: Mark break time as unavailable
7. **Check Overlaps**: For each slot, check if it + course duration overlaps with occupied ranges
8. **Return Results**: Array of time slots with availability flags

### Example Slot Generation
```typescript
Operating Hours: 09:00 - 21:00
Course Duration: 90 minutes
Break Time: 12:00 - 13:00

Generated Slots:
09:00 ✓ (ends 10:30, no conflict)
09:30 ✓ (ends 11:00, no conflict)
10:00 ✓ (ends 11:30, no conflict)
10:30 ✗ (ends 12:00, overlaps with break)
11:00 ✗ (ends 12:30, overlaps with break)
11:30 ✗ (ends 13:00, overlaps with break)
12:00 ✗ (break time)
12:30 ✗ (break time)
13:00 ✓ (ends 14:30, no conflict)
...
```

## Key Features

### 1. Smart Time Validation
- Prevents booking slots that would extend past closing time
- Accounts for course duration in availability checking
- Validates break times don't exceed operating hours

### 2. Real-time Updates
- React Query automatically refetches on date/duration change
- Optimistic updates for staff status toggles
- Instant UI feedback on all mutations

### 3. Accessibility
- Keyboard navigation support
- Screen reader friendly labels
- Clear visual indicators for disabled states

### 4. Responsive Design
- Mobile-first approach
- Touch-friendly time slot buttons
- Adaptive grid layouts

### 5. Error Handling
- User-friendly error messages
- Validation before API calls
- Graceful degradation on API failures

## Integration Checklist

- [ ] Run database migration: `supabase migration up`
- [ ] Update SHOP_ID constant with actual shop ID from auth
- [ ] Add navigation links to partner dashboard
- [ ] Integrate TimeSlotSelector into BookingDrawer
- [ ] Integrate StaffSelector into BookingDrawer
- [ ] Update booking creation to include staff_id
- [ ] Test with real data
- [ ] Configure RLS policies for production

## Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "date-fns": "^3.x",
    "framer-motion": "^11.x",
    "lucide-react": "^0.x",
    "sonner": "^1.x"
  }
}
```

## Next Steps

1. **Authentication Integration**: Replace hardcoded SHOP_ID with actual auth context
2. **Image Upload**: Implement photo upload for staff profiles
3. **Staff Scheduling**: Add individual staff schedules (if needed)
4. **Booking Confirmation**: Show selected staff in booking confirmation
5. **Analytics**: Track popular time slots and staff performance
6. **Multi-language**: Add i18n support for time formats

## Testing

### Manual Testing Checklist
- [ ] Create staff member with all fields
- [ ] Upload staff photo (if implemented)
- [ ] Toggle staff active/inactive status
- [ ] Delete staff member
- [ ] Set operating hours for all days
- [ ] Enable/disable 24-hour operation
- [ ] Configure break time
- [ ] Select date and view available slots
- [ ] Verify slots respect operating hours
- [ ] Verify slots exclude existing bookings
- [ ] Verify slots exclude break time
- [ ] Select staff member
- [ ] Create booking with staff assignment

## Performance Considerations

- Indexed queries on shop_id, staff_id, start_time
- React Query caching reduces API calls
- Optimistic updates for instant UI feedback
- Lazy loading for large staff lists (if needed)
- Debounced time slot fetching (consider adding)

## Security

- Row Level Security (RLS) enabled on staff table
- Shop owners can only manage their own staff
- Public read access for customer-facing components
- Input validation on all forms
- SQL injection protection via parameterized queries

---

**Implementation Status**: ✅ Complete
**Last Updated**: 2026-01-25
**Version**: 1.0.0
