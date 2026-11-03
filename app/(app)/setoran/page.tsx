import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SetoranContent } from './setoran-content';

export const metadata: Metadata = {
  title: 'Input Setoran — Tahfizh App',
  description: 'Input setoran hafalan harian santri (Sabaq, Sabqi, Manzil).',
};

export default function SetoranPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Input Setoran"
        description="Pencatatan presensi dan setoran hafalan santri (Sabaq, Sabqi, Manzil)."
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        }
      >
        <SetoranContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
