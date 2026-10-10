import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Ustadz — Tahfizh App',
  description: 'Kelola data ustadz dan musyrif Pesantren Darul Ilmi.',
};

export default function UstadzPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Ustadz"
        description="Kelola data ustadz dan musyrif halaqah."
      />
      <EmptyState
        icon={<GraduationCap className="h-8 w-8 text-primary" />}
        title="Fitur ini sedang dikembangkan"
        description="Tabel data ustadz dan fitur manajemen halaqah akan tersedia pada fase berikutnya."
      />
    </div>
  );
}
