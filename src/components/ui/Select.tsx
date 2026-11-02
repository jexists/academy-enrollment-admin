'use client';

import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

/** 단일 선택. 브라우저 기본 select라 모바일에서는 OS 선택 창이 뜬다 */
export function Select({ label, options, placeholder, error, hint, id, className, ...props }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={selectId} className="text-meta font-medium text-fg">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-11 rounded-control border bg-canvas px-3 text-body text-fg focus:border-primary focus:outline-none',
          error ? 'border-err' : 'border-line2',
        )}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {(error || hint) && <p className={cn('text-meta', error ? 'text-err' : 'text-subtle')}>{error ?? hint}</p>}
    </div>
  );
}
