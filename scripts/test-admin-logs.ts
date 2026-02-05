/**
 * Test script to insert sample admin logs
 * Run with: npx tsx scripts/test-admin-logs.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertSampleLogs() {
  console.log('🔄 Inserting sample admin logs...');

  const sampleLogs = [
    {
      admin_id: null,
      admin_name: '시스템 관리자',
      action: 'user.suspend',
      target_type: 'user',
      target_id: 'user123',
      details: { reason: '정책 위반', violation_type: 'spam' },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: new Date().toISOString(),
    },
    {
      admin_id: null,
      admin_name: '김관리',
      action: 'shop.approve',
      target_type: 'shop',
      target_id: 'shop456',
      details: { review_notes: '서류 확인 완료', verified_at: new Date().toISOString() },
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      admin_id: null,
      admin_name: '박관리',
      action: 'settlement.process',
      target_type: 'settlement',
      target_id: 'stl789',
      details: { amount: 500000, bank: '국민은행', account: '***1234' },
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      admin_id: null,
      admin_name: '시스템 관리자',
      action: 'config.update',
      target_type: 'config',
      target_id: 'commission_rate',
      details: { old_value: 10, new_value: 12, reason: '정책 변경' },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      admin_id: null,
      admin_name: '이관리',
      action: 'shop.reject',
      target_type: 'shop',
      target_id: 'shop999',
      details: { reason: '서류 미비', missing_documents: ['사업자등록증', '통장사본'] },
      ip_address: '192.168.1.103',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      admin_id: null,
      admin_name: '최관리',
      action: 'report.resolve',
      target_type: 'report',
      target_id: 'rpt555',
      details: { resolution: 'warning_issued', action_taken: '경고 처리' },
      ip_address: '192.168.1.104',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      admin_id: null,
      admin_name: '시스템 관리자',
      action: 'content.publish',
      target_type: 'notice',
      target_id: 'ntc777',
      details: { title: '시스템 점검 안내', category: 'maintenance' },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      admin_id: null,
      admin_name: '정관리',
      action: 'user.role_change',
      target_type: 'user',
      target_id: 'user888',
      details: { old_role: 'customer', new_role: 'partner', reason: '파트너 전환 승인' },
      ip_address: '192.168.1.105',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const { data, error } = await supabase
    .from('admin_logs')
    .insert(sampleLogs)
    .select();

  if (error) {
    console.error('❌ Error inserting logs:', error);
    return;
  }

  console.log(`✅ Successfully inserted ${data?.length || 0} admin logs`);
  console.log('📊 Sample log IDs:', data?.map(log => log.id).join(', '));
}

async function viewLogs() {
  console.log('\n📋 Viewing recent logs...\n');

  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching logs:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No logs found');
    return;
  }

  data.forEach(log => {
    console.log(`[${new Date(log.created_at).toLocaleString('ko-KR')}]`);
    console.log(`  👤 ${log.admin_name}`);
    console.log(`  🎯 ${log.action} → ${log.target_type}:${log.target_id}`);
    console.log(`  📍 ${log.ip_address}`);
    console.log(`  📝 ${JSON.stringify(log.details)}`);
    console.log('---');
  });
}

async function main() {
  try {
    await insertSampleLogs();
    await viewLogs();
    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

main();
