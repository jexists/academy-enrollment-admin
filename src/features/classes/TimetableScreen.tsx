"use client";

import { useState } from "react";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/use-api";
import { WEEKDAYS, type TeacherRow } from "./types";

interface TeacherSlot {
  weekday: number;
  startTime: string;
  endTime: string;
  classId: number;
  className: string;
}

/** 기본 13시~22시, 그보다 이르거나 늦은 수업이 있으면 그 시간까지 넓힌다 (QA BUG-019) */
function hourRange(slots: TeacherSlot[]): number[] {
  const first = Math.min(13, ...slots.map((s) => Math.floor(toMin(s.startTime) / 60)));
  const last = Math.max(22, ...slots.map((s) => Math.ceil(toMin(s.endTime) / 60) - 1));
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** 강사별 주간 시간표 (D17) — final/screens/a-timetable. 보기 전용 (겹침 검사는 시간표 생성에서) */
export function TimetableScreen() {
  const { data: teachers } = useApi<TeacherRow[]>("/admin/teachers");
  const [picked, setPicked] = useState<number>(0);
  const list = (teachers ?? []).filter(
    (t) => t.isActive && (!picked || t.id === picked),
  );
  return (
    <>
      <PageHeader title="강사 주간 시간표" className="pt-4" />
      <FilterChips
        className="mb-6"
        options={[
          { value: 0, label: "전체 보기" },
          ...(teachers ?? [])
            .filter((t) => t.isActive)
            .map((t) => ({ value: t.id, label: t.name })),
        ]}
        value={picked}
        onChange={setPicked}
      />
      {!teachers ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-6">
          {list.map((t) => (
            <TeacherWeek key={t.id} teacher={t} />
          ))}
        </div>
      )}
    </>
  );
}

function TeacherWeek({ teacher }: { teacher: TeacherRow }) {
  const { data } = useApi<TeacherSlot[]>(`/admin/teachers/${teacher.id}/slots`);
  const hours = data
    ? data.reduce((s, x) => s + (toMin(x.endTime) - toMin(x.startTime)) / 60, 0)
    : 0;
  // 일요일 수업이 있으면 일요일 칸도 그린다
  const days = data?.some((s) => s.weekday === 0) ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5, 6];
  return (
    <section className="card flex flex-col gap-3">
      <h2 className="text-sec">
        {teacher.name}{" "}
        <span className="text-meta font-normal text-muted">
          · 주 {hours}시간 · {teacher.subject} · {teacher.classes.length}개 반
        </span>
      </h2>
      {!data ? (
        <Skeleton className="h-40" />
      ) : (
        <div
          className="grid border-t border-line text-meta"
          style={{ gridTemplateColumns: `48px repeat(${days.length},minmax(0,1fr))` }}
        >
          <span />
          {days.map((d) => (
            <span key={d} className="h-8 text-center leading-8 text-subtle">
              {WEEKDAYS[d]}
            </span>
          ))}
          {hourRange(data).map((h) => (
            <div key={h} className="contents">
              <span className="h-10 border-t border-line pr-2 text-right leading-10 tabular-nums text-subtle">
                {h}:00
              </span>
              {days.map((d) => {
                // 그 시간 칸에 걸치는 수업 (14:30 시작처럼 정각이 아니어도)
                const slot = data.find(
                  (s) =>
                    s.weekday === d &&
                    toMin(s.startTime) < (h + 1) * 60 &&
                    h * 60 < toMin(s.endTime),
                );
                const first =
                  slot &&
                  toMin(slot.startTime) >= h * 60 &&
                  toMin(slot.startTime) < (h + 1) * 60;
                return (
                  <span
                    key={d}
                    className={cn(
                      "h-10 border-t border-line px-1",
                      slot && "bg-primary-c",
                    )}
                  >
                    {first && (
                      <span className="block truncate pt-1 font-bold text-fg">
                        {slot.className}{" "}
                        <span className="font-normal text-muted">
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
