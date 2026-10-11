import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { Settings } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pengaturan — Tahfizh App',
  description: 'Pengaturan aplikasi pesantren.',
};

// instant = false dipertahankan: halaman memeriksa role ADMIN di server-side sebelum merender konten formulir.
export const instant = false;

export default async function PengaturanPage() {
  await connection();
  const supabase = await createClient();

  // Verifikasi role ADMIN di server — bukan hanya di proxy/UI
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'ADMIN') {
    // Redirect dengan pesan — ditangkap oleh dashboard via searchParams
    redirect('/dashboard?error=unauthorized');
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola pengaturan pesantren, tema, dan konfigurasi aplikasi."
      />
      <EmptyState
        icon={<Settings className="h-8 w-8 text-primary" />}
        title="Fitur ini sedang dikembangkan"
        description="Pengaturan nama pesantren, logo, tema, dan tahun ajaran akan tersedia pada fase berikutnya."
      />
    </div>
  );
}
