import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/setoran/rules';

export interface AuthenticatedUser {
  userId: string;
  role: Role;
  isActive: boolean;
  teacherId: string | null;
  fullName?: string;
  email?: string;
  phone?: string | null;
}

export const requireUser = cache(async (): Promise<AuthenticatedUser> => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('TH000');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, phone, role, is_active')
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
    fullName: profile.full_name || '',
    email: user.email || '',
    phone: profile.phone || null,
  };
});
