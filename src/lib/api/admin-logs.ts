import { getSupabase } from '@/lib/supabase/client';

export interface AdminLog {
  id: string;
  admin_id: string | null;
  admin_name: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CreateLogInput {
  adminId: string;
  adminName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}

export interface GetLogsOptions {
  limit?: number;
  offset?: number;
  action?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetLogsResponse {
  logs: AdminLog[];
  total: number;
  error?: string;
}

/**
 * Create a new admin log entry
 * @param input - Log creation parameters
 * @returns Success status and optional error message
 */
export async function createAdminLog(input: CreateLogInput): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase.from('admin_logs').insert({
      admin_id: input.adminId,
      admin_name: input.adminName,
      action: input.action,
      target_type: input.targetType || null,
      target_id: input.targetId || null,
      details: input.details || {},
    });

    if (error) {
      console.error('Failed to create admin log:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception creating admin log:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Retrieve admin logs with optional filtering and pagination
 * @param options - Query options (limit, offset, filters)
 * @returns Logs array, total count, and optional error
 */
export async function getAdminLogs(options?: GetLogsOptions): Promise<GetLogsResponse> {
  const supabase = getSupabase();
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  try {
    let query = supabase
      .from('admin_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (options?.action) {
      query = query.eq('action', options.action);
    }
    if (options?.adminId) {
      query = query.eq('admin_id', options.adminId);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch admin logs:', error);
      return { logs: [], total: 0, error: error.message };
    }

    return {
      logs: data || [],
      total: count || 0
    };
  } catch (err) {
    console.error('Exception fetching admin logs:', err);
    return {
      logs: [],
      total: 0,
      error: String(err)
    };
  }
}

/**
 * Get statistics about admin actions
 * @param options - Time range filters
 * @returns Action counts by type
 */
export async function getAdminLogStats(options?: { startDate?: string; endDate?: string }) {
  const supabase = getSupabase();

  try {
    let query = supabase
      .from('admin_logs')
      .select('action');

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch log stats:', error);
      return { stats: {}, error: error.message };
    }

    // Count actions
    const stats: Record<string, number> = {};
    data?.forEach((log: { action: string }) => {
      stats[log.action] = (stats[log.action] || 0) + 1;
    });

    return { stats, error: undefined };
  } catch (err) {
    console.error('Exception fetching log stats:', err);
    return { stats: {}, error: String(err) };
  }
}
