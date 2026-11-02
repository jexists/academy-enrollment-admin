'use client';

import { cn } from '@/lib/cn';

interface FilterChipsProps<T extends string | number> {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** 필터 칩 (선택 = 주황 선·글자). 자녀 선택, 상태 필터 등 */
export function FilterChips<T extends string | number>({ options, value, onChange, className }: FilterChipsProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 rounded-full border px-3 text-meta font-medium transition-colors',
              selected ? 'border-primary text-primary' : 'border-line2 text-muted hover:text-fg',
            )}
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1 tabular-nums">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
