'use client';

import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { ROLE_LABEL, type Role } from '@/lib/auth-storage';
import { cn } from '@/lib/cn';

interface DemoAccount {
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
}

/**
 * 로컬 전용 데모 로그인 버튼. 백엔드에 DEMO_LOGIN=true일 때만 목록이 오고,
 * 배포 서버에서는 목록 요청이 거절되어 아무것도 그리지 않는다. 비밀번호는 프런트에 없다.
 */
export function DemoAccounts({
  app,
  onPick,
  disabled,
}: {
  app: 'web' | 'admin';
  onPick: (email: string) => void;
  disabled?: boolean;
}) {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);

  useEffect(() => {
    api<DemoAccount[]>('/auth/demo-accounts', { query: { app } })
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, [app]);

  if (accounts.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-6">
      <h2 className="text-meta font-medium text-subtle">로컬 데모 계정 — 누르면 바로 로그인해요</h2>
      <ul className="flex flex-col">
        {accounts.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(account.email)}
              className={cn(
                'flex min-h-11 w-full items-center gap-2 rounded-control px-2 text-left hover:bg-s1',
                'disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              <span className="w-10 text-meta text-muted">{ROLE_LABEL[account.role]}</span>
              <span className="text-body-sm font-medium text-fg">{account.name}</span>
              <span className="flex-1 truncate text-meta text-subtle">{account.email}</span>
              {!account.isActive && <StatusBadge status="중지" />}
              {account.mustChangePassword && <StatusBadge status="비번 변경 필요" />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
