'use client';

import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextArea({ label, error, id, className, ...props }: TextAreaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={areaId} className="text-meta font-medium text-fg">
        {label}
      </label>
      <textarea
        id={areaId}
        aria-invalid={error ? true : undefined}
        className={cn(
          'min-h-24 rounded-control border bg-canvas px-3 py-2 text-body text-fg placeholder:text-subtle focus:border-primary focus:outline-none',
          error ? 'border-err' : 'border-line2',
        )}
        {...props}
      />
      {error && <p className="text-meta text-err">{error}</p>}
    </div>
  );
}
