/**
 * Favorites/Like System Type Definitions
 */

import { Shop } from './supabase';

export interface Favorite {
  id: string;
  user_id: string;
  shop_id: string;
  created_at: string;
}

export interface FavoriteInsert {
  id?: string;
  user_id: string;
  shop_id: string;
}

export interface FavoriteWithShop extends Favorite {
  shop: Shop;
}
