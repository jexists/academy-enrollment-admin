"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { EmptyState, Skeleton } from "@/components/ui/states";
import type { ClassRow } from "@/features/classes/types";
import type { StudentRow } from "@/features/students/types";
import { errorMessage } from "@/lib/api";
import { won } from "@/lib/format";
import { useApi, useMutate } from "@/lib/use-api";
import { RefundDialog } from "./RefundDialog";
import type { EnrollmentRow } from "./types";

type Tab = "신청됨" | "환불요청" | "전체";

/** 신청 내역 — final/screens/a-enroll. 승인·거절, 전화 신청 대신 등록, 환불 요청 처리 */
export function EnrollmentsScreen() {
  const [tab, setTab] = useState<Tab>("신청됨");
  const { data, error, reload } = useApi<EnrollmentRow[]>(
    `/admin/enrollments?status=${encodeURIComponent(tab)}`,
  );
  const { data: counts, reload: reloadCounts } = useApi<EnrollmentRow[]>(
    "/admin/enrollments?status=%EC%A0%84%EC%B2%B4",
  );
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [refunding, setRefunding] = useState<EnrollmentRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const mutate = useMutate();
  const toast = useToast();
  const count = (s: string) =>
    counts?.filter((e) => e.status === s).length ?? 0;
  const refresh = () => {
    reload();
    reloadCounts();
  };

  const act = async (row: EnrollmentRow, action: "approve" | "reject") => {
    setBusyId(row.id);
    try {
      await mutate(`/admin/enrollments/${row.id}/${action}`, "POST");
      toast.success(action === "approve" ? "승인했어요" : "거절했어요");
      refresh();
    } catch (reason) {
      toast.error(errorMessage(reason));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="신청 내역"
        className="pt-4"
        action={
          <Button variant="secondary" onClick={() => setPhoneOpen(true)}>
            전화 신청
          </Button>
        }
      />
      <p className="mb-4 text-body-sm text-muted">
        신청을 승인할 때 정원·학년·시간 겹침을 한 번 더 검사해요.
      </p>
      <Tabs
        tabs={[
          { value: "신청됨", label: `승인 대기 ${count("신청됨")}` },
          { value: "환불요청", label: `환불 요청 ${count("환불요청")}` },
          { value: "전체", label: "전체" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="card mt-4">
        {error && <EmptyState message={error} />}
        {!data && !error && <Skeleton className="h-48" />}
        {data && (
          <Table
            rows={data}
            rowKey={(r) => r.id}
            empty={
              <EmptyState
                message={
                  tab === "신청됨"
                    ? "승인할 신청이 없어요."
                    : "해당하는 신청이 없어요."
                }
              />
            }
            columns={[
              {
                key: "date",
                header: "신청일",
                render: (r) => (
                  <span className="tabular-nums text-muted">{r.appliedOn}</span>
                ),
              },
              {
                key: "student",
                header: "학생",
                render: (r) => (
                  <span className="font-medium">{r.studentName}</span>
                ),
              },
              { key: "class", header: "반", render: (r) => r.className },
              {
                key: "seats",
                header: "현재 인원",
                align: "right",
                render: (r) => (
                  <span className="tabular-nums">
                    {r.enrolled}/{r.capacity}명
                  </span>
                ),
              },
              {
                key: "status",
                header: tab === "신청됨" ? "검사" : "상태",
                render: (r) =>
                  r.check ? (
                    <span title={r.check.message ?? undefined}>
                      <StatusBadge
                        status={r.check.code}
                        tone={r.check.code === "통과" ? "ok" : "err"}
                      />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <StatusBadge status={r.status} />
                      {r.byPhone && <StatusBadge status="전화 신청" />}
                      {r.refundAmount !== null && (
                        <span className="text-meta text-muted">
                          환불 {won(r.refundAmount)}원
                        </span>
                      )}
                    </span>
                  ),
              },
              {
                key: "actions",
                header: "처리",
                align: "right",
                render: (r) =>
                  r.status === "신청됨" ? (
                    <span className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={r.check?.code !== "통과"}
                        loading={busyId === r.id}
                        onClick={() => act(r, "approve")}
                      >
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => act(r, "reject")}
                      >
                        거절
                      </Button>
                    </span>
                  ) : r.status === "환불요청" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setRefunding(r)}
                    >
                      환불 처리
                    </Button>
                  ) : null,
              },
            ]}
          />
        )}
        {tab === "신청됨" &&
          data?.some((r) => r.check && r.check.code !== "통과") && (
            <p className="mt-2 text-meta text-err">
              승인할 수 없는 신청이 있어요 —{" "}
              {data
                .find((r) => r.check?.message)
                ?.check?.message?.replace("신청할 수 없어요. ", "")}
            </p>
          )}
      </div>
      <PhoneDialog
        open={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        onDone={() => {
          setPhoneOpen(false);
          toast.success("등록했어요");
          refresh();
        }}
      />
      <RefundDialog
        enrollment={refunding}
        onClose={() => setRefunding(null)}
        onDone={() => {
          setRefunding(null);
          refresh();
        }}
      />
    </>
  );
}

function PhoneDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { data: students } = useApi<StudentRow[]>(
    open ? "/admin/students" : null,
  );
  const { data: classes } = useApi<ClassRow[]>(open ? "/admin/classes" : null);
  const [form, setForm] = useState(() => ({
    studentId: "",
    classId: "",
    startDate: new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10),
  }));
  const [busy, setBusy] = useState(false);
  const mutate = useMutate();
  const toast = useToast();
  const student = students?.find((s) => String(s.id) === form.studentId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await mutate("/admin/enrollments/phone", "POST", {
        ...form,
        studentId: Number(form.studentId),
        classId: Number(form.classId),
      });
      setForm({ ...form, studentId: "", classId: "" });
      onDone();
    } catch (reason) {
      toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="전화 신청 등록"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button
            type="submit"
            form="phone-enroll"
            loading={busy}
            disabled={!form.studentId || !form.classId}
          >
            등록
          </Button>
        </>
      }
    >
      <p className="mb-4">
        전화로 받은 신청은 같은 규칙을 검사하고 바로 수강중이 돼요.
      </p>
      <form id="phone-enroll" onSubmit={submit} className="flex flex-col gap-4">
        <Select
          label="학생"
          placeholder="학생 고르기"
          options={(students ?? []).map((s) => ({
            value: s.id,
            label: `${s.name} (${s.gradeLabel})`,
          }))}
          value={form.studentId}
          onChange={(e) =>
            setForm({ ...form, studentId: e.target.value, classId: "" })
          }
        />
        <Select
          label="반"
          placeholder={student ? "반 고르기" : "학생을 먼저 골라 주세요"}
          options={(classes ?? [])
            .filter(
              (c) =>
                c.isActive && (!student || c.targetGrade === student.grade),
            )
            .map((c) => ({
              value: c.id,
              label: `${c.name} (${c.enrolled}/${c.capacity}명)`,
            }))}
          value={form.classId}
          onChange={(e) => setForm({ ...form, classId: e.target.value })}
        />
        <TextField
          label="시작일"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
      </form>
    </Modal>
  );
}
