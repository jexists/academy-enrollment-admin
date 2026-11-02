import type { Metadata } from 'next';
import { StaffScreen } from '@/features/staff/StaffScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '직원 계정 관리' };
export const instant = false;

export default function Page() {
  return (
    <AdminShell>
      <StaffScreen />
    </AdminShell>
  );
}
