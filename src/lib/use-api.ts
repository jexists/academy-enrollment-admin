'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { api, errorMessage } from './api';

interface ApiState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (data: T) => void;
}

/** 로그인 토큰을 붙여 GET 하고, 로딩·오류·다시 불러오기를 같이 돌려준다. path가 null이면 부르지 않는다 */
export function useApi<T>(path: string | null): ApiState<T> {
  const { session } = useAuth();
  const token = session?.token;
  const [data, setData] = useState<T | undefined>(undefined);
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
          setData(result);
          setError(null);
        }
      } catch (reason) {
        if (!cancelled) setError(errorMessage(reason));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, token, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, loading, reload, setData };
}

/** 로그인 토큰을 붙여 POST·PATCH 하는 함수 */
export function useMutate() {
  const { session } = useAuth();
  return useCallback(
    <T,>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) =>
      api<T>(path, { method, body, token: session?.token }),
    [session?.token],
  );
}
