import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatProps {
  label: string;
  value: ReactNode;
  /** 비교·단위 같은 보조 글자 */
  sub?: ReactNode;
  className?: string;
}

/** 라벨 + 큰 숫자. 상자 없이 여백으로만 구분한다. */
export function Stat({ label, value, sub, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-meta text-muted">{label}</span>
      <span className="text-stat tabular-nums text-fg">{value}</span>
      {sub && <span className="text-meta text-subtle">{sub}</span>}
    </div>
  );
}
