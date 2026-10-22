import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { UstadzContent } from './ustadz-content';

export const metadata: Metadata = {
  title: 'Data Ustadz — Tahfizh App',
  description: 'Kelola data ustadz dan musyrif Pesantren Darul Ilmi.',
};

export default function UstadzPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Ustadz"
        description="Kelola data ustadz dan musyrif halaqah."
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        }
      >
        <UstadzContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
