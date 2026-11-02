import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** 빈 화면: 안내 한 줄 + (있으면) 다음 행동 */
export function EmptyState({ message, action, className }: { message: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-12 text-center', className)}>
      <p className="text-body text-muted">{message}</p>
      {action}
    </div>
  );
}

/** 로딩 자리: 실제 내용과 같은 크기로 회색 막대를 깐다 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-control bg-s1', className)} aria-hidden />;
}

/** 계속 유지되는 상태만 페이지 맨 위 한 줄로 (예: 임시 비밀번호). 거절·오류 안내에는 쓰지 않는다. */
export function InlineNotice({
  children,
  tone = 'warn',
  className,
}: {
  children: ReactNode;
  tone?: 'warn' | 'info';
  className?: string;
}) {
  return (
    <p
      role="status"
      className={cn(
        'px-4 py-3 text-meta font-medium',
        tone === 'warn' ? 'bg-warn-c text-warn' : 'bg-info-c text-info',
        className,
      )}
    >
      {children}
    </p>
  );
}
