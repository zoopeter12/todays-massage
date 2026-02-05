/**
 * Favorites/Like API Functions
 * Handles user favorite shops operations with Supabase
 */

import { supabase } from '@/lib/supabase/client';
import type { Favorite, FavoriteInsert, FavoriteWithShop } from '@/types/favorites';

/**
 * Toggle favorite status for a shop
 * If favorite exists, remove it. If not, add it.
 */
export async function toggleFavorite(shopId: string): Promise<{ isFavorite: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if favorite exists
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('shop_id', shopId)
    .single();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return { isFavorite: false };
  } else {
    // Add favorite
    const favoriteData: FavoriteInsert = {
      user_id: user.id,
      shop_id: shopId,
    };

    const { error } = await supabase
      .from('favorites')
      .insert(favoriteData);

    if (error) throw error;
    return { isFavorite: true };
  }
}

/**
 * Check if a shop is favorited by current user
 */
export async function checkIsFavorite(shopId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('shop_id', shopId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

/**
 * Fetch all favorites for a user with shop details
 */
export async function fetchFavorites(userId: string): Promise<FavoriteWithShop[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      id,
      user_id,
      shop_id,
      created_at,
      shop:shops (
        id,
        name,
        lat,
        lng,
        address,
        tel,
        category,
        images,
        view_count,
        is_open,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []) as unknown as FavoriteWithShop[];
}

/**
 * Get favorite count for a specific shop
 */
export async function getFavoriteCount(shopId: string): Promise<number> {
  const { count, error } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId);

  if (error) throw error;

  return count || 0;
}

/**
 * Get multiple favorite statuses at once (for lists)
 */
export async function checkMultipleFavorites(shopIds: string[]): Promise<Record<string, boolean>> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || shopIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('shop_id')
    .eq('user_id', user.id)
    .in('shop_id', shopIds);

  if (error) throw error;

  const favoriteMap: Record<string, boolean> = {};
  shopIds.forEach(id => {
    favoriteMap[id] = false;
  });

  data?.forEach(fav => {
    favoriteMap[fav.shop_id] = true;
  });

  return favoriteMap;
}
