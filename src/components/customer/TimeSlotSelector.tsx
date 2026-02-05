'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { getAvailableSlots } from '@/lib/api/operating-hours';
import { TimeSlot } from '@/types/staff';

interface TimeSlotSelectorProps {
  shopId: string;
  courseDuration: number;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

export function TimeSlotSelector({
  shopId,
  courseDuration,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}: TimeSlotSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: [
      'available-slots',
      shopId,
      selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      courseDuration,
    ],
    queryFn: () => {
      if (!selectedDate) return [];
      return getAvailableSlots(
        shopId,
        format(selectedDate, 'yyyy-MM-dd'),
        courseDuration
      );
    },
    enabled: !!selectedDate,
  });

  const availableSlots = slots.filter((slot) => slot.available);
  const hasAvailableSlots = availableSlots.length > 0;

  useEffect(() => {
    // Reset time selection when date changes
    onTimeChange('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-semibold">예약 날짜 선택</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal h-12"
            >
              <Calendar className="mr-2 h-5 w-5" />
              {selectedDate ? (
                format(selectedDate, 'PPP', { locale: ko })
              ) : (
                <span className="text-gray-500">날짜를 선택하세요</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                onDateChange(date);
                setCalendarOpen(false);
              }}
              disabled={(date) => date < new Date()}
              initialFocus
              locale={ko}
            />
          </PopoverContent>
        </Popover>
      </div>

      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">예약 시간 선택</Label>
            {!isLoading && (
              <span className="text-sm text-gray-600">
                {availableSlots.length}개 시간 가능
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">시간을 확인하는 중...</p>
              </div>
            </div>
          ) : !hasAvailableSlots ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                선택한 날짜에 예약 가능한 시간이 없습니다. 다른 날짜를
                선택해주세요.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const isAvailable = slot.available;

                return (
                  <Button
                    key={slot.time}
                    variant={isSelected ? 'default' : 'outline'}
                    size="lg"
                    disabled={!isAvailable}
                    onClick={() => onTimeChange(slot.time)}
                    aria-pressed={isSelected}
                    aria-label={`${slot.time} ${isAvailable ? (isSelected ? '선택됨' : '선택 가능') : '예약 불가'}`}
                    className={`
                      relative h-14 flex flex-col items-center justify-center gap-1
                      ${
                        !isAvailable
                          ? 'opacity-50 cursor-not-allowed line-through'
                          : ''
                      }
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : ''
                      }
                    `}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-semibold">{slot.time}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedDate && selectedTime && (
        <Alert className="bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            선택한 예약 시간:{' '}
            <strong>
              {format(selectedDate, 'PPP', { locale: ko })} {selectedTime}
            </strong>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
