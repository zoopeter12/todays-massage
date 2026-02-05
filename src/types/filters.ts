export interface ShopAmenities {
  parking: boolean;
  shower: boolean;
  women_only: boolean;
  couple_room: boolean;
  unisex: boolean;
  late_night: boolean; // 심야영업
}

export interface ShopFilters {
  category?: string;
  amenities?: Partial<ShopAmenities>;
  priceRange?: { min: number; max: number };
  sortBy?: 'distance' | 'rating' | 'popular' | 'price_low' | 'price_high';
  isOpenNow?: boolean;
  tags?: string[];
}

export type PriceRange = '3-5만원' | '5-8만원' | '8만원이상';

export const PRICE_RANGES: Record<PriceRange, { min: number; max: number }> = {
  '3-5만원': { min: 30000, max: 50000 },
  '5-8만원': { min: 50000, max: 80000 },
  '8만원이상': { min: 80000, max: 999999 },
};

export const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'distance', label: '거리순' },
  { value: 'rating', label: '평점순' },
  { value: 'price_low', label: '가격 낮은순' },
  { value: 'price_high', label: '가격 높은순' },
] as const;

export const POPULAR_TAGS = [
  '커플 추천',
  '주차 가능',
  '24시',
  '여성 전용',
  '럭셔리',
  '가성비',
] as const;
