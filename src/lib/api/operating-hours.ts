import { supabase } from '@/lib/supabase/client';
import { OperatingHours, TimeSlot } from '@/types/staff';

export async function fetchOperatingHours(shopId: string): Promise<OperatingHours | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('operating_hours')
    .eq('id', shopId)
    .single();

  if (error) {
    console.error('Error fetching operating hours:', error);
    throw new Error('영업시간 정보를 불러오는데 실패했습니다.');
  }

  return data?.operating_hours || null;
}

export async function updateOperatingHours(
  shopId: string,
  hours: OperatingHours
): Promise<OperatingHours> {
  const { data, error } = await supabase
    .from('shops')
    .update({ operating_hours: hours })
    .eq('id', shopId)
    .select('operating_hours')
    .single();

  if (error) {
    console.error('Error updating operating hours:', error);
    throw new Error('영업시간 설정에 실패했습니다.');
  }

  return data.operating_hours;
}

type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export function isShopOpenNow(hours: OperatingHours): boolean {
  if (!hours) return false;
  if (hours.is_24h) return true;

  const now = new Date();
  const currentDay = (['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const)[now.getDay()] as DayOfWeek;
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const dayHours = hours[currentDay];
  if (!dayHours) return false;

  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Check if we're in break time
  if (hours.break_time) {
    const [breakStartHour, breakStartMin] = hours.break_time.start.split(':').map(Number);
    const [breakEndHour, breakEndMin] = hours.break_time.end.split(':').map(Number);
    const breakStart = breakStartHour * 60 + breakStartMin;
    const breakEnd = breakEndHour * 60 + breakEndMin;

    if (currentTime >= breakStart && currentTime < breakEnd) {
      return false;
    }
  }

  return currentTime >= openTime && currentTime < closeTime;
}

export async function getAvailableSlots(
  shopId: string,
  date: string, // YYYY-MM-DD
  courseDuration: number // minutes
): Promise<TimeSlot[]> {
  // Fetch operating hours
  const hours = await fetchOperatingHours(shopId);
  if (!hours) return [];

  const dateObj = new Date(date);
  const dayOfWeek = (['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const)[dateObj.getDay()] as DayOfWeek;

  const dayHours = hours[dayOfWeek];
  if (!dayHours) return []; // Closed on this day

  // Generate time slots
  const slots: TimeSlot[] = [];

  let startMinutes: number;
  let endMinutes: number;

  if (hours.is_24h) {
    startMinutes = 0;
    endMinutes = 24 * 60;
  } else {
    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
    startMinutes = openHour * 60 + openMin;
    endMinutes = closeHour * 60 + closeMin;
  }

  // Fetch existing bookings for this date
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_time, course_duration, staff_id, staff:staff_id(name)')
    .eq('shop_id', shopId)
    .gte('start_time', `${date}T00:00:00`)
    .lt('start_time', `${date}T23:59:59`)
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('예약 정보를 불러오는데 실패했습니다.');
  }

  // Create set of occupied time ranges
  const occupiedRanges: { start: number; end: number; staff_id?: string; staff_name?: string }[] = [];

  bookings?.forEach((booking) => {
    const bookingTime = new Date(booking.start_time);
    const bookingMinutes = bookingTime.getHours() * 60 + bookingTime.getMinutes();
    occupiedRanges.push({
      start: bookingMinutes,
      end: bookingMinutes + booking.course_duration,
      staff_id: booking.staff_id,
      staff_name: booking.staff?.name
    });
  });

  // Add break time as occupied
  if (hours.break_time) {
    const [breakStartHour, breakStartMin] = hours.break_time.start.split(':').map(Number);
    const [breakEndHour, breakEndMin] = hours.break_time.end.split(':').map(Number);
    occupiedRanges.push({
      start: breakStartHour * 60 + breakStartMin,
      end: breakEndHour * 60 + breakEndMin
    });
  }

  // Generate 30-minute slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const slotEndTime = minutes + courseDuration;

    // Check if slot + course duration fits within operating hours
    if (slotEndTime > endMinutes) continue;

    const slotHours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeString = `${slotHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    // Check if this slot overlaps with any occupied range
    const isOccupied = occupiedRanges.some((range) => {
      // Check if slot overlaps with occupied range
      return (minutes < range.end && slotEndTime > range.start);
    });

    slots.push({
      time: timeString,
      available: !isOccupied
    });
  }

  return slots;
}

export function formatTime(time24: string): string {
  const [hour, minute] = time24.split(':').map(Number);
  const period = hour >= 12 ? '오후' : '오전';
  const hour12 = hour % 12 || 12;
  return `${period} ${hour12}:${minute.toString().padStart(2, '0')}`;
}

export function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
}
