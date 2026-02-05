'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Save, Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

import {
  fetchOperatingHours,
  updateOperatingHours,
  generateTimeOptions,
  formatTime,
} from '@/lib/api/operating-hours';
import { getPartnerShop } from '@/lib/api/partner';
import { OperatingHours, DAYS_OF_WEEK, DAY_LABELS } from '@/types/staff';

const DEFAULT_HOURS: OperatingHours = {
  monday: { open: '09:00', close: '21:00' },
  tuesday: { open: '09:00', close: '21:00' },
  wednesday: { open: '09:00', close: '21:00' },
  thursday: { open: '09:00', close: '21:00' },
  friday: { open: '09:00', close: '21:00' },
  saturday: { open: '09:00', close: '21:00' },
  sunday: null,
  is_24h: false,
  break_time: null,
};

export default function OperatingHoursPage() {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<OperatingHours>(DEFAULT_HOURS);
  const [hasBreakTime, setHasBreakTime] = useState(false);

  const timeOptions = generateTimeOptions();

  // Resolve the partner's shop dynamically
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['partner-shop'],
    queryFn: getPartnerShop,
  });

  const { data: fetchedHours, isLoading: hoursLoading } = useQuery({
    queryKey: ['operating-hours', shop?.id],
    queryFn: () => fetchOperatingHours(shop!.id),
    enabled: !!shop?.id,
  });

  const isLoading = shopLoading || hoursLoading;

  useEffect(() => {
    if (fetchedHours) {
      setHours(fetchedHours);
      setHasBreakTime(!!fetchedHours.break_time);
    }
  }, [fetchedHours]);

  const updateMutation = useMutation({
    mutationFn: (data: OperatingHours) => {
      if (!shop?.id) throw new Error('Shop not found');
      return updateOperatingHours(shop.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-hours', shop?.id] });
      toast.success('영업시간이 저장되었습니다.');
    },
    onError: () => {
      toast.error('영업시간 저장에 실패했습니다.');
    },
  });

  const handleSave = () => {
    // Validate break time if enabled
    if (hasBreakTime && hours.break_time) {
      const breakStart = hours.break_time.start;
      const breakEnd = hours.break_time.end;

      if (breakStart >= breakEnd) {
        toast.error('브레이크 타임 종료 시간은 시작 시간보다 늦어야 합니다.');
        return;
      }
    }

    // Validate each day's hours
    for (const day of DAYS_OF_WEEK) {
      const dayHours = hours[day];
      if (dayHours && typeof dayHours !== 'boolean') {
        if (dayHours.open >= dayHours.close) {
          toast.error(
            `${DAY_LABELS[day]}: 종료 시간은 시작 시간보다 늦어야 합니다.`
          );
          return;
        }
      }
    }

    const finalHours = {
      ...hours,
      break_time: hasBreakTime ? hours.break_time : null,
    };

    updateMutation.mutate(finalHours);
  };

  const handleDayToggle = (day: keyof OperatingHours) => {
    if (day === 'is_24h' || day === 'break_time') return;

    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '21:00' },
    }));
  };

  const handleTimeChange = (
    day: keyof OperatingHours,
    type: 'open' | 'close',
    value: string
  ) => {
    if (day === 'is_24h' || day === 'break_time') return;

    setHours((prev) => {
      const dayHours = prev[day];
      if (!dayHours || typeof dayHours === 'boolean') return prev;

      return {
        ...prev,
        [day]: {
          ...dayHours,
          [type]: value,
        },
      };
    });
  };

  const handleBreakTimeChange = (type: 'start' | 'end', value: string) => {
    setHours((prev) => ({
      ...prev,
      break_time: {
        start: type === 'start' ? value : prev.break_time?.start || '12:00',
        end: type === 'end' ? value : prev.break_time?.end || '13:00',
      },
    }));
  };

  // Show message if partner has no registered shop
  if (!shopLoading && !shop) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                <StoreIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">등록된 가게가 없습니다</h2>
              <p className="text-sm text-gray-500">
                영업시간 설정을 이용하려면 먼저 가게를 등록해주세요.
                <br />
                관리자에게 문의하시면 가게 등록을 도와드립니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">영업시간 설정</h1>
          <p className="text-gray-600 mt-2">매장의 영업시간을 설정하세요.</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                기본 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-semibold">24시간 운영</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    매일 24시간 운영되는 경우 활성화하세요.
                  </p>
                </div>
                <Switch
                  checked={hours.is_24h}
                  onCheckedChange={(checked) =>
                    setHours((prev) => ({ ...prev, is_24h: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-semibold">브레이크 타임</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    점심시간 등 예약을 받지 않는 시간을 설정하세요.
                  </p>
                </div>
                <Switch
                  checked={hasBreakTime}
                  onCheckedChange={(checked) => {
                    setHasBreakTime(checked);
                    if (checked && !hours.break_time) {
                      setHours((prev) => ({
                        ...prev,
                        break_time: { start: '12:00', end: '13:00' },
                      }));
                    }
                  }}
                />
              </div>

              {hasBreakTime && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label>시작 시간</Label>
                    <Select
                      value={hours.break_time?.start || '12:00'}
                      onValueChange={(value) =>
                        handleBreakTimeChange('start', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatTime(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>종료 시간</Label>
                    <Select
                      value={hours.break_time?.end || '13:00'}
                      onValueChange={(value) =>
                        handleBreakTimeChange('end', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatTime(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>요일별 영업시간</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const dayHours = hours[day];
                  const isOpen =
                    dayHours !== null && typeof dayHours !== 'boolean';

                  return (
                    <div
                      key={day}
                      className={`p-4 rounded-lg border ${
                        isOpen
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 w-32">
                          <Checkbox
                            checked={isOpen}
                            onCheckedChange={() => handleDayToggle(day)}
                            disabled={hours.is_24h}
                          />
                          <Label className="font-semibold">
                            {DAY_LABELS[day]}
                          </Label>
                        </div>

                        {isOpen && !hours.is_24h ? (
                          <div className="flex items-center gap-4 flex-1">
                            <Select
                              value={dayHours.open}
                              onValueChange={(value) =>
                                handleTimeChange(day, 'open', value)
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {timeOptions.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {formatTime(time)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <span className="text-gray-500">~</span>

                            <Select
                              value={dayHours.close}
                              onValueChange={(value) =>
                                handleTimeChange(day, 'close', value)
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {timeOptions.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {formatTime(time)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            {hours.is_24h ? '24시간 운영' : '휴무'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (fetchedHours) {
                  setHours(fetchedHours);
                  setHasBreakTime(!!fetchedHours.break_time);
                }
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              size="lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {updateMutation.isPending ? '저장중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
