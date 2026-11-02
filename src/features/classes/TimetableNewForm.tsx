'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { ApiError, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { gradeLabel } from '@/lib/format';
import { useApi, useMutate } from '@/lib/use-api';
import { WEEKDAYS, type Slot, type TeacherRow } from './types';

interface TeacherSlot extends Slot {
  classId: number;
  className: string;
}

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const overlaps = (a: Slot, b: Slot) =>
  a.weekday === b.weekday && minutes(a.startTime) < minutes(b.endTime) && minutes(b.startTime) < minutes(a.endTime);
const thisMonth = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 7);

/** 그 달 정규 요일 날짜 수 (백엔드 monthSessions와 같은 계산) */
function countSessions(slots: Slot[], yearMonth: string) {
  const [y, m] = yearMonth.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const counts = new Map<number, number>();
  for (let d = 1; d <= days; d++) {
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (slots.some((s) => s.weekday === wd)) counts.set(wd, (counts.get(wd) ?? 0) + 1);
  }
  return counts;
}

/**
 * 수업 시간표 생성 — final/screens/a-timetable-new. ① 반 정보 → ② 정규 요일 → ③ 수업일 만들기.
 * 강사 시간 겹침(B9)은 미리 보여 주고 저장 버튼을 막는다 (비활성 + 이유). 서버도 한 번 더 검사한다.
 */
