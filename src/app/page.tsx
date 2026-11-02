'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';
import { TeacherDashboard } from '@/features/dashboard/TeacherDashboard';
import { AdminShell } from '@/features/shell/AdminShell';

/** 대시보드 — 원장과 강사가 보는 내용이 다르다 */
export default function DashboardPage() {
  const { session } = useAuth();
  return <AdminShell>{session?.user.role === 'TEACHER' ? <TeacherDashboard /> : <AdminDashboard />}</AdminShell>;
}
