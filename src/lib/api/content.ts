/**
 * Content Management API
 * Handles notices, FAQs, and banners
 */

import { supabase } from '@/lib/supabase/client';
import type { Notice, FAQ, Banner } from '@/types/admin';

// ==========================================
// Notices API
// ==========================================

export async function getNotices(options?: {
  publishedOnly?: boolean;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (options?.publishedOnly) {
      query = query.eq('is_published', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Notice[];
  } catch (error) {
    console.error('Failed to fetch notices:', error);
    throw error;
  }
}

export async function getNotice(id: string) {
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase.rpc('increment_notice_views', { notice_id: id });

    return data as Notice;
  } catch (error) {
    console.error('Failed to fetch notice:', error);
    throw error;
  }
}

export async function createNotice(notice: Omit<Notice, 'id' | 'created_at' | 'updated_at' | 'view_count'>) {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('notices')
      .insert({
        ...notice,
        created_by: userData.user?.id,
        published_at: notice.is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Notice;
  } catch (error) {
    console.error('Failed to create notice:', error);
    throw error;
  }
}

export async function updateNotice(id: string, updates: Partial<Notice>) {
  try {
    // If publishing status changes to true, set published_at
    const payload: any = { ...updates };
    if (updates.is_published && !updates.published_at) {
      payload.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('notices')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Notice;
  } catch (error) {
    console.error('Failed to update notice:', error);
    throw error;
  }
}

export async function deleteNotice(id: string) {
  try {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete notice:', error);
    throw error;
  }
}

// ==========================================
// FAQs API
// ==========================================

export async function getFaqs(options?: {
  publishedOnly?: boolean;
  category?: FAQ['category'];
}) {
  try {
    let query = supabase
      .from('faqs')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });

    if (options?.publishedOnly) {
      query = query.eq('is_published', true);
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as FAQ[];
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    throw error;
  }
}

export async function getFaq(id: string) {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as FAQ;
  } catch (error) {
    console.error('Failed to fetch FAQ:', error);
    throw error;
  }
}

export async function createFaq(faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // Get max order and increment
    const { data: maxOrderData } = await supabase
      .from('faqs')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderData?.order ?? 0) + 1;

    const { data, error } = await supabase
      .from('faqs')
      .insert({
        ...faq,
        order: faq.order ?? nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FAQ;
  } catch (error) {
    console.error('Failed to create FAQ:', error);
    throw error;
  }
}

export async function updateFaq(id: string, updates: Partial<FAQ>) {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FAQ;
  } catch (error) {
    console.error('Failed to update FAQ:', error);
    throw error;
  }
}

export async function deleteFaq(id: string) {
  try {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete FAQ:', error);
    throw error;
  }
}

// ==========================================
// Banners API
// ==========================================

export async function getBanners(options?: {
  activeOnly?: boolean;
  position?: Banner['position'];
}) {
  try {
    let query = supabase
      .from('banners')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });

    if (options?.activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      query = query
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today);
    }

    if (options?.position) {
      query = query.eq('position', options.position);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Banner[];
  } catch (error) {
    console.error('Failed to fetch banners:', error);
    throw error;
  }
}

export async function getBanner(id: string) {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Banner;
  } catch (error) {
    console.error('Failed to fetch banner:', error);
    throw error;
  }
}

export async function createBanner(banner: Omit<Banner, 'id' | 'created_at' | 'updated_at' | 'click_count'>) {
  try {
    // Get max order and increment
    const { data: maxOrderData } = await supabase
      .from('banners')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderData?.order ?? 0) + 1;

    const { data, error } = await supabase
      .from('banners')
      .insert({
        ...banner,
        order: banner.order ?? nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Banner;
  } catch (error) {
    console.error('Failed to create banner:', error);
    throw error;
  }
}

export async function updateBanner(id: string, updates: Partial<Banner>) {
  try {
    const { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Banner;
  } catch (error) {
    console.error('Failed to update banner:', error);
    throw error;
  }
}

export async function deleteBanner(id: string) {
  try {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete banner:', error);
    throw error;
  }
}

export async function incrementBannerClick(id: string) {
  try {
    await supabase.rpc('increment_banner_clicks', { banner_id: id });
  } catch (error) {
    console.error('Failed to increment banner click:', error);
    throw error;
  }
}

// ==========================================
// Reorder Functions
// ==========================================

export async function reorderFaqs(faqIds: string[]) {
  try {
    // Update order for each FAQ
    const updates = faqIds.map((id, index) => ({
      id,
      order: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('faqs')
        .update({ order: update.order })
        .eq('id', update.id);
    }
  } catch (error) {
    console.error('Failed to reorder FAQs:', error);
    throw error;
  }
}

export async function reorderBanners(bannerIds: string[]) {
  try {
    // Update order for each banner
    const updates = bannerIds.map((id, index) => ({
      id,
      order: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('banners')
        .update({ order: update.order })
        .eq('id', update.id);
    }
  } catch (error) {
    console.error('Failed to reorder banners:', error);
    throw error;
  }
}
