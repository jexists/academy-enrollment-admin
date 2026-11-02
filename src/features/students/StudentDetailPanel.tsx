'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { IssuedPasswords, type Issued } from '@/features/common/IssuedPasswords';
import { ApiError, errorMessage } from '@/lib/api';
import { useApi, useMutate } from '@/lib/use-api';
import { NOTE_CATEGORIES, type School, type StudentDetail } from './types';

type Tab = 'basic' | 'history' | 'notes';
type Dialog = 'school' | 'grade' | 'note' | null;

const today = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

/** 학생 상세 — final/screens/a-students 오른쪽. 탭: 기본 · 학적 이력 · 상담·메모 */
export function StudentDetailPanel({ studentId, onChanged }: { studentId: number; onChanged: () => void }) {
  const { data, error, setData } = useApi<StudentDetail>(`/admin/students/${studentId}`);
  const [tab, setTab] = useState<Tab>('basic');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [issued, setIssued] = useState<Issued[] | null>(null);
  const mutate = useMutate();
  const toast = useToast();

  if (error) return <EmptyState message={error} />;
  if (!data) {
    return (
      <div className="flex flex-col gap-3 pt-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const updated = (next: StudentDetail, message: string) => {
    setData(next);
    setDialog(null);
    toast.success(message);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-page">{data.name}</h2>
          <StatusBadge status={data.accountStatus} />
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={async () => {
              try {
                const result = await mutate<{ email: string; password: string }>(
                  `/admin/students/${data.id}/reset-password`,
                  'POST',
                );
                setIssued([{ name: data.name, ...result }]);
              } catch (reason) {
                toast.error(errorMessage(reason));
              }
            }}
          >
            비번 리셋
          </Button>
        </div>
        <p className="text-body-sm text-muted">
          {data.gradeLabel} · {data.schoolName ?? '학교 없음'} · {data.birthDate} ({data.age}세)
        </p>
        <p className="text-meta text-subtle">
          입학일자 {data.enteredOn ?? '—'} 기준으로 학년을 계산해요 · {data.familyName} {data.siblingOrder}번째
          {data.siblingOrder >= 2 && <span className="ml-1 text-primary">형제 할인 10%</span>}
        </p>
      </header>

      <Tabs
        tabs={[
          { value: 'basic', label: '기본' },
          { value: 'history', label: '학적 이력' },
          { value: 'notes', label: `상담·메모 ${data.notes.length}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'basic' && <BasicTab data={data} />}
      {tab === 'history' && <HistoryTab data={data} onOpen={setDialog} />}
      {tab === 'notes' && <NotesTab data={data} onOpen={() => setDialog('note')} />}

      <SchoolChangeDialog
        open={dialog === 'school'}
        onClose={() => setDialog(null)}
        submit={(body) => mutate<StudentDetail>(`/admin/students/${data.id}/school-history`, 'POST', body)}
        onDone={(next) => updated(next, '학적 이력을 추가했어요')}
      />
      <GradeDialog
        open={dialog === 'grade'}
        onClose={() => setDialog(null)}
        submit={(body) => mutate<StudentDetail>(`/admin/students/${data.id}/grade-adjustments`, 'POST', body)}
        onDone={(next) => updated(next, '학년 보정을 저장했어요')}
      />
      <NoteDialog
        open={dialog === 'note'}
        data={data}
        onClose={() => setDialog(null)}
        submit={(body) => mutate<StudentDetail>(`/admin/students/${data.id}/notes`, 'POST', body)}
        onDone={(next) => updated(next, '메모를 저장했어요')}
      />
      <IssuedPasswords
        open={issued !== null}
        title="학생 비밀번호를 리셋했어요"
        issued={issued ?? []}
        onClose={() => {
          setIssued(null);
          onChanged();
        }}
      />
    </div>
  );
}

function BasicTab({ data }: { data: StudentDetail }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h3 className="text-sec">보호자</h3>
        <ul className="flex flex-col divide-y divide-line">
          {data.guardians.map((g) => (
            <li key={g.id} className="flex min-h-12 items-center gap-3 text-body-sm">
              <span className="w-6 text-muted">{g.relation}</span>
              <span className="w-20 font-medium">{g.name}</span>
              <span className="w-32 tabular-nums text-muted">{g.phone}</span>
              <span className="flex-1 truncate text-muted">{g.email ?? '이메일 없음'}</span>
              {g.email ? <StatusBadge status="계정 있음" tone="ok" /> : <StatusBadge status="연락처만" tone="gray" />}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sec">학생 계정</h3>
        <p className="text-body-sm text-muted">{data.email} · 등록일 {data.registeredAt}</p>
      </section>
      {data.siblings.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sec">형제</h3>
          <p className="text-body-sm text-muted">{data.siblings.map((s) => s.name).join(', ')}</p>
        </section>
      )}
      <p className="text-meta text-subtle">수강·출결·성적 탭은 3단계 다음 항목에서 붙여요.</p>
    </div>
  );
}

function HistoryTab({ data, onOpen }: { data: StudentDetail; onOpen: (d: Dialog) => void }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-center">
          <h3 className="flex-1 text-sec">학적 이력</h3>
          <Button variant="secondary" size="sm" onClick={() => onOpen('school')}>
            학교 변경
          </Button>
        </div>
        <ol className="flex flex-col divide-y divide-line">
          {data.history.map((h) => (
            <li key={h.id} className="flex min-h-12 items-center gap-3 py-2 text-body-sm">
              <span className="w-24 tabular-nums text-muted">{h.effectiveFrom}</span>
              <StatusBadge status={h.changeType} tone={h.changeType === '처음등록' ? 'gray' : 'info'} />
              <span className="font-medium">{h.schoolName}</span>
              <span className="text-meta text-subtle">{h.region}</span>
              <span className="flex-1 text-right text-meta text-muted">{h.memo}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="flex flex-col gap-2">
        <div className="flex items-center">
          <h3 className="flex-1 text-sec">학년 보정</h3>
          <Button variant="secondary" size="sm" onClick={() => onOpen('grade')}>
            보정 추가
          </Button>
        </div>
        {data.adjustments.length === 0 ? (
          <p className="text-body-sm text-subtle">보정 없음 — 입학일자로 계산한 학년 그대로예요.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {data.adjustments.map((a) => (
              <li key={a.id} className="flex min-h-12 items-center gap-3 text-body-sm">
                <span className="w-24 tabular-nums text-muted">{a.effectiveFrom}</span>
                <span className="w-10 font-bold tabular-nums">{a.delta > 0 ? `+${a.delta}` : a.delta}</span>
                <span className="flex-1">{a.reason}</span>
                <span className="text-meta text-subtle">{a.staffName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NotesTab({ data, onOpen }: { data: StudentDetail; onOpen: () => void }) {
  const [category, setCategory] = useState<string>('전체');
  const rows = category === '전체' ? data.notes : data.notes.filter((n) => n.category === category);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <FilterChips
          options={['전체', ...NOTE_CATEGORIES].map((c) => ({ value: c, label: c }))}
          value={category}
          onChange={setCategory}
          className="flex-1"
        />
        <Button variant="secondary" size="sm" onClick={onOpen}>
          메모 추가
        </Button>
      </div>
      <p className="text-meta text-subtle">내부용 — 학부모와 학생에게는 안 보여요.</p>
      {rows.length === 0 ? (
        <EmptyState message="메모가 없어요." />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((n) => (
            <li key={n.id} className="flex gap-3 py-3 text-body-sm">
              <span className="w-20 shrink-0 tabular-nums text-muted">{n.notedOn}</span>
              <span className="w-24 shrink-0 text-muted">{n.target}</span>
              <StatusBadge status={n.category} tone="info" />
              <span className="flex-1">{n.content}</span>
              <span className="shrink-0 text-meta text-subtle">{n.authorName ?? '시스템'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 서버 거절은 Toast, 칸 오류는 칸 아래 */
function useFormSubmit<T>(submit: (body: unknown) => Promise<T>, onDone: (result: T) => void) {
  const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const run = async (event: FormEvent, body: unknown) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      onDone(await submit(body));
    } catch (reason) {
      if (reason instanceof ApiError && Object.keys(reason.fieldErrors).length > 0) setErrors(reason.fieldErrors);
      else toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return { errors, busy, run };
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  submit: (body: unknown) => Promise<StudentDetail>;
  onDone: (next: StudentDetail) => void;
}

function SchoolChangeDialog({ open, onClose, submit, onDone }: DialogProps) {
  const { data: schools } = useApi<School[]>(open ? '/admin/schools' : null);
  const [form, setForm] = useState({ schoolId: '', changeType: '전학' as '전학' | '진학', enteredOn: today(), effectiveFrom: today(), memo: '' });
  const { errors, busy, run } = useFormSubmit(submit, onDone);
  const options = (schools ?? [])
    .filter((s) => (form.changeType === '진학' ? s.level === '고' : true))
    .map((s) => ({ value: s.id, label: `${s.name} · ${s.region}` }));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="학교 변경"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" form="school-change" loading={busy}>
            추가
          </Button>
        </>
      }
    >
      <form
        id="school-change"
        className="flex flex-col gap-4"
        onSubmit={(e) => run(e, { ...form, schoolId: Number(form.schoolId) })}
      >
        <SegmentedControl
          label="변경 종류"
          options={[
            { value: '전학', label: '전학' },
            { value: '진학', label: '진학 (중→고)' },
          ]}
          value={form.changeType}
          onChange={(changeType) => setForm({ ...form, changeType, schoolId: '' })}
        />
        <Select
          label="새 학교"
          placeholder="학교 고르기"
          options={options}
          value={form.schoolId}
          onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
          error={errors.schoolId}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="입학일자"
            type="date"
            value={form.enteredOn}
            onChange={(e) => setForm({ ...form, enteredOn: e.target.value })}
            hint={form.changeType === '전학' ? '전학은 원래 입학일 그대로' : '고등학교 입학일'}
            error={errors.enteredOn}
          />
          <TextField
            label="바뀐 날"
            type="date"
            value={form.effectiveFrom}
            onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
            error={errors.effectiveFrom}
          />
        </div>
        <TextField label="메모 (선택)" placeholder="예: 이사로 전학" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
      </form>
    </Modal>
  );
}

function GradeDialog({ open, onClose, submit, onDone }: DialogProps) {
  const [form, setForm] = useState({ delta: '-1', reason: '', effectiveFrom: today() });
  const { errors, busy, run } = useFormSubmit(submit, onDone);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="학년 보정"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" form="grade-adjust" loading={busy}>
            저장
          </Button>
        </>
      }
    >
      <p className="mb-4">유급·휴학·조기 진급처럼 입학일자로 계산한 학년과 다를 때만 넣어요.</p>
      <form id="grade-adjust" className="flex flex-col gap-4" onSubmit={(e) => run(e, { ...form, delta: Number(form.delta) })}>
        <SegmentedControl
          label="보정"
          options={[
            { value: '-1', label: '−1 (한 학년 아래)' },
            { value: '1', label: '+1 (한 학년 위)' },
          ]}
          value={form.delta}
          onChange={(delta) => setForm({ ...form, delta })}
        />
        <TextField label="사유" placeholder="예: 휴학 후 복학" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} error={errors.reason} />
        <TextField label="적용일" type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} error={errors.effectiveFrom} />
      </form>
    </Modal>
  );
}

function NoteDialog({ open, onClose, submit, onDone, data }: DialogProps & { data: StudentDetail }) {
  const [form, setForm] = useState({ target: 'student', parentProfileId: '', category: '상담', notedOn: today(), content: '' });
  const { errors, busy, run } = useFormSubmit(submit, (next: StudentDetail) => {
    setForm((f) => ({ ...f, content: '' }));
    onDone(next);
  });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="메모 추가"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" form="note-add" loading={busy}>
            저장
          </Button>
        </>
      }
    >
      <form
        id="note-add"
        className="flex flex-col gap-4"
        onSubmit={(e) =>
          run(e, { ...form, parentProfileId: form.parentProfileId ? Number(form.parentProfileId) : undefined })
        }
      >
        <SegmentedControl
          label="대상"
          options={[
            { value: 'student', label: data.name },
            { value: 'parent', label: '보호자' },
            { value: 'family', label: '가족' },
          ]}
          value={form.target}
          onChange={(target) => setForm({ ...form, target })}
        />
        {form.target === 'parent' && (
          <Select
            label="보호자"
            placeholder="보호자 고르기"
            options={data.guardians.map((g) => ({ value: g.id, label: `${g.name} (${g.relation})` }))}
            value={form.parentProfileId}
            onChange={(e) => setForm({ ...form, parentProfileId: e.target.value })}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="종류"
            options={NOTE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <TextField label="날짜" type="date" value={form.notedOn} onChange={(e) => setForm({ ...form, notedOn: e.target.value })} />
        </div>
        <TextArea label="내용" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} error={errors.content} />
      </form>
    </Modal>
  );
}
