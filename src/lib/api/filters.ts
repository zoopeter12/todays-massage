import { supabase } from '@/lib/supabase/client';
import type { ShopFilters, PriceRange, ShopAmenities } from '@/types/filters';
import { PRICE_RANGES } from '@/types/filters';

/**
 * Extended Shop type for filter operations
 * Includes additional fields from DB that are used in filtering
 */
export interface FilterShop {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  amenities: ShopAmenities;
  tags: string[];
  base_price: number;
  is_open: boolean;
  popular_score?: number;
  distance?: number;
}

export async function fetchFilteredShops(
  filters: ShopFilters,
  userLat?: number,
  userLng?: number
): Promise<FilterShop[]> {
  let query = supabase.from('shops').select('*');

  // Category filter
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  // Price range filter
  if (filters.priceRange) {
    query = query
      .gte('base_price', filters.priceRange.min)
      .lte('base_price', filters.priceRange.max);
  }

  // Open now filter
  if (filters.isOpenNow) {
    query = query.eq('is_open', true);
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data: shops, error } = await query;

  if (error) {
    console.error('Error fetching filtered shops:', error);
    return [];
  }

  if (!shops) return [];

  // Client-side amenities filtering
  let filteredShops = shops as FilterShop[];

  if (filters.amenities) {
    filteredShops = filteredShops.filter((shop) => {
      return Object.entries(filters.amenities!).every(([key, value]) => {
        if (value === true) {
          return shop.amenities?.[key as keyof ShopAmenities] === true;
        }
        return true;
      });
    });
  }

  // Calculate distance if user location provided
  if (userLat && userLng) {
    filteredShops = filteredShops.map((shop) => ({
      ...shop,
      distance: calculateDistance(userLat, userLng, shop.latitude, shop.longitude),
    }));
  }

  // Sorting
  if (filters.sortBy) {
    filteredShops = sortShops(filteredShops, filters.sortBy);
  }

  return filteredShops;
}

export async function fetchShopsByPriceRange(range: PriceRange): Promise<FilterShop[]> {
  const { min, max } = PRICE_RANGES[range];

  const { data: shops, error } = await supabase
    .from('shops')
    .select('*')
    .gte('base_price', min)
    .lte('base_price', max)
    .order('rating', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching shops by price range:', error);
    return [];
  }

  return (shops as FilterShop[]) || [];
}

export async function fetchPopularTags(): Promise<string[]> {
  // For now, return predefined popular tags
  // In production, this could query a tags table or aggregate from shops
  return [
    '커플 추천',
    '주차 가능',
    '24시',
    '여성 전용',
    '럭셔리',
    '가성비',
    '신규 오픈',
    '베스트 후기',
  ];
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function sortShops(shops: FilterShop[], sortBy: string): FilterShop[] {
  const sorted = [...shops];

  switch (sortBy) {
    case 'distance':
      return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'popular':
      return sorted.sort((a, b) => (b.popular_score || 0) - (a.popular_score || 0));
    case 'price_low':
      return sorted.sort((a, b) => a.base_price - b.base_price);
    case 'price_high':
      return sorted.sort((a, b) => b.base_price - a.base_price);
    default:
      return sorted;
  }
}
