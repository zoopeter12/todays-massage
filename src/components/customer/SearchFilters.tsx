'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SlidersHorizontal, X } from 'lucide-react';
import type { ShopFilters, ShopAmenities } from '@/types/filters';
import SortSelector from './SortSelector';

const CATEGORIES = [
  { id: 'swedish', label: '스웨디시' },
  { id: 'thai', label: '타이 마사지' },
  { id: 'sports', label: '스포츠 마사지' },
  { id: 'aroma', label: '아로마 테라피' },
  { id: 'hot-stone', label: '핫스톤' },
  { id: 'foot', label: '발 마사지' },
];

const AMENITIES_CONFIG = [
  { key: 'parking', label: '주차 가능', emoji: '🅿️' },
  { key: 'shower', label: '샤워 시설', emoji: '🚿' },
  { key: 'women_only', label: '여성 전용', emoji: '👩' },
  { key: 'couple_room', label: '커플룸', emoji: '💑' },
  { key: 'unisex', label: '남녀공용', emoji: '👥' },
  { key: 'late_night', label: '심야 영업', emoji: '🌙' },
] as const;

interface SearchFiltersProps {
  filters: ShopFilters;
  onFiltersChange: (filters: ShopFilters) => void;
  className?: string;
}

export default function SearchFilters({
  filters,
  onFiltersChange,
  className = '',
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ShopFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const filterCount = calculateFilterCount(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: ShopFilters = {
      sortBy: 'popular',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const handleCategoryChange = (categoryId: string) => {
    setLocalFilters({
      ...localFilters,
      category: localFilters.category === categoryId ? undefined : categoryId,
    });
  };

  const handleAmenityChange = (key: keyof ShopAmenities) => {
    const currentAmenities = localFilters.amenities || {};
    const newValue = !currentAmenities[key];

    setLocalFilters({
      ...localFilters,
      amenities: {
        ...currentAmenities,
        [key]: newValue || undefined,
      },
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setLocalFilters({
      ...localFilters,
      priceRange: { min: values[0], max: values[1] },
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <SortSelector
          value={filters.sortBy || 'popular'}
          onChange={(value) =>
            onFiltersChange({ ...filters, sortBy: value as ShopFilters['sortBy'] })
          }
        />

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              필터
              {filterCount > 0 && (
                <Badge className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary">
                  {filterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>필터</SheetTitle>
              <SheetDescription>원하는 조건으로 검색하세요</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Category Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">카테고리</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={localFilters.category === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleCategoryChange(cat.id)}
                      className="justify-start"
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Amenities Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">편의시설</Label>
                <div className="grid grid-cols-2 gap-3" role="group" aria-label="편의시설 필터">
                  {AMENITIES_CONFIG.map((amenity) => {
                    const isChecked = !!localFilters.amenities?.[amenity.key as keyof ShopAmenities];
                    return (
                    <div
                      key={amenity.key}
                      role="checkbox"
                      aria-checked={isChecked}
                      aria-label={`${amenity.label} ${isChecked ? '선택됨' : '선택 안됨'}`}
                      tabIndex={0}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      onClick={() => handleAmenityChange(amenity.key as keyof ShopAmenities)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleAmenityChange(amenity.key as keyof ShopAmenities);
                        }
                      }}
                    >
                      <Switch
                        id={amenity.key}
                        checked={!!localFilters.amenities?.[amenity.key as keyof ShopAmenities]}
                        onCheckedChange={() =>
                          handleAmenityChange(amenity.key as keyof ShopAmenities)
                        }
                      />
                      <Label
                        htmlFor={amenity.key}
                        className="flex items-center gap-1.5 cursor-pointer flex-1"
                      >
                        <span>{amenity.emoji}</span>
                        <span className="text-sm">{amenity.label}</span>
                      </Label>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">가격대</Label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={200000}
                    step={10000}
                    value={[
                      localFilters.priceRange?.min || 0,
                      localFilters.priceRange?.max || 200000,
                    ]}
                    onValueChange={handlePriceRangeChange}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>
                      {(localFilters.priceRange?.min || 0).toLocaleString()}원
                    </span>
                    <span>
                      {(localFilters.priceRange?.max || 200000).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              {/* Open Now Filter */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <Label htmlFor="openNow" className="text-base font-medium cursor-pointer">
                  영업중만 보기
                </Label>
                <Switch
                  id="openNow"
                  checked={localFilters.isOpenNow || false}
                  onCheckedChange={(checked) =>
                    setLocalFilters({ ...localFilters, isOpenNow: checked })
                  }
                />
              </div>
            </div>

            <SheetFooter className="flex-row gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                초기화
              </Button>
              <Button onClick={handleApply} className="flex-1">
                적용
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {filterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>
    </div>
  );
}

function calculateFilterCount(filters: ShopFilters): number {
  let count = 0;

  if (filters.category) count++;
  if (filters.amenities) {
    count += Object.values(filters.amenities).filter(Boolean).length;
  }
  if (filters.priceRange) {
    if (filters.priceRange.min > 0 || filters.priceRange.max < 200000) {
      count++;
    }
  }
  if (filters.isOpenNow) count++;
  if (filters.tags && filters.tags.length > 0) count += filters.tags.length;

  return count;
}
