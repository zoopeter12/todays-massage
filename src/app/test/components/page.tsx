import { notFound } from 'next/navigation';
import { ComponentTestPageClient } from './ComponentTestPageClient';

/**
 * Component Testing Page
 * Use this page to visually test TimeSlotSelector and StaffSelector
 * Navigate to /test/components to view
 *
 * NOTE: This page is only accessible in development mode.
 * In production, it returns a 404 page.
 */

export default function ComponentTestPage() {
  // 프로덕션 환경에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ComponentTestPageClient />;
}
