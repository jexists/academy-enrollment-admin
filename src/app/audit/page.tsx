import type { Metadata } from 'next';
import { AuditScreen } from '@/features/audit/AuditScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '변경 기록' };
export const instant = false;

export default function Page() {
  return (
    <AdminShell>
      <AuditScreen />
    </AdminShell>
  );
}
