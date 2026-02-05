'use client';

import { Car, Droplets, UserRound, Heart, Users, Moon } from 'lucide-react';
import type { ShopAmenities } from '@/types/filters';

interface AmenityIconsProps {
  amenities: Partial<ShopAmenities>;
  mode?: 'compact' | 'full';
  className?: string;
}

const AMENITY_CONFIG = {
  parking: {
    icon: Car,
    label: '주차',
    color: 'text-blue-600',
  },
  shower: {
    icon: Droplets,
    label: '샤워',
    color: 'text-cyan-600',
  },
  women_only: {
    icon: UserRound,
    label: '여성전용',
    color: 'text-pink-600',
  },
  couple_room: {
    icon: Heart,
    label: '커플룸',
    color: 'text-rose-600',
  },
  unisex: {
    icon: Users,
    label: '남녀공용',
    color: 'text-purple-600',
  },
  late_night: {
    icon: Moon,
    label: '심야영업',
    color: 'text-indigo-600',
  },
} as const;

export default function AmenityIcons({
  amenities,
  mode = 'compact',
  className = '',
}: AmenityIconsProps) {
  const activeAmenities = Object.entries(amenities).filter(([_, value]) => value === true);

  if (activeAmenities.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {activeAmenities.map(([key]) => {
        const config = AMENITY_CONFIG[key as keyof ShopAmenities];
        if (!config) return null;

        const Icon = config.icon;

        if (mode === 'compact') {
          return (
            <div
              key={key}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs"
              title={config.label}
            >
              <Icon className={`h-3 w-3 ${config.color}`} />
            </div>
          );
        }

        return (
          <div
            key={key}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium"
          >
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            <span className="text-gray-700">{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}
