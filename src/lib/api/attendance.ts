import { supabase } from '@/lib/supabase/client';
import type {
  Attendance,
  AttendanceCheckResult,
  MonthlyAttendance,
  AttendanceStats,
} from '@/types/attendance';
import { BASE_ATTENDANCE_POINTS, STREAK_MILESTONES } from '@/types/attendance';

/**
 * 연속 출석 보너스 계산 (클라이언트 측)
 */
function calculateStreakBonus(streakDays: number): number {
  // 30일, 21일, 14일, 7일 순으로 확인
  if (streakDays === 30) return 300;
  if (streakDays === 21) return 150;
  if (streakDays === 14) return 100;
  if (streakDays === 7) return 50;
  return 0;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * 어제 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * 출석체크 수행 (Fallback 지원)
 * - 1일 1회 제한 (서버에서 검증)
 * - 연속 출석 보너스 자동 계산
 * - point_history에 자동 적립
 */
export async function checkAttendance(
  userId: string
): Promise<AttendanceCheckResult> {
  try {
    // 먼저 RPC 시도
    const { data, error } = await supabase.rpc('check_attendance', {
      p_user_id: userId,
    });

    // RPC 성공 시
    if (!error && data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        message: result.message,
        attendance_id: result.attendance_id,
        streak_days: result.streak_days,
        base_points: result.base_points,
        bonus_points: result.bonus_points,
        total_points: result.total_points,
        is_already_checked: result.is_already_checked,
      };
    }

    // RPC 실패 시 Fallback: 직접 테이블 쿼리
    console.log('[Attendance] RPC unavailable, using fallback logic');
    return await checkAttendanceFallback(userId);
  } catch (error) {
    console.warn('Failed to check attendance:', error);
    // RPC 에러 시에도 fallback 시도
    try {
      return await checkAttendanceFallback(userId);
    } catch (fallbackError) {
      console.warn('Fallback also failed:', fallbackError);
      throw error;
    }
  }
}

/**
 * 출석체크 Fallback (RPC 없이 직접 쿼리)
 */
async function checkAttendanceFallback(
  userId: string
): Promise<AttendanceCheckResult> {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // 1. 오늘 이미 출석했는지 확인
  const { data: existingAttendance, error: checkError } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('check_date', today)
    .single();

  // 테이블이 존재하지 않는 경우 graceful하게 처리
  if (checkError?.code === 'PGRST205') {
    console.log('[Attendance] Table not exists, service unavailable');
    return {
      success: false,
      message: '출석체크 서비스가 준비 중입니다. 잠시 후 다시 시도해주세요.',
      attendance_id: null,
      streak_days: 0,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      is_already_checked: false,
    };
  }

  if (existingAttendance) {
    return {
      success: true,
      message: '이미 오늘 출석체크를 완료했습니다.',
      attendance_id: existingAttendance.id,
      streak_days: existingAttendance.streak_days,
      base_points: existingAttendance.base_points,
      bonus_points: existingAttendance.bonus_points,
      total_points: existingAttendance.base_points + existingAttendance.bonus_points,
      is_already_checked: true,
    };
  }

  // 2. 어제 출석 기록 확인 (연속 출석 계산)
  const { data: yesterdayAttendance, error: yesterdayError } = await supabase
    .from('attendance')
    .select('streak_days')
    .eq('user_id', userId)
    .eq('check_date', yesterday)
    .single();

  // 테이블이 존재하지 않는 경우 graceful하게 처리
  if (yesterdayError?.code === 'PGRST205') {
    console.log('[Attendance] Table not exists, service unavailable');
    return {
      success: false,
      message: '출석체크 서비스가 준비 중입니다. 잠시 후 다시 시도해주세요.',
      attendance_id: null,
      streak_days: 0,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      is_already_checked: false,
    };
  }

  const newStreakDays = yesterdayAttendance ? yesterdayAttendance.streak_days + 1 : 1;
  const basePoints = BASE_ATTENDANCE_POINTS;
  const bonusPoints = calculateStreakBonus(newStreakDays);
  const totalPoints = basePoints + bonusPoints;

  // 3. 출석 기록 생성
  const { data: newAttendance, error: insertError } = await supabase
    .from('attendance')
    .insert({
      user_id: userId,
      check_date: today,
      base_points: basePoints,
      streak_days: newStreakDays,
      bonus_points: bonusPoints,
    })
    .select()
    .single();

  if (insertError) {
    // 테이블이 존재하지 않는 경우 graceful하게 처리
    if (insertError.code === 'PGRST205') {
      console.log('[Attendance] Table not exists, service unavailable');
      return {
        success: false,
        message: '출석체크 서비스가 준비 중입니다. 잠시 후 다시 시도해주세요.',
        attendance_id: null,
        streak_days: 0,
        base_points: 0,
        bonus_points: 0,
        total_points: 0,
        is_already_checked: false,
      };
    }
    console.warn('Failed to insert attendance:', insertError);
    throw new Error('출석체크 처리 중 오류가 발생했습니다.');
  }

  // 4. 메시지 생성
  const message = bonusPoints > 0
    ? `출석체크 완료! ${newStreakDays}일 연속 출석 보너스 ${bonusPoints}P 추가 적립!`
    : `출석체크 완료! ${newStreakDays}일차 출석입니다.`;

  return {
    success: true,
    message,
    attendance_id: newAttendance?.id || null,
    streak_days: newStreakDays,
    base_points: basePoints,
    bonus_points: bonusPoints,
    total_points: totalPoints,
    is_already_checked: false,
  };
}

