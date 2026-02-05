export interface Settlement {
  id: string;
  shop_id: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  platform_fee: number; // 10%
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paid_at: string | null;
  created_at: string;
}

export interface SalesStats {
  daily: { date: string; amount: number; count: number }[];
  weekly: { week: string; amount: number; count: number }[];
  monthly: { month: string; amount: number; count: number }[];
  byCourse: { name: string; amount: number; count: number }[];
  byHour: { hour: number; count: number }[];
}

export interface CustomerNote {
  id: string;
  shop_id: string;
  customer_phone: string;
  customer_name: string | null;
  visit_count: number;
  total_spent: number;
  last_visit: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
