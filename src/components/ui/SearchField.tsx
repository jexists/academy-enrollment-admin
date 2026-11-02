'use client';

import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

/** 돋보기 + 지우기 */
export function SearchField({ value, onChange, label, className, ...props }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden>
        ⌕
      </span>
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-control border border-line2 bg-canvas pl-8 pr-8 text-body-sm placeholder:text-subtle focus:border-primary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-subtle hover:bg-s1"
        >
          ×
        </button>
      )}
    </div>
  );
}
