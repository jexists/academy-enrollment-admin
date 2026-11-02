import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AttendanceScreen } from '@/features/attendance/AttendanceScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '출결' };
export const instant = false;

export default function AttendancePage() {
  return (
    <AdminShell>
      <Suspense>
        <AttendanceScreen />
      </Suspense>
    </AdminShell>
  );
}
