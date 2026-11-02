export interface StudentRow {
  id: number;
  name: string;
  birthDate: string;
  age: number;
  registeredAt: string;
  grade: number | null;
  gradeLabel: string;
  schoolName: string | null;
  schoolRegion: string | null;
  enteredOn: string | null;
  familyId: number;
  familyName: string;
  siblingOrder: number;
  email: string;
  accountStatus: '사용' | '비번 변경 필요' | '중지';
}

export interface StudentDetail extends StudentRow {
  history: {
    id: number;
    changeType: '처음등록' | '전학' | '진학';
    enteredOn: string;
    effectiveFrom: string;
    memo: string | null;
    schoolName: string;
    level: '중' | '고';
    region: string;
  }[];
  adjustments: { id: number; delta: number; reason: string; effectiveFrom: string; staffName: string }[];
  guardians: { id: number; relation: '부' | '모'; name: string; phone: string; email: string | null; isActive: boolean | null }[];
  notes: { id: number; category: string; notedOn: string; content: string; target: string; authorName: string | null }[];
  siblings: { id: number; name: string }[];
  enrollments: { id: number; status: string; className: string; teacherName: string; startDate: string; endDate: string | null; refundAmount: number | null }[];
}

export interface School {
  id: number;
  name: string;
  level: '중' | '고';
  region: string;
}

export interface FamilyOption {
  id: number;
  name: string;
  students: string[];
  guardians: { relation: string; name: string; phone: string; hasAccount: boolean }[];
}

export const NOTE_CATEGORIES = ['상담', '학습', '생활', '연락', '결제', '기타'] as const;
