import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Santri — Tahfizh App',
  description: 'Kelola data santri Pesantren Darul Ilmi.',
};

export default function SantriPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Santri"
        description="Kelola data santri, kelas, dan halaqah."
      />
      <EmptyState
        icon={<Users className="h-8 w-8 text-primary" />}
        title="Fitur ini sedang dikembangkan"
        description="Tabel data santri, filter, dan fitur CRUD akan tersedia pada fase berikutnya."
      />
    </div>
  );
}
