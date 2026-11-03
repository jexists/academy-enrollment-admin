import { cn } from '@/lib/cn';

/** 메뉴·탭용 선 아이콘 (24 그리드, currentColor). 이름만 골라 쓴다 */
const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  apply: 'M8 3h8v3H8zM6 5H4v16h16V5h-2M8 12h8M8 16h5',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  check: 'M4 12l5 5L20 6',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M18 14a6 6 0 0 1 4 7',
  book: 'M4 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4zM20 4h-6M20 4v15h-6',
  clipboard: 'M9 3h6v3H9zM6 5H5v16h14V5h-1M8 12l2 2 4-4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  teacher: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21v-2a7 7 0 0 1 14 0v2M9 15l3 3 3-3',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  repeat: 'M4 9h13l-3-3M20 15H7l3 3',
  coins: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
};

export function Icon({ name, className }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={cn('size-5 shrink-0', className)} aria-hidden>
      <path d={PATHS[name] ?? PATHS.home} />
    </svg>
  );
}
