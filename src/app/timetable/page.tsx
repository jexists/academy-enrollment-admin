import type { Metadata } from 'next';
import { TimetableScreen } from '@/features/classes/TimetableScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '강사 시간표' };
export const instant = false;

export default function Page() {
  return (
    <AdminShell>
      <TimetableScreen />
    </AdminShell>
  );
}
