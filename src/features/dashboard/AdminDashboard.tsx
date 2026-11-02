'use client';

import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stat } from '@/components/ui/Stat';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { EmptyState, Skeleton } from '@/components/ui/states';
import type { ClassRow } from '@/features/classes/types';
import { cn } from '@/lib/cn';
import { scheduleLabel, won } from '@/lib/format';
import { useApi } from '@/lib/use-api';

interface Rate {
  studentId: number;
  name: string;
  classes: string | null;
  출석: number;
  지각: number;
  결석: number;
  total: number;
  convertedAbsence: number;
  rate: number | null;
}

interface Dashboard {
  month: string;
  today: string;
  revenue: { billed: number; received: number; unpaid: number; siblingDiscount: number; refunds: number };
  students: { active: number; newThisMonth: number; endedThisMonth: number };
  pending: { enrollments: number; refunds: number; makeups: number };
  averageRate: number | null;
  classes: ClassRow[];
  rates: Rate[];
  needsMakeup: { studentId: number; studentName: string; absences: number; classes: string; lastAbsence: string }[];
  unpaid: { enrollmentId: number; studentName: string; familyName: string; className: string; listPrice: number; discount: number; charge: number; siblingOrder: number }[];
}

/** 관리자 대시보드 — final/screens/a-dash. 할 일 → 수입 → 학생·반 → C13·C14·C15 */
export function AdminDashboard() {
  const { data } = useApi<Dashboard>('/admin/dashboard');
  if (!data) return <Skeleton className="mt-6 h-96" />;
  const capacity = data.classes.reduce((s, c) => s + (c.isActive ? c.capacity : 0), 0);
  const seated = data.classes.reduce((s, c) => s + (c.isActive ? c.enrolled : 0), 0);

  return (
    <div className="flex flex-col gap-10 pb-10">
      <PageHeader title={`${Number(data.month.slice(5))}월 대시보드`} className="pt-4" />

      <section className="-mt-6 flex flex-wrap gap-2">
        <TodoLink href="/enrollments" label="승인 대기" count={data.pending.enrollments} />
        <TodoLink href="/makeups" label="보강 대기" count={data.pending.makeups} />
        <TodoLink href="/enrollments" label="환불 요청" count={data.pending.refunds} />
        <TodoLink href="/makeups" label="보강 필요" count={data.needsMakeup.length} />
        <TodoLink href="/accounting" label="미납" count={data.unpaid.length} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sec">이번 달 수입</h2>
        <div className="grid grid-cols-5 gap-6">
          <Stat label="청구 합계" value={won(data.revenue.billed)} sub={`형제 할인 −${won(data.revenue.siblingDiscount)} 반영`} />
          <Stat label="수납" value={won(data.revenue.received)} sub={data.revenue.billed ? `${Math.round((data.revenue.received / data.revenue.billed) * 100)}%` : undefined} />
          <Stat label="미납" value={won(data.revenue.unpaid)} sub={`${data.unpaid.length}건`} />
          <Stat label="환불" value={won(data.revenue.refunds)} sub="이번 달 확정" />
          <Stat label="평균 출석률" value={data.averageRate === null ? '—' : `${data.averageRate}%`} sub="지각 3 = 결석 1" />
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10">
        <div className="flex flex-col gap-4">
          <h2 className="text-sec">학생</h2>
          <div className="grid grid-cols-3 gap-6">
            <Stat label="수강 중" value={`${data.students.active}명`} sub={`정원 ${capacity}명 중 ${seated}자리`} />
            <Stat label="이번 달 신규" value={`${data.students.newThisMonth}명`} />
            <Stat label="이번 달 수강종료" value={`${data.students.endedThisMonth}명`} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <h2 className="flex-1 text-sec">반별 정원</h2>
            <Link href="/classes" className="text-meta text-muted hover:text-fg">
              반 관리 ›
            </Link>
          </div>
          <ul className="flex flex-col gap-2.5">
            {data.classes
              .filter((c) => c.isActive)
              .map((c) => (
                <li key={c.id} className="flex items-center gap-3 text-body-sm">
                  <span className="w-24 font-medium">{c.name}</span>
                  <span className="w-36 text-meta text-muted">{scheduleLabel(c.schedules)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-s1" aria-hidden>
                    <span className={cn('block h-full rounded-full', c.enrolled >= c.capacity ? 'bg-fg' : 'bg-primary')} style={{ width: `${Math.min(100, (c.enrolled / c.capacity) * 100)}%` }} />
                  </span>
                  <span className="w-14 text-right tabular-nums">
                    {c.enrolled}/{c.capacity}
                  </span>
                  {c.enrolled >= c.capacity && <StatusBadge status="마감" tone="gray" />}
                </li>
              ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-sec">보강 필요 · 결석 2회 이상, 보강 없음</h2>
          {data.needsMakeup.length === 0 ? (
            <p className="text-body-sm text-subtle">보강이 필요한 학생이 없어요.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {data.needsMakeup.map((n) => (
                <li key={n.studentId} className="flex min-h-12 items-center gap-3 text-body-sm">
                  <span className="w-16 font-medium">{n.studentName}</span>
                  <span className="flex-1 text-muted">
                    {n.classes} · 결석 {n.absences}회 · 최근 {n.lastAbsence.slice(5)}
                  </span>
                  <ButtonLink href="/makeups" size="sm" variant="secondary">
                    보강 잡기
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <h2 className="flex-1 text-sec">이번 달 미납 · 형제 할인 반영</h2>
            <Link href="/accounting" className="text-meta text-muted hover:text-fg">
              회계 ›
            </Link>
          </div>
          <Table
            rows={data.unpaid}
            rowKey={(r) => r.enrollmentId}
            empty={<p className="text-body-sm text-subtle">미납이 없어요.</p>}
            columns={[
              { key: 'student', header: '학생', render: (r) => <span className="font-medium">{r.studentName}</span> },
              { key: 'class', header: '반', render: (r) => r.className },
              { key: 'note', header: '할인', render: (r) => (r.discount ? <span className="text-meta text-primary">{r.siblingOrder}번째 10%</span> : <span className="text-subtle">—</span>) },
              { key: 'charge', header: '청구액', align: 'right', render: (r) => <span className="tabular-nums">{won(r.charge)}원</span> },
            ]}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sec">학생별 이번 달 출석률 · 지각 3번 = 결석 1번</h2>
        <Table
          rows={data.rates}
          rowKey={(r) => r.studentId}
          empty={<EmptyState message="이번 달 출결이 아직 없어요." />}
          columns={[
            { key: 'name', header: '학생', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'classes', header: '반', render: (r) => <span className="text-muted">{r.classes ?? '—'}</span> },
            { key: 'count', header: '출석·지각·결석', render: (r) => <span className="tabular-nums">{r.출석} · {r.지각} · {r.결석}</span> },
            { key: 'conv', header: '환산 결석', align: 'right', render: (r) => <span className="tabular-nums">{r.convertedAbsence}회</span> },
            {
              key: 'rate',
              header: '출석률',
              align: 'right',
              render: (r) => <span className={cn('font-bold tabular-nums', r.rate !== null && r.rate < 80 && 'text-err')}>{r.rate === null ? '—' : `${r.rate}%`}</span>,
            },
          ]}
        />
      </section>
    </div>
  );
}

function TodoLink({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link href={href} className={cn('flex h-9 items-center gap-2 rounded-full px-4 text-body-sm', count ? 'bg-primary-c text-fg' : 'bg-s1 text-subtle')}>
      {label}
      <b className={cn('tabular-nums', count ? 'text-primary' : '')}>{count}</b>
    </Link>
  );
}
