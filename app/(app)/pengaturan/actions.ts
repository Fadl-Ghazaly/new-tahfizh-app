'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  schoolSettingsSchema,
  userProfileSchema,
  changePasswordSchema,
} from '@/lib/validators/pengaturan';
import { mapDbError } from '@/lib/validators/list-params';
import { revalidatePath, revalidateTag } from 'next/cache';

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Update Pengaturan Sekolah / Pesantren (Khusus ADMIN).
 */
export async function updateSchoolSettingsAction(
  rawInput: unknown
): Promise<ActionResult> {
  const { error: adminError, supabase, user } = await requireAdmin();
  if (adminError || !supabase || !user) {
    return { ok: false, error: adminError || 'Akses ditolak.' };
  }

  const parsed = schoolSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { school_name, logo_url, theme } = parsed.data;

  // Cek apakah baris school_settings sudah ada
  const { data: existing, error: fetchError } = await supabase
    .from('school_settings')
    .select('id')
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
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
        updated_by: user.id,
      })
      .eq('id', existing.id);
    dbError = error;
  } else {
    const { error } = await supabase.from('school_settings').insert({
      school_name,
      logo_url: logo_url || null,
      theme,
      updated_by: user.id,
    });
    dbError = error;
  }

  if (dbError) {
    return { ok: false, error: mapDbError(dbError) };
  }

  try {
    revalidateTag('school-settings', 'max');
  } catch {
    // revalidateTag fallback
  }
  revalidatePath('/pengaturan');
  revalidatePath('/(app)', 'layout');
  revalidatePath('/', 'layout');

  return { ok: true };
}

/**
 * Update Profil Pengguna Saat Ini (Bisa ADMIN & USTADZ).
 */
export async function updateUserProfileAction(
  rawInput: unknown
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'Sesi Anda telah berakhir. Silakan masuk kembali.' };
  }

  const parsed = userProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { full_name, phone } = parsed.data;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name,
      phone: phone || null,
    })
    .eq('id', user.id);

  if (updateError) {
    return { ok: false, error: mapDbError(updateError) };
  }

  revalidatePath('/pengaturan');
  revalidatePath('/(app)', 'layout');
  revalidatePath('/', 'layout');

  return { ok: true };
}

/**
 * Ganti Kata Sandi Akun Pengguna Saat Ini.
 */
export async function changePasswordAction(
  rawInput: unknown
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return { ok: false, error: 'Sesi Anda telah berakhir. Silakan masuk kembali.' };
  }

  const parsed = changePasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
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

