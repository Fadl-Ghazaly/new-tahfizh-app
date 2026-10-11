import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { getPublicSchoolSettings } from '@/lib/settings';

// instant = false dipertahankan: layout memerlukan auth gating dan pembacaan cookie sesi pengguna (auth.getUser) di puncak pohon layout.
export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const supabase = await createClient();

  // 1. Verifikasi pengguna — gunakan getUser(), bukan getSession()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Ambil profil dari tabel profiles (role selalu dari sini)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Profil belum ada (baru daftar atau inkonsisten data)
    await supabase.auth.signOut();
    redirect('/login');
  }

  if (profile.is_active === false) {
    await supabase.auth.signOut();
    redirect('/login?error=inactive');
  }

  // 3. Ambil pengaturan sekolah via cache
  const settings = await getPublicSchoolSettings();
  const schoolName = settings.school_name;
  const logoUrl = settings.logo_url;

  const userName = profile.full_name;
  const role = profile.role as string;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <Sidebar role={role} schoolName={schoolName} logoUrl={logoUrl} />

      {/* Topbar */}
      <Topbar userName={userName} role={role} schoolName={schoolName} />

      {/* Konten utama */}
      <main
        className="flex min-h-screen flex-col pt-16 md:pl-72"
        id="main-content"
        tabIndex={-1}
      >
        <div className="flex-1 px-4 py-6 pb-28 md:px-6 md:pb-6">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <MobileNav role={role} userName={userName} schoolName={schoolName} />
    </div>
  );
}
