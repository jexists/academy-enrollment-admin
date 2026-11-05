import type { Role } from '@/lib/auth-storage';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/** 역할마다 다른 사이드 메뉴 (journeys.md 권한표, final 와이어프레임 사이드바) */
export const ADMIN_NAV: Record<'ADMIN' | 'TEACHER', NavItem[]> = {
  ADMIN: [
    { href: '/', label: '대시보드', icon: 'dashboard' },
    { href: '/timetable/new', label: '수업 시간표 생성', icon: 'calendar' },
    { href: '/enrollments', label: '신청 내역', icon: 'clipboard' },
    { href: '/students', label: '학생 관리', icon: 'users' },
    { href: '/classes', label: '반 관리', icon: 'book' },
    { href: '/attendance', label: '반 출결 관리', icon: 'check' },
    { href: '/scores', label: '성적 입력', icon: 'edit' },
    { href: '/teachers', label: '강사 관리', icon: 'teacher' },
    { href: '/timetable', label: '강사 시간표', icon: 'clock' },
    { href: '/makeups', label: '보강 관리', icon: 'repeat' },
    { href: '/accounting', label: '회계', icon: 'coins' },
    { href: '/staff', label: '직원 계정 관리', icon: 'shield' },
    { href: '/chat-logs', label: '문의 기록', icon: 'history' },
    { href: '/audit', label: '변경 기록', icon: 'history' },
  ],
  TEACHER: [
    { href: '/', label: '대시보드', icon: 'dashboard' },
    { href: '/my-schedule', label: '내 스케줄', icon: 'calendar' },
    { href: '/attendance', label: '출결 입력', icon: 'check' },
    { href: '/scores', label: '성적 입력', icon: 'edit' },
    { href: '/makeups', label: '보강 보기', icon: 'repeat' },
  ],
};

export function navFor(role: Role): NavItem[] {
  return role === 'ADMIN' || role === 'TEACHER' ? ADMIN_NAV[role] : [];
}

/**
 * 이 주소를 볼 수 있는 역할. 사이드 메뉴가 곧 권한표라서, 메뉴에 있는 주소와 그 하위 경로만 연다
 * (예: 강사가 /staff·/accounting을 직접 쳐도 들어가지 못하게 — QA BUG-014). 진짜 권한은 백엔드가 막는다.
 */
export function rolesFor(pathname: string): Role[] {
  const opens = (role: 'ADMIN' | 'TEACHER') =>
    ADMIN_NAV[role].some((item) =>
      item.href === '/'
        ? pathname === '/'
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
  return (['ADMIN', 'TEACHER'] as const).filter(opens);
}
