import { PageHeader } from '@/components/ui/PageHeader';
import { SetupCheck } from '@/features/setup/SetupCheck';

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-24">
      <PageHeader title="한빛수학 어드민" />
      <SetupCheck app="어드민" />
    </main>
  );
}
