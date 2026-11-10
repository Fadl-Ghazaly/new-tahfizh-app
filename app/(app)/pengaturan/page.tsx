import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { PengaturanContent } from './pengaturan-content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pengaturan — Tahfizh App',
  description: 'Pengaturan profil pengguna dan konfigurasi sistem aplikasi.',
};

function PengaturanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1 space-y-3">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <div className="md:col-span-3 space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function PengaturanPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil akun, keamanan kata sandi, dan konfigurasi pesantren."
      />
      <Suspense fallback={<PengaturanSkeleton />}>
        <PengaturanContent />
      </Suspense>
    </div>
  );
}
