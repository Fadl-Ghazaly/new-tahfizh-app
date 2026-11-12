'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/require-user';
import {
  schoolSettingsSchema,
  academicSettingsSchema,
  userProfileSchema,
  changePasswordSchema,
  toggleUserStatusSchema,
  adminResetPasswordSchema,
} from '@/lib/validators/pengaturan';
import { mapDbError } from '@/lib/validators/list-params';
import { revalidatePath, revalidateTag } from 'next/cache';

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper internal: verifikasi pengguna aktif melalui requireUser().
 */
async function verifyActiveUser(requireAdminRole = false) {
  try {
    const authUser = await requireUser();
    if (!authUser.isActive) {
      return { ok: false as const, error: 'Akun Anda sedang tidak aktif.', authUser: null };
    }
    if (requireAdminRole && authUser.role !== 'ADMIN') {
      return {
        ok: false as const,
        error: 'Akses ditolak. Hanya Admin yang dapat melakukan tindakan ini.',
        authUser: null,
      };
    }
    return { ok: true as const, error: null, authUser };
  } catch {
    return {
      ok: false as const,
      error: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
      authUser: null,
    };
  }
}

/**
 * 1. Update Pengaturan Identitas Pesantren & Visual (Khusus ADMIN).
 */
export async function updateSchoolSettingsAction(
  rawInput: unknown
): Promise<ActionResult> {
  const authCheck = await verifyActiveUser(true);
  if (!authCheck.ok || !authCheck.authUser) {
    return { ok: false, error: authCheck.error || 'Akses ditolak.' };
  }

  const parsed = schoolSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { school_name, logo_url, theme } = parsed.data;
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('school_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: mapDbError(fetchError) };
  }

  let dbError;
  if (existing) {
    const { error } = await supabase
      .from('school_settings')
      .update({
        school_name,
        logo_url: logo_url || null,
        theme,
        updated_by: authCheck.authUser.userId,
      })
      .eq('id', existing.id);
    dbError = error;
  } else {
    const { error } = await supabase.from('school_settings').insert({
      school_name,
      logo_url: logo_url || null,
      theme,
      updated_by: authCheck.authUser.userId,
    });
    dbError = error;
  }

  if (dbError) {
    return { ok: false, error: mapDbError(dbError) };
  }

  try {
    revalidateTag('school-settings', 'max');
  } catch {
    // Fallback jika revalidateTag tidak tersedia di lingkungan test
  }
  revalidatePath('/pengaturan');
  revalidatePath('/laporan');
  revalidatePath('/(app)', 'layout');
  revalidatePath('/', 'layout');

  return { ok: true };
}

/**
 * 2. Update Konfigurasi Akademik & Standar Perhitungan Tahfizh (Khusus ADMIN).
 */
export async function updateAcademicSettingsAction(
  rawInput: unknown
): Promise<ActionResult> {
  const authCheck = await verifyActiveUser(true);
  if (!authCheck.ok || !authCheck.authUser) {
    return { ok: false, error: authCheck.error || 'Akses ditolak.' };
  }

  const parsed = academicSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const academicConfig = parsed.data;
  const supabase = await createClient();

  // Simpan pada metadata akun Admin di Supabase PostgreSQL (auth.users)
  const { error: metaError } = await supabase.auth.updateUser({
    data: { academic_config: academicConfig },
  });

  if (metaError) {
    return {
      ok: false,
      error: 'Gagal menyimpan konfigurasi akademik. Silakan coba lagi.',
    };
  }

  // Sinkronkan juga ke app_metadata via Admin Client bila tersedia agar terbaca lintas sesi Admin
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      await adminClient.auth.admin.updateUserById(authCheck.authUser.userId, {
        app_metadata: { academic_config: academicConfig },
      });
    } catch {
      // Abaikan jika gagal update app_metadata, user_metadata sudah tersimpan
    }
  }

  revalidatePath('/pengaturan');
  revalidatePath('/(app)', 'layout');
  revalidatePath('/', 'layout');

  return { ok: true, data: academicConfig };
}

/**
 * 3. Toggle Status Aktif / Nonaktif Akun Pengguna (Khusus ADMIN).
 */
