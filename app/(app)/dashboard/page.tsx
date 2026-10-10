import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { LayoutDashboard } from 'lucide-react';
import { DashboardToast } from './dashboard-toast';

export const metadata: Metadata = {
  title: 'Dashboard — Tahfizh App',
  description: 'Ringkasan mutaba\'ah tahfizh santri Pesantren Darul Ilmi.',
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <DashboardToast />
      </Suspense>
      <PageHeader
        title="Dashboard"
        description="Selamat datang! Ringkasan mutaba'ah tahfizh akan ditampilkan di sini."
      />
      <EmptyState
        icon={<LayoutDashboard className="h-8 w-8 text-primary" />}
        title="Fitur ini sedang dikembangkan"
        description="Kartu statistik, grafik capaian, dan tabel ranking santri akan tersedia pada fase berikutnya."
      />
    </div>
  );
}
