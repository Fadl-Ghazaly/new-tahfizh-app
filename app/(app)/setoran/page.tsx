import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { BookOpenCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Input Setoran — Tahfizh App',
  description: 'Input setoran hafalan santri.',
};

export default function SetoranPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Input Setoran"
        description="Input setoran hafalan harian santri (Sabaq, Sabqi, Manzil)."
      />
      <EmptyState
        icon={<BookOpenCheck className="h-8 w-8 text-primary" />}
        title="Fitur ini sedang dikembangkan"
        description="Form input setoran dan rekap kehadiran akan tersedia pada fase berikutnya."
      />
    </div>
  );
}
