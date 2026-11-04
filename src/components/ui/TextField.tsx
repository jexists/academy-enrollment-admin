'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /**
   * 입력 오류는 칸 아래 한 줄로만 보여 준다 (Toast로 같은 말을 또 띄우지 않는다).
   * 설명은 칸 아래에 쓰지 않고 placeholder로 넣는다 — 칸 아래 글은 오류일 때만.
   */
  error?: string;
}

export function TextField({ label, error, id, className, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="text-meta font-medium text-fg">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? noteId : undefined}
        className={cn(
          'h-11 rounded-control border bg-canvas px-3 text-body text-fg placeholder:text-subtle',
          'focus:border-primary focus:outline-none disabled:bg-s1 disabled:text-subtle',
          error ? 'border-err' : 'border-line2',
        )}
        {...props}
      />
      {error && (
        <p id={noteId} className="text-meta text-err">
          {error}
        </p>
      )}
    </div>
  );
}
