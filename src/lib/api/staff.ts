import { supabase } from '@/lib/supabase/client';
import { Staff, StaffSchedule, StaffReview, StaffWithStats } from '@/types/staff';

export interface CreateStaffData {
  shop_id: string;
  name: string;
  photo?: string | null;
  specialties: string[];
}

export interface UpdateStaffData {
  name?: string;
  photo?: string | null;
  specialties?: string[];
  is_active?: boolean;
}

export async function fetchStaff(shopId: string): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff:', error);
    throw new Error('관리사 목록을 불러오는데 실패했습니다.');
  }

  return data || [];
}

export async function createStaff(staffData: CreateStaffData): Promise<Staff> {
  const { data, error } = await supabase
    .from('staff')
    .insert({
      ...staffData,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating staff:', error);
    throw new Error('관리사 등록에 실패했습니다.');
  }

  return data;
}

export async function updateStaff(id: string, staffData: UpdateStaffData): Promise<Staff> {
  const { data, error } = await supabase
    .from('staff')
    .update(staffData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating staff:', error);
    throw new Error('관리사 정보 수정에 실패했습니다.');
  }

  return data;
}

export async function deleteStaff(id: string): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting staff:', error);
    throw new Error('관리사 삭제에 실패했습니다.');
  }
}

export async function toggleStaffActive(id: string, isActive: boolean): Promise<Staff> {
  return updateStaff(id, { is_active: isActive });
}

export async function fetchActiveStaff(shopId: string): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active staff:', error);
    throw new Error('활성 관리사 목록을 불러오는데 실패했습니다.');
  }

  return data || [];
}

// Staff Schedule APIs
export interface CreateScheduleData {
  staff_id: string;
  day_off: string[];
  work_start: string;
  work_end: string;
  temp_off_dates: string[];
}

export interface UpdateScheduleData {
  day_off?: string[];
  work_start?: string;
  work_end?: string;
  temp_off_dates?: string[];
}

export async function fetchStaffSchedule(staffId: string): Promise<StaffSchedule | null> {
  const { data, error } = await supabase
    .from('staff_schedules')
    .select('*')
    .eq('staff_id', staffId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - schedule doesn't exist yet
      return null;
    }
    console.error('Error fetching staff schedule:', error);
    throw new Error('관리사 일정을 불러오는데 실패했습니다.');
  }

  return data;
}

export async function upsertStaffSchedule(scheduleData: CreateScheduleData): Promise<StaffSchedule> {
  const { data, error } = await supabase
    .from('staff_schedules')
    .upsert(scheduleData, { onConflict: 'staff_id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting staff schedule:', error);
    throw new Error('관리사 일정 저장에 실패했습니다.');
  }

  return data;
}

// Staff Reviews APIs
export async function fetchStaffReviews(staffId: string): Promise<StaffReview[]> {
  const { data, error } = await supabase
    .from('staff_reviews')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff reviews:', error);
    throw new Error('관리사 리뷰를 불러오는데 실패했습니다.');
  }

  return data || [];
}

export async function fetchStaffStats(staffId: string): Promise<{ average_rating: number; review_count: number }> {
  const { data, error } = await supabase
    .from('staff_reviews')
    .select('rating')
    .eq('staff_id', staffId);

  if (error) {
    console.error('Error fetching staff stats:', error);
    return { average_rating: 0, review_count: 0 };
  }

  if (!data || data.length === 0) {
    return { average_rating: 0, review_count: 0 };
  }

  const total = data.reduce((sum, review) => sum + review.rating, 0);
  return {
    average_rating: total / data.length,
    review_count: data.length,
  };
}

export async function fetchStaffWithStats(shopId: string): Promise<StaffWithStats[]> {
  const staffList = await fetchStaff(shopId);

  const staffWithStats = await Promise.all(
    staffList.map(async (staff) => {
      const [schedule, stats] = await Promise.all([
        fetchStaffSchedule(staff.id).catch(() => null),
        fetchStaffStats(staff.id),
      ]);

      return {
        ...staff,
        schedule: schedule || undefined,
        average_rating: stats.average_rating,
        review_count: stats.review_count,
      };
    })
  );

  return staffWithStats;
}
