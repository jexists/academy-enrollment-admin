import { APP_KIND } from './app-kind';

// 로그인 토큰은 이 브라우저의 localStorage에만 둔다. 앱마다 키를 달리해서 코어 웹·어드민 로그인이 섞이지 않게 한다.
const KEY = `hanbit-session-${APP_KIND}`;

export type Role = 'PARENT' | 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface SessionUser {
  id: number;
  role: Role;
  name: string;
  email: string;
  mustChangePassword: boolean;
}

export interface Session {
  token: string;
  user: SessionUser;
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 새로고침하면 다시 로그인한다
  }
}

export const ROLE_LABEL: Record<Role, string> = {
  PARENT: '학부모',
  STUDENT: '학생',
  TEACHER: '강사',
  ADMIN: '원장',
};

/** 로그인한 뒤 처음 가는 곳 */
export const HOME_PATH: Record<Role, string> = {
  PARENT: '/home',
  STUDENT: '/me/schedule',
  TEACHER: '/',
  ADMIN: '/',
};
