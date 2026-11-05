"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/api";
import { useApi, useMutate } from "@/lib/use-api";

interface Sheet {
  students: { studentId: number; name: string; score: number | null }[];
  exams: { examName: string; examDate: string; n: number }[];
}

/** 성적 입력 (D16) — final/screens/a-scores. 강사는 담당 반만, 칸을 비우면 미응시 */
export function ScoresScreen() {
  const { session } = useAuth();
  const { data: classes } = useApi<{ id: number; name: string }[]>(
    "/staff/scores/classes",
  );
  const [classId, setClassId] = useState<number | null>(null);
  const cid = classId ?? classes?.[0]?.id ?? null;
  const [exam, setExam] = useState({ examName: "", examDate: "" });
  // 시험 이름을 치는 동안 글자마다 다시 부르지 않게 0.4초 쉬었다가 조회 (QA BUG-016)
  const [lookup, setLookup] = useState(exam);
  useEffect(() => {
    const timer = setTimeout(() => setLookup(exam), 400);
    return () => clearTimeout(timer);
  }, [exam]);
  const query = cid
    ? `/staff/scores?classId=${cid}${lookup.examName && lookup.examDate ? `&examName=${encodeURIComponent(lookup.examName)}&examDate=${lookup.examDate}` : ""}`
    : null;
  const { data: fresh, reload } = useApi<Sheet>(query);
  // 다시 부르는 동안에도 같은 반 학생 목록은 그대로 보여 준다
  const [sheet, setSheet] = useState<{ cid: number; data: Sheet } | null>(null);
  const data = sheet && sheet.cid === cid ? sheet.data : undefined;
  const [values, setValues] = useState<Record<number, string>>({});
  // 선생님이 직접 고친 칸 — 다시 불러와도 덮어쓰지 않는다 (시험 이름을 나중에 고쳐도 점수가 남게)
  const edited = useRef(new Set<number>());
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const mutate = useMutate();
  const toast = useToast();

  useEffect(() => {
    if (!fresh || !cid) return;
    queueMicrotask(() => {
      setSheet({ cid, data: fresh });
      setValues((prev) => {
        const next: Record<number, string> = {};
        for (const s of fresh.students)
          next[s.studentId] = edited.current.has(s.studentId)
            ? (prev[s.studentId] ?? "")
            : s.score === null
              ? ""
              : String(s.score);
        return next;
      });
    });
  }, [fresh, cid]);

  const invalid = Object.entries(values).find(
    ([, v]) => v !== "" && (!/^\d+$/.test(v) || Number(v) > 100),
  );
  const blockReason = !exam.examName.trim()
    ? "시험 이름을 적어 주세요"
    : !exam.examDate
      ? "시험 날짜를 골라 주세요"
      : invalid
        ? "점수는 0~100 사이로 입력해요"
        : null;

  async function save() {
    if (!data || !cid) return;
    setBusy(true);
    try {
      const r = await mutate<{ saved: number }>("/staff/scores", "POST", {
        classId: cid,
        ...exam,
        entries: data.students.map((s) => ({
          studentId: s.studentId,
          score:
            values[s.studentId] === "" ? null : Number(values[s.studentId]),
        })),
      });
      toast.success(`${r.saved}명 점수를 저장했어요`);
      edited.current.clear();
      reload();
    } catch (reason) {
      toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="성적 입력" className="pt-4" />
      <p className="mb-4 text-body-sm text-muted">
        시험이 끝나면 학생별 점수를 넣어요. 학부모·학생 화면의 성적 탭에 바로
        보여요.
      </p>
      {!classes ? (
        <Skeleton className="h-10" />
      ) : classes.length === 0 ? (
        <EmptyState message="담당 반이 없어요." />
      ) : (
        <FilterChips
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          value={cid ?? 0}
          onChange={(id) => {
            setClassId(id);
            edited.current.clear();
            setExam({ examName: "", examDate: "" });
          }}
        />
      )}
      {data && (
        <div className="mt-6 grid grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-6">
          <section className="card flex h-fit flex-col gap-2">
            <h2 className="text-sec">지난 시험</h2>
            {data.exams.length === 0 ? (
              <p className="text-body-sm text-subtle">아직 없어요.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {data.exams.map((e) => (
                  <li key={`${e.examName}-${e.examDate}`}>
                    <button
                      type="button"
                      onClick={() =>
                        {
                          edited.current.clear();
                          setExam({ examName: e.examName, examDate: e.examDate });
                        }
                      }
                      className="flex w-full items-center gap-2 px-2 py-2.5 text-left text-body-sm hover:bg-s1"
                    >
                      <span className="flex-1 font-medium">{e.examName}</span>
                      <span className="tabular-nums text-muted">
                        {e.examDate}
                      </span>
                      <span className="text-meta text-subtle">{e.n}명</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="시험 이름"
                placeholder="예: 2학기 기말"
                value={exam.examName}
                onChange={(e) => setExam({ ...exam, examName: e.target.value })}
              />
              <TextField
                label="시험 날짜"
                type="date"
                value={exam.examDate}
                onChange={(e) => setExam({ ...exam, examDate: e.target.value })}
              />
            </div>
            <ul className="flex flex-col divide-y divide-line">
              {data.students.map((s) => (
                <li
                  key={s.studentId}
                  className="flex min-h-14 items-center gap-4"
                >
                  <span className="w-32 font-medium">{s.name}</span>
                  <input
                    inputMode="numeric"
                    aria-label={`${s.name} 점수`}
                    placeholder="미응시"
                    value={values[s.studentId] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      edited.current.add(s.studentId);
                      setValues({ ...values, [s.studentId]: v });
                      setErrors({
                        ...errors,
                        [s.studentId]:
                          v && Number(v) > 100 ? "0~100 사이로 입력해요" : "",
                      });
                    }}
                    className={`h-10 w-24 rounded-control border px-3 text-right tabular-nums ${errors[s.studentId] ? "border-err" : "border-line2"}`}
                  />
                  <span className="text-meta text-err">
                    {errors[s.studentId]}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              {blockReason && (
                <span className="text-meta text-subtle">{blockReason}</span>
              )}
              <Button
                onClick={save}
                loading={busy}
                disabled={!!blockReason || data.students.length === 0}
              >
                저장
              </Button>
            </div>
            {session?.user.role === "TEACHER" && (
              <p className="text-meta text-subtle">
                담당 반 학생만 입력할 수 있어요.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
