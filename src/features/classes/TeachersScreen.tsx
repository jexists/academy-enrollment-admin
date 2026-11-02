'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { IssuedPasswords, type Issued } from '@/features/common/IssuedPasswords';
import { ApiError, errorMessage } from '@/lib/api';
import { useApi, useMutate } from '@/lib/use-api';
import type { TeacherRow } from './types';

/** 강사 관리 — final/screens/a-teachers. 강사 = 직원 계정 + 강사 정보 1:1 */
export function TeachersScreen() {
  const { data, error, reload } = useApi<TeacherRow[]>('/admin/teachers');
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState<Issued[] | null>(null);
  return (
    <>
      <PageHeader title="강사 관리" className="pt-4" action={<Button onClick={() => setOpen(true)}>강사 추가</Button>} />
      <p className="mb-6 text-body-sm text-muted">강사를 추가하면 직원 계정이 같이 만들어지고 임시 비밀번호가 나와요.</p>
      {error && <EmptyState message={error} />}
      {!data && !error && <Skeleton className="h-48" />}
      {data && (
        <Table
          rows={data}
          rowKey={(r) => r.id}
          empty={<EmptyState message="등록된 강사가 없어요." />}
          columns={[
            { key: 'name', header: '이름', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'subject', header: '과목', render: (r) => r.subject },
            { key: 'email', header: '직원 계정', render: (r) => <span className="text-muted">{r.email}</span> },
            { key: 'hired', header: '등록일', render: (r) => <span className="tabular-nums text-muted">{r.hiredAt}</span> },
            { key: 'classes', header: '담당 반', render: (r) => r.classes.map((c) => c.name).join(', ') || '—' },
            {
              key: 'status',
              header: '계정',
              render: (r) => <StatusBadge status={!r.isActive ? '중지' : r.mustChangePassword ? '비번 변경 필요' : '사용'} />,
            },
          ]}
        />
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
      <IssuedPasswords open={issued !== null} title="강사를 추가했어요" issued={issued ?? []} onClose={() => setIssued(null)} />
    </>
  );
}

function AddTeacherDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (issued: Issued) => void }) {
  const mutate = useMutate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '중등 수학', hiredAt: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const result = await mutate<{ issued: Issued }>('/admin/teachers', 'POST', form);
      setForm({ ...form, name: '', email: '' });
      onDone(result.issued);
    } catch (reason) {
      if (reason instanceof ApiError && Object.keys(reason.fieldErrors).length > 0) setErrors(reason.fieldErrors);
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
        <TextField label="이름" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField label="이메일 (로그인 아이디)" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="과목" value={form.subject} onChange={set('subject')} error={errors.subject} />
          <TextField label="등록일" type="date" value={form.hiredAt} onChange={set('hiredAt')} error={errors.hiredAt} />
        </div>
      </form>
    </Modal>
  );
}
