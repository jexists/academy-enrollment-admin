import { cn } from '@/lib/cn';

type Tone = 'warn' | 'ok' | 'err' | 'gray' | 'info';

const TONES: Record<Tone, string> = {
  warn: 'bg-warn-c text-warn',
  ok: 'bg-ok-c text-ok',
  err: 'bg-err-c text-err',
  gray: 'bg-gray-c text-gray',
  info: 'bg-info-c text-info',
};

/** 상태 글자 → 색 (docs/design/components.md 2.1 StatusBadge 표) */
const STATUS_TONE: Record<string, Tone> = {
  신청됨: 'warn',
  환불요청: 'warn',
  신청: 'warn',
  지각: 'warn',
  '비번 변경 필요': 'warn',
  수강중: 'ok',
  확정: 'ok',
  출석: 'ok',
  납부: 'ok',
  사용: 'ok',
  거절: 'err',
  결석: 'err',
  미납: 'err',
  중지: 'err',
  수강종료: 'gray',
  취소: 'gray',
  휴강: 'gray',
  삭제됨: 'gray',
  보강: 'info',
  보충: 'info',
  '전화 신청': 'info',
};

interface StatusBadgeProps {
  status: string;
  /** 표에 없는 글자를 쓸 때 색을 직접 정한다 */
  tone?: Tone;
  className?: string;
}

export function StatusBadge({ status, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2 text-badge whitespace-nowrap',
        TONES[tone ?? STATUS_TONE[status] ?? 'gray'],
        className,
      )}
    >
      {status}
    </span>
  );
}
