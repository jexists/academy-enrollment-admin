'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Stat } from '@/components/ui/Stat';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { InlineNotice, Skeleton } from '@/components/ui/states';
import { api, errorMessage } from '@/lib/api';

type Health = { state: 'loading' } | { state: 'ok' } | { state: 'fail'; message: string };

/**
 * 2단계 세팅 확인용 화면 조각 (3단계에서 실제 첫 화면으로 바꾼다).
 * 백엔드·DB 연결 상태와 공용 컴포넌트·토큰이 제대로 그려지는지 한 번에 본다.
 */
export function SetupCheck({ app }: { app: string }) {
  const toast = useToast();
  const [health, setHealth] = useState<Health>({ state: 'loading' });
  const [tab, setTab] = useState<'ui' | 'status'>('ui');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api<{ status: string }>('/health')
      .then(() => setHealth({ state: 'ok' }))
      .catch((error: unknown) => setHealth({ state: 'fail', message: errorMessage(error) }));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <InlineNotice tone="info">2단계 세팅 확인 화면이에요. 3단계에서 실제 화면으로 바뀌어요.</InlineNotice>

      <section className="flex flex-col gap-3">
        <h2 className="text-sec">백엔드 · DB 연결</h2>
        {health.state === 'loading' && <Skeleton className="h-6 w-40" />}
        {health.state === 'ok' && (
          <p className="flex items-center gap-2 text-body">
            <StatusBadge status="연결됨" tone="ok" /> 백엔드와 hw2 스키마에 연결했어요.
          </p>
        )}
        {health.state === 'fail' && (
          <p className="flex items-center gap-2 text-body">
            <StatusBadge status="연결 안 됨" tone="err" /> {health.message}
          </p>
        )}
      </section>

      <section className="grid grid-cols-3 gap-4">
        <Stat label="앱" value={app} />
        <Stat label="출석률" value="92%" sub="자리 표시" />
        <Stat label="결제할 금액" value="532,000" sub="원" />
      </section>

      <Tabs
        tabs={[
          { value: 'ui', label: '컴포넌트' },
          { value: 'status', label: '상태 배지' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'ui' ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast.success('저장했어요')}>저장</Button>
            <Button variant="secondary" onClick={() => toast.error('신청할 수 없어요. 시간이 겹쳐요')}>
              거절 보기
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(true)}>
              확인 창
            </Button>
            <Button disabled>마감</Button>
          </div>
          <TextField label="이메일" type="email" placeholder="parent@example.com" />
          <TextField label="점수" inputMode="numeric" defaultValue="120" error="0~100 사이로 입력해요" />
        </section>
      ) : (
        <section className="flex flex-wrap gap-2">
          {['신청됨', '수강중', '환불요청', '수강종료', '거절', '취소', '출석', '지각', '결석', '보강', '보충', '휴강', '미납', '납부'].map(
            (status) => (
              <StatusBadge key={status} status={status} />
            ),
          )}
        </section>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="신청을 취소할까요?"
        role="alertdialog"
        actions={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              닫기
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                toast.success('취소했어요');
              }}
            >
              신청 취소
            </Button>
          </>
        }
      >
        승인 전이라 바로 취소돼요.
      </Modal>
    </div>
  );
}
