import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EmptyState } from '@/components/layout/empty-state';
import { Settings as SettingsIcon } from 'lucide-react';
import {
  academicSettingsSchema,
  DEFAULT_ACADEMIC_SETTINGS,
  AcademicSettingsInput,
} from '@/lib/validators/pengaturan';
import { PengaturanClient, ManagedUserRow } from './pengaturan-client';

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

  // 4. Ambil konfigurasi akademik & daftar pengguna (khusus ADMIN)
  let academicSettings: AcademicSettingsInput = { ...DEFAULT_ACADEMIC_SETTINGS };
  const rawUserMetaAcademic =
    user.app_metadata?.academic_config ?? user.user_metadata?.academic_config;
  const parsedAcademic = academicSettingsSchema.safeParse(rawUserMetaAcademic);
  if (parsedAcademic.success) {
    academicSettings = parsedAcademic.data;
  }

  let managedUsers: ManagedUserRow[] = [];

  if (role === 'ADMIN') {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, role, phone, is_active, created_at')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });

    const authUserMap = new Map<
      string,
      { email: string; lastSignInAt: string | null }
    >();

    // Fallback untuk akun sendiri bila service role tidak tersedia
    authUserMap.set(user.id, {
      email: user.email || '-',
      lastSignInAt: user.last_sign_in_at || null,
    });

    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        const { data: authUsersData } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (authUsersData?.users) {
          for (const au of authUsersData.users) {
            authUserMap.set(au.id, {
              email: au.email || '-',
              lastSignInAt: au.last_sign_in_at || null,
            });
            // Jika user saat ini belum punya academic_config, cek dari admin lain
            if (!parsedAcademic.success) {
              const candidateConfig =
                au.app_metadata?.academic_config ?? au.user_metadata?.academic_config;
              const candidateParsed = academicSettingsSchema.safeParse(candidateConfig);
              if (candidateParsed.success) {
                academicSettings = candidateParsed.data;
              }
            }
          }
        }
      } catch {
        // Gunakan data dari tabel profiles jika admin auth API gagal
      }
    }

    managedUsers = (allProfiles || []).map((p) => {
      const authInfo = authUserMap.get(p.id);
      return {
        id: p.id,
        fullName: p.full_name,
        email: authInfo?.email || '-',
        role: p.role as 'ADMIN' | 'USTADZ',
        phone: p.phone || null,
        isActive: Boolean(p.is_active),
        lastSignInAt: authInfo?.lastSignInAt || null,
      };
    });
  }

  return (
    <PengaturanClient
      role={role}
      userProfile={userProfile}
      schoolSettings={schoolSettings}
      academicSettings={academicSettings}
      managedUsers={managedUsers}
    />
  );
}
