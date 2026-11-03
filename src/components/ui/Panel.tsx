import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** 흰 카드 (파이널 와이어프레임): 어드민은 회색 바탕 위 묶음, 코어 웹은 한 묶음 정보에만 */
export function Panel({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn('rounded-modal border border-line bg-canvas', padded && 'p-5', className)}>
      {(title || action) && (
        <div className={cn('mb-4 flex items-center gap-2', !padded && 'px-5 pt-5')}>
          {title && <h2 className="flex-1 text-sec">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
