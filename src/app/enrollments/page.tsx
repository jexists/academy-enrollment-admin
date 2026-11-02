import type { Metadata } from 'next';
import { EnrollmentsScreen } from '@/features/enrollments/EnrollmentsScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '신청 내역' };
export const instant = false;

export default function EnrollmentsPage() {
  return (
    <AdminShell>
      <EnrollmentsScreen />
    </AdminShell>
  );
}
