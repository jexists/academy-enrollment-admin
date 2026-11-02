'use client';

import { cn } from '@/lib/cn';

interface TabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** 밑줄 탭: 선택 = 검정 글자 + 1px 검정 밑줄, 나머지 = muted 글자 */
export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex gap-5 border-b border-line', className)}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px h-11 border-b text-body font-bold transition-colors',
              selected ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
