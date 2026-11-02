'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useApi, useMutate } from '@/lib/use-api';

interface MakeupRow {
  id: number;
  status: '신청' | '확정' | '거절';
  studentName: string;
  absenceDate: string;
  absenceClass: string;
  targetDate: string;
  targetTime: string;
  targetClass: string;
  capacity: number;
  headcount: number;
  problem: string | null;
}

interface Needed {
  studentId: number;
  studentName: string;
  absences: number;
  classes: string;
  lastAbsence: string;
}

interface Options {
  absences: { id: number; date: string; className: string; makeupStatus: string | null }[];
  targets: { id: number; date: string; startTime: string; className: string; teacherName: string; capacity: number; headcount: number; problem: string | null }[];
  forAbsenceId: number | null;
}

/** 보강 관리 — final/screens/a-makeups. 신청 확정·거절, 보강 필요(C14)에서 바로 잡기. 강사는 보기만 */
export function MakeupsScreen() {
  const { session } = useAuth();
  const isAdmin = session?.user.role === 'ADMIN';
  const { data, reload } = useApi<MakeupRow[]>('/staff/makeups');
  const { data: needed, reload: reloadNeeded } = useApi<Needed[]>('/staff/makeups/needed');
  const [planning, setPlanning] = useState<Needed | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const mutate = useMutate();
  const toast = useToast();
  const refresh = () => {
    reload();
    reloadNeeded();
  };

  const decide = async (row: MakeupRow, action: 'confirm' | 'reject') => {
    setBusyId(row.id);
    try {
      await mutate(`/admin/makeups/${row.id}/${action}`, 'POST');
      toast.success(action === 'confirm' ? '보강을 확정했어요' : '거절했어요');
      refresh();
    } catch (reason) {
      toast.error(errorMessage(reason));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title={isAdmin ? '보강 관리' : '보강 보기'} className="pt-4" />
      <p className="mb-6 text-body-sm text-muted">
        {isAdmin ? '보강은 결석한 달 안, 같은 학년 다른 반, 그날 인원(원래 + 보강)이 정원 안일 때만 확정돼요.' : '내 반 학생의 보강과 내 반에 들어오는 보강생이에요. 확정은 원장님이 해요.'}
      </p>

      <section className="mb-10 flex flex-col gap-3">
        <h2 className="text-sec">보강 필요 (이번 달 결석 2회 이상 · 보강 없음)</h2>
        {!needed ? (
          <Skeleton className="h-16" />
        ) : needed.length === 0 ? (
          <p className="text-body-sm text-subtle">보강이 필요한 학생이 없어요.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {needed.map((n) => (
              <li key={n.studentId} className="flex min-h-12 items-center gap-3 text-body-sm">
                <span className="w-20 font-medium">{n.studentName}</span>
                <span className="flex-1 text-muted">
                  {n.classes} · 결석 {n.absences}회 · 최근 {n.lastAbsence}
                </span>
                {isAdmin && (
                  <Button size="sm" variant="secondary" onClick={() => setPlanning(n)}>
                    보강 잡기
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sec">보강 신청·일정</h2>
        {!data ? (
          <Skeleton className="h-40" />
        ) : (
          <Table
            rows={data}
            rowKey={(r) => r.id}
            empty={<EmptyState message="보강 신청이 없어요." />}
            columns={[
              { key: 'student', header: '학생', render: (r) => <span className="font-medium">{r.studentName}</span> },
              { key: 'absence', header: '결석한 수업', render: (r) => <span className="text-muted">{r.absenceDate.slice(5)} {r.absenceClass}</span> },
              { key: 'target', header: '들어갈 수업', render: (r) => `${r.targetDate.slice(5)} ${r.targetTime} ${r.targetClass}` },
              { key: 'seats', header: '그날 인원', align: 'right', render: (r) => <span className="tabular-nums">{r.headcount}/{r.capacity}명</span> },
              {
                key: 'status',
                header: '상태',
                render: (r) =>
                  r.status === '신청' && r.problem ? (
                    <span className="text-meta text-err">{r.problem}</span>
                  ) : (
                    <StatusBadge status={r.status} />
                  ),
              },
              {
                key: 'act',
                header: '처리',
                align: 'right',
                render: (r) =>
                  isAdmin && r.status === '신청' ? (
                    <span className="inline-flex gap-1">
                      <Button size="sm" variant="secondary" disabled={!!r.problem} loading={busyId === r.id} onClick={() => decide(r, 'confirm')}>
                        확정
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => decide(r, 'reject')}>
                        거절
                      </Button>
                    </span>
                  ) : null,
              },
            ]}
          />
        )}
      </section>

      {planning && (
        <PlanDialog
          student={planning}
          onClose={() => setPlanning(null)}
          onDone={() => {
            setPlanning(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

/** 원장이 보강을 바로 잡는다 = 신청 + 확정 */
function PlanDialog({ student, onClose, onDone }: { student: Needed; onClose: () => void; onDone: () => void }) {
  const { data } = useApi<Options>(`/admin/makeups/options?studentId=${student.studentId}`);
  const [target, setTarget] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const mutate = useMutate();
  const toast = useToast();

  async function save() {
    if (!data?.forAbsenceId || !target) return;
    setBusy(true);
    try {
      const made = await mutate<{ id: number }>('/admin/makeups', 'POST', { absenceAttendanceId: data.forAbsenceId, targetSessionId: target });
      await mutate(`/admin/makeups/${made.id}/confirm`, 'POST');
      toast.success('보강을 확정했어요');
      onDone();
    } catch (reason) {
      toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const absence = data?.absences.find((a) => a.id === data.forAbsenceId);
  return (
    <Modal
      open
      onClose={onClose}
      title={`${student.studentName} 보강 잡기`}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={save} loading={busy} disabled={!target}>
            확정
          </Button>
        </>
      }
    >
      {!data ? (
        <Skeleton className="h-32" />
      ) : !absence ? (
        <p>보강을 잡을 결석이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p>
            {absence.date} {absence.className} 결석분을 채워요. 들어갈 수업을 골라 주세요.
          </p>
          <ul className="flex max-h-72 flex-col divide-y divide-line overflow-y-auto">
            {data.targets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={!!t.problem}
                  onClick={() => setTarget(t.id)}
                  className={cn('flex w-full items-center gap-3 px-2 py-2.5 text-left text-body-sm disabled:cursor-not-allowed', target === t.id ? 'bg-primary-c' : 'hover:bg-s1', t.problem && 'opacity-50')}
                >
                  <span className="w-28 tabular-nums text-fg">
                    {t.date.slice(5)} {t.startTime}
                  </span>
                  <span className="flex-1 text-fg">{t.className}</span>
                  <span className="text-meta">{t.problem ?? `${t.headcount}/${t.capacity}명`}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
