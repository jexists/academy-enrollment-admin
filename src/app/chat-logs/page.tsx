import type { Metadata } from 'next';
import { ChatLogsScreen } from '@/features/chat-logs/ChatLogsScreen';
import { AdminShell } from '@/features/shell/AdminShell';

export const metadata: Metadata = { title: '문의 기록' };
export const instant = false;

export default function Page() {
  return (
    <AdminShell>
      <ChatLogsScreen />
    </AdminShell>
  );
}
