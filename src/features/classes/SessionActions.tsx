'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { ApiError, errorMessage } from '@/lib/api';
import { useMutate } from '@/lib/use-api';
import type { Session } from './types';

/** 수업일 조정: 휴강 처리(+같은 반 보충), 휴강 없이 보충 수업 추가 (결정14·35) */
export function SessionActions({
  classId,
  sessions,
  picked,
  onClosePicked,
  onChanged,
}: {
  classId: number;
  sessions: Session[];
  picked: Session | null;
  onClosePicked: () => void;
  onChanged: () => void;
}) {
  const [extraOpen, setExtraOpen] = useState(false);
  const mutate = useMutate();
  const adjusted = sessions.filter((s) => s.status === '휴강' || s.kind === '보충');
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center">
        <h3 className="flex-1 text-sec">수업일 조정</h3>
        <Button variant="secondary" size="sm" onClick={() => setExtraOpen(true)}>
          보충 수업 추가
        </Button>
      </div>
      {adjusted.length === 0 ? (
        <p className="text-body-sm text-subtle">이 달은 휴강·보충이 없어요.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {adjusted.map((s) => (
            <li key={s.id} className="flex min-h-11 items-center gap-3 text-body-sm">
              <StatusBadge status={s.status === '휴강' ? '휴강' : '보충'} />
              <span className="w-40 tabular-nums">
                {s.date} {s.startTime}~{s.endTime}
              </span>
              <span className="flex-1 text-muted">
                {s.status === '휴강'
                  ? `→ ${sessions.find((x) => x.replacesSessionId === s.id)?.date ?? '보충 없음'}`
                  : s.replacesSessionId
                    ? `${sessions.find((x) => x.id === s.replacesSessionId)?.date ?? ''} 휴강 대체`
                    : (s.memo ?? '추가 보충')}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-meta text-subtle">이 반 학생은 수강생으로, 다른 반 학생은 보강으로 보충 수업에 들어와요.</p>

      <SessionDialog
        title={picked ? `${picked.date} 휴강 처리` : ''}
        open={picked !== null}
        cancelMode
        onClose={onClosePicked}
        submit={(body) => (picked ? mutate(`/admin/sessions/${picked.id}/cancel`, 'POST', body) : Promise.resolve())}
        onDone={onChanged}
        defaultDate={picked?.date}
        defaultTime={picked ? [picked.startTime, picked.endTime] : undefined}
      />
      <SessionDialog
        title="보충 수업 추가"
        open={extraOpen}
        onClose={() => setExtraOpen(false)}
        submit={(body) => mutate(`/admin/classes/${classId}/extra-sessions`, 'POST', body)}
        onDone={() => {
          setExtraOpen(false);
          onChanged();
        }}
      />
    </section>
  );
}

function SessionDialog({
  title,
  open,
  cancelMode,
  onClose,
  submit,
  onDone,
  defaultDate,
  defaultTime,
}: {
  title: string;
  open: boolean;
  cancelMode?: boolean;
  onClose: () => void;
  submit: (body: unknown) => Promise<unknown>;
  onDone: () => void;
  defaultDate?: string;
  defaultTime?: [string, string];
}) {
  const toast = useToast();
  const [withExtra, setWithExtra] = useState<'yes' | 'no'>('yes');
  const [form, setForm] = useState({ date: '', startTime: defaultTime?.[0] ?? '14:00', endTime: defaultTime?.[1] ?? '16:00', memo: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function run(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const slot = { date: form.date, startTime: form.startTime, endTime: form.endTime, memo: form.memo || undefined };
      await submit(cancelMode ? { memo: form.memo || undefined, replacement: withExtra === 'yes' ? slot : undefined } : slot);
      toast.success(cancelMode ? '휴강 처리했어요' : '보충 수업을 추가했어요');
      setForm({ ...form, date: '', memo: '' });
      onDone();
    } catch (reason) {
      if (reason instanceof ApiError && Object.keys(reason.fieldErrors).length > 0) setErrors(reason.fieldErrors);
      else toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const showSlot = !cancelMode || withExtra === 'yes';
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" form={`session-${cancelMode ? 'cancel' : 'extra'}`} variant={cancelMode ? 'danger' : 'primary'} loading={busy}>
            {cancelMode ? '휴강 처리' : '추가'}
          </Button>
        </>
      }
    >
      <form id={`session-${cancelMode ? 'cancel' : 'extra'}`} onSubmit={run} className="flex flex-col gap-4">
        {cancelMode && (
          <>
            <p>
              {defaultDate} 수업을 휴강으로 바꿔요. 휴강한 수업은 환불 계산에서 빠지고, 출결을 넣을 수 없어요.
            </p>
            <SegmentedControl
              label="보충"
              options={[
                { value: 'yes', label: '보충 수업 같이 만들기' },
                { value: 'no', label: '휴강만' },
              ]}
              value={withExtra}
              onChange={setWithExtra}
            />
          </>
        )}
        {showSlot && (
          <div className="grid grid-cols-3 gap-3">
            <TextField label="보충 날짜" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} error={errors.date ?? errors['replacement.date']} />
            <TextField label="시작" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <TextField label="끝" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
        )}
        <TextField label={cancelMode ? '휴강 사유 (선택)' : '보충 사유 (선택)'} placeholder={cancelMode ? '예: 학원 정기 방역' : '예: 기말 대비'} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
      </form>
    </Modal>
  );
}
