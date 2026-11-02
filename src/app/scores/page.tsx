import type { Metadata } from 'next';
import { ScoresScreen } from '@/features/scores/ScoresScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '성적 입력' };
export const instant = false;

export default function Page() {
  return (
    <AdminShell>
      <ScoresScreen />
    </AdminShell>
  );
}
