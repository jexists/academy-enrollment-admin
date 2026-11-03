"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";

export interface WeekSession {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  kind: string;
  className: string;
  recorded: number;
  makeups: number;
  enrolled: number;
  memo?: string | null;
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const addDays = (d: string, n: number) =>
  new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000)
    .toISOString()
    .slice(0, 10);

/** 강사 주간 수업 격자 (요일 × 수업) — 칸을 누르면 그 수업 출결 입력으로 */
export function WeekSessions({
  from,
  sessions,
  today,
}: {
  from: string;
  sessions: WeekSession[];
  today: string;
}) {
  const days = Array.from({ length: 6 }, (_, i) => addDays(from, i));
  return (
    <div className="grid grid-cols-6 gap-2">
      {days.map((d) => (
        <div key={d} className="flex flex-col gap-2">
          <span
            className={cn(
              "text-center text-meta",
              d === today ? "font-bold text-primary" : "text-subtle",
            )}
          >
            {WEEKDAY[new Date(`${d}T00:00:00Z`).getUTCDay()]} {d.slice(5)}
          </span>
          {sessions
            .filter((s) => s.date === d)
            .map((s) => (
              <Link
                key={s.id}
                href={`/attendance?date=${s.date}`}
                className={cn(
                  "flex flex-col gap-0.5 rounded-control px-2 py-2 text-meta",
                  s.status === "휴강"
                    ? "bg-gray-c text-subtle"
                    : s.kind === "보충"
                      ? "bg-info-c text-info"
                      : "bg-s1 text-fg hover:bg-s2",
                )}
              >
                <span className="font-bold">{s.className}</span>
                <span className="tabular-nums">
                  {s.startTime}–{s.endTime}
                </span>
                <span className="flex flex-wrap gap-1">
                  {s.status === "휴강" ? (
                    <StatusBadge status="휴강" />
                  ) : (
                    <>
                      {s.kind === "보충" && <StatusBadge status="보충" />}
                      {s.date <= today &&
                        (s.recorded ? (
                          <StatusBadge status="입력함" tone="ok" />
                        ) : (
                          <StatusBadge status="미입력" tone="warn" />
                        ))}
                      {s.makeups > 0 && (
                        <span className="text-info">보강 {s.makeups}</span>
                      )}
                    </>
                  )}
                </span>
              </Link>
            ))}
        </div>
      ))}
    </div>
  );
}
