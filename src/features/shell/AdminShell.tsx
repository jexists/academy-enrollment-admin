'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { useAuth } from '@/features/auth/AuthProvider';
import { ROLE_LABEL } from '@/lib/auth-storage';
import { cn } from '@/lib/cn';
import { navFor } from './admin-nav';

/** 어드민 공통 틀: 왼쪽 사이드바 220 + 본문 최대 1200 (components.md 1.8) */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={['ADMIN', 'TEACHER']}>
      <div className="flex min-h-full">
        <Sidebar />
        <main className="min-w-0 flex-1 px-8 pb-24">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}

function Sidebar() {
  const { session, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const user = session?.user;
  if (!user) return null;
  const items = navFor(user.role);
  // 가장 길게 맞는 메뉴 하나만 켠다 (/timetable/new는 '강사 시간표'가 아니라 '수업 시간표 생성')
  const activeHref = items
    .filter((item) => (item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-line px-3 py-5">
      <Link href="/" className="px-3 text-sec text-primary">
        한빛수학 어드민
      </Link>
      <p className="mt-1 px-3 text-meta text-muted">
        {user.name} · {ROLE_LABEL[user.role]}
      </p>
      <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center rounded-control px-3 text-body-sm',
                active ? 'bg-primary-c font-bold text-primary' : 'text-muted hover:bg-s1 hover:text-fg',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => {
          signOut();
          router.replace('/login');
        }}
        className="flex h-10 items-center rounded-control px-3 text-left text-body-sm text-muted hover:bg-s1 hover:text-fg"
      >
        로그아웃
      </button>
    </aside>
  );
}
