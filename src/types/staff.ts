export interface OperatingHours {
  monday: { open: string; close: string } | null;
  tuesday: { open: string; close: string } | null;
  wednesday: { open: string; close: string } | null;
  thursday: { open: string; close: string } | null;
  friday: { open: string; close: string } | null;
  saturday: { open: string; close: string } | null;
  sunday: { open: string; close: string } | null;
  is_24h: boolean;
  break_time: { start: string; end: string } | null;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  day_off: string[]; // ['monday', 'sunday'] 형식의 휴무 요일
  work_start: string; // '09:00' 형식
  work_end: string; // '18:00' 형식
  temp_off_dates: string[]; // ['2024-01-15', '2024-01-20'] 형식의 임시 휴무일
}

export interface StaffReview {
  id: string;
  staff_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface StaffWithStats extends Staff {
  schedule?: StaffSchedule;
  average_rating: number;
  review_count: number;
}

export interface Staff {
  id: string;
  shop_id: string;
  name: string;
  photo: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: string;
}

export interface TimeSlot {
  time: string; // "10:00"
  available: boolean;
  staff_id?: string;
  staff_name?: string;
}

export const SPECIALTY_OPTIONS = [
  "스웨디시",
  "타이",
  "아로마",
  "딥티슈",
  "스포츠",
  "발"
] as const;

export type Specialty = typeof SPECIALTY_OPTIONS[number];

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

export const DAY_LABELS: Record<typeof DAYS_OF_WEEK[number], string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일'
};
