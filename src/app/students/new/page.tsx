import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { AdminShell } from '@/features/shell/AdminShell';
import { StudentRegisterForm } from '@/features/students/StudentRegisterForm';

export const metadata: Metadata = { title: '학생 등록' };
export const instant = false;

export default function StudentNewPage() {
  return (
    <AdminShell>
      <PageHeader title="학생 등록" backHref="/students" className="pt-4" />
      <p className="mb-8 text-body-sm text-muted">학생 정보와 보호자를 등록하면 학생·보호자 계정이 같이 만들어져요.</p>
      <StudentRegisterForm />
    </AdminShell>
  );
}
