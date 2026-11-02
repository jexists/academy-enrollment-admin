import type { Metadata } from 'next';
import { MyScheduleScreen } from '@/features/dashboard/MyScheduleScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '내 스케줄' };
export const instant = false;

export default function Page() {
  return (
    <AdminShell>
      <MyScheduleScreen />
    </AdminShell>
  );
}
