"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useAuth } from "@/features/auth/AuthProvider";
import { ROLE_LABEL } from "@/lib/auth-storage";
import { cn } from "@/lib/cn";
import { navFor } from "./admin-nav";

/** 어드민 공통 틀 (파이널 와이어프레임): 왼쪽 사이드바 + 위쪽 바 + 회색 바탕 위 흰 카드 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={["ADMIN", "TEACHER"]}>
      <div className="flex min-h-full bg-backdrop">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1 px-8 pb-24">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}

function useActive() {
  const { session } = useAuth();
  const pathname = usePathname();
  const items = session ? navFor(session.user.role) : [];
  // 가장 길게 맞는 메뉴 하나만 켠다 (/timetable/new는 '강사 시간표'가 아니라 '수업 시간표 생성')
  const active = items
    .filter((item) =>
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return { items, active };
}

function Sidebar() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const { items, active } = useActive();
  const user = session?.user;
  if (!user) return null;

  return (
    <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col border-r border-line bg-canvas px-3 py-5">
      <Link href="/" className="flex items-center gap-3 px-2">
        <span className="flex size-9 items-center justify-center rounded-control bg-primary text-sec text-white">
          한
        </span>
        <span className="flex flex-col">
          <span className="text-body font-bold text-fg">한빛수학 어드민</span>
          <span className="text-meta text-muted">
            {user.name} · {ROLE_LABEL[user.role]}
          </span>
        </span>
      </Link>
      <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {items.map((item) => {
          const on = item.href === active?.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-control px-3 text-body-sm",
                on
                  ? "bg-primary-c font-bold text-primary"
                  : "text-muted hover:bg-s1 hover:text-fg",
              )}
            >
              <Icon
                name={item.icon}
                className={on ? "text-primary" : "text-subtle"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => {
          signOut();
          router.replace("/login");
        }}
        className="flex h-10 items-center gap-3 rounded-control px-3 text-left text-body-sm text-muted hover:bg-s1 hover:text-fg"
      >
        <Icon name="logout" className="text-subtle" />
        로그아웃
      </button>
    </aside>
  );
}

function TopBar() {
  const { session } = useAuth();
  const { active } = useActive();
  const user = session?.user;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-8 backdrop-blur">
      <span className="text-meta text-subtle">
        {user?.role === "ADMIN" ? "관리자 콘솔" : "강사 포털"}
      </span>
      <span className="text-meta text-subtle">/</span>
      <span className="text-body-sm font-bold text-fg">
        {active?.label ?? ""}
      </span>
      {user && (
        <span className="ml-auto flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-fg text-meta font-bold text-white">
            {user.name[0]}
          </span>
          <span className="text-body-sm text-fg">{user.name}</span>
        </span>
      )}
    </header>
  );
}
