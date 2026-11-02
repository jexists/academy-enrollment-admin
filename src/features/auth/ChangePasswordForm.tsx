'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { InlineNotice } from '@/components/ui/states';
import { api, ApiError, errorMessage } from '@/lib/api';
import { HOME_PATH, type SessionUser } from '@/lib/auth-storage';
import { useAuth } from './AuthProvider';

/** 비밀번호 변경. 임시 비밀번호면 바꾸기 전까지 다른 화면으로 갈 수 없다 (공통8) */
export function ChangePasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const { session, updateUser, signOut } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session === null) router.replace('/login');
  }, [session, router]);

  if (!session) return null;
  const temporary = session.user.mustChangePassword;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.newPassword !== form.confirm) {
      setErrors({ confirm: '새 비밀번호가 서로 달라요.' });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const user = await api<SessionUser>('/auth/password', {
        method: 'POST',
        token: session?.token,
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      updateUser(user);
      toast.success('비밀번호를 바꿨어요');
      router.replace(HOME_PATH[user.role]);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors);
      else toast.error(errorMessage(error));
      setBusy(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value })),
    error: errors[key],
  });

  return (
    <div className="flex flex-col gap-6">
      {temporary && (
        <InlineNotice className="-mx-4 sm:mx-0">임시 비밀번호예요. 바꿔야 계속할 수 있어요.</InlineNotice>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField
          label={temporary ? '임시 비밀번호' : '지금 비밀번호'}
          type="password"
          autoComplete="current-password"
          {...field('currentPassword')}
        />
        <TextField
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          hint="8자 이상"
          {...field('newPassword')}
        />
        <TextField label="새 비밀번호 확인" type="password" autoComplete="new-password" {...field('confirm')} />
        <Button type="submit" size="lg" block loading={busy} className="mt-2">
          변경
        </Button>
      </form>
      {temporary && (
        <Button variant="ghost" onClick={() => { signOut(); router.replace('/login'); }}>
          다른 계정으로 로그인
        </Button>
      )}
    </div>
  );
}
