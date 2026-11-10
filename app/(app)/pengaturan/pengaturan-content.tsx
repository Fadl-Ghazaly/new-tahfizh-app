import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/layout/empty-state';
import { Settings as SettingsIcon } from 'lucide-react';
import { PengaturanClient } from './pengaturan-client';

export async function PengaturanContent() {
  await connection();
  const supabase = await createClient();

  // 1. Ambil data user yang sedang login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <EmptyState
        icon={<SettingsIcon className="h-8 w-8 text-primary" />}
        title="Sesi tidak ditemukan"
        description="Silakan masuk kembali untuk mengakses pengaturan."
      />
    );
  }

  // 2. Ambil profil user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    return (
      <EmptyState
        icon={<SettingsIcon className="h-8 w-8 text-primary" />}
        title="Akun tidak aktif"
        description="Akun Anda sedang dinonaktifkan, hubungi administrator pesantren."
      />
    );
  }

  const role = profile.role as 'ADMIN' | 'USTADZ';

  // 3. Ambil data pengaturan sekolah
  const { data: settingsData } = await supabase
    .from('school_settings')
    .select('school_name, logo_url, theme')
    .limit(1)
    .maybeSingle();

  const schoolSettings = {
    schoolName: settingsData?.school_name || 'Pesantren Darul Ilmi',
    logoUrl: settingsData?.logo_url || null,
    theme: settingsData?.theme || 'theme-1',
  };

  const userProfile = {
    id: user.id,
    fullName: profile.full_name || '',
    email: user.email || '',
    phone: profile.phone || '',
  };

  return (
    <PengaturanClient
      role={role}
      userProfile={userProfile}
      schoolSettings={schoolSettings}
    />
  );
}

