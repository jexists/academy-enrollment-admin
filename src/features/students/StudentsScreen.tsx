'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchField } from '@/components/ui/SearchField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table } from '@/components/ui/Table';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { useApi } from '@/lib/use-api';
import { StudentDetailPanel } from './StudentDetailPanel';
import type { StudentRow } from './types';

/** 학생 관리 — final/screens/a-students: 왼쪽 목록, 오른쪽 상세 */
export function StudentsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = Number(params.get('id')) || null;
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const { data, error, reload } = useApi<StudentRow[]>(`/admin/students${deferred ? `?q=${encodeURIComponent(deferred)}` : ''}`);

  return (
    <>
      <PageHeader title="학생 관리" className="pt-4" action={<ButtonLink href="/students/new">학생 등록</ButtonLink>} />
      <div className="mt-4 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8">
        <section className="flex flex-col gap-3">
          <SearchField label="학생 검색" placeholder="이름·가족·이메일" value={query} onChange={setQuery} />
          {error && <EmptyState message={error} />}
          {!data && !error && <Skeleton className="h-64" />}
          {data && (
            <Table
              rows={data}
              rowKey={(row) => row.id}
              selectedKey={selected}
              onRowClick={(row) => router.replace(`${pathname}?id=${row.id}`)}
              empty={<EmptyState message="찾는 학생이 없어요." />}
              columns={[
                { key: 'name', header: '이름', render: (r) => <span className="font-medium">{r.name}</span> },
                { key: 'grade', header: '학년', render: (r) => r.gradeLabel },
                { key: 'school', header: '학교', render: (r) => <span className="text-muted">{r.schoolName}</span> },
                {
                  key: 'family',
                  header: '가족',
                  render: (r) => (
                    <span className="text-muted">
                      {r.familyName} ({r.siblingOrder})
                    </span>
                  ),
                },
                {
                  key: 'account',
                  header: '계정',
                  render: (r) => (r.accountStatus === '사용' ? null : <StatusBadge status={r.accountStatus} />),
                },
              ]}
            />
          )}
        </section>
        <section className="min-w-0 border-l border-line pl-8">
          {selected ? (
            <StudentDetailPanel key={selected} studentId={selected} onChanged={reload} />
          ) : (
            <EmptyState message="왼쪽에서 학생을 고르면 학적 이력과 상담 메모가 보여요." />
          )}
        </section>
      </div>
    </>
  );
}