export async function toggleUserStatusAction(
  rawInput: unknown
): Promise<ActionResult> {
  const authCheck = await verifyActiveUser(true);
  if (!authCheck.ok || !authCheck.authUser) {
    return { ok: false, error: authCheck.error || 'Akses ditolak.' };
  }

  const parsed = toggleUserStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { user_id, is_active } = parsed.data;

  if (user_id === authCheck.authUser.userId && !is_active) {
    return {
      ok: false,
      error: 'Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.',
    };
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_active })
    .eq('id', user_id);

  if (updateError) {
    return { ok: false, error: mapDbError(updateError) };
  }

  revalidatePath('/pengaturan');
  revalidatePath('/(app)', 'layout');

  return { ok: true };
}

/**
 * 4. Reset Kata Sandi Pengguna oleh ADMIN (Khusus ADMIN).
 */
export async function adminResetPasswordAction(
  rawInput: unknown
): Promise<ActionResult> {
  const authCheck = await verifyActiveUser(true);
  if (!authCheck.ok || !authCheck.authUser) {
    return { ok: false, error: authCheck.error || 'Akses ditolak.' };
  }

  const parsed = adminResetPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { user_id, new_password } = parsed.data;
  const adminClient = createAdminClient();

  if (adminClient) {
    const { error } = await adminClient.auth.admin.updateUserById(user_id, {
      password: new_password,
    });
    if (error) {
      return {
        ok: false,
        error: 'Gagal mereset kata sandi pengguna. Pastikan kata sandi memenuhi syarat keamanan.',
      };
    }
  } else if (user_id === authCheck.authUser.userId) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: new_password,
    });
    if (error) {
      return {
        ok: false,
        error: 'Gagal mereset kata sandi pengguna.',
      };
    }
  } else {
    return {
      ok: false,
      error: 'Konfigurasi kunci layanan admin belum tersedia untuk mereset akun pengguna lain.',
    };
  }

  revalidatePath('/pengaturan');
  return { ok: true };
}

/**
 * 5. Update Profil Pengguna Saat Ini (Bisa ADMIN & USTADZ).
 */
export async function updateUserProfileAction(
  rawInput: unknown
): Promise<ActionResult> {
  const authCheck = await verifyActiveUser(false);
  if (!authCheck.ok || !authCheck.authUser) {
    return { ok: false, error: authCheck.error || 'Sesi tidak valid.' };
  }

  const parsed = userProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { full_name, phone } = parsed.data;
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name,
      phone: phone || null,
    })
    .eq('id', authCheck.authUser.userId);

  if (updateError) {
    return { ok: false, error: mapDbError(updateError) };
  }

  // Jika role adalah USTADZ yang terhubung ke data ustadz, sinkronkan nama & whatsapp ke tabel teachers
  if (authCheck.authUser.role === 'USTADZ' && authCheck.authUser.teacherId) {
    const adminClient = createAdminClient();
    const writeClient = adminClient || supabase;
    await writeClient
      .from('teachers')
      .update({
        name: full_name,
        ...(phone && phone.trim().length > 0 ? { whatsapp: phone.trim() } : {}),
      })
      .eq('id', authCheck.authUser.teacherId);
    revalidatePath('/ustadz');
  }

  revalidatePath('/pengaturan');
  revalidatePath('/(app)', 'layout');
  revalidatePath('/', 'layout');

  return { ok: true };
}

/**
 * 6. Ganti Kata Sandi Akun Pengguna Saat Ini (Bisa ADMIN & USTADZ).
 */
export async function changePasswordAction(
  rawInput: unknown
): Promise<ActionResult> {
  const authCheck = await verifyActiveUser(false);
  if (!authCheck.ok || !authCheck.authUser) {
    return { ok: false, error: authCheck.error || 'Sesi tidak valid.' };
  }

  const parsed = changePasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { ok: false, error: 'Sesi Anda telah berakhir. Silakan masuk kembali.' };
  }

  const { current_password, new_password } = parsed.data;

  // 1. Verifikasi kredensial saat ini terlebih dahulu demi keamanan
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current_password,
  });

  if (signInError) {
    return {
      ok: false,
      error: 'Kata sandi saat ini salah. Pastikan Anda memasukkan kata sandi yang benar.',
    };
  }

  // 2. Update password baru
  const { error: updateError } = await supabase.auth.updateUser({
    password: new_password,
  });

  if (updateError) {
    return {
      ok: false,
      error: 'Gagal mengubah kata sandi. Pastikan kata sandi baru memenuhi syarat keamanan.',
    };
  }

  return { ok: true };
}
