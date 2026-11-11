import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Membuat Supabase Admin Client menggunakan SUPABASE_SERVICE_ROLE_KEY
 * hanya di lingkungan server untuk manajemen pengguna (auth.admin.*).
 * Mengembalikan null jika environment variable tidak tersedia.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

