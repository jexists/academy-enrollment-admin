'use client';

import { cn } from '@/lib/cn';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

/** 2~4개 중 하나 고르기 (라디오 대신). 출결 입력·관계·전학/진학 등 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-control bg-s1 p-0.5', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[6px] font-medium transition-colors',
              size === 'sm' ? 'h-7 px-3 text-meta' : 'h-9 px-4 text-body-sm',
              selected ? 'bg-canvas text-fg shadow-[0_0_0_1px_var(--color-line2)]' : 'text-muted hover:text-fg',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
