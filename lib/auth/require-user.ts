import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/setoran/rules';

export interface AuthenticatedUser {
  userId: string;
  role: Role;
  isActive: boolean;
  teacherId: string | null;
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('TH000');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('TH000');
  }

  let teacherId: string | null = null;
  if (profile.role === 'USTADZ') {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, is_active')
      .eq('profile_id', user.id)
      .single();

    if (teacher && teacher.is_active) {
      teacherId = teacher.id;
    }
  }

  return {
    userId: user.id,
    role: profile.role as Role,
    isActive: Boolean(profile.is_active),
    teacherId,
  };
}
