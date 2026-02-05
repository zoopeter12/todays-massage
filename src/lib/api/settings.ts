import { supabase } from '@/lib/supabase/client';

/**
 * System Settings API
 * 관리자 시스템 설정 CRUD 함수
 */

// =========================
// Types
// =========================

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
}

export interface PaymentSettings {
  platformFeeRate: number;
  minWithdrawal: number;
  settlementDay: number;
  paymentMethods: {
    card: boolean;
    kakaopay: boolean;
    naverpay: boolean;
    toss: boolean;
  };
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  reservationReminder: boolean;
  reminderHours: number;
  marketingEnabled: boolean;
}

export interface SystemSettings {
  general: GeneralSettings;
  payment: PaymentSettings;
  notification: NotificationSettings;
}

interface SystemSettingRow {
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// =========================
// Default Values
// =========================

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: '마사지 예약 플랫폼',
  siteDescription: '편리한 마사지 예약 서비스',
  supportEmail: 'support@massage-platform.com',
  supportPhone: '1588-0000',
  maintenanceMode: false,
  allowRegistration: true,
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  platformFeeRate: 10,
  minWithdrawal: 10000,
  settlementDay: 15,
  paymentMethods: {
    card: true,
    kakaopay: true,
    naverpay: true,
    toss: true,
  },
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  reservationReminder: true,
  reminderHours: 24,
  marketingEnabled: false,
};

// =========================
// Helper Functions
// =========================

/**
 * Parse JSONB value from database
 */
function parseValue<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value as T;
}

/**
 * Map database rows to settings objects
 */
function mapRowsToSettings(rows: SystemSettingRow[]): SystemSettings {
  const settings: SystemSettings = {
    general: { ...DEFAULT_GENERAL_SETTINGS },
    payment: { ...DEFAULT_PAYMENT_SETTINGS },
    notification: { ...DEFAULT_NOTIFICATION_SETTINGS },
  };

  for (const row of rows) {
    const [category, field] = row.key.split('.');

    switch (category) {
      case 'general':
        switch (field) {
          case 'site_name':
            settings.general.siteName = parseValue(row.value, DEFAULT_GENERAL_SETTINGS.siteName);
            break;
          case 'site_description':
            settings.general.siteDescription = parseValue(row.value, DEFAULT_GENERAL_SETTINGS.siteDescription);
            break;
          case 'support_email':
            settings.general.supportEmail = parseValue(row.value, DEFAULT_GENERAL_SETTINGS.supportEmail);
            break;
          case 'support_phone':
            settings.general.supportPhone = parseValue(row.value, DEFAULT_GENERAL_SETTINGS.supportPhone);
            break;
          case 'maintenance_mode':
            settings.general.maintenanceMode = parseValue(row.value, DEFAULT_GENERAL_SETTINGS.maintenanceMode);
            break;
          case 'allow_registration':
            settings.general.allowRegistration = parseValue(row.value, DEFAULT_GENERAL_SETTINGS.allowRegistration);
            break;
        }
        break;
      case 'payment':
        switch (field) {
          case 'platform_fee_rate':
            settings.payment.platformFeeRate = parseValue(row.value, DEFAULT_PAYMENT_SETTINGS.platformFeeRate);
            break;
          case 'min_withdrawal':
            settings.payment.minWithdrawal = parseValue(row.value, DEFAULT_PAYMENT_SETTINGS.minWithdrawal);
            break;
          case 'settlement_day':
            settings.payment.settlementDay = parseValue(row.value, DEFAULT_PAYMENT_SETTINGS.settlementDay);
            break;
          case 'methods':
            settings.payment.paymentMethods = parseValue(row.value, DEFAULT_PAYMENT_SETTINGS.paymentMethods);
            break;
        }
        break;
      case 'notification':
        switch (field) {
          case 'email_enabled':
            settings.notification.emailEnabled = parseValue(row.value, DEFAULT_NOTIFICATION_SETTINGS.emailEnabled);
            break;
          case 'sms_enabled':
            settings.notification.smsEnabled = parseValue(row.value, DEFAULT_NOTIFICATION_SETTINGS.smsEnabled);
            break;
          case 'push_enabled':
            settings.notification.pushEnabled = parseValue(row.value, DEFAULT_NOTIFICATION_SETTINGS.pushEnabled);
            break;
          case 'reservation_reminder':
            settings.notification.reservationReminder = parseValue(row.value, DEFAULT_NOTIFICATION_SETTINGS.reservationReminder);
            break;
          case 'reminder_hours':
            settings.notification.reminderHours = parseValue(row.value, DEFAULT_NOTIFICATION_SETTINGS.reminderHours);
            break;
          case 'marketing_enabled':
            settings.notification.marketingEnabled = parseValue(row.value, DEFAULT_NOTIFICATION_SETTINGS.marketingEnabled);
            break;
        }
        break;
    }
  }

  return settings;
}

// =========================
// API Functions
// =========================

/**
 * Fetch all system settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*');

  if (error) {
    console.error('Failed to fetch system settings:', error);
    // Return defaults on error
    return {
      general: DEFAULT_GENERAL_SETTINGS,
      payment: DEFAULT_PAYMENT_SETTINGS,
      notification: DEFAULT_NOTIFICATION_SETTINGS,
    };
  }

  return mapRowsToSettings(data || []);
}

/**
 * Fetch settings by category
 */
