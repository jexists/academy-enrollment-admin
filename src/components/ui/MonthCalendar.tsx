import { cn } from '@/lib/cn';

export interface CalendarMark {
  date: string;
  label: string;
  tone: 'ok' | 'err' | 'info' | 'warn' | 'gray';
}

const TONE = {
  ok: 'bg-ok-c text-ok',
  err: 'bg-err-c text-err',
  info: 'bg-info-c text-info',
  warn: 'bg-warn-c text-warn',
  gray: 'bg-gray-c text-gray',
};

/** 달력 칸 (월요일 시작). 날짜마다 표시를 붙인다 — 반 수업일, 출석 기록 등 */
export function MonthCalendar({
  yearMonth,
  marks,
  onDayClick,
}: {
  yearMonth: string;
  marks: CalendarMark[];
  onDayClick?: (date: string) => void;
}) {
  const [y, m] = yearMonth.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => `${yearMonth}-${String(i + 1).padStart(2, '0')}`),
  ];
  const byDate = new Map<string, CalendarMark[]>();
  for (const mark of marks) byDate.set(mark.date, [...(byDate.get(mark.date) ?? []), mark]);

  return (
    <div className="grid grid-cols-7 text-meta">
      {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
        <div key={d} className="h-8 text-center leading-8 text-subtle">
          {d}
        </div>
      ))}
      {cells.map((date, index) => (
        <button
          key={date ?? `blank-${index}`}
          type="button"
          disabled={!date || !onDayClick}
          onClick={() => date && onDayClick?.(date)}
          className={cn(
            'flex min-h-16 flex-col items-stretch gap-0.5 border-t border-line p-1 text-left',
            onDayClick && date && 'hover:bg-s1',
          )}
        >
          {date && <span className="tabular-nums text-muted">{Number(date.slice(8))}</span>}
          {date &&
            byDate.get(date)?.map((mark, i) => (
              <span key={i} className={cn('truncate rounded px-1 text-[11px] leading-4', TONE[mark.tone])}>
                {mark.label}
              </span>
            ))}
        </button>
      ))}
    </div>
  );
}
