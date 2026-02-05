/**
 * 출석체크 타입 정의
 */

// 출석 기록 타입
export interface Attendance {
  id: string;
  user_id: string;
  check_date: string; // YYYY-MM-DD 형식
  base_points: number;
  streak_days: number;
  bonus_points: number;
  total_points: number;
  created_at: string;
}

// 출석체크 결과 타입
export interface AttendanceCheckResult {
  success: boolean;
  message: string;
  attendance_id: string | null;
  streak_days: number;
  base_points: number;
  bonus_points: number;
  total_points: number;
  is_already_checked: boolean;
}

// 월별 출석 현황 타입
export interface MonthlyAttendance {
  check_date: string;
  streak_days: number;
  total_points: number;
}

// 출석 통계 타입
export interface AttendanceStats {
  total_days: number;        // 총 출석일
  current_streak: number;    // 현재 연속 출석일
  max_streak: number;        // 최대 연속 출석일
  total_points_earned: number; // 출석으로 적립한 총 포인트
  this_month_days: number;   // 이번 달 출석일
}

// 연속 출석 보너스 마일스톤
export interface StreakMilestone {
  days: number;
  bonus: number;
  label: string;
}

// 연속 출석 보너스 규칙
export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 7, bonus: 50, label: '7일 연속' },
  { days: 14, bonus: 100, label: '14일 연속' },
  { days: 21, bonus: 150, label: '21일 연속' },
  { days: 30, bonus: 300, label: '30일 연속' },
];

// 기본 출석 포인트
export const BASE_ATTENDANCE_POINTS = 10;
