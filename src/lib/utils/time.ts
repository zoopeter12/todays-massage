/**
 * Time utility functions for booking system
 */

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTimeString(timeStr);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function isTimeInRange(
  time: string,
  startTime: string,
  endTime: string
): boolean {
  const timeMin = timeToMinutes(time);
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return timeMin >= startMin && timeMin < endMin;
}

export function doTimesOverlap(
  start1: string,
  duration1: number,
  start2: string,
  duration2: number
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = start1Min + duration1;
  const start2Min = timeToMinutes(start2);
  const end2Min = start2Min + duration2;

  return start1Min < end2Min && end1Min > start2Min;
}

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMinutes % (24 * 60)); // Handle day overflow
}

export function getDayOfWeek(date: Date): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  return days[date.getDay()];
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

export function getTimeRangeDisplay(startTime: string, durationMinutes: number): string {
  const endTime = addMinutesToTime(startTime, durationMinutes);
  return `${startTime} - ${endTime}`;
}

export function isValidTimeFormat(timeStr: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(timeStr);
}

export function sortTimeSlots(slots: string[]): string[] {
  return slots.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

export function generateTimeRange(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): string[] {
  const times: string[] = [];
  let currentMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  while (currentMinutes < endMinutes) {
    times.push(minutesToTime(currentMinutes));
    currentMinutes += intervalMinutes;
  }

  return times;
}

export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export function isTimeInPast(date: Date, time: string): boolean {
  const now = new Date();
  const selectedDate = new Date(date);

  // If different day, compare dates
  if (selectedDate.toDateString() !== now.toDateString()) {
    return selectedDate < now;
  }

  // Same day, compare times
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const selectedMinutes = timeToMinutes(time);

  return selectedMinutes < currentMinutes;
}

export function getNextAvailableDate(): Date {
  // Returns tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

export function roundTimeToNearest30(date: Date = new Date()): string {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 30) * 30;

  let hours = date.getHours();
  let finalMinutes = roundedMinutes;

  if (roundedMinutes === 60) {
    hours += 1;
    finalMinutes = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
}

/**
 * Example usage:
 *
 * // Check if booking time is valid
 * const isValid = !isTimeInPast(selectedDate, selectedTime);
 *
 * // Get display text for booking
 * const displayTime = getTimeRangeDisplay('14:00', 90); // "14:00 - 15:30"
 *
 * // Format duration for UI
 * const durationText = formatDuration(90); // "1시간 30분"
 *
 * // Check overlap between bookings
 * const hasConflict = doTimesOverlap('14:00', 90, '15:00', 60); // true
 */
