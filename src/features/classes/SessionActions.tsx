'use client';

import type { Session } from './types';

/** 휴강·보충 처리 — 3단계 수업일·출결 항목에서 채운다 */
export function SessionActions(_props: {
  classId: number;
  sessions: Session[];
  picked: Session | null;
  onClosePicked: () => void;
  onChanged: () => void;
}) {
  return null;
}
