import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm';

export const metadata: Metadata = { title: '비밀번호 변경' };
export const instant = false;

/** 비밀번호 변경 (임시 비밀번호면 강제) — final/screens/a-pw */
export default function ChangePasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <span className="text-sec text-primary">한빛수학 어드민</span>
        <h1 className="text-page">새 비밀번호 설정</h1>
      </div>
      <ChangePasswordForm />
    </main>
  );
}
