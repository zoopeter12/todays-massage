import { supabase } from '@/lib/supabase/client';
import { Shop, ShopWithCourses } from '@/types/supabase';

/**
 * Shop with distance information for nearby queries
 */
export interface ShopWithDistance extends ShopWithCourses {
  distance: number; // distance in km
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetch shops within a radius (km) from a given coordinate
 * - First filters by bounding box for DB efficiency
 * - Then applies Haversine formula for accurate distance filtering
 * - Returns shops sorted by distance (nearest first)
 */
export async function fetchNearbyShops(
  lat: number,
  lng: number,
  radiusKm: number = 3
): Promise<ShopWithDistance[]> {
  // 1. Log input coordinates
  console.log('[fetchNearbyShops] 🎯 Starting nearby search with params:', {
    centerLat: lat,
    centerLng: lng,
    radiusKm: radiusKm,
  });

  // Calculate bounding box for initial DB filter (rough filter)
  const latDelta = radiusKm / 111.32; // 1 degree lat ~ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  const bounds: MapBounds = {
    swLat: lat - latDelta,
    swLng: lng - lngDelta,
    neLat: lat + latDelta,
    neLng: lng + lngDelta,
  };

  // 2. Log bounding box calculation
  console.log('[fetchNearbyShops] 📐 Calculated bounding box:', {
    latDelta: latDelta.toFixed(6),
    lngDelta: lngDelta.toFixed(6),
    bounds: {
      swLat: bounds.swLat.toFixed(6),
      swLng: bounds.swLng.toFixed(6),
      neLat: bounds.neLat.toFixed(6),
      neLng: bounds.neLng.toFixed(6),
    },
  });

  const { data, error } = await supabase
    .from('shops')
    .select('*, courses(*)')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('lat', bounds.swLat)
    .lte('lat', bounds.neLat)
    .gte('lng', bounds.swLng)
    .lte('lng', bounds.neLng);

  if (error) throw error;

  // 3. Log DB query results
  console.log('[fetchNearbyShops] 🗄️ DB query results (bounding box filter):', {
    totalShopsFound: data?.length || 0,
    sampleShops: data?.slice(0, 3).map(s => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
    })) || [],
  });

  // Apply precise Haversine distance filter and sort by distance
  const shopsWithDistance: ShopWithDistance[] = (data || [])
    .map((shop) => ({
      ...shop,
      distance: haversineDistance(lat, lng, shop.lat!, shop.lng!),
    }))
    .filter((shop) => shop.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  // 4. Log Haversine filtering results
  console.log('[fetchNearbyShops] 📏 After Haversine distance filtering:', {
    shopsWithinRadius: shopsWithDistance.length,
    radiusKm: radiusKm,
  });

  // 5. Log final shop list with distances
  console.log('[fetchNearbyShops] ✅ Final shop list (sorted by distance):',
    shopsWithDistance.map((shop, idx) => ({
      rank: idx + 1,
      name: shop.name,
      distanceKm: shop.distance.toFixed(2),
      coordinates: {
        lat: shop.lat?.toFixed(6),
        lng: shop.lng?.toFixed(6),
      },
    }))
  );

  return shopsWithDistance;
}

/**
 * Banner type for home page display
 */
export interface HomeBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  click_count: number;
}

/**
 * Fetch active banners for main page
 * - From banners table (admin managed)
 * - Filters by position='main', is_active=true, and valid date range
 * - Falls back to top shops if no banners exist or table doesn't exist
 */
export async function fetchBanners(): Promise<(Shop | HomeBanner)[]> {
  console.log('[fetchBanners] Starting banner fetch...');
  const today = new Date().toISOString().split('T')[0];
  console.log('[fetchBanners] Query date:', today);

  // 1. 먼저 관리자 배너 테이블에서 조회 (try-catch로 테이블 미존재 에러 처리)
  let bannerData: any[] | null = null;
  let bannerError: any = null;

  try {
    const result = await supabase
      .from('banners')
      .select('id, title, image_url, link_url, click_count')
      .eq('position', 'main')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('order', { ascending: true })
      .limit(10);

    bannerData = result.data;
    bannerError = result.error;
  } catch (err) {
    // 테이블이 없거나 네트워크 에러 등의 예외 처리
    console.log('[fetchBanners] Banners table query exception (table may not exist)');
    bannerError = err;
  }

  // 에러가 404 또는 relation does not exist인 경우 조용히 fallback
  const isTableMissing = bannerError && (
    bannerError.code === '42P01' || // PostgreSQL: relation does not exist
    bannerError.code === 'PGRST200' || // PostgREST: table not found
    bannerError.message?.includes('relation') ||
    bannerError.message?.includes('does not exist') ||
    (typeof bannerError === 'object' && bannerError.status === 404)
  );

  if (isTableMissing) {
    console.log('[fetchBanners] Banners table does not exist, using fallback silently');
  } else if (bannerError) {
    console.log('[fetchBanners] Banners table query result:', {
      success: false,
      error: bannerError?.message || bannerError,
      count: 0,
    });
  } else {
    console.log('[fetchBanners] Banners table query result:', {
      success: true,
      count: bannerData?.length || 0,
    });
  }

  // 관리자 배너가 있으면 반환
  if (!bannerError && bannerData && bannerData.length > 0) {
    console.log('[fetchBanners] Using admin banners, count:', bannerData.length);
    return bannerData.map((b) => ({
      id: b.id,
      title: b.title,
      image_url: b.image_url,
      link_url: b.link_url,
      click_count: b.click_count || 0,
      // Shop 호환성을 위한 필드
      name: b.title,
      images: [b.image_url],
      view_count: b.click_count || 0,
    })) as any;
  }

  // 2. 배너가 없거나 테이블이 없으면 기존 방식 (인기 샵)으로 폴백
  console.log('[fetchBanners] No admin banners available, falling back to popular shops');
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .not('images', 'eq', '{}')
    .order('view_count', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[fetchBanners] Shop fallback query error:', error);
    throw error;
  }

  console.log('[fetchBanners] Fallback shops returned, count:', data?.length || 0);
  return data || [];
}