export async function getSettingsByCategory(category: 'general' | 'payment' | 'notification'): Promise<GeneralSettings | PaymentSettings | NotificationSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('category', category);

  if (error) {
    console.error(`Failed to fetch ${category} settings:`, error);
    switch (category) {
      case 'general':
        return DEFAULT_GENERAL_SETTINGS;
      case 'payment':
        return DEFAULT_PAYMENT_SETTINGS;
      case 'notification':
        return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  const settings = mapRowsToSettings(data || []);
  return settings[category];
}

/**
 * Update general settings
 */
export async function updateGeneralSettings(
  settings: Partial<GeneralSettings>,
  userId?: string
): Promise<void> {
  const updates: { key: string; value: unknown; category: string; updated_by?: string }[] = [];

  if (settings.siteName !== undefined) {
    updates.push({ key: 'general.site_name', value: settings.siteName, category: 'general', updated_by: userId });
  }
  if (settings.siteDescription !== undefined) {
    updates.push({ key: 'general.site_description', value: settings.siteDescription, category: 'general', updated_by: userId });
  }
  if (settings.supportEmail !== undefined) {
    updates.push({ key: 'general.support_email', value: settings.supportEmail, category: 'general', updated_by: userId });
  }
  if (settings.supportPhone !== undefined) {
    updates.push({ key: 'general.support_phone', value: settings.supportPhone, category: 'general', updated_by: userId });
  }
  if (settings.maintenanceMode !== undefined) {
    updates.push({ key: 'general.maintenance_mode', value: settings.maintenanceMode, category: 'general', updated_by: userId });
  }
  if (settings.allowRegistration !== undefined) {
    updates.push({ key: 'general.allow_registration', value: settings.allowRegistration, category: 'general', updated_by: userId });
  }

  for (const update of updates) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: update.key,
        value: update.value,
        category: update.category,
        updated_by: update.updated_by,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.error(`Failed to update setting ${update.key}:`, error);
      throw new Error(`설정 저장에 실패했습니다: ${update.key}`);
    }
  }
}

/**
 * Update payment settings
 */
export async function updatePaymentSettings(
  settings: Partial<PaymentSettings>,
  userId?: string
): Promise<void> {
  const updates: { key: string; value: unknown; category: string; updated_by?: string }[] = [];

  if (settings.platformFeeRate !== undefined) {
    updates.push({ key: 'payment.platform_fee_rate', value: settings.platformFeeRate, category: 'payment', updated_by: userId });
  }
  if (settings.minWithdrawal !== undefined) {
    updates.push({ key: 'payment.min_withdrawal', value: settings.minWithdrawal, category: 'payment', updated_by: userId });
  }
  if (settings.settlementDay !== undefined) {
    updates.push({ key: 'payment.settlement_day', value: settings.settlementDay, category: 'payment', updated_by: userId });
  }
  if (settings.paymentMethods !== undefined) {
    updates.push({ key: 'payment.methods', value: settings.paymentMethods, category: 'payment', updated_by: userId });
  }

  for (const update of updates) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: update.key,
        value: update.value,
        category: update.category,
        updated_by: update.updated_by,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.error(`Failed to update setting ${update.key}:`, error);
      throw new Error(`설정 저장에 실패했습니다: ${update.key}`);
    }
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>,
  userId?: string
): Promise<void> {
  const updates: { key: string; value: unknown; category: string; updated_by?: string }[] = [];

  if (settings.emailEnabled !== undefined) {
    updates.push({ key: 'notification.email_enabled', value: settings.emailEnabled, category: 'notification', updated_by: userId });
  }
  if (settings.smsEnabled !== undefined) {
    updates.push({ key: 'notification.sms_enabled', value: settings.smsEnabled, category: 'notification', updated_by: userId });
  }
  if (settings.pushEnabled !== undefined) {
    updates.push({ key: 'notification.push_enabled', value: settings.pushEnabled, category: 'notification', updated_by: userId });
  }
  if (settings.reservationReminder !== undefined) {
    updates.push({ key: 'notification.reservation_reminder', value: settings.reservationReminder, category: 'notification', updated_by: userId });
  }
  if (settings.reminderHours !== undefined) {
    updates.push({ key: 'notification.reminder_hours', value: settings.reminderHours, category: 'notification', updated_by: userId });
  }
  if (settings.marketingEnabled !== undefined) {
    updates.push({ key: 'notification.marketing_enabled', value: settings.marketingEnabled, category: 'notification', updated_by: userId });
  }

  for (const update of updates) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: update.key,
        value: update.value,
        category: update.category,
        updated_by: update.updated_by,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.error(`Failed to update setting ${update.key}:`, error);
      throw new Error(`설정 저장에 실패했습니다: ${update.key}`);
    }
  }
}

/**
 * Get a single setting value by key
 */
export async function getSettingValue<T>(key: string, defaultValue: T): Promise<T> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) {
    return defaultValue;
  }

  return parseValue(data.value, defaultValue);
}

/**
 * Check if maintenance mode is enabled
 */
export async function isMaintenanceMode(): Promise<boolean> {
  return getSettingValue('general.maintenance_mode', false);
}

/**
 * Check if registration is allowed
 */
export async function isRegistrationAllowed(): Promise<boolean> {
  return getSettingValue('general.allow_registration', true);
}

/**
 * Get platform fee rate
 */
export async function getPlatformFeeRate(): Promise<number> {
  return getSettingValue('payment.platform_fee_rate', 10);
}
