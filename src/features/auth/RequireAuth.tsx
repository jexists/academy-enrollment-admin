'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/states';
import { HOME_PATH, type Role } from '@/lib/auth-storage';
import { useAuth } from './AuthProvider';

/**
 * 로그인한 사람만 보이게 한다. 임시 비밀번호면 비밀번호 변경 화면으로 보낸다 (공통8).
 * 진짜 권한 검사는 백엔드가 한다 — 여기는 화면 이동만.
 */
export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();
  const user = session?.user;
  const allowed = !!user && !user.mustChangePassword && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (session === undefined) return;
    if (!user) router.replace('/login');
    else if (user.mustChangePassword) router.replace('/change-password');
    else if (roles && !roles.includes(user.role)) router.replace(HOME_PATH[user.role]);
  }, [session, user, roles, router]);

  if (!allowed) {
    return (
      <div className="flex flex-col gap-3 p-6" aria-busy>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
    );
  }
  return children;
}