/**
 * Fetch fixed massage category list
 */
export async function fetchCategories(): Promise<string[]> {
  console.log('[fetchCategories] Returning fixed category list');
  const categories = ['타이', '스웨디시', '아로마', '스포츠', '발', '커플'];
  console.log('[fetchCategories] Categories:', categories);
  return categories;
}

/**
 * Fetch recommended shops with courses
 * - Ordered by rating descending (using view_count as proxy)
 * - Limit 10
 * - Includes courses
 */
export async function fetchRecommendedShops(): Promise<ShopWithCourses[]> {
  console.log('[fetchRecommendedShops] Starting recommended shops fetch...');

  const { data, error } = await supabase
    .from('shops')
    .select('*, courses(*)')
    .order('view_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[fetchRecommendedShops] ❌ Query error:', error);
    throw error;
  }

  console.log('[fetchRecommendedShops] ✅ Query successful, count:', data?.length || 0);
  console.log('[fetchRecommendedShops] Sample data:', data?.[0] ? {
    id: data[0].id,
    name: data[0].name,
    coursesCount: data[0].courses?.length || 0,
  } : 'No data');

  return data || [];
}

/**
 * Fetch shop by ID with courses
 */
export async function fetchShopById(id: string): Promise<ShopWithCourses | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('*, courses(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Increment shop view count
 * Uses direct update instead of RPC to avoid 404 errors
 */
export async function incrementShopViewCount(id: string): Promise<void> {
  try {
    // Direct update approach (more reliable than RPC)
    const { data: shop } = await supabase
      .from('shops')
      .select('view_count')
      .eq('id', id)
      .single();

    if (shop) {
      await supabase
        .from('shops')
        .update({ view_count: (shop.view_count || 0) + 1 })
        .eq('id', id);
    }
  } catch (err) {
    // Silently ignore view count errors - not critical for UX
    console.log('[incrementShopViewCount] View count update skipped');
  }
}

/**
 * Map bounds interface for location-based queries
 */
export interface MapBounds {
  swLat: number; // South-West latitude
  swLng: number; // South-West longitude
  neLat: number; // North-East latitude
  neLng: number; // North-East longitude
}

/**
 * Fetch shops within map bounds (LBS)
 * - Filters by lat/lng bounds
 * - Only shops with valid coordinates
 * - Includes courses for shop cards
 * - Optionally filters by category
 */
export async function fetchShopsByBounds(bounds: MapBounds, category?: string): Promise<ShopWithCourses[]> {
  let query = supabase
    .from('shops')
    .select('*, courses(*)')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('lat', bounds.swLat)
    .lte('lat', bounds.neLat)
    .gte('lng', bounds.swLng)
    .lte('lng', bounds.neLng);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query
    .order('view_count', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch shops by category (no bounds restriction)
 * - Returns all shops matching the given category
 * - Includes courses for shop cards
 * - Ordered by view_count descending
 */
export async function fetchShopsByCategory(category: string): Promise<ShopWithCourses[]> {
  const { data, error } = await supabase
    .from('shops')
    .select('*, courses(*)')
    .eq('category', category)
    .order('view_count', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Update shop tier (admin only)
 * - Updates tier and tier_changed_at timestamp
 * - Returns success status
 */
export async function updateShopTier(
  shopId: string,
  newTier: 'basic' | 'premium' | 'vip'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('shops')
    .update({
      tier: newTier,
      tier_changed_at: new Date().toISOString(),
    })
    .eq('id', shopId);

  if (error) {
    console.error('Failed to update shop tier:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
