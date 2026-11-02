'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DURATION_MS = 3000;
const MAX_TOASTS = 3;

const DOT: Record<ToastTone, string> = { success: 'bg-ok', error: 'bg-err', info: 'bg-info' };

/** 화면 아래 가운데에 3초 떴다 사라지는 안내. 작업 성공("~했어요")과 서버 거절 문구는 모두 여기로. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++nextId.current;
      setToasts((current) => [
        // 같은 문구가 이미 떠 있으면 하나만 남긴다
        ...current.filter((toast) => toast.message !== message).slice(-(MAX_TOASTS - 1)),
        { id, tone, message },
      ]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="animate-rise pointer-events-auto flex max-w-[420px] items-center gap-2 rounded-full bg-toast px-4 py-2.5 text-body-sm text-white"
          >
            <span className={cn('size-2 shrink-0 rounded-full', DOT[toast.tone])} aria-hidden />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast는 ToastProvider 안에서만 쓸 수 있어요.');
  return context;
}
