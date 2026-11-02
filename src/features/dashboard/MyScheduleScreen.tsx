'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { Skeleton } from '@/components/ui/states';
import { useApi } from '@/lib/use-api';
import { WeekSessions, type WeekSession } from './WeekSessions';

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/** 강사 내 스케줄 — final/screens/a-myschedule. 주간, 정규·보충·휴강 */
export function MyScheduleScreen() {
  const [date, setDate] = useState(() => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10));
  const [today] = useState(date);
  const { data } = useApi<{ from: string; to: string; sessions: WeekSession[] }>(`/staff/my-week?date=${date}`);
  const regular = data?.sessions.filter((s) => s.status === '정상' && s.kind === '정규').length ?? 0;
  const canceled = data?.sessions.filter((s) => s.status === '휴강').length ?? 0;
  const extra = data?.sessions.filter((s) => s.kind === '보충' && s.status === '정상').length ?? 0;
  return (
    <>
      <PageHeader title="내 주간 스케줄" className="pt-4" />
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" aria-label="지난주" onClick={() => setDate(addDays(date, -7))}>
          ‹
        </Button>
        <span className="text-sec tabular-nums">{data ? `${data.from.slice(5)} – ${data.to.slice(5)}` : '…'}</span>
        <Button variant="ghost" size="sm" aria-label="다음 주" onClick={() => setDate(addDays(date, 7))}>
          ›
        </Button>
      </div>
      {!data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-3 gap-6">
            <Stat label="정규 수업" value={`${regular}회`} />
            <Stat label="휴강" value={`${canceled}회`} />
            <Stat label="보충" value={`${extra}회`} />
          </div>
          <WeekSessions from={data.from} sessions={data.sessions} today={today} />
          <p className="text-meta text-subtle">칸을 누르면 그날 출결 입력으로 가요.</p>
        </div>
      )}
    </>
  );
}
