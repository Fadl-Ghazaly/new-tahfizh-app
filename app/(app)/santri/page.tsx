import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/server';
import { SantriClientContent } from './santri-client-content';

export const metadata: Metadata = {
  title: 'Data Santri — Tahfizh App',
  description: 'Kelola data santri Pesantren Darul Ilmi.',
};

async function getInitialData() {
  const supabase = await createClient();

  const [classesRes, halaqahsRes, profileData] = await Promise.all([
    supabase.from('classes').select('id, name, level').order('level', { ascending: true }),
    supabase.from('halaqahs').select('id, name, class_id, is_active, teachers(name)').eq('is_active', true),
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return { role: null, is_active: false };
      const { data } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single();
      return data || { role: null, is_active: false };
    }),
  ]);

  return {
    classes: (classesRes.data || []).map(c => ({ id: c.id, name: c.name, level: c.level })),
    halaqahs: (halaqahsRes.data || []).map(h => ({
        id: h.id, 
        name: h.name, 
        class_id: h.class_id, 
        is_active: h.is_active, 
        teachers: Array.isArray(h.teachers) ? h.teachers[0] : (h.teachers as unknown as { name: string })
    })),
    isAdmin: profileData?.role === 'ADMIN' && profileData?.is_active === true,
  };
}

export default async function SantriPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const initialData = await getInitialData();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Santri"
        description="Kelola data santri, kelas, dan halaqah."
      />
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>}>
        <SantriClientContent initialParams={resolvedParams} initialData={initialData} />
      </Suspense>
    </div>
  );
}
