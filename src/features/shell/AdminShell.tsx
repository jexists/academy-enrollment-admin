"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { ROLE_LABEL } from "@/lib/auth-storage";
import { cn } from "@/lib/cn";
import { navFor } from "./admin-nav";

/** 어드민 공통 틀 (파이널 와이어프레임): 왼쪽 사이드바 + 위쪽 바 + 회색 바탕 위 흰 카드 */
export function AdminShell({ children }: { children: ReactNode }) {
  // 로그아웃을 누르면 로그인 화면이 뜰 때까지 "로그아웃하고 있어요"를 덮어 둔다 (느린 인터넷에서 멈춘 것처럼 보이지 않게)
  // 이전 화면이 숨겨진 채 남아 있다가 다시 로그인하면 되살아나므로, 로그인 정보가 없을 때만 보인다
  const { session } = useAuth();
  const [leaving, setLeaving] = useState(false);
  return (
    <>
      {leaving && session === null && <LeavingOverlay />}
      <RequireAuth roles={["ADMIN", "TEACHER"]}>
        <div className="flex min-h-full bg-backdrop">
          <Sidebar onLogout={() => setLeaving(true)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="min-w-0 flex-1 px-8 pb-24">
              <div className="mx-auto w-full max-w-[1200px]">{children}</div>
            </main>
          </div>
        </div>
      </RequireAuth>
    </>
  );
}

function LeavingOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-canvas/90"
    >
      <span
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
      <p className="text-body text-muted">로그아웃하고 있어요</p>
    </div>
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

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { items, active } = useActive();
  const user = session?.user;
  // 로그아웃할 때 바로 넘어가도록 로그인 화면을 미리 받아 둔다
  useEffect(() => {
    router.prefetch("/login");
  }, [router]);
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
          onLogout();
          router.replace("/login");
          signOut();
          toast.success("로그아웃했어요");
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
