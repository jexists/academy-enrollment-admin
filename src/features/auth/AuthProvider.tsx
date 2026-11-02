'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { readSession, writeSession, type Session, type SessionUser } from '@/lib/auth-storage';

interface AuthState {
  /** 저장소를 읽기 전에는 undefined (그동안 화면을 그리지 않는다) */
  session: Session | null | undefined;
  signIn: (session: Session) => void;
  signOut: () => void;
  updateUser: (user: SessionUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // localStorage는 브라우저에서만 읽을 수 있어서 화면을 그린 뒤에 읽는다
    void (async () => {
      await Promise.resolve();
      const saved = readSession();
      if (cancelled) return;
      setSession(saved);
      if (!saved) return;
      // 원장이 계정을 막았거나 비밀번호를 바꿨을 수 있으니 서버 기준으로 다시 맞춘다
      try {
        const user = await api<SessionUser>('/auth/me', { token: saved.token });
        if (cancelled) return;
        const next = { token: saved.token, user };
        writeSession(next);
        setSession(next);
      } catch {
        if (cancelled) return;
        writeSession(null);
        setSession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((next: Session) => {
    writeSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const updateUser = useCallback((user: SessionUser) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user };
      writeSession(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ session, signIn, signOut, updateUser }), [session, signIn, signOut, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있어요.');
  return context;
}
