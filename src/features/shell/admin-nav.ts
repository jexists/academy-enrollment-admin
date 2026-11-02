import type { Role } from '@/lib/auth-storage';

export interface NavItem {
  href: string;
  label: string;
}

/** 역할마다 다른 사이드 메뉴 (journeys.md 권한표, final 와이어프레임 사이드바) */
export const ADMIN_NAV: Record<'ADMIN' | 'TEACHER', NavItem[]> = {
  ADMIN: [
    { href: '/', label: '대시보드' },
    { href: '/timetable/new', label: '수업 시간표 생성' },
    { href: '/enrollments', label: '신청 내역' },
    { href: '/students', label: '학생 관리' },
    { href: '/classes', label: '반 관리' },
    { href: '/attendance', label: '반 출결 관리' },
    { href: '/scores', label: '성적 입력' },
    { href: '/teachers', label: '강사 관리' },
    { href: '/timetable', label: '강사 시간표' },
    { href: '/makeups', label: '보강 관리' },
    { href: '/accounting', label: '회계' },
    { href: '/staff', label: '직원 계정 관리' },
    { href: '/audit', label: '변경 기록' },
  ],
  TEACHER: [
    { href: '/', label: '대시보드' },
    { href: '/my-schedule', label: '내 스케줄' },
    { href: '/attendance', label: '출결 입력' },
    { href: '/scores', label: '성적 입력' },
    { href: '/makeups', label: '보강 보기' },
  ],
};

export function navFor(role: Role): NavItem[] {
  return role === 'ADMIN' || role === 'TEACHER' ? ADMIN_NAV[role] : [];
}
