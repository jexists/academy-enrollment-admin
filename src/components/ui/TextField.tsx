'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  /** 입력 오류는 칸 아래 한 줄로만 보여 준다 (Toast로 같은 말을 또 띄우지 않는다) */
  error?: string;
}

export function TextField({ label, hint, error, id, className, ...props }: TextFieldProps) {
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
        aria-describedby={error || hint ? noteId : undefined}
        className={cn(
          'h-11 rounded-control border bg-canvas px-3 text-body text-fg placeholder:text-subtle',
          'focus:border-primary focus:outline-none disabled:bg-s1 disabled:text-subtle',
          error ? 'border-err' : 'border-line2',
        )}
        {...props}
      />
      {(error || hint) && (
        <p id={noteId} className={cn('text-meta', error ? 'text-err' : 'text-subtle')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
