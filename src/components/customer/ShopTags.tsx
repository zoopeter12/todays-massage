'use client';

import { Badge } from '@/components/ui/badge';
import { POPULAR_TAGS } from '@/types/filters';

interface ShopTagsProps {
  selectedTags?: string[];
  onTagClick: (tag: string) => void;
  className?: string;
}

export default function ShopTags({ selectedTags = [], onTagClick, className = '' }: ShopTagsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-2 ${className}`}>
      {POPULAR_TAGS.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <Badge
            key={tag}
            variant={isSelected ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap transition-all hover:scale-105 ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onTagClick(tag)}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
}
