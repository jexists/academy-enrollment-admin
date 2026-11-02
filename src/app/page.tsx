'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/states';
import { useAuth } from '@/features/auth/AuthProvider';
import { AdminShell } from '@/features/shell/AdminShell';

/** 대시보드 자리 — 숫자·할 일은 4단계에서 채운다 */
export default function DashboardPage() {
  const { session } = useAuth();
  return (
    <AdminShell>
      <PageHeader title={session?.user.role === 'TEACHER' ? `${session.user.name} 대시보드` : '대시보드'} className="pt-4" />
      <EmptyState message="로그인했어요. 대시보드 숫자·할 일은 4단계에서 채워요." />
    </AdminShell>
  );
}
