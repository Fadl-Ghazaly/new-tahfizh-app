import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { LaporanContent } from './laporan-content';

export const metadata: Metadata = {
  title: 'Laporan & Rekapitulasi — Tahfizh App',
  description: 'Pusat analisis, rekapitulasi bulanan, dan mutabaah tahfizh santri Pesantren Darul Ilmi.',
};

export default function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <PageHeader
          title="Laporan & Rekapitulasi"
          description="Rekapitulasi capaian hafalan bulanan, kartu mutaba'ah santri, dan evaluasi kinerja halaqah."
        />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-16 bg-muted/40 animate-pulse rounded-xl" />
            <div className="h-96 bg-muted/20 animate-pulse rounded-xl" />
          </div>
        }
      >
        <LaporanContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
