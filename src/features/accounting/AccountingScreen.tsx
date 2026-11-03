"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stat } from "@/components/ui/Stat";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { EmptyState, Skeleton } from "@/components/ui/states";
import type { EnrollmentRow } from "@/features/enrollments/types";
import { ApiError, errorMessage } from "@/lib/api";
import { won } from "@/lib/format";
import { useApi, useMutate } from "@/lib/use-api";

interface Bill {
  enrollmentId: number;
  status: string;
  studentName: string;
  familyName: string;
  className: string;
  listPrice: number;
  siblingOrder: number;
  expectedDiscount: number;
  expectedCharge: number;
  payment: {
    discountType: string;
    discountAmount: number;
    paidAmount: number;
    paidAt: string;
    memo: string | null;
  } | null;
}

const thisMonth = () =>
  new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 7);

/** 회계 — final/screens/a-accounting. 월 납부 체크(B12), 미납(C15), 형제 할인, 환불 내역 */
export function AccountingScreen() {
  const [month, setMonth] = useState(thisMonth());
  const [tab, setTab] = useState<"bills" | "refunds">("bills");
  const { data, reload } = useApi<Bill[]>(`/admin/payments?month=${month}`);
  const { data: refunds } = useApi<EnrollmentRow[]>(
    "/admin/enrollments?status=%EC%88%98%EA%B0%95%EC%A2%85%EB%A3%8C",
  );
  const [paying, setPaying] = useState<Bill | null>(null);

  const billed =
    data?.reduce(
      (s, b) => s + (b.payment ? b.payment.paidAmount : b.expectedCharge),
      0,
    ) ?? 0;
  const received =
    data?.reduce((s, b) => s + (b.payment?.paidAmount ?? 0), 0) ?? 0;
  const unpaid = data?.filter((b) => !b.payment) ?? [];
  const sibling =
    data?.reduce(
      (s, b) =>
        s +
        (b.payment
          ? b.payment.discountType === "형제"
            ? b.payment.discountAmount
            : 0
          : b.expectedDiscount),
      0,
    ) ?? 0;
  const refundTotal =
    refunds
      ?.filter((r) => r.endDate?.startsWith(month))
      .reduce((s, r) => s + (r.refundAmount ?? 0), 0) ?? 0;

  return (
    <>
      <PageHeader
        title="회계"
        className="pt-4"
        action={
          <TextField
            label="달"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-44"
          />
        }
      />
      {!data ? (
        <Skeleton className="h-24" />
      ) : (
        <section className="card my-6 grid grid-cols-5 gap-6">
          <Stat label="청구" value={won(billed)} sub="원" />
          <Stat
            label="수납"
            value={won(received)}
            sub={
              billed
                ? `수납률 ${Math.round((received / billed) * 100)}%`
                : undefined
            }
          />
          <Stat
            label="미납"
            value={won(unpaid.reduce((s, b) => s + b.expectedCharge, 0))}
            sub={`${unpaid.length}건`}
          />
          <Stat label="형제 할인" value={won(sibling)} sub="원" />
          <Stat label="환불" value={won(refundTotal)} sub="원" />
        </section>
      )}
      <Tabs
        tabs={[
          { value: "bills", label: `${month.slice(5)}월 납부` },
          { value: "refunds", label: "환불 내역" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="card mt-4">
        {tab === "bills" && data && (
          <Table
            rows={data}
            rowKey={(r) => r.enrollmentId}
            empty={<EmptyState message="이 달에 다닌 수강이 없어요." />}
            columns={[
              {
                key: "student",
                header: "학생",
                render: (r) => (
                  <span className="font-medium">{r.studentName}</span>
                ),
              },
              { key: "class", header: "반", render: (r) => r.className },
              {
                key: "list",
                header: "정가",
                align: "right",
                render: (r) => (
                  <span className="tabular-nums">{won(r.listPrice)}</span>
                ),
              },
              {
                key: "discount",
                header: "할인",
                render: (r) => {
                  const p = r.payment;
                  if (p)
                    return p.discountType === "없음" ? (
                      <span className="text-subtle">없음</span>
                    ) : (
                      <span className="text-meta">
                        {p.discountType} −{won(p.discountAmount)}{" "}
                        {p.memo && (
                          <span className="text-subtle">· {p.memo}</span>
                        )}
                      </span>
                    );
                  return r.expectedDiscount ? (
                    <span className="text-meta text-primary">
                      형제 −{won(r.expectedDiscount)} (둘째 10% 자동)
                    </span>
                  ) : (
                    <span className="text-subtle">없음</span>
                  );
                },
              },
              {
                key: "charge",
                header: "청구액",
                align: "right",
                render: (r) => (
                  <span className="font-medium tabular-nums">
                    {won(r.payment?.paidAmount ?? r.expectedCharge)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "납부",
                render: (r) => (
                  <StatusBadge status={r.payment ? "납부" : "미납"} />
                ),
              },
              {
                key: "date",
                header: "납부일",
                render: (r) => (
                  <span className="tabular-nums text-muted">
                    {r.payment?.paidAt.slice(5) ?? "—"}
                  </span>
                ),
              },
              {
                key: "act",
                header: "",
                align: "right",
                render: (r) =>
                  r.payment ? null : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPaying(r)}
                    >
                      납부 체크
                    </Button>
                  ),
              },
            ]}
          />
        )}
        {tab === "refunds" &&
          (!refunds ? (
            <Skeleton className="h-24" />
          ) : (
            <Table
              rows={refunds}
              rowKey={(r) => r.id}
              empty={<EmptyState message="환불 내역이 없어요." />}
              columns={[
                {
                  key: "end",
                  header: "그만둔 날",
                  render: (r) => (
                    <span className="tabular-nums">{r.endDate}</span>
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
                  key: "amount",
                  header: "환불액",
                  align: "right",
                  render: (r) => (
                    <span className="tabular-nums">
                      {won(r.refundAmount ?? 0)}원
                    </span>
                  ),
                },
              ]}
            />
          ))}
      </div>
      {paying && (
        <PayDialog
          bill={paying}
          month={month}
          onClose={() => setPaying(null)}
          onDone={() => {
            setPaying(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function PayDialog({
  bill,
  month,
  onClose,
  onDone,
}: {
  bill: Bill;
  month: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState(() => ({
    discountType: (bill.expectedDiscount ? "형제" : "없음") as
      "없음" | "형제" | "기타",
    discountAmount: String(bill.expectedDiscount),
    memo: "",
    paidAt: new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const mutate = useMutate();
  const toast = useToast();
  const discount =
    form.discountType === "없음" ? 0 : Number(form.discountAmount) || 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await mutate("/admin/payments", "POST", {
        enrollmentId: bill.enrollmentId,
        yearMonth: month,
        ...form,
        discountAmount: discount,
      });
      toast.success("납부를 기록했어요");
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
      open
      onClose={onClose}
      title={`${bill.studentName} · ${bill.className} ${month.slice(5)}월 납부`}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" form="pay" loading={busy}>
            납부 확인
          </Button>
        </>
      }
    >
      <form id="pay" onSubmit={submit} className="flex flex-col gap-4">
        <p className="tabular-nums">정가 {won(bill.listPrice)}원</p>
        <SegmentedControl
          label="할인 종류"
          options={[
            { value: "없음", label: "없음" },
            { value: "형제", label: "형제" },
            { value: "기타", label: "기타" },
          ]}
          value={form.discountType}
          onChange={(discountType) =>
            setForm({
              ...form,
              discountType,
              discountAmount:
                discountType === "형제"
                  ? String(Math.round(bill.listPrice * 0.1))
                  : discountType === "없음"
                    ? "0"
                    : form.discountAmount,
            })
          }
        />
        {form.discountType !== "없음" && (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="할인액"
              type="number"
              min={0}
              value={form.discountAmount}
              onChange={(e) =>
                setForm({ ...form, discountAmount: e.target.value })
              }
              error={errors.discountAmount}
            />
            <TextField
              label={
                form.discountType === "기타"
                  ? "할인 사유 (필수)"
                  : "메모 (선택)"
              }
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              error={errors.memo}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="낸 금액 (자동)"
            value={`${won(bill.listPrice - discount)}원`}
            readOnly
          />
          <TextField
            label="납부일"
            type="date"
            value={form.paidAt}
            onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
            error={errors.paidAt}
          />
        </div>
      </form>
    </Modal>
  );
}
