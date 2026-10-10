import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Laporan — Tahfizh App',
  description: 'Laporan capaian hafalan bulanan santri.',
};

export default function LaporanPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Laporan"
        description="Laporan capaian hafalan bulanan dan rekap kinerja halaqah."
      />
      <EmptyState
        icon={<BarChart3 className="h-8 w-8 text-primary" />}
        title="Fitur ini sedang dikembangkan"
        description="Grafik capaian, laporan bulanan, dan ekspor PDF akan tersedia pada fase berikutnya."
      />
    </div>
  );
}
