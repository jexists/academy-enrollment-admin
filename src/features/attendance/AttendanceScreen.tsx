"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useApi, useMutate } from "@/lib/use-api";

interface SessionItem {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: "정상" | "휴강";
  kind: "정규" | "보충";
  className: string;
  teacherName: string;
  recorded: number;
}

interface Roster {
  session: {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    className: string;
  };
  students: {
    studentId: number;
    name: string;
    attendType: "수강" | "보강";
    fromClass: string | null;
    noteCount: number;
    record: {
      status: "출석" | "지각" | "결석";
      arrivedAt: string | null;
    } | null;
  }[];
}

type Mark = { status: "출석" | "지각" | "결석" | null; arrivedAt: string };
const today = () =>
  new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const minutesLate = (start: string, arrived: string) =>
  Number(arrived.slice(0, 2)) * 60 +
  Number(arrived.slice(3, 5)) -
  (Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5)));

/** 출결 입력 — final/screens/a-attendance. 강사는 담당 반만, 지각이면 도착 시각 → 몇 분 늦었는지 자동 (B10, 결정36) */
export function AttendanceScreen() {
  const { session: auth } = useAuth();
  const params = useSearchParams();
  // 대시보드·내 스케줄에서 ?date=로 들어오면 그날부터
  const [date, setDate] = useState(() => params.get("date") ?? today());
  const { data: sessions, reload: reloadSessions } = useApi<SessionItem[]>(
    `/staff/sessions?date=${date}`,
  );
  const [picked, setPicked] = useState<number | null>(null);
  const sessionId =
    picked ?? sessions?.find((s) => s.status === "정상")?.id ?? null;
  const { data: roster, reload } = useApi<Roster>(
    sessionId ? `/staff/sessions/${sessionId}/roster` : null,
  );
  const [marks, setMarks] = useState<Record<number, Mark>>({});
  const [busy, setBusy] = useState(false);
  const mutate = useMutate();
  const toast = useToast();

  useEffect(() => {
    if (!roster) return;
    const next: Record<number, Mark> = {};
    for (const s of roster.students)
      next[s.studentId] = {
        status: s.record?.status ?? null,
        arrivedAt: s.record?.arrivedAt ?? "",
      };
    // 서버에서 받은 출결로 입력칸을 맞춘다 (다른 수업을 고를 때마다)
    queueMicrotask(() => setMarks(next));
  }, [roster]);

  const counts = { 출석: 0, 지각: 0, 결석: 0 };
  Object.values(marks).forEach((m) => m.status && counts[m.status]++);
  const missing =
    roster?.students.filter((s) => !marks[s.studentId]?.status).length ?? 0;
  const lateWithoutTime = roster?.students.find(
    (s) =>
      marks[s.studentId]?.status === "지각" && !marks[s.studentId]?.arrivedAt,
  );
  const future = roster ? roster.session.date > today() : false;
  const blockReason = future
    ? "아직 열리지 않은 수업이에요"
    : missing
      ? `${missing}명 출결을 골라 주세요`
      : lateWithoutTime
        ? `${lateWithoutTime.name}의 도착 시각을 적어 주세요`
        : null;

  async function save() {
    if (!roster) return;
    setBusy(true);
    try {
      await mutate(`/staff/sessions/${roster.session.id}/attendance`, "PUT", {
        rows: roster.students.map((s) => ({
          studentId: s.studentId,
          status: marks[s.studentId].status,
          arrivedAt: marks[s.studentId].arrivedAt || undefined,
        })),
      });
      toast.success("출결을 저장했어요");
      reload();
      reloadSessions(); // 왼쪽 목록의 미입력 → 입력함 (QA BUG-015)
    } catch (reason) {
      toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={auth?.user.role === "ADMIN" ? "반 출결 관리" : "출결 입력"}
        className="pt-4"
      />
      <div className="mt-2 grid grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-6">
        <section className="card flex h-fit flex-col gap-3">
          <TextField
            label="날짜"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPicked(null);
            }}
          />
          {!sessions ? (
            <Skeleton className="h-32" />
          ) : sessions.length === 0 ? (
            <EmptyState message="이 날 수업이 없어요." />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={s.status === "휴강"}
                    onClick={() => setPicked(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-2 py-3 text-left disabled:opacity-40",
                      sessionId === s.id ? "bg-primary-c" : "hover:bg-s1",
                    )}
                  >
                    <span className="w-12 text-meta tabular-nums text-muted">
                      {s.startTime}
                    </span>
                    <span className="flex-1 text-body-sm font-medium">
                      {s.className}
                    </span>
                    {s.kind === "보충" && <StatusBadge status="보충" />}
                    {s.status === "휴강" ? (
                      <StatusBadge status="휴강" />
                    ) : s.recorded ? (
                      <StatusBadge status="입력함" tone="ok" />
                    ) : (
                      <StatusBadge status="미입력" tone="warn" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {auth?.user.role === "TEACHER" && (
            <p className="text-meta text-subtle">담당 반 수업만 보여요.</p>
          )}
        </section>

        <section className="card min-w-0">
          {!roster ? (
            sessionId ? (
              <Skeleton className="h-64" />
            ) : (
              <EmptyState message="수업을 고르면 학생 목록이 나와요." />
            )
          ) : (
            <div className="flex flex-col gap-4">
              <header className="flex items-end gap-3">
                <div className="flex-1">
                  <h2 className="text-page">{roster.session.className}</h2>
                  <p className="text-body-sm text-muted">
                    {roster.session.date} {roster.session.startTime}~
                    {roster.session.endTime} · {roster.students.length}명
                    {roster.students.some((s) => s.attendType === "보강") &&
                      ` (보강 ${roster.students.filter((s) => s.attendType === "보강").length}명 포함)`}
                  </p>
                </div>
                <span className="text-meta text-muted">
                  출석 {counts.출석} · 지각 {counts.지각} · 결석 {counts.결석}
                </span>
              </header>
              {roster.students.length === 0 ? (
                <EmptyState message="이 수업 학생이 없어요." />
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {roster.students.map((s) => {
                    const mark = marks[s.studentId] ?? {
                      status: null,
                      arrivedAt: "",
                    };
                    const late =
                      mark.status === "지각" && mark.arrivedAt
                        ? minutesLate(roster.session.startTime, mark.arrivedAt)
                        : null;
                    return (
                      <li
                        key={s.studentId}
                        // 좁은 화면(태블릿)에서는 도착 시각 칸이 다음 줄로 내려가게 (QA BUG-027)
                        className="flex min-h-16 flex-wrap items-center gap-3 py-2"
                      >
                        <div className="flex w-44 flex-col">
                          <span className="flex items-center gap-1.5 text-body font-medium">
                            {s.name}
                            {s.attendType === "보강" && (
                              <StatusBadge status="보강" />
                            )}
                          </span>
                          <span className="text-meta text-subtle">
                            {s.fromClass ??
                              (s.noteCount ? `메모 ${s.noteCount}` : "")}
                          </span>
                        </div>
                        <SegmentedControl
                          label={`${s.name} 출결`}
                          options={[
                            { value: "출석", label: "출석" },
                            { value: "지각", label: "지각" },
                            { value: "결석", label: "결석" },
                          ]}
                          value={mark.status}
                          onChange={(status) =>
                            setMarks({
                              ...marks,
                              [s.studentId]: { ...mark, status },
                            })
                          }
                        />
                        {mark.status === "지각" && (
                          <span className="flex items-center gap-2">
                            <input
                              type="time"
                              aria-label={`${s.name} 도착 시각`}
                              value={mark.arrivedAt}
                              onChange={(e) =>
                                setMarks({
                                  ...marks,
                                  [s.studentId]: {
                                    ...mark,
                                    arrivedAt: e.target.value,
                                  },
                                })
                              }
                              className="h-9 rounded-control border border-line2 px-2 text-body-sm"
                            />
                            {late !== null && late > 0 && (
                              <span className="text-meta font-medium text-warn">
                                {late}분 지각
                              </span>
                            )}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                {blockReason && (
                  <span className="text-meta text-subtle">{blockReason}</span>
                )}
                <Button
                  onClick={save}
                  loading={busy}
                  disabled={!!blockReason || roster.students.length === 0}
                >
                  출결 저장
                </Button>
              </div>
              <p className="text-meta text-subtle">
                지각을 고르면 도착 시각 칸이 열려요. 지각 몇 분은 수업 시작과
                비교해 자동으로 계산해요. 지각 3번은 결석 1번으로 쳐요.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
