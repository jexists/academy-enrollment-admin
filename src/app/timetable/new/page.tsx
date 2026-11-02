import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { TimetableNewForm } from '@/features/classes/TimetableNewForm';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '수업 시간표 생성' };
export const instant = false;

export default function TimetableNewPage() {
  return (
    <AdminShell>
      <PageHeader title="수업 시간표 생성" backHref="/classes" className="pt-4" />
      <p className="mb-8 text-body-sm text-muted">새 정규 수업을 만들고 월별 수업일을 자동으로 만들어요.</p>
      <TimetableNewForm />
    </AdminShell>
  );
}
