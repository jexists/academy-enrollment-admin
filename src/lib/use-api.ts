'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { api, ApiError, errorMessage } from './api';

interface ApiState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (data: T) => void;
}

/**
 * 로그인 토큰을 붙여 GET 하고, 로딩·오류·다시 불러오기를 같이 돌려준다. path가 null이면 부르지 않는다.
 * data는 **지금 path로 받은 것만** 돌려준다 — 자녀·날짜·반을 바꾸면 새 응답이 올 때까지 undefined(QA BUG-013).
 * 같은 path를 reload 할 때는 이전 data를 그대로 보여 준다.
 */
export function useApi<T>(
  path: string | null,
  /** inline: 화면이 error를 직접 그린다(토스트 안 띄움). 아니면 불러오기 실패를 토스트로 알린다 (QA BUG-021) */
  options: { inline?: boolean } = {},
): ApiState<T> {
  const { session } = useAuth();
  const token = session?.token;
  const toast = useToast();
  const inline = options.inline ?? false;
  const [state, setState] = useState<{ key: string | null; value: T | undefined }>({
    key: null,
    value: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path || !token) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const result = await api<T>(path, { token });
        if (!cancelled) {
          setState({ key: path, value: result });
          setError(null);
        }
      } catch (reason) {
        if (!cancelled) {
          setError(errorMessage(reason));
          // 401은 AuthProvider가 로그인 화면으로 보내며 알린다
          const expired = reason instanceof ApiError && reason.status === 401;
          if (!inline && !expired) toast.error(errorMessage(reason));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, token, version, inline, toast]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback((value: T) => setState({ key: path, value }), [path]);
  const data = path !== null && state.key === path ? state.value : undefined;
  return { data, error, loading, reload, setData };
}

/** 로그인 토큰을 붙여 POST·PATCH 하는 함수 */
export function useMutate() {
  const { session } = useAuth();
  return useCallback(
    <T,>(path: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) =>
      api<T>(path, { method, body, token: session?.token }),
    [session?.token],
  );
}
