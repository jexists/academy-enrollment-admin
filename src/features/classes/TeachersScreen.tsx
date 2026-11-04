"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { EmptyState, Skeleton } from "@/components/ui/states";
import {
  IssuedPasswords,
  type Issued,
} from "@/features/common/IssuedPasswords";
import { ApiError, errorMessage } from "@/lib/api";
import { useApi, useMutate } from "@/lib/use-api";
import type { TeacherRow } from "./types";

/** 강사 관리 — final/screens/a-teachers. 강사 = 직원 계정 + 강사 정보 1:1 */
export function TeachersScreen() {
  const { data, error, reload } = useApi<TeacherRow[]>("/admin/teachers", { inline: true });
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState<Issued[] | null>(null);
  const [editing, setEditing] = useState<TeacherRow | null>(null);
  return (
    <>
      <PageHeader
        title="강사 관리"
        className="pt-4"
        action={<Button onClick={() => setOpen(true)}>강사 추가</Button>}
      />
      <p className="mb-6 text-body-sm text-muted">
        강사를 추가하면 직원 계정이 같이 만들어지고 임시 비밀번호가 나와요. 소개와
        이력은 첫 화면과 강사진 화면에 보여요.
      </p>
      {error && <EmptyState message={error} />}
      {!data && !error && <Skeleton className="h-48" />}
      {data && (
        <div className="card">
          <Table
            rows={data}
            rowKey={(r) => r.id}
            empty={<EmptyState message="등록된 강사가 없어요." />}
            columns={[
              {
                key: "name",
                header: "이름",
                render: (r) => <span className="font-medium">{r.name}</span>,
              },
              { key: "subject", header: "과목", render: (r) => r.subject },
              {
                key: "email",
                header: "직원 계정",
                render: (r) => <span className="text-muted">{r.email}</span>,
              },
              {
                key: "hired",
                header: "등록일",
                render: (r) => (
                  <span className="tabular-nums text-muted">{r.hiredAt}</span>
                ),
              },
              {
                key: "classes",
                header: "담당 반",
                render: (r) => r.classes.map((c) => c.name).join(", ") || "—",
              },
              {
                key: "profile",
                header: "소개",
                render: (r) => (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(r)}
                  >
                    {r.bio ? "고치기" : "쓰기"}
                  </Button>
                ),
              },
              {
                key: "status",
                header: "계정",
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
            ]}
          />
        </div>
      )}
      <AddTeacherDialog
        open={open}
        onClose={() => setOpen(false)}
        onDone={(result) => {
          setOpen(false);
          setIssued([result]);
          reload();
        }}
      />
      <ProfileDialog
        teacher={editing}
        onClose={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          reload();
        }}
      />
      <IssuedPasswords
        open={issued !== null}
        title="강사를 추가했어요"
        issued={issued ?? []}
        onClose={() => setIssued(null)}
      />
    </>
  );
}

function AddTeacherDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (issued: Issued) => void;
}) {
  const mutate = useMutate();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "중등 수학",
    hiredAt: new Date().toISOString().slice(0, 10),
    bio: "",
    career: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const result = await mutate<{ issued: Issued }>(
        "/admin/teachers",
        "POST",
        form,
      );
      setForm({ ...form, name: "", email: "", bio: "", career: "" });
      onDone(result.issued);
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
      open={open}
      onClose={onClose}
      title="강사 추가"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" form="add-teacher" loading={busy}>
            추가
          </Button>
        </>
      }
    >
      <form id="add-teacher" onSubmit={submit} className="flex flex-col gap-4">
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
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="과목"
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
        <ProfileFields
          bio={form.bio}
          career={form.career}
          errors={errors}
          onChange={(key, value) => setForm({ ...form, [key]: value })}
        />
      </form>
    </Modal>
  );
}

const BIO_MAX = 300;
const CAREER_MAX_LINES = 6;
const CAREER_LINE_MAX = 60;

/** 소개·이력 입력 (결정41). 이력은 한 줄에 하나 */
function ProfileFields({
  bio,
  career,
  errors,
  onChange,
}: {
  bio: string;
  career: string;
  errors: Record<string, string>;
  onChange: (key: "bio" | "career", value: string) => void;
}) {
  const lines = career.split("\n").filter((l) => l.trim() !== "");
  // 넘쳤을 때만 칸 아래에 오류로 알린다 (저장하면 백엔드도 같은 기준으로 막는다)
  const careerError =
    errors.career ??
    (lines.length > CAREER_MAX_LINES
      ? `이력은 ${CAREER_MAX_LINES}줄까지 쓸 수 있어요. 지금 ${lines.length}줄이에요.`
      : lines.some((l) => l.trim().length > CAREER_LINE_MAX)
        ? `이력은 줄마다 ${CAREER_LINE_MAX}자까지 쓸 수 있어요.`
        : undefined);
  return (
    <>
      <TextArea
        label="소개 (선택)"
        rows={4}
        maxLength={BIO_MAX}
        placeholder={`수업 방식과 맡은 학년을 2~3문장으로 (${BIO_MAX}자까지). 첫 문장이 카드에 보여요.`}
        value={bio}
        onChange={(e) => onChange("bio", e.target.value)}
        error={errors.bio}
      />
      <TextArea
        label="이력 (선택)"
        rows={5}
        placeholder={`한 줄에 하나, ${CAREER_MAX_LINES}줄까지\n예: 새솔대학교 수학교육과 졸업\n중등 수학 강의 5년`}
        value={career}
        onChange={(e) => onChange("career", e.target.value)}
        error={careerError}
      />
    </>
  );
}

function ProfileDialog({
  teacher,
  onClose,
  onDone,
}: {
  teacher: TeacherRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const mutate = useMutate();
  const toast = useToast();
  const [form, setForm] = useState({ bio: "", career: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  // 다른 강사를 열면 그 강사의 값으로 채운다
  if (teacher && teacher.id !== loadedId) {
    setLoadedId(teacher.id);
    setForm({ bio: teacher.bio ?? "", career: teacher.career ?? "" });
    setErrors({});
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!teacher) return;
    setBusy(true);
    setErrors({});
    try {
      await mutate(`/admin/teachers/${teacher.id}`, "PATCH", form);
      toast.success(`${teacher.name} 소개를 저장했어요`);
      setLoadedId(null);
      onDone();
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
      open={teacher !== null}
      onClose={() => {
        setLoadedId(null);
        onClose();
      }}
      title={teacher ? `${teacher.name} 소개` : "강사 소개"}
      actions={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setLoadedId(null);
              onClose();
            }}
          >
            닫기
          </Button>
          <Button type="submit" form="teacher-profile" loading={busy}>
            저장
          </Button>
        </>
      }
    >
      <form
        id="teacher-profile"
        onSubmit={submit}
        className="flex flex-col gap-4"
      >
        <ProfileFields
          bio={form.bio}
          career={form.career}
          errors={errors}
          onChange={(key, value) => setForm({ ...form, [key]: value })}
        />
      </form>
    </Modal>
  );
}
