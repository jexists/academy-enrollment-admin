import type { Metadata } from 'next';
import { TeachersScreen } from '@/features/classes/TeachersScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '강사 관리' };
export const instant = false;

export default function TeachersPage() {
  return (
    <AdminShell>
      <TeachersScreen />
    </AdminShell>
  );
}
