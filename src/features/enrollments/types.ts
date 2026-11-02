import type { Slot } from '@/features/classes/types';

export interface EnrollmentRow {
  id: number;
  status: '신청됨' | '수강중' | '환불요청' | '수강종료' | '거절' | '취소';
  startDate: string;
  endDate: string | null;
  refundAmount: number | null;
  appliedOn: string;
  byPhone: boolean;
  studentId: number;
  studentName: string;
  familyId: number;
  classId: number;
  className: string;
  monthlyFee: number;
  capacity: number;
  enrolled: number;
  schedules: Slot[];
  check?: { code: string; message: string | null };
}
