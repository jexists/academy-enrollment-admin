"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/states";
import { errorMessage } from "@/lib/api";
import { won } from "@/lib/format";
import { useApi, useMutate } from "@/lib/use-api";
import type { EnrollmentRow } from "./types";

interface Preview {
  charged: number;
  paid: boolean;
  amount: number;
  rule: string;
  totalSessions: number;
  passedSessions: number;
}

const today = () =>
  new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

/** 환불 처리 (D20): 그만둔 날 → 지난 수업(결석 포함, 휴강 제외) → 규정 구간 → 확정하면 수강종료. 되돌릴 수 없어 확인 Modal */
export function RefundDialog({
  enrollment,
  onClose,
  onDone,
}: {
  enrollment: EnrollmentRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [endDate, setEndDate] = useState("");
  const { data: preview } = useApi<Preview>(
    enrollment && endDate
      ? `/admin/enrollments/${enrollment.id}/refund-preview?endDate=${endDate}`
      : null,
  );
  const [busy, setBusy] = useState(false);
  const mutate = useMutate();
  const toast = useToast();

  useEffect(() => {
    if (enrollment) queueMicrotask(() => setEndDate(today()));
  }, [enrollment]);

  return (
    <Modal
      open={enrollment !== null}
      onClose={onClose}
      title={
        enrollment
          ? `${enrollment.studentName} · ${enrollment.className} 환불 확정`
          : ""
      }
      role="alertdialog"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="danger"
            loading={busy}
            disabled={!preview}
            onClick={async () => {
              if (!enrollment) return;
              setBusy(true);
              try {
                await mutate(
                  `/admin/enrollments/${enrollment.id}/finish`,
                  "POST",
                  { endDate },
                );
                toast.success("환불을 확정했어요");
                onDone();
              } catch (reason) {
                toast.error(errorMessage(reason));
              } finally {
                setBusy(false);
              }
            }}
          >
            환불 확정
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="그만둔 날"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        {!preview ? (
          <Skeleton className="h-20" />
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-body-sm">
            <dt className="text-muted">그 달 낸 금액</dt>
            <dd className="text-right tabular-nums">
              {preview.paid
                ? `${won(preview.charged)}원`
                : "미납 — 돌려줄 돈 없음"}
            </dd>
            <dt className="text-muted">지난 수업</dt>
            <dd className="text-right tabular-nums">
              {preview.passedSessions} / {preview.totalSessions}회 (휴강 제외 ·
              결석 포함)
            </dd>
            <dt className="text-muted">적용 구간</dt>
            <dd className="text-right">{preview.rule}</dd>
            <dt className="font-bold text-fg">환불 금액</dt>
            <dd className="text-right text-stat tabular-nums text-fg">
              {won(preview.amount)}원
            </dd>
          </dl>
        )}
        <p className="text-meta text-subtle">
          확정하면 수강종료로 바뀌고 환불액이 저장돼요. 나중에 출결이나 수업일을
          고쳐도 확정 금액은 바뀌지 않아요.
        </p>
      </div>
    </Modal>
  );
}
