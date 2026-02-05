import { supabase } from '@/lib/supabase/client';
import type { Settlement, SalesStats, CustomerNote } from '@/types/settlements';

export async function fetchSettlements(
  shopId: string,
  page: number = 1,
  limit: number = 10,
  dateRange?: { start: string; end: string }
): Promise<{
  settlements: Settlement[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('settlements')
    .select('*', { count: 'exact' })
    .eq('shop_id', shopId);

  // Apply date range filter if provided
  if (dateRange?.start) {
    query = query.gte('period_start', dateRange.start);
  }
  if (dateRange?.end) {
    query = query.lte('period_end', dateRange.end);
  }

  const { data, error, count } = await query
    .order('period_start', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    settlements: data as Settlement[],
    total: count || 0,
    page,
    pageSize: limit,
  };
}

export async function fetchSettlementDetail(id: string) {
  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      bookings:booking(
        id,
        customer_name,
        customer_phone,
        start_time,
        total_price,
        course:course(name)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSalesStats(
  shopId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<SalesStats> {
  // Get bookings for the last 30 days for daily, 12 weeks for weekly, 12 months for monthly
  const now = new Date();
  const startDate = new Date();

  if (period === 'daily') {
    startDate.setDate(now.getDate() - 30);
  } else if (period === 'weekly') {
    startDate.setDate(now.getDate() - 84);
  } else {
    startDate.setMonth(now.getMonth() - 12);
  }

  const { data: bookings, error } = await supabase
    .from('booking')
    .select('start_time, total_price, status')
    .eq('shop_id', shopId)
    .eq('status', 'confirmed')
    .gte('start_time', startDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) throw error;

  // Process data based on period
  const daily: { date: string; amount: number; count: number }[] = [];
  const weekly: { week: string; amount: number; count: number }[] = [];
  const monthly: { month: string; amount: number; count: number }[] = [];

  if (period === 'daily') {
    const dailyMap = new Map<string, { amount: number; count: number }>();

    bookings?.forEach((booking) => {
      const date = new Date(booking.start_time).toISOString().split('T')[0];
      const current = dailyMap.get(date) || { amount: 0, count: 0 };
      dailyMap.set(date, {
        amount: current.amount + booking.total_price,
        count: current.count + 1,
      });
    });

    dailyMap.forEach((value, date) => {
      daily.push({ date, ...value });
    });
  } else if (period === 'weekly') {
    const weeklyMap = new Map<string, { amount: number; count: number }>();

    bookings?.forEach((booking) => {
      const date = new Date(booking.start_time);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const current = weeklyMap.get(weekKey) || { amount: 0, count: 0 };
      weeklyMap.set(weekKey, {
        amount: current.amount + booking.total_price,
        count: current.count + 1,
      });
    });

    weeklyMap.forEach((value, week) => {
      weekly.push({ week, ...value });
    });
  } else {
    const monthlyMap = new Map<string, { amount: number; count: number }>();

    bookings?.forEach((booking) => {
      const date = new Date(booking.start_time);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const current = monthlyMap.get(monthKey) || { amount: 0, count: 0 };
      monthlyMap.set(monthKey, {
        amount: current.amount + booking.total_price,
        count: current.count + 1,
      });
    });

    monthlyMap.forEach((value, month) => {
      monthly.push({ month, ...value });
    });
  }

  return {
    daily,
    weekly,
    monthly,
    byCourse: [],
    byHour: [],
  };
}

export async function fetchCourseStats(shopId: string) {
  const { data, error } = await supabase
    .from('booking')
    .select(`
      total_price,
      course:course(name)
    `)
    .eq('shop_id', shopId)
    .eq('status', 'confirmed')
    .gte('start_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  const courseMap = new Map<string, { amount: number; count: number }>();

  data?.forEach((booking: any) => {
    const courseName = booking.course?.name || '기타';
    const current = courseMap.get(courseName) || { amount: 0, count: 0 };
    courseMap.set(courseName, {
      amount: current.amount + booking.total_price,
      count: current.count + 1,
    });
  });

  return Array.from(courseMap.entries()).map(([name, stats]) => ({
    name,
    amount: stats.amount,
    count: stats.count,
  }));
}

export async function fetchHourlyStats(shopId: string) {
  const { data, error } = await supabase
    .from('booking')
    .select('start_time')
    .eq('shop_id', shopId)
    .eq('status', 'confirmed')
    .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  const hourMap = new Map<number, number>();

  for (let i = 0; i < 24; i++) {
    hourMap.set(i, 0);
  }

  data?.forEach((booking) => {
    const hour = new Date(booking.start_time).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  return Array.from(hourMap.entries()).map(([hour, count]) => ({
    hour,
    count,
  }));
}

export async function fetchCustomers(shopId: string) {
  const { data, error } = await supabase
    .from('customer_notes')
    .select('*')
    .eq('shop_id', shopId)
    .order('last_visit', { ascending: false });

  if (error) throw error;
  return data as CustomerNote[];
}

export async function updateCustomerNote(
  id: string,
  data: { notes?: string; customer_name?: string }
) {
  const { error } = await supabase
    .from('customer_notes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function addCustomerTag(id: string, tag: string) {
  const { data: current, error: fetchError } = await supabase
    .from('customer_notes')
    .select('tags')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const tags = current.tags || [];
  if (!tags.includes(tag)) {
    const { error } = await supabase
      .from('customer_notes')
      .update({ tags: [...tags, tag], updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}

export async function removeCustomerTag(id: string, tag: string) {
  const { data: current, error: fetchError } = await supabase
    .from('customer_notes')
    .select('tags')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const tags = current.tags || [];
  const { error } = await supabase
    .from('customer_notes')
    .update({
      tags: tags.filter((t: string) => t !== tag),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// Admin Settlement Functions
// ============================================================

export interface AdminSettlementData extends Settlement {
  shop_name?: string;
  bank_name?: string;
  bank_account?: string;
  account_holder?: string;
}

export interface SettlementStats {
  totalSales: number;
  totalFee: number;
  pendingAmount: number;
  completedAmount: number;
}

/**
 * Fetch all settlements (Admin only)
 * @param statusFilter - Filter by settlement status
 */
export async function fetchAllSettlements(
  statusFilter: 'all' | 'pending' | 'completed' = 'all'
): Promise<{ settlements: AdminSettlementData[]; stats: SettlementStats }> {
  try {
    let query = supabase
      .from('settlements')
      .select(
        `
        *,
        shops (
          id,
          name
        )
      `
      )
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: settlementsData, error } = await query;

    if (error) throw error;

    const settlements: AdminSettlementData[] = (settlementsData ?? []).map((s: any) => ({
      id: s.id,
      shop_id: s.shop_id,
      shop_name: s.shops?.name ?? '알 수 없음',
      period_start: s.period_start,
      period_end: s.period_end,
      total_sales: s.total_sales,
      platform_fee: s.platform_fee,
      net_amount: s.net_amount,
      status: s.status,
      paid_at: s.paid_at,
      created_at: s.created_at,
      // Mock bank info (in real system, this would come from shop's bank details table)
      bank_name: '신한은행',
      bank_account: '110-***-******',
      account_holder: '홍**',
    }));

    const stats = calculateStats(settlements);

    return { settlements, stats };
  } catch (error) {
    console.error('Failed to fetch settlements:', error);
    throw error;
  }
}

/**
 * Generate settlement for a shop using database function
 * @param shopId - Shop UUID
 * @param periodStart - Settlement period start (YYYY-MM-DD)
 * @param periodEnd - Settlement period end (YYYY-MM-DD)
 * @param platformFeeRate - Platform fee rate (default: 0.10 = 10%)
 */
export async function generateSettlement(
  shopId: string,
  periodStart: string,
  periodEnd: string,
  platformFeeRate: number = 0.10
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('generate_settlement', {
      p_shop_id: shopId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_platform_fee_rate: platformFeeRate,
    });

    if (error) throw error;

    return data as string;
  } catch (error) {
    console.error('Failed to generate settlement:', error);
    throw error;
  }
}

/**
 * Complete a settlement (pending → completed)
 * @param settlementId - Settlement UUID
 */
export async function completeSettlement(settlementId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('complete_settlement', {
      p_settlement_id: settlementId,
    });

    if (error) throw error;

    return data as boolean;
  } catch (error) {
    console.error('Failed to complete settlement:', error);
    throw error;
  }
}

/**
 * Generate settlements for all shops
 * @param periodStart - Settlement period start (YYYY-MM-DD)
 * @param periodEnd - Settlement period end (YYYY-MM-DD)
 */
export async function generateAllShopsSettlements(
  periodStart: string,
  periodEnd: string
): Promise<number> {
  try {
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id');

    if (shopsError) throw shopsError;

    if (!shops || shops.length === 0) {
      return 0;
    }

    const promises = shops.map((shop) =>
      generateSettlement(shop.id, periodStart, periodEnd)
    );

    await Promise.all(promises);

    return shops.length;
  } catch (error) {
    console.error('Failed to generate all settlements:', error);
    throw error;
  }
}

/**
 * Calculate settlement statistics
 */
function calculateStats(settlements: AdminSettlementData[]): SettlementStats {
  const stats: SettlementStats = {
    totalSales: 0,
    totalFee: 0,
    pendingAmount: 0,
    completedAmount: 0,
  };

  settlements.forEach((s) => {
    stats.totalSales += s.total_sales;
    stats.totalFee += s.platform_fee;

    if (s.status === 'pending') {
      stats.pendingAmount += s.net_amount;
    } else if (s.status === 'completed') {
      stats.completedAmount += s.net_amount;
    }
  });

  return stats;
}

/**
 * Get settlement by ID with shop details
 */
export async function getSettlementById(
  settlementId: string
): Promise<AdminSettlementData | null> {
  try {
    const { data, error } = await supabase
      .from('settlements')
      .select(
        `
        *,
        shops (
          id,
          name
        )
      `
      )
      .eq('id', settlementId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      shop_id: data.shop_id,
      shop_name: (data as any).shops?.name ?? '알 수 없음',
      period_start: data.period_start,
      period_end: data.period_end,
      total_sales: data.total_sales,
      platform_fee: data.platform_fee,
      net_amount: data.net_amount,
      status: data.status,
      paid_at: data.paid_at,
      created_at: data.created_at,
      bank_name: '신한은행',
      bank_account: '110-***-******',
      account_holder: '홍**',
    };
  } catch (error) {
    console.error('Failed to fetch settlement:', error);
    throw error;
  }
}
