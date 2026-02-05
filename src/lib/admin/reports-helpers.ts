/**
 * Admin Reports Helper Functions
 * Utility functions for working with reports and inquiries
 */

import { supabase } from '@/lib/supabase/client';

/**
 * Get the display name for a report target
 * Fetches the actual name from the respective table based on target_type
 */
export async function getTargetName(targetType: string, targetId: string): Promise<string> {
  try {
    switch (targetType) {
      case 'shop': {
        const { data, error } = await supabase
          .from('shops')
          .select('name')
          .eq('id', targetId)
          .single();

        if (error || !data) return '알 수 없는 상점';
        return data.name;
      }

      case 'review': {
        const { data, error } = await supabase
          .from('reviews')
          .select('id')
          .eq('id', targetId)
          .single();

        if (error || !data) return '알 수 없는 리뷰';
        return `리뷰 #${targetId.slice(0, 8)}`;
      }

      case 'user': {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', targetId)
          .single();

        if (error || !data) return '알 수 없는 사용자';
        return data.nickname || '알 수 없는 사용자';
      }

      case 'chat': {
        // If you have a messages or chats table
        return `채팅 #${targetId.slice(0, 8)}`;
      }

      default:
        return '알 수 없음';
    }
  } catch (error) {
    console.error('Failed to fetch target name:', error);
    return '알 수 없음';
  }
}

/**
 * Get display name for report reason
 * Maps database reason codes to Korean labels
 */
export function getReasonLabel(reason: string): string {
  const reasonMap: Record<string, string> = {
    profanity: '비방/욕설',
    false_info: '허위 정보',
    spam: '스팸/광고',
    other: '기타',
  };
  return reasonMap[reason] || reason;
}

/**
 * Get display name for inquiry category
 * Maps database category codes to Korean labels
 */
export function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    general: '일반',
    reservation: '예약',
    payment: '결제',
    technical: '기술',
    complaint: '불만',
  };
  return categoryMap[category] || category;
}

/**
 * Batch fetch target names for multiple reports
 * More efficient than fetching one by one
 */
export async function batchGetTargetNames(
  reports: Array<{ target_type: string; target_id: string }>
): Promise<Map<string, string>> {
  const targetNames = new Map<string, string>();

  // Group by target type
  const shopIds: string[] = [];
  const reviewIds: string[] = [];
  const userIds: string[] = [];
  const chatIds: string[] = [];

  reports.forEach(report => {
    switch (report.target_type) {
      case 'shop':
        shopIds.push(report.target_id);
        break;
      case 'review':
        reviewIds.push(report.target_id);
        break;
      case 'user':
        userIds.push(report.target_id);
        break;
      case 'chat':
        chatIds.push(report.target_id);
        break;
    }
  });

  // Batch fetch shops
  if (shopIds.length > 0) {
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name')
      .in('id', shopIds);

    shops?.forEach(shop => {
      targetNames.set(`shop-${shop.id}`, shop.name);
    });
  }

  // Batch fetch users
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', userIds);

    users?.forEach(user => {
      targetNames.set(`user-${user.id}`, user.nickname || '알 수 없는 사용자');
    });
  }

  // Reviews - just use IDs
  reviewIds.forEach(id => {
    targetNames.set(`review-${id}`, `리뷰 #${id.slice(0, 8)}`);
  });

  // Chats - just use IDs
  chatIds.forEach(id => {
    targetNames.set(`chat-${id}`, `채팅 #${id.slice(0, 8)}`);
  });

  return targetNames;
}
