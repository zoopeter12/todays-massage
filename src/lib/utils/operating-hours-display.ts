import { OperatingHours, DAYS_OF_WEEK, DAY_LABELS } from '@/types/staff';

type DayKey = (typeof DAYS_OF_WEEK)[number];

/**
 * 오늘 요일의 영어 키를 반환
 */
export function getTodayDayKey(): DayKey {
  const dayIndex = new Date().getDay();
  // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
  const dayMap: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayMap[dayIndex];
}

/**
 * 시간 문자열을 한국어 형식으로 포맷팅
 * "10:00" -> "오전 10:00"
 * "14:30" -> "오후 2:30"
 */
export function formatTimeKorean(time24: string): string {
  const [hour, minute] = time24.split(':').map(Number);
  const period = hour >= 12 ? '오후' : '오전';
  const hour12 = hour % 12 || 12;
  return `${period} ${hour12}:${minute.toString().padStart(2, '0')}`;
}

/**
 * 단일 요일의 영업시간을 포맷팅
 * null -> "휴무"
 * {open: "10:00", close: "22:00"} -> "10:00 - 22:00"
 */
export function formatDayHours(dayHours: { open: string; close: string } | null): string {
  if (!dayHours) return '휴무';
  return `${dayHours.open} - ${dayHours.close}`;
}

/**
 * 단일 요일의 영업시간을 한국어 형식으로 포맷팅
 * null -> "휴무"
 * {open: "10:00", close: "22:00"} -> "오전 10:00 - 오후 10:00"
 */
export function formatDayHoursKorean(dayHours: { open: string; close: string } | null): string {
  if (!dayHours) return '휴무';
  return `${formatTimeKorean(dayHours.open)} - ${formatTimeKorean(dayHours.close)}`;
}

/**
 * 영업시간의 간략 표시 (오늘 기준)
 * - 24시간: "24시간 영업"
 * - 휴무: "오늘 휴무"
 * - 일반: "10:00 - 22:00"
 */
export function getTodayHoursSummary(hours: OperatingHours | null): string {
  if (!hours) return '영업시간 정보 없음';
  if (hours.is_24h) return '24시간 영업';

  const todayKey = getTodayDayKey();
  const todayHours = hours[todayKey];

  if (!todayHours) return '오늘 휴무';
  return `${todayHours.open} - ${todayHours.close}`;
}

/**
 * 모든 요일의 영업시간을 배열로 반환
 */
export interface DaySchedule {
  dayKey: DayKey;
  dayLabel: string;
  hours: string;
  isClosed: boolean;
  isToday: boolean;
}

export function getWeeklySchedule(hours: OperatingHours | null): DaySchedule[] {
  if (!hours) {
    return DAYS_OF_WEEK.map((dayKey) => ({
      dayKey,
      dayLabel: DAY_LABELS[dayKey],
      hours: '정보 없음',
      isClosed: false,
      isToday: dayKey === getTodayDayKey(),
    }));
  }

  const todayKey = getTodayDayKey();

  return DAYS_OF_WEEK.map((dayKey) => {
    const dayHours = hours[dayKey];
    return {
      dayKey,
      dayLabel: DAY_LABELS[dayKey],
      hours: hours.is_24h ? '24시간' : formatDayHours(dayHours),
      isClosed: !hours.is_24h && dayHours === null,
      isToday: dayKey === todayKey,
    };
  });
}

/**
 * 휴게시간 포맷팅
 */
export function formatBreakTime(breakTime: { start: string; end: string } | null): string | null {
  if (!breakTime) return null;
  return `${breakTime.start} - ${breakTime.end}`;
}

/**
 * 현재 영업 상태 판단
 */
export type ShopStatus = 'open' | 'closed' | 'break' | 'unknown';

export function getCurrentShopStatus(hours: OperatingHours | null): ShopStatus {
  if (!hours) return 'unknown';
  if (hours.is_24h) return 'open';

  const now = new Date();
  const todayKey = getTodayDayKey();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayHours = hours[todayKey];
  if (!todayHours) return 'closed'; // 휴무일

  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // 영업시간 외
  if (currentMinutes < openTime || currentMinutes >= closeTime) {
    return 'closed';
  }

  // 휴게시간 체크
  if (hours.break_time) {
    const [breakStartHour, breakStartMin] = hours.break_time.start.split(':').map(Number);
    const [breakEndHour, breakEndMin] = hours.break_time.end.split(':').map(Number);
    const breakStart = breakStartHour * 60 + breakStartMin;
    const breakEnd = breakEndHour * 60 + breakEndMin;

    if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
      return 'break';
    }
  }

  return 'open';
}

/**
 * 영업 상태에 따른 텍스트 반환
 */
export function getStatusText(status: ShopStatus): string {
  switch (status) {
    case 'open':
      return '영업중';
    case 'closed':
      return '영업종료';
    case 'break':
      return '휴게시간';
    case 'unknown':
    default:
      return '';
  }
}

/**
 * 영업 상태에 따른 색상 클래스 반환
 */
export function getStatusColorClass(status: ShopStatus): string {
  switch (status) {
    case 'open':
      return 'text-green-600';
    case 'closed':
      return 'text-red-500';
    case 'break':
      return 'text-yellow-600';
    case 'unknown':
    default:
      return 'text-muted-foreground';
  }
}
