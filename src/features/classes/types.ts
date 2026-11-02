export interface Slot {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface ClassRow {
  id: number;
  name: string;
  targetGrade: number;
  capacity: number;
  monthlyFee: number;
  intro: string | null;
  isActive: boolean;
  teacherId: number;
  teacherName: string;
  enrolled: number;
  schedules: Slot[];
}

export interface Session {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: '정상' | '휴강';
  kind: '정규' | '보충';
  replacesSessionId: number | null;
  memo: string | null;
}

export interface ClassDetail extends ClassRow {
  yearMonth: string;
  sessions: Session[];
}

export interface TeacherRow {
  id: number;
  userId: number;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  subject: string;
  hiredAt: string;
  classes: { id: number; name: string }[];
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
