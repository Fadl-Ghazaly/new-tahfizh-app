import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
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

  // 1. Verifikasi pengguna & profil menggunakan utilitas cache request
  let authUser;
  try {
    authUser = await requireUser();
  } catch {
    redirect('/login');
  }

  if (!authUser.isActive) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login?error=inactive');
  }

  // 2. Ambil pengaturan sekolah via cache
  const settings = await getPublicSchoolSettings();
  const schoolName = settings.school_name;
  const logoUrl = settings.logo_url;

  const userName = authUser.fullName || '';
  const role = authUser.role;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <Sidebar role={role} schoolName={schoolName} logoUrl={logoUrl} />

      {/* Topbar */}
      <Topbar userName={userName} role={role} schoolName={schoolName} />

      {/* Konten utama */}
      <main
        className="flex min-h-screen flex-col pt-16 md:pl-72 print:pt-0 print:pl-0"
        id="main-content"
        tabIndex={-1}
      >
        <div className="flex-1 px-4 py-6 pb-28 md:px-6 md:pb-6 print:p-0">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <MobileNav role={role} userName={userName} schoolName={schoolName} />
    </div>
  );
}
