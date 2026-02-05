'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeSlotSelector } from '@/components/customer/TimeSlotSelector';
import { StaffSelector } from '@/components/customer/StaffSelector';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const TEST_SHOP_ID = '00000000-0000-0000-0000-000000000001';

export function ComponentTestPageClient() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [courseDuration, setCourseDuration] = useState(90);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Component Testing Page
          </h1>
          <p className="text-gray-600 mt-2">
            Test TimeSlotSelector and StaffSelector components
          </p>
          <p className="text-sm text-orange-600 mt-1">
            (Development only - not accessible in production)
          </p>
        </div>

        <Tabs defaultValue="time-slot" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="time-slot">Time Slot Selector</TabsTrigger>
            <TabsTrigger value="staff">Staff Selector</TabsTrigger>
          </TabsList>

          <TabsContent value="time-slot" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>TimeSlotSelector Component</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex gap-2">
                      <Badge
                        variant={courseDuration === 60 ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setCourseDuration(60)}
                      >
                        60분
                      </Badge>
                      <Badge
                        variant={courseDuration === 90 ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setCourseDuration(90)}
                      >
                        90분
                      </Badge>
                      <Badge
                        variant={courseDuration === 120 ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setCourseDuration(120)}
                      >
                        120분
                      </Badge>
                    </div>

                    <TimeSlotSelector
                      shopId={TEST_SHOP_ID}
                      courseDuration={courseDuration}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onDateChange={setSelectedDate}
                      onTimeChange={setSelectedTime}
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Values</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Course Duration
                      </p>
                      <p className="text-lg font-semibold">
                        {courseDuration} minutes
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Selected Date
                      </p>
                      <p className="text-lg font-semibold">
                        {selectedDate
                          ? format(selectedDate, 'PPP', { locale: ko })
                          : 'Not selected'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Selected Time
                      </p>
                      <p className="text-lg font-semibold">
                        {selectedTime || 'Not selected'}
                      </p>
                    </div>

                    {selectedDate && selectedTime && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Booking Start
                        </p>
                        <p className="text-sm text-blue-800">
                          {format(selectedDate, 'yyyy-MM-dd')}T{selectedTime}:00
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Component Props
                      </p>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                        {JSON.stringify(
                          {
                            shopId: TEST_SHOP_ID,
                            courseDuration,
                            selectedDate: selectedDate
                              ? format(selectedDate, 'yyyy-MM-dd')
                              : null,
                            selectedTime: selectedTime || null,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>StaffSelector Component</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StaffSelector
                      shopId={TEST_SHOP_ID}
                      selectedStaffId={selectedStaffId}
                      onStaffChange={setSelectedStaffId}
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Staff</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Staff ID
                      </p>
                      <p className="text-lg font-semibold">
                        {selectedStaffId || 'Not assigned'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Assignment Type
                      </p>
                      <p className="text-lg font-semibold">
                        {selectedStaffId ? 'Specific Staff' : 'Auto-assign'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Component Props
                      </p>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                        {JSON.stringify(
                          {
                            shopId: TEST_SHOP_ID,
                            selectedStaffId: selectedStaffId || null,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>

                    {selectedStaffId && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          Booking Data
                        </p>
                        <pre className="text-xs text-green-800">
                          {JSON.stringify(
                            {
                              staff_id: selectedStaffId,
                              assignment_type: 'specific',
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Complete Booking Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
              {JSON.stringify(
                {
                  shop_id: TEST_SHOP_ID,
                  course_id: 'example-course-id',
                  start_time: selectedDate && selectedTime
                    ? `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`
                    : null,
                  course_duration: courseDuration,
                  staff_id: selectedStaffId,
                  status: 'pending',
                  created_at: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">Testing Notes</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>
              Make sure operating hours are configured at{' '}
              <code className="bg-yellow-100 px-1 rounded">
                /partner/operating-hours
              </code>
            </li>
            <li>
              Add staff members at{' '}
              <code className="bg-yellow-100 px-1 rounded">
                /partner/staff
              </code>
            </li>
            <li>
              Create test bookings to see unavailable slots
            </li>
            <li>
              Try different course durations to see slot availability change
            </li>
            <li>
              Check console for any API errors
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
