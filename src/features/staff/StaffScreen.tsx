"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/states";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  IssuedPasswords,
  type Issued,
} from "@/features/common/IssuedPasswords";
import { ApiError, errorMessage } from "@/lib/api";
import { useApi, useMutate } from "@/lib/use-api";

interface Staff {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER";
  isActive: boolean;
  mustChangePassword: boolean;
  createdOn: string;
  subject: string | null;
  lastLogin: string | null;
}

/** 직원 계정 관리 (공통5~8) — final/screens/a-staff. 만들기·이름 수정·사용 중지/다시 사용·비번 리셋 */
export function StaffScreen() {
  const { session } = useAuth();
  const { data, reload } = useApi<Staff[]>("/admin/staff");
  const [adding, setAdding] = useState(false);
  const [stopping, setStopping] = useState<Staff | null>(null);
  const [issued, setIssued] = useState<{
    title: string;
    list: Issued[];
  } | null>(null);
  const mutate = useMutate();
  const toast = useToast();

  const setActive = async (s: Staff, isActive: boolean) => {
    try {
      await mutate(`/admin/staff/${s.id}`, "PATCH", { isActive });
      toast.success(isActive ? "다시 사용하게 했어요" : "사용을 멈췄어요");
      setStopping(null);
      reload();
    } catch (reason) {
      toast.error(errorMessage(reason));
    }
  };
  const reset = async (s: Staff) => {
    try {
      const r = await mutate<Issued>(
        `/admin/staff/${s.id}/reset-password`,
        "POST",
      );
      setIssued({ title: `${s.name} 비밀번호를 리셋했어요`, list: [r] });
      reload();
    } catch (reason) {
      toast.error(errorMessage(reason));
    }
  };

  return (
    <>
      <PageHeader
        title="직원 계정 관리"
        className="pt-4"
        action={<Button onClick={() => setAdding(true)}>직원 추가</Button>}
      />
      <p className="mb-6 text-body-sm text-muted">
        직원은 가입하지 않고 여기서 만들어요. 사용을 멈춘 계정은 바로 로그인할
        수 없어요.
      </p>
      {!data ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="card">
          <Table
            rows={data}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "name",
                header: "이름",
                render: (r) => (
                  <span className="font-medium">
                    {r.name}
                    {r.id === session?.user.id && (
                      <span className="ml-1 text-meta text-primary">본인</span>
                    )}
                  </span>
                ),
              },
              {
                key: "email",
                header: "이메일",
                render: (r) => <span className="text-muted">{r.email}</span>,
              },
              {
                key: "role",
                header: "역할",
                render: (r) =>
                  r.role === "ADMIN"
                    ? "관리자(원장)"
                    : `일반 직원(강사) · ${r.subject ?? ""}`,
              },
              {
                key: "last",
                header: "마지막 로그인",
                render: (r) => (
                  <span className="tabular-nums text-muted">
                    {r.lastLogin ?? "—"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "상태",
                render: (r) => (
                  <StatusBadge
                    status={
                      !r.isActive
                        ? "중지"
                        : r.mustChangePassword
                          ? "비번 변경 필요"
                          : "사용"
                    }
                  />
                ),
              },
              {
                key: "act",
                header: "관리",
                align: "right",
                render: (r) =>
                  r.id === session?.user.id ? null : (
                    <span className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => reset(r)}
                      >
                        비번 리셋
                      </Button>
                      {r.isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStopping(r)}
                        >
                          사용 중지
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setActive(r, true)}
                        >
                          다시 사용
                        </Button>
                      )}
                    </span>
                  ),
              },
            ]}
          />
        </div>
      )}
      <Modal
        open={stopping !== null}
        onClose={() => setStopping(null)}
        title={`${stopping?.name} 계정 사용을 멈출까요?`}
        role="alertdialog"
        actions={
          <>
            <Button variant="secondary" onClick={() => setStopping(null)}>
              닫기
            </Button>
            <Button
              variant="danger"
              onClick={() => stopping && setActive(stopping, false)}
            >
              사용 중지
            </Button>
          </>
        }
      >
        바로 로그인할 수 없게 돼요. 담당 반·출결 기록은 그대로 남고, 언제든 다시
        사용하게 할 수 있어요.
      </Modal>
      {adding && (
        <AddStaffDialog
          onClose={() => setAdding(false)}
          onDone={(r) => {
            setAdding(false);
            setIssued({ title: "직원을 추가했어요", list: [r] });
            reload();
          }}
        />
      )}
      <IssuedPasswords
        open={issued !== null}
        title={issued?.title ?? ""}
        issued={issued?.list ?? []}
        onClose={() => setIssued(null)}
      />
    </>
  );
}

function AddStaffDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (issued: Issued) => void;
}) {
  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    role: "TEACHER" as "ADMIN" | "TEACHER",
    subject: "중등 수학",
    hiredAt: new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const mutate = useMutate();
  const toast = useToast();
  const set =
    (key: "name" | "email" | "subject" | "hiredAt") =>
    (e: { target: { value: string } }) =>
      setForm({ ...form, [key]: e.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const r = await mutate<{ issued: Issued }>(
        "/admin/staff",
        "POST",
        form.role === "ADMIN"
          ? { name: form.name, email: form.email, role: "ADMIN" }
          : form,
      );
      onDone(r.issued);
    } catch (reason) {
      if (
        reason instanceof ApiError &&
        Object.keys(reason.fieldErrors).length > 0
      )
        setErrors(reason.fieldErrors);
      else toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="직원 추가"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" form="add-staff" loading={busy}>
            추가
          </Button>
        </>
      }
    >
      <form id="add-staff" onSubmit={submit} className="flex flex-col gap-4">
        <SegmentedControl
          label="역할"
          options={[
            { value: "TEACHER", label: "일반 직원(강사)" },
            { value: "ADMIN", label: "관리자(원장)" },
          ]}
          value={form.role}
          onChange={(role) => setForm({ ...form, role })}
        />
        <TextField
          label="이름"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
        />
        <TextField
          label="이메일 (로그인 아이디)"
          type="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        {form.role === "TEACHER" && (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="담당 과목"
              value={form.subject}
              onChange={set("subject")}
              error={errors.subject}
            />
            <TextField
              label="등록일"
              type="date"
              value={form.hiredAt}
              onChange={set("hiredAt")}
              error={errors.hiredAt}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
