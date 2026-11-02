import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  title: string;
  /** 뒤로 갈 주소가 있으면 제목 왼쪽에 ‹ 를 둔다 */
  backHref?: string;
  /** 오른쪽 행동. 주 버튼은 최대 1개 */
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, backHref, action, className }: PageHeaderProps) {
  return (
    <header className={cn('flex min-h-14 items-center gap-2', className)}>
      {backHref && (
        <Link
          href={backHref}
          aria-label="뒤로"
          className="-ml-2 flex size-10 items-center justify-center rounded-control text-sec text-fg hover:bg-s1"
        >
          ‹
        </Link>
      )}
      <h1 className="flex-1 text-page">{title}</h1>
      {action}
    </header>
  );
}
