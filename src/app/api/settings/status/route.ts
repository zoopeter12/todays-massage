import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * System Status API
 * 점검 모드 및 회원가입 허용 상태 조회
 *
 * Edge Runtime 호환 (미들웨어에서 호출 가능)
 */

export const runtime = 'edge';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        maintenanceMode: false,
        allowRegistration: true,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 점검 모드 및 회원가입 허용 설정 조회
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['general.maintenance_mode', 'general.allow_registration']);

    if (error) {
      console.error('[Settings Status] Failed to fetch settings:', error);
      return NextResponse.json({
        maintenanceMode: false,
        allowRegistration: true,
      });
    }

    let maintenanceMode = false;
    let allowRegistration = true;

    for (const row of data || []) {
      if (row.key === 'general.maintenance_mode') {
        maintenanceMode = row.value === true;
      } else if (row.key === 'general.allow_registration') {
        allowRegistration = row.value !== false;
      }
    }

    return NextResponse.json({
      maintenanceMode,
      allowRegistration,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('[Settings Status] Unexpected error:', error);
    return NextResponse.json({
      maintenanceMode: false,
      allowRegistration: true,
    });
  }
}
