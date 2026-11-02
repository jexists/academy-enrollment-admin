import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClassesScreen } from '@/features/classes/ClassesScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '반 관리' };
export const instant = false;

export default function ClassesPage() {
  return (
    <AdminShell>
      <Suspense>
        <ClassesScreen />
      </Suspense>
    </AdminShell>
  );
}
