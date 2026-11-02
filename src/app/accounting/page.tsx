import type { Metadata } from 'next';
import { AccountingScreen } from '@/features/accounting/AccountingScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '회계' };
export const instant = false;

export default function AccountingPage() {
  return (
    <AdminShell>
      <AccountingScreen />
    </AdminShell>
  );
}
