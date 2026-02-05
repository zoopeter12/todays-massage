'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SORT_OPTIONS } from '@/types/filters';

interface SortSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SortSelector({ value, onChange, className = '' }: SortSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-[140px] ${className}`}>
        <SelectValue placeholder="정렬" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
