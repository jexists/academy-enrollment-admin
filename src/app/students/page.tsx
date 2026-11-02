import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudentsScreen } from '@/features/students/StudentsScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '학생 관리' };
export const instant = false;

export default function StudentsPage() {
  return (
    <AdminShell>
      {/* 주소의 ?id=를 읽어서 미리 그릴 수 없다 */}
      <Suspense>
        <StudentsScreen />
      </Suspense>
    </AdminShell>
  );
}
