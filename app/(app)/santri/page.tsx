import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SantriContent } from './santri-content';

export const metadata: Metadata = {
  title: 'Data Santri — Tahfizh App',
  description: 'Kelola data santri Pesantren Darul Ilmi.',
};

export default function SantriPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Santri"
        description="Kelola data santri, kelas, dan halaqah."
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        }
      >
        <SantriContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