/**
 * 월별 출석 현황 조회 (Fallback 지원)
 */
export async function fetchMonthlyAttendance(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyAttendance[]> {
  try {
    // 먼저 RPC 시도
    const { data, error } = await supabase.rpc('get_monthly_attendance', {
      p_user_id: userId,
      p_year: year,
      p_month: month,
    });

    if (!error && data) {
      return data;
    }

    // RPC 실패 시 Fallback
    console.log('[Attendance] get_monthly_attendance RPC unavailable, using fallback');
    return await fetchMonthlyAttendanceFallback(userId, year, month);
  } catch (error) {
    console.warn('Failed to fetch monthly attendance:', error);
    try {
      return await fetchMonthlyAttendanceFallback(userId, year, month);
    } catch {
      return [];
    }
  }
}

/**
 * 월별 출석 현황 조회 Fallback
 */
async function fetchMonthlyAttendanceFallback(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyAttendance[]> {
  // 해당 월의 시작일과 마지막일 계산
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 해당 월 마지막 날

  const { data, error } = await supabase
    .from('attendance')
    .select('check_date, streak_days, base_points, bonus_points')
    .eq('user_id', userId)
    .gte('check_date', startDate)
    .lte('check_date', endDate)
    .order('check_date', { ascending: true });

  if (error) {
    // 테이블이 존재하지 않는 경우 graceful하게 처리
    if (error.code === 'PGRST205') {
      console.log('[Attendance] Table not exists, returning empty attendance');
      return [];
    }
    console.warn('Fallback fetch monthly attendance error:', error);
    return [];
  }

  return (data || []).map((item) => ({
    check_date: item.check_date,
    streak_days: item.streak_days,
    total_points: item.base_points + item.bonus_points,
  }));
}

/**
 * 출석 통계 조회 (Fallback 지원)
 */
export async function fetchAttendanceStats(
  userId: string
): Promise<AttendanceStats> {
  try {
    // 먼저 RPC 시도
    const { data, error } = await supabase.rpc('get_attendance_stats', {
      p_user_id: userId,
    });

    if (!error && data && data.length > 0) {
      const stats = data[0];
      return {
        total_days: stats.total_days || 0,
        current_streak: stats.current_streak || 0,
        max_streak: stats.max_streak || 0,
        total_points_earned: stats.total_points_earned || 0,
        this_month_days: stats.this_month_days || 0,
      };
    }

    // RPC 실패 시 Fallback
    console.log('[Attendance] get_attendance_stats RPC unavailable, using fallback');
    return await fetchAttendanceStatsFallback(userId);
  } catch (error) {
    console.warn('Failed to fetch attendance stats:', error);
    try {
      return await fetchAttendanceStatsFallback(userId);
    } catch {
      return {
        total_days: 0,
        current_streak: 0,
        max_streak: 0,
        total_points_earned: 0,
        this_month_days: 0,
      };
    }
  }
}

/**
 * 출석 통계 조회 Fallback
 */
async function fetchAttendanceStatsFallback(
  userId: string
): Promise<AttendanceStats> {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const thisMonthStart = `${today.substring(0, 7)}-01`;

  // 모든 출석 기록 조회
  const { data: allAttendance, error } = await supabase
    .from('attendance')
    .select('check_date, streak_days, base_points, bonus_points')
    .eq('user_id', userId)
    .order('check_date', { ascending: false });

  if (error || !allAttendance) {
    // 테이블이 존재하지 않는 경우 graceful하게 처리
    if (error?.code === 'PGRST205') {
      console.log('[Attendance] Table not exists, returning default stats');
    } else {
      console.warn('Fallback fetch attendance stats error:', error);
    }
    return {
      total_days: 0,
      current_streak: 0,
      max_streak: 0,
      total_points_earned: 0,
      this_month_days: 0,
    };
  }

  // 총 출석일
  const totalDays = allAttendance.length;

  // 최대 연속 출석일
  const maxStreak = allAttendance.reduce(
    (max, item) => Math.max(max, item.streak_days),
    0
  );

  // 총 적립 포인트
  const totalPointsEarned = allAttendance.reduce(
    (sum, item) => sum + item.base_points + item.bonus_points,
    0
  );

  // 이번 달 출석일
  const thisMonthDays = allAttendance.filter(
    (item) => item.check_date >= thisMonthStart
  ).length;

  // 현재 연속 출석일
  let currentStreak = 0;
  const todayAttendance = allAttendance.find((item) => item.check_date === today);
  const yesterdayAttendance = allAttendance.find(
    (item) => item.check_date === yesterday
  );

  if (todayAttendance) {
    currentStreak = todayAttendance.streak_days;
  } else if (yesterdayAttendance) {
    currentStreak = yesterdayAttendance.streak_days;
  }

  return {
    total_days: totalDays,
    current_streak: currentStreak,
    max_streak: maxStreak,
    total_points_earned: totalPointsEarned,
    this_month_days: thisMonthDays,
  };
}

/**
 * 오늘 출석 여부 확인 (Fallback 지원)
 */
export async function hasCheckedToday(userId: string): Promise<boolean> {
  try {
    // 먼저 RPC 시도
    const { data, error } = await supabase.rpc('has_checked_today', {
      p_user_id: userId,
    });

    if (!error) {
      return data || false;
    }

    // RPC 실패 시 Fallback
    console.log('[Attendance] has_checked_today RPC unavailable, using fallback');
    return await hasCheckedTodayFallback(userId);
  } catch (error) {
    console.warn('Failed to check today attendance:', error);
    try {
      return await hasCheckedTodayFallback(userId);
    } catch {
      return false;
    }
  }
}

/**
 * 오늘 출석 여부 확인 Fallback
 */
async function hasCheckedTodayFallback(userId: string): Promise<boolean> {
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', userId)
    .eq('check_date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (정상적인 경우)
    // PGRST205 = table not exists
    if (error.code === 'PGRST205') {
      console.log('[Attendance] Table not exists, returning false');
      return false;
    }
    console.warn('Fallback hasCheckedToday error:', error);
  }

  return !!data;
}

/**
 * 출석 기록 목록 조회 (페이지네이션)
 */
export async function fetchAttendanceHistory(
  userId: string,
  page: number = 1,
  limit: number = 30
): Promise<{ data: Attendance[]; hasMore: boolean }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit;

    const { data, error, count } = await supabase
      .from('attendance')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('check_date', { ascending: false })
      .range(from, to - 1);

    if (error) throw error;

    return {
      data: data || [],
      hasMore: (count || 0) > to,
    };
  } catch (error: any) {
    // 테이블이 존재하지 않는 경우 graceful하게 처리
    if (error?.code === 'PGRST205') {
      console.log('[Attendance] Table not exists, returning empty history');
      return { data: [], hasMore: false };
    }
    console.warn('Failed to fetch attendance history:', error);
    throw error;
  }
}

/**
 * 다음 마일스톤까지 남은 일수 계산
 */
export function getNextMilestone(currentStreak: number): {
  daysUntilNext: number;
  nextMilestone: number;
  nextBonus: number;
} | null {
  const milestones = [7, 14, 21, 30];
  const bonuses = [50, 100, 150, 300];

  for (let i = 0; i < milestones.length; i++) {
    if (currentStreak < milestones[i]) {
      return {
        daysUntilNext: milestones[i] - currentStreak,
        nextMilestone: milestones[i],
        nextBonus: bonuses[i],
      };
    }
  }

  // 30일 초과 시 다음 30일 마일스톤
  const nextThirty = Math.ceil((currentStreak + 1) / 30) * 30;
  return {
    daysUntilNext: nextThirty - currentStreak,
    nextMilestone: nextThirty,
    nextBonus: 300,
  };
}
