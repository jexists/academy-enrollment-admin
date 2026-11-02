import type { Metadata } from 'next';
import { MakeupsScreen } from '@/features/attendance/MakeupsScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '보강' };
export const instant = false;

export default function MakeupsPage() {
  return (
    <AdminShell>
      <MakeupsScreen />
    </AdminShell>
  );
}
