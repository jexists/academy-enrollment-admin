'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError, errorMessage } from '@/lib/api';
import { APP_KIND } from '@/lib/app-kind';
import { HOME_PATH, type Session } from '@/lib/auth-storage';
import { useAuth } from './AuthProvider';
import { DemoAccounts } from './DemoAccounts';

/** 이메일 + 비밀번호 로그인. 서버 거절은 Toast, 칸별 입력 오류는 칸 아래에 (components.md 1.6) */
export function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function finish(request: Promise<Session>) {
    setBusy(true);
    setErrors({});
    try {
      const session = await request;
      signIn(session);
      router.replace(session.user.mustChangePassword ? '/change-password' : HOME_PATH[session.user.role]);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors);
      else toast.error(errorMessage(error));
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void finish(api<Session>('/auth/login', { method: 'POST', body: { email, password, app: APP_KIND } }));
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="이메일"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <Button type="submit" size="lg" block loading={busy} className="mt-2">
          로그인
        </Button>
      </form>
      <DemoAccounts
        app={APP_KIND}
        disabled={busy}
        onPick={(pick) =>
          void finish(api<Session>('/auth/demo-login', { method: 'POST', body: { email: pick, app: APP_KIND } }))
        }
      />
    </div>
  );
}
