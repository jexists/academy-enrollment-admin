"use client";

import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table } from "@/components/ui/Table";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/use-api";
import { WeekSessions, type WeekSession } from "./WeekSessions";

interface TeacherDash {
  today: string;
  week: { from: string; to: string; sessions: WeekSession[] };
  todaySessions: WeekSession[];
  rates: {
    studentId: number;
    name: string;
    classes: string | null;
    rate: number | null;
    결석: number;
    지각: number;
  }[];
  needsMakeup: {
    studentId: number;
    studentName: string;
    absences: number;
    classes: string;
  }[];
  incoming: {
    studentName: string;
    date: string;
    startTime: string;
    className: string;
    fromClass: string;
  }[];
}

/** 강사 대시보드 — final/screens/a-dash-staff. 오늘 수업 → 이번 주 → 내 반 학생 → 보강 */
export function TeacherDashboard() {
  const { session } = useAuth();
  const { data } = useApi<TeacherDash>("/staff/dashboard");
  if (!data) return <Skeleton className="mt-6 h-96" />;
  const next = data.todaySessions.find(
    (s) => s.status === "정상" && !s.recorded,
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader title={`${session?.user.name} 대시보드`} className="pt-4" />
      <section className="card flex items-center gap-4">
        {data.todaySessions.length === 0 ? (
          <p className="text-body text-muted">오늘은 수업이 없어요.</p>
        ) : (
          <>
            <div className="flex-1">
              <p className="text-meta text-muted">오늘 수업</p>
              <p className="text-sec">
                {data.todaySessions
                  .map(
                    (s) =>
                      `${s.startTime} ${s.className}${s.makeups ? ` (보강 ${s.makeups}명)` : ""}`,
                  )
                  .join(" · ")}
              </p>
            </div>
            {next && (
              <ButtonLink href={`/attendance?date=${data.today}`}>
                출결 입력
              </ButtonLink>
            )}
          </>
        )}
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-sec">이번 주 내 수업</h2>
        <WeekSessions
          from={data.week.from}
          sessions={data.week.sessions}
          today={data.today}
        />
      </section>

      <section className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6">
        <div className="card flex flex-col gap-3">
          <h2 className="text-sec">내 반 학생 · 이번 달 출석률</h2>
          <Table
            rows={data.rates}
            rowKey={(r) => r.studentId}
            empty={<EmptyState message="이번 달 출결이 아직 없어요." />}
            columns={[
              {
                key: "name",
                header: "학생",
                render: (r) => <span className="font-medium">{r.name}</span>,
              },
              {
                key: "class",
                header: "반",
                render: (r) => <span className="text-muted">{r.classes}</span>,
              },
              {
                key: "abs",
                header: "결석·지각",
                render: (r) => (
                  <span className="tabular-nums">
                    {r.결석} · {r.지각}
                  </span>
                ),
              },
              {
                key: "rate",
                header: "출석률",
                align: "right",
                render: (r) => (
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      r.rate !== null && r.rate < 80 && "text-err",
                    )}
                  >
                    {r.rate === null ? "—" : `${r.rate}%`}
                  </span>
                ),
              },
            ]}
          />
        </div>
        <div className="card flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-sec">보강 필요 (결석 2회↑ · 보강 없음)</h2>
            {data.needsMakeup.length === 0 ? (
              <p className="text-body-sm text-subtle">없어요.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {data.needsMakeup.map((n) => (
                  <li
                    key={n.studentId}
                    className="flex min-h-11 items-center gap-2 text-body-sm"
                  >
                    <span className="font-medium">{n.studentName}</span>
                    <span className="text-muted">
                      {n.classes} · 결석 {n.absences}회
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-meta text-subtle">보강 확정은 원장님이 해요.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-sec">내 반에 들어오는 보강생</h2>
            {data.incoming.length === 0 ? (
              <p className="text-body-sm text-subtle">이번 주는 없어요.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {data.incoming.map((m, i) => (
                  <li
                    key={i}
                    className="flex min-h-11 items-center gap-2 text-body-sm"
                  >
                    <span className="tabular-nums text-muted">
                      {m.date.slice(5)} {m.startTime}
                    </span>
                    <span className="font-medium">{m.studentName}</span>
                    <span className="text-meta text-subtle">{m.fromClass}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
