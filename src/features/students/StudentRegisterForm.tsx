"use client";

import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SearchField } from "@/components/ui/SearchField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import {
  IssuedPasswords,
  type Issued,
} from "@/features/common/IssuedPasswords";
import { ApiError, errorMessage } from "@/lib/api";
import { gradeLabel } from "@/lib/format";
import { useApi, useMutate } from "@/lib/use-api";
import type { FamilyOption, School } from "./types";

interface Guardian {
  relation: "부" | "모";
  name: string;
  phone: string;
  email: string;
}

const emptyGuardian = (): Guardian => ({
  relation: "모",
  name: "",
  phone: "",
  email: "",
});

/** 학년 미리보기 — 백엔드 grade-rules와 같은 계산 (학년도는 3월 시작) */
function previewGrade(
  level: "중" | "고" | undefined,
  enteredOn: string,
): string | null {
  if (!level || !/^\d{4}-\d{2}-\d{2}$/.test(enteredOn)) return null;
  const year = (date: Date) =>
    date.getMonth() + 1 <= 2 ? date.getFullYear() - 1 : date.getFullYear();
  return gradeLabel(
    (level === "중" ? 7 : 10) + year(new Date()) - year(new Date(enteredOn)),
  );
}

/** 학생 등록 — final/screens/a-student-new. 학생 계정 + 가족(기존/새로) + 보호자를 한 번에 (결정6·26·33) */
export function StudentRegisterForm() {
  const router = useRouter();
  const toast = useToast();
  const mutate = useMutate();
  const { data: schools } = useApi<School[]>("/admin/schools");
  const [familyQuery, setFamilyQuery] = useState("");
  const deferredFamily = useDeferredValue(familyQuery);
  const { data: families } = useApi<FamilyOption[]>(
    `/admin/families?q=${encodeURIComponent(deferredFamily)}`,
  );

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    schoolId: "",
    enteredOn: "",
    email: "",
  });
  const [familyMode, setFamilyMode] = useState<"existing" | "new">("new");
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [guardians, setGuardians] = useState<Guardian[]>([emptyGuardian()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    studentId: number;
    issued: Issued[];
    linked: string[];
  } | null>(null);

  const school = schools?.find((s) => String(s.id) === form.schoolId);
  const grade = previewGrade(school?.level, form.enteredOn);
  const family = useMemo(
    () => families?.find((f) => f.id === familyId),
    [families, familyId],
  );

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value });
  const setGuardian = (index: number, patch: Partial<Guardian>) =>
    setGuardians((list) =>
      list.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const body = {
        ...form,
        schoolId: Number(form.schoolId),
        familyId:
          familyMode === "existing" ? (familyId ?? undefined) : undefined,
        familyName:
          familyMode === "new" ? familyName || `${form.name} 가족` : undefined,
        // 이름을 비운 보호자 줄은 보내지 않는다
        guardians: guardians
          .filter((g) => g.name.trim())
          .map((g) => ({ ...g, email: g.email.trim() || undefined })),
      };
      if (familyMode === "existing" && !familyId) {
        setErrors({ familyId: "연결할 가족을 골라 주세요." });
        return;
      }
      setResult(await mutate("/admin/students", "POST", body));
      toast.success("등록했어요");
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
    <form
      onSubmit={submit}
      className="card flex max-w-[860px] flex-col gap-10 pb-6"
      noValidate
    >
      <Section no={1} title="학생 정보">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="이름"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
          />
          <TextField
            label="생년월일"
            type="date"
            value={form.birthDate}
            onChange={set("birthDate")}
            error={errors.birthDate}
          />
          <Select
            label="학교"
            placeholder="학교 고르기"
            options={(schools ?? []).map((s) => ({
              value: s.id,
              label: `${s.name} · ${s.region}`,
            }))}
            value={form.schoolId}
            onChange={set("schoolId")}
            error={errors.schoolId}
          />
          <TextField
            label="입학일자"
            type="date"
            value={form.enteredOn}
            onChange={set("enteredOn")}
            error={errors.enteredOn}
            hint={
              grade
                ? `현재 학년: ${grade} (입학일자로 자동 계산)`
                : "학교급에 입학한 날 — 학년은 이걸로 계산해요"
            }
          />
        </div>
      </Section>

      <Section no={2} title="학생 계정">
        <TextField
          label="학생 이메일"
          type="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          hint="등록하면 임시 비밀번호가 나와요. 학생이 첫 로그인 때 바꿔요."
        />
      </Section>

      <Section
        no={3}
        title="가족 · 보호자"
        action={
          <SegmentedControl
            label="가족"
            options={[
              { value: "existing", label: "기존 가족에 추가" },
              { value: "new", label: "새 가족" },
            ]}
            value={familyMode}
            onChange={setFamilyMode}
            size="sm"
          />
        }
      >
        {familyMode === "existing" ? (
          <div className="flex flex-col gap-3">
            <SearchField
              label="가족 검색"
              placeholder="가족 이름·보호자 이름·전화"
              value={familyQuery}
              onChange={setFamilyQuery}
            />
            {errors.familyId && (
              <p className="text-meta text-err">{errors.familyId}</p>
            )}
            <ul className="flex max-h-56 flex-col divide-y divide-line overflow-y-auto">
              {(families ?? []).map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setFamilyId(f.id)}
                    className={`flex min-h-12 w-full items-center gap-3 px-2 text-left text-body-sm ${familyId === f.id ? "bg-primary-c" : "hover:bg-s1"}`}
                  >
                    <span className="w-28 font-medium">{f.name}</span>
                    <span className="flex-1 text-muted">
                      학생 {f.students.join(", ") || "없음"}
                    </span>
                    <span className="text-meta text-subtle">
                      {f.guardians
                        .map((g) => `${g.name}(${g.relation})`)
                        .join(", ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {family && family.students.length >= 1 && (
              <p className="text-meta text-primary">
                같은 가족 {family.students.length + 1}번째 학생이에요. 형제 할인
                10%가 자동으로 적용돼요.
              </p>
            )}
          </div>
        ) : (
          <TextField
            label="가족 이름"
            placeholder={form.name ? `${form.name} 가족` : "예: 김민준 가족"}
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            error={errors.familyName}
          />
        )}

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center">
            <h4 className="flex-1 text-body-sm font-bold">
              {familyMode === "existing" ? "보호자 추가 (선택)" : "보호자"}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGuardians([...guardians, emptyGuardian()])}
            >
              + 보호자 추가
            </Button>
          </div>
          {guardians.map((g, index) => (
            <div
              key={index}
              className="grid grid-cols-[auto_1fr_1fr_1.4fr_auto] items-end gap-3"
            >
              <SegmentedControl
                label="관계"
                options={[
                  { value: "부", label: "부" },
                  { value: "모", label: "모" },
                ]}
                value={g.relation}
                onChange={(relation) => setGuardian(index, { relation })}
                className="mb-1"
              />
              <TextField
                label="이름"
                value={g.name}
                onChange={(e) => setGuardian(index, { name: e.target.value })}
              />
              <TextField
                label="전화"
                placeholder="010-0000-0000"
                value={g.phone}
                onChange={(e) => setGuardian(index, { phone: e.target.value })}
              />
              <TextField
                label="이메일 (선택)"
                type="email"
                value={g.email}
                onChange={(e) => setGuardian(index, { email: e.target.value })}
              />
              <Button
                variant="ghost"
                size="sm"
                className="mb-1"
                onClick={() =>
                  setGuardians(guardians.filter((_, i) => i !== index))
                }
              >
                빼기
              </Button>
            </div>
          ))}
          <p className="text-meta text-subtle">
            이메일을 적으면 보호자 계정을 같이 만들어요. 이미 가입한 학부모
            이메일이면 새로 만들지 않고 이 가족에 연결해요. 이메일이 없으면
            이름·관계·전화만 저장해요.
          </p>
        </div>
      </Section>

      <div className="flex justify-end gap-2 border-t border-line pt-6">
        <ButtonLink href="/students" variant="secondary">
          취소
        </ButtonLink>
        <Button type="submit" loading={busy}>
          등록
        </Button>
      </div>

      <IssuedPasswords
        open={result !== null}
        title="학생을 등록했어요"
        issued={result?.issued ?? []}
        linked={result?.linked}
        onClose={() => router.replace(`/students?id=${result?.studentId}`)}
      />
    </form>
  );
}

function Section({
  no,
  title,
  action,
  children,
}: {
  no: number;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center rounded-full bg-fg text-badge text-white">
          {no}
        </span>
        <h2 className="flex-1 text-sec">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
