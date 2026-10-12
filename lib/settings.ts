import 'server-only';
import { cacheTag, cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Fallback jika RPC gagal
const DEFAULT_SETTINGS = {
  school_name: 'Pesantren Darul Ilmi',
  logo_url: null,
  theme: 'theme-1',
};

// Fungsi normalisasi tema (hanya 'theme-1' sampai 'theme-6')
export function normalizeTheme(value: unknown): string {
  const allowed = ['theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6'];
  return typeof value === 'string' && allowed.includes(value) ? value : 'theme-1';
}

/**
 * Mendapatkan pengaturan publik sekolah dari Supabase via RPC.
 * Menggunakan "use cache" untuk performa dan instant navigation.
 * stale 5 menit (klien), revalidate 1 jam (server), expire 30 hari.
 * Perubahan dari halaman Pengaturan langsung terlihat lewat updateTag('school-settings').
 */
async function fetchCachedSchoolSettings() {
  "use cache";
  cacheTag('school-settings');
  cacheLife({ stale: 300, revalidate: 3600, expire: 2592000 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.rpc('get_public_school_settings');

  if (error || !data || data.length === 0) {
    throw new Error('Failed to fetch school settings');
  }

  return {
    school_name: data[0].school_name,
    logo_url: data[0].logo_url,
    theme: normalizeTheme(data[0].theme),
  };
}

export async function getPublicSchoolSettings() {
  try {
    return await fetchCachedSchoolSettings();
  } catch (e) {
    console.error('Failed to fetch school settings, using defaults:', e);
    return DEFAULT_SETTINGS;
  }
}
