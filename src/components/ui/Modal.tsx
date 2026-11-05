'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  /** 아래 버튼 줄. 주 버튼은 하나만 (위험한 일은 danger) */
  actions?: ReactNode;
  role?: 'dialog' | 'alertdialog';
  className?: string;
}

/**
 * 모든 Modal의 껍데기. 브라우저 기본 <dialog>라서 ESC 닫기·포커스 가두기를 브라우저가 처리한다.
 * 모바일(640 미만)에서는 화면 아래에 붙는 시트, 그 이상은 가운데 창.
 */
export function Modal({ open, onClose, title, children, actions, role = 'dialog', className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // 어두운 바깥을 누르면 닫는다. 창 안쪽 여백(p-6)을 눌러도 target이 dialog라서 좌표로 바깥인지 본다
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        const inside =
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom;
        if (!inside) onClose();
      }}
      className={cn(
        'bg-canvas p-6 text-fg',
        'mx-auto mb-0 mt-auto w-full max-w-[480px] animate-sheet rounded-t-modal',
        'sm:m-auto sm:w-[min(92vw,420px)] sm:animate-rise sm:rounded-modal',
        className,
      )}
    >
      <h2 id={titleId} className="text-sec">
        {title}
      </h2>
      {children && <div className="mt-3 text-body text-muted">{children}</div>}
      <div className="mt-6 flex justify-end gap-2">
        {actions ?? (
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        )}
      </div>
    </dialog>
  );
}
