"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, UNAUTHORIZED_EVENT } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  readSession,
  writeSession,
  type Session,
  type SessionUser,
} from "@/lib/auth-storage";

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
        const user = await api<SessionUser>("/auth/me", { token: saved.token });
        if (cancelled) return;
        const next = { token: saved.token, user };
        writeSession(next);
        setSession(next);
      } catch (reason) {
        if (cancelled) return;
        // 서버가 아직 깨는 중이거나 연결이 끊긴 거면(0·5xx) 로그인을 지우지 않는다. 무효한 로그인(401)만 지운다
        if (reason instanceof ApiError && (reason.status === 0 || reason.status >= 500)) return;
        writeSession(null);
        setSession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toast = useToast();
  useEffect(() => {
    // 쓰는 중에 로그인이 무효가 되면(만료·중지·탈퇴) 로그아웃 → 보호 화면이 로그인 화면으로 보낸다 (QA BUG-020)
    function onUnauthorized(event: Event) {
      // 로그인한 상태에서만 한 번 알린다 (상태 갱신 함수 안에서 토스트를 띄우면 렌더 중 상태 변경 경고)
      if (!readSession()) return;
      writeSession(null);
      setSession(null);
      toast.error((event as CustomEvent<string | undefined>).detail ?? "로그인이 만료됐어요. 다시 로그인해 주세요.");
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [toast]);

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

  const value = useMemo(
    () => ({ session, signIn, signOut, updateUser }),
    [session, signIn, signOut, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있어요.");
  return context;
}
