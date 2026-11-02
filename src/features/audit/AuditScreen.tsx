'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { errorMessage } from '@/lib/api';
import { useApi, useMutate } from '@/lib/use-api';

interface Change {
  id: number;
  at: string;
  who: string;
  action: string;
  tableName: string;
  rowId: number | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
}

const TABLE_LABEL: Record<string, string> = {
  app_user: '계정', enrollment: '수강', attendance: '출결', makeup: '보강', tuition_payment: '납부', class: '반', class_session: '수업일',
  class_schedule: '정규 요일', student: '학생', parent_profile: '보호자', family: '가족', counsel_note: '상담 메모', exam_score: '성적',
  student_school_history: '학적 이력', student_grade_adjustment: '학년 보정', school: '학교', teacher: '강사',
};
const SKIP = new Set(['createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'deletedAt', 'id']);

/** 바뀐 칸만 "전 → 후"로 */
function diff(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string {
  if (!before && after) return Object.entries(after).filter(([k, v]) => !SKIP.has(k) && v !== null).slice(0, 4).map(([k, v]) => `${k} ${String(v)}`).join(' · ');
  if (before && !after) return '삭제됨';
  if (!before || !after) return '';
  return Object.keys(after)
    .filter((k) => !SKIP.has(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map((k) => `${k} ${String(before[k])} → ${String(after[k])}`)
    .join(' · ');
}

/** 변경 기록 · 로그인 기록 · 삭제 항목 되살리기 (결정27·28) — final/screens/a-audit */
export function AuditScreen() {
  const [tab, setTab] = useState<'changes' | 'logins' | 'deleted'>('changes');
  const [action, setAction] = useState('전체');
  const { data: changes } = useApi<Change[]>(tab === 'changes' ? `/admin/audit/changes?action=${encodeURIComponent(action)}` : null);
  const { data: logins } = useApi<{ id: number; at: string; email: string; name: string | null; success: boolean; ip: string | null }[]>(tab === 'logins' ? '/admin/audit/logins' : null);
  const { data: deleted, reload } = useApi<{ tableName: string; rowId: number; deletedAt: string; data: Record<string, unknown> }[]>(tab === 'deleted' ? '/admin/audit/deleted' : null);
  const mutate = useMutate();
  const toast = useToast();

  return (
    <>
      <PageHeader title="변경 기록" className="pt-4" />
      <p className="mb-4 text-body-sm text-muted">누가 · 언제 · 어디서(IP) · 무엇을 바꿨는지 자동으로 남아요. 삭제는 실제로 지우지 않아서 되살릴 수 있어요.</p>
      <Tabs
        tabs={[
          { value: 'changes', label: '변경 기록' },
          { value: 'logins', label: '로그인 기록' },
          { value: 'deleted', label: '삭제된 항목' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="mt-4 flex flex-col gap-3">
        {tab === 'changes' && (
          <>
            <FilterChips options={['전체', '생성', '수정', '상태변경', '삭제'].map((a) => ({ value: a, label: a }))} value={action} onChange={setAction} />
            {!changes ? (
              <Skeleton className="h-48" />
            ) : (
              <Table
                rows={changes}
                rowKey={(r) => r.id}
                empty={<EmptyState message="기록이 없어요." />}
                columns={[
                  { key: 'at', header: '시각', render: (r) => <span className="tabular-nums text-muted">{r.at.slice(5)}</span> },
                  { key: 'who', header: '누가', render: (r) => r.who },
                  { key: 'ip', header: 'IP', render: (r) => <span className="text-meta text-subtle">{r.ip ?? '—'}</span> },
                  { key: 'what', header: '대상', render: (r) => `${TABLE_LABEL[r.tableName] ?? r.tableName} #${r.rowId ?? ''}` },
                  { key: 'action', header: '작업', render: (r) => <StatusBadge status={r.action} tone={r.action === '삭제' ? 'err' : r.action === '상태변경' ? 'warn' : r.action === '생성' ? 'ok' : 'info'} /> },
                  { key: 'diff', header: '바뀐 내용', render: (r) => <span className="line-clamp-2 text-meta text-muted">{diff(r.before, r.after)}</span> },
                ]}
              />
            )}
          </>
        )}
        {tab === 'logins' &&
          (!logins ? (
            <Skeleton className="h-48" />
          ) : (
            <Table
              rows={logins}
              rowKey={(r) => r.id}
              columns={[
                { key: 'at', header: '시각', render: (r) => <span className="tabular-nums text-muted">{r.at.slice(5)}</span> },
                { key: 'email', header: '계정', render: (r) => <span>{r.email} <span className="text-subtle">{r.name ?? ''}</span></span> },
                { key: 'ip', header: 'IP', render: (r) => <span className="text-meta text-subtle">{r.ip ?? '—'}</span> },
                { key: 'ok', header: '결과', render: (r) => <StatusBadge status={r.success ? '성공' : '실패'} tone={r.success ? 'ok' : 'err'} /> },
              ]}
            />
          ))}
        {tab === 'deleted' &&
          (!deleted ? (
            <Skeleton className="h-48" />
          ) : (
            <Table
              rows={deleted}
              rowKey={(r) => `${r.tableName}-${r.rowId}`}
              empty={<EmptyState message="삭제된 항목이 없어요. (상담 메모·성적·학적 이력을 지우면 여기서 되살릴 수 있어요)" />}
              columns={[
                { key: 'what', header: '대상', render: (r) => `${TABLE_LABEL[r.tableName] ?? r.tableName} #${r.rowId}` },
                { key: 'content', header: '내용', render: (r) => <span className="text-meta text-muted">{String(r.data.content ?? r.data.examName ?? r.data.changeType ?? '')} {r.data.score !== undefined ? `${String(r.data.score)}점` : ''}</span> },
                {
                  key: 'act',
                  header: '',
                  align: 'right',
                  render: (r) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await mutate('/admin/audit/restore', 'POST', { table: r.tableName, rowId: r.rowId });
                          toast.success('되살렸어요');
                          reload();
                        } catch (reason) {
                          toast.error(errorMessage(reason));
                        }
                      }}
                    >
                      되살리기
                    </Button>
                  ),
                },
              ]}
            />
          ))}
      </div>
    </>
  );
}
