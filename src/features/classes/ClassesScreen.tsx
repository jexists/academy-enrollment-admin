'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { ApiError, errorMessage } from '@/lib/api';
import { gradeLabel, scheduleLabel, won } from '@/lib/format';
import { useApi, useMutate } from '@/lib/use-api';
import { cn } from '@/lib/cn';
import { MonthCalendar } from '@/components/ui/MonthCalendar';
import { SessionActions } from './SessionActions';
import type { ClassDetail, ClassRow, Session } from './types';

const thisMonth = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 7);
const shiftMonth = (ym: string, delta: number) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

/** 반 관리 — final/screens/a-classes. 반 목록 → 반 상세(정원·월 수업일·휴강·보충) */
export function ClassesScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data, error, reload } = useApi<ClassRow[]>('/admin/classes');
  const [grade, setGrade] = useState<number>(0);
  const selected = Number(params.get('id')) || data?.[0]?.id || null;
  const rows = (data ?? []).filter((c) => !grade || c.targetGrade === grade);
  const grades = [...new Set((data ?? []).map((c) => c.targetGrade))].sort();

  return (
    <>
      <PageHeader title="반 관리" className="pt-4" action={<ButtonLink href="/timetable/new">반 만들기</ButtonLink>} />
      <FilterChips
        className="mt-2"
        options={[{ value: 0, label: '전체', count: data?.length }, ...grades.map((g) => ({ value: g, label: gradeLabel(g) }))]}
        value={grade}
        onChange={setGrade}
      />
      {error && <EmptyState message={error} />}
      {!data && !error && <Skeleton className="mt-4 h-48" />}
      {data && (
        <div className="mt-4 grid grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-8">
          <ul className="flex flex-col divide-y divide-line">
            {rows.map((c) => {
              const full = c.enrolled >= c.capacity;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => router.replace(`${pathname}?id=${c.id}`)}
                    className={cn('flex w-full flex-col gap-1 px-2 py-3 text-left', selected === c.id ? 'bg-primary-c' : 'hover:bg-s1')}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-body font-bold">{c.name}</span>
                      {!c.isActive && <StatusBadge status="운영 안 함" tone="gray" />}
                      {full && <StatusBadge status="마감" tone="gray" />}
                      <span className="ml-auto text-meta tabular-nums text-muted">
                        {c.enrolled} / {c.capacity}명
                      </span>
                    </span>
                    <span className="text-meta text-muted">
                      {scheduleLabel(c.schedules)} · {c.teacherName}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <section className="min-w-0 border-l border-line pl-8">
            {selected ? <ClassDetailPanel key={selected} classId={selected} onChanged={reload} /> : <EmptyState message="반을 골라 주세요." />}
          </section>
        </div>
      )}
    </>
  );
}

function ClassDetailPanel({ classId, onChanged }: { classId: number; onChanged: () => void }) {
  const [month, setMonth] = useState(thisMonth());
  const { data, error, reload } = useApi<ClassDetail>(`/admin/classes/${classId}?month=${month}`);
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<Session | null>(null);
  const mutate = useMutate();
  const toast = useToast();

  if (error) return <EmptyState message={error} />;
  if (!data) return <Skeleton className="h-80" />;

  const regular = data.sessions.filter((s) => s.kind === '정규').length;
  const extra = data.sessions.length - regular;
  const marks = data.sessions.map((s) => ({
    date: s.date,
    label: s.status === '휴강' ? '휴강' : s.kind === '보충' ? `보충 ${s.startTime}` : s.startTime,
    tone: (s.status === '휴강' ? 'err' : s.kind === '보충' ? 'info' : 'ok') as 'err' | 'info' | 'ok',
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-page">{data.name}</h2>
          <span className="text-body-sm text-muted">{gradeLabel(data.targetGrade)}</span>
          <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setEditing(true)}>
            정원 수정
          </Button>
        </div>
        <p className="text-body-sm text-muted">
          {scheduleLabel(data.schedules)} · {data.teacherName} · 월 {won(data.monthlyFee)}원 · 재원 {data.enrolled} / {data.capacity}명
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>
            ‹
          </Button>
          <h3 className="text-sec tabular-nums">{month.replace('-', '년 ')}월 수업일</h3>
          <Button variant="ghost" size="sm" aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>
            ›
          </Button>
          <span className="text-meta text-subtle">
            정규 {regular}회{extra ? ` · 보충 ${extra}회` : ''}
          </span>
          <span className="ml-auto flex gap-2">
            {data.sessions.length === 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    const r = await mutate<{ created: number }>(`/admin/classes/${classId}/sessions/generate`, 'POST', { yearMonth: month });
                    toast.success(`수업일 ${r.created}개를 만들었어요`);
                    reload();
                  } catch (reason) {
                    toast.error(errorMessage(reason));
                  }
                }}
              >
                이 달 수업일 만들기
              </Button>
            )}
          </span>
        </div>
        <MonthCalendar
          yearMonth={month}
          marks={marks}
          onDayClick={(date) => setPicked(data.sessions.find((s) => s.date === date && s.status === '정상') ?? null)}
        />
        <p className="text-meta text-subtle">초록 정상 · 빨강 휴강 · 파랑 보충. 수업 날짜를 누르면 휴강 처리를 할 수 있어요.</p>
      </section>

      <SessionActions
        classId={classId}
        sessions={data.sessions}
        picked={picked}
        onClosePicked={() => setPicked(null)}
        onChanged={() => {
          setPicked(null);
          reload();
        }}
      />

      <CapacityDialog
        open={editing}
        current={data}
        onClose={() => setEditing(false)}
        onDone={() => {
          setEditing(false);
          toast.success('저장했어요');
          reload();
          onChanged();
        }}
      />
    </div>
  );
}

function CapacityDialog({
  open,
  current,
  onClose,
  onDone,
}: {
  open: boolean;
  current: ClassDetail;
  onClose: () => void;
  onDone: () => void;
}) {
  const mutate = useMutate();
  const toast = useToast();
  const [form, setForm] = useState({ capacity: String(current.capacity), monthlyFee: String(current.monthlyFee), intro: current.intro ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await mutate(`/admin/classes/${current.id}`, 'PATCH', {
        capacity: Number(form.capacity),
        monthlyFee: Number(form.monthlyFee),
        intro: form.intro,
      });
      onDone();
    } catch (reason) {
      if (reason instanceof ApiError && Object.keys(reason.fieldErrors).length > 0) setErrors(reason.fieldErrors);
      else toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${current.name} 정보 수정`}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" form="class-edit" loading={busy}>
            저장
          </Button>
        </>
      }
    >
      <form id="class-edit" onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="정원"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            hint={`지금 ${current.enrolled}명 수강 중`}
            error={errors.capacity}
          />
          <TextField label="월 수강료" type="number" min={0} value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} error={errors.monthlyFee} />
        </div>
        <TextField label="소개 (첫 화면에 보여요)" value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} />
      </form>
    </Modal>
  );
}