export function TimetableNewForm() {
  const router = useRouter();
  const toast = useToast();
  const mutate = useMutate();
  const { data: teachers } = useApi<TeacherRow[]>('/admin/teachers');
  const [form, setForm] = useState({ name: '', targetGrade: '8', teacherId: '', capacity: '8', monthlyFee: '280000', intro: '' });
  const [slots, setSlots] = useState<Slot[]>([
    { weekday: 2, startTime: '19:00', endTime: '21:00' },
    { weekday: 4, startTime: '19:00', endTime: '21:00' },
  ]);
  const [month, setMonth] = useState(thisMonth());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { data: busySlots } = useApi<TeacherSlot[]>(form.teacherId ? `/admin/teachers/${form.teacherId}/slots` : null);

  const teacher = teachers?.find((t) => String(t.id) === form.teacherId);
  const conflict = slots.map((s) => (busySlots ?? []).find((b) => overlaps(s, b)) ?? null);
  const firstConflict = conflict.find(Boolean);
  const badTime = slots.some((s) => minutes(s.endTime) <= minutes(s.startTime));
  const dupDay = new Set(slots.map((s) => s.weekday)).size !== slots.length;
  const blockReason = firstConflict
    ? `${teacher?.name}는 ${WEEKDAYS[firstConflict.weekday]} ${firstConflict.startTime}~${firstConflict.endTime}에 ${firstConflict.className}를 맡고 있어요`
    : badTime
      ? '끝나는 시간이 시작 시간보다 늦어야 해요'
      : dupDay
        ? '같은 요일이 두 번 들어갔어요'
        : slots.length === 0
          ? '정규 요일을 하나 이상 넣어 주세요'
          : null;
  const counts = countSessions(slots, month);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const setSlot = (i: number, patch: Partial<Slot>) => setSlots((list) => list.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const result = await mutate<{ id: number; sessionsCreated: number }>('/admin/classes', 'POST', {
        ...form,
        targetGrade: Number(form.targetGrade),
        teacherId: Number(form.teacherId),
        capacity: Number(form.capacity),
        monthlyFee: Number(form.monthlyFee),
        schedules: slots,
        generateMonth: month,
      });
      toast.success(`반을 만들고 수업일 ${result.sessionsCreated}개를 만들었어요`);
      router.replace(`/classes?id=${result.id}`);
    } catch (reason) {
      if (reason instanceof ApiError && Object.keys(reason.fieldErrors).length > 0) setErrors(reason.fieldErrors);
      else toast.error(errorMessage(reason));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 pb-10" noValidate>
      <div className="flex flex-col gap-10">
        <Step no={1} title="반 정보">
          <div className="grid grid-cols-2 gap-4">
            <TextField label="반 이름" placeholder="예: 중2 서술형" value={form.name} onChange={set('name')} error={errors.name} />
            <Select
              label="대상 학년"
              options={[7, 8, 9, 10, 11, 12].map((g) => ({ value: g, label: gradeLabel(g) }))}
              value={form.targetGrade}
              onChange={set('targetGrade')}
            />
            <Select
              label="담당 강사"
              placeholder="강사 고르기"
              options={(teachers ?? []).filter((t) => t.isActive).map((t) => ({ value: t.id, label: `${t.name} (${t.subject})` }))}
              value={form.teacherId}
              onChange={set('teacherId')}
              error={errors.teacherId}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="정원" type="number" min={1} value={form.capacity} onChange={set('capacity')} hint="기본 8명" error={errors.capacity} />
              <TextField label="월 수강료" type="number" min={0} step={10000} value={form.monthlyFee} onChange={set('monthlyFee')} error={errors.monthlyFee} />
            </div>
          </div>
          <TextField label="소개 (첫 화면에 보여요)" value={form.intro} onChange={set('intro')} />
        </Step>

        <Step no={2} title="정규 요일">
          {slots.map((slot, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3">
              <Select
                label="요일"
                options={WEEKDAYS.map((d, wd) => ({ value: wd, label: `${d}요일` }))}
                value={slot.weekday}
                onChange={(e) => setSlot(i, { weekday: Number(e.target.value) })}
                error={conflict[i] ? '강사 시간 겹침' : undefined}
              />
              <TextField label="시작" type="time" step={600} value={slot.startTime} onChange={(e) => setSlot(i, { startTime: e.target.value })} />
              <TextField label="끝" type="time" step={600} value={slot.endTime} onChange={(e) => setSlot(i, { endTime: e.target.value })} />
              <Button variant="ghost" size="sm" className="mb-1.5" onClick={() => setSlots(slots.filter((_, j) => j !== i))}>
                빼기
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => setSlots([...slots, { weekday: 1, startTime: '17:00', endTime: '19:00' }])}
          >
            + 요일 추가
          </Button>
        </Step>

        <Step no={3} title="수업일 만들기">
          <div className="flex items-end gap-4">
            <TextField label="만들 달" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />
            <p className="pb-3 text-body-sm text-muted">
              {month.replace('-', '년 ')}월 → 총 <b className="text-fg">{total}회</b>{' '}
              {[...counts.entries()].map(([wd, n]) => `${WEEKDAYS[wd]} ${n}회`).join(' · ')}
            </p>
          </div>
          <p className="text-meta text-subtle">만든 뒤 반 관리에서 날짜별로 휴강 처리하고 보충 수업을 추가할 수 있어요.</p>
        </Step>

        <div className="flex items-center justify-end gap-3 border-t border-line pt-6">
          {blockReason && <span className="text-meta text-err">저장할 수 없어요 · {blockReason}</span>}
          <ButtonLink href="/classes" variant="secondary">
            취소
          </ButtonLink>
          <Button type="submit" loading={busy} disabled={!!blockReason || !form.teacherId}>
            저장
          </Button>
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        <h2 className="text-sec">{teacher ? `${teacher.name} 주간 일정` : '강사 주간 일정'}</h2>
        {!teacher ? (
          <p className="text-body-sm text-subtle">강사를 고르면 맡은 반 시간과 새 반 시간을 같이 보여 줘요.</p>
        ) : (
          <WeekPreview busy={busySlots ?? []} draft={slots} conflict={conflict} name={form.name || '새 반'} />
        )}
      </aside>
    </form>
  );
}

function WeekPreview({ busy, draft, conflict, name }: { busy: TeacherSlot[]; draft: Slot[]; conflict: (TeacherSlot | null)[]; name: string }) {
  const days = [1, 2, 3, 4, 5, 6];
  return (
    <div className="grid grid-cols-6 gap-1 text-meta">
      {days.map((d) => (
        <div key={d} className="flex flex-col gap-1">
          <span className="h-7 text-center leading-7 text-subtle">{WEEKDAYS[d]}</span>
          {busy
            .filter((b) => b.weekday === d)
            .map((b) => (
              <span key={`${b.classId}-${d}`} className="rounded bg-s1 px-1.5 py-1 text-muted">
                {b.className}
                <br />
                {b.startTime}–{b.endTime}
              </span>
            ))}
          {draft.map((s, i) =>
            s.weekday === d ? (
              <span key={`draft-${i}`} className={cn('rounded px-1.5 py-1', conflict[i] ? 'bg-err-c text-err' : 'bg-primary-c text-primary')}>
                {conflict[i] ? '겹침 · ' : '신규 · '}
                {name}
                <br />
                {s.startTime}–{s.endTime}
              </span>
            ) : null,
          )}
        </div>
      ))}
    </div>
  );
}

function Step({ no, title, children }: { no: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center rounded-full bg-fg text-badge text-white">{no}</span>
        <h2 className="text-sec">{title}</h2>
      </div>
      {children}
    </section>
  );
}
