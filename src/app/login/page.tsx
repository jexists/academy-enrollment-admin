import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: '로그인' };
export const instant = false;

/** 직원 로그인 — final/screens/a-login */
export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-2">
        <span className="text-sec text-primary">한빛수학 어드민</span>
        <h1 className="text-page">로그인</h1>
        <p className="text-body text-muted">직원 계정으로 로그인해요. 계정은 원장님이 만들어요.</p>
      </div>
      <LoginForm />
      <p className="text-meta text-subtle">학부모·학생 계정은 학원 홈페이지에서 로그인해 주세요.</p>
    </main>
  );
}
