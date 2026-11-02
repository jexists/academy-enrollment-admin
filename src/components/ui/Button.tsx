import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

/** 주황(primary)은 상태마다 1개만. 나머지 행동은 secondary(회색 바탕)·ghost(글자) */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-s1 text-fg hover:bg-s2',
  ghost: 'text-muted hover:bg-s1 hover:text-fg',
  danger: 'bg-err text-white hover:bg-err/90',
};

/** 높이: sm 32 / md 40 / lg 48 */
const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-meta',
  md: 'h-10 px-4 text-body',
  lg: 'h-12 px-5 text-body',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'relative inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-40',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, cn(block && 'w-full', className))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          {/* 로딩 중에도 버튼 폭이 바뀌지 않게 글자 자리는 남기고 숨긴다 */}
          <span className="invisible">{children}</span>
          <span className="absolute size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          <span className="sr-only">처리 중</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ href, variant = 'primary', size = 'md', className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
