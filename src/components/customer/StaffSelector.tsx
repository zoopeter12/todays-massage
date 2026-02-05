'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { User, Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { fetchActiveStaff } from '@/lib/api/staff';
import { Staff } from '@/types/staff';

interface StaffSelectorProps {
  shopId: string;
  selectedStaffId: string | null;
  onStaffChange: (staffId: string | null) => void;
}

export function StaffSelector({
  shopId,
  selectedStaffId,
  onStaffChange,
}: StaffSelectorProps) {
  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['active-staff', shopId],
    queryFn: () => fetchActiveStaff(shopId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold">관리사 선택 (선택사항)</Label>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">관리사 목록 로딩중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">관리사 선택 (선택사항)</Label>
        <span className="text-sm text-gray-600">
          {staffList.length}명 관리사
        </span>
      </div>

      <RadioGroup
        value={selectedStaffId || 'none'}
        onValueChange={(value) => onStaffChange(value === 'none' ? null : value)}
      >
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              role="button"
              tabIndex={0}
              aria-pressed={selectedStaffId === null}
              aria-label="관리사 지정 안함"
              className={`cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selectedStaffId === null
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => onStaffChange(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStaffChange(null);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="none" id="staff-none" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <Label
                          htmlFor="staff-none"
                          className="text-base font-semibold cursor-pointer"
                        >
                          지정 안함
                        </Label>
                        <p className="text-sm text-gray-600">
                          가능한 관리사가 배정됩니다
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedStaffId === null && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {staffList.map((staff, index) => (
            <motion.div
              key={staff.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: (index + 1) * 0.05 }}
            >
              <Card
                role="button"
                tabIndex={0}
                aria-pressed={selectedStaffId === staff.id}
                aria-label={`관리사 ${staff.name} 선택`}
                className={`cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedStaffId === staff.id
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => onStaffChange(staff.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStaffChange(staff.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem
                      value={staff.id}
                      id={`staff-${staff.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {staff.photo ? (
                          <Image
                            src={staff.photo}
                            alt={staff.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <Label
                            htmlFor={`staff-${staff.id}`}
                            className="text-base font-semibold cursor-pointer block"
                          >
                            {staff.name}
                          </Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {staff.specialties.map((specialty) => (
                              <Badge
                                key={specialty}
                                variant="secondary"
                                className="text-xs"
                              >
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedStaffId === staff.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
