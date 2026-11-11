import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseListParams } from '@/lib/validators/list-params';
import { normalizeHalaqahRelation } from '@/lib/validators/ustadz-rules';
import { buildUstadzEmailFromName } from '@/lib/ustadz/provision-email';
import { UstadzClient, TeacherRow } from './ustadz-client';

export async function UstadzContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const rawParams = await searchParams;
  const validated = parseListParams(rawParams);

  const supabase = await createClient();

  // 1. Fetch user role
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'ADMIN' && profile?.is_active === true;
  }

  // 2. Fetch classes
  const classesRes = await supabase
    .from('classes')
    .select('id, name, level')
    .order('level', { ascending: true });
  const allClasses = classesRes.data || [];

  // 3. Query teachers
  let query = supabase
    .from('teachers')
    .select('*, halaqahs(id, name, class_id, is_active, classes(name))', { count: 'exact' });

  // RBAC: Hanya ADMIN yang melihat seluruh data ustadz secara rinci; USTADZ hanya melihat profilnya sendiri
  if (!isAdmin && user) {
    query = query.eq('profile_id', user.id);
  }

  if (!validated.showInactive || !isAdmin) {
    query = query.eq('is_active', true);
  }

  if (validated.search) {
    query = query.ilike('name', `%${validated.search}%`);
  }

  if (validated.classLevel !== 'all') {
    const matchedClass = allClasses.find((c) => c.level === validated.classLevel);
    if (matchedClass) {
      const { data: halRows } = await supabase
        .from('halaqahs')
        .select('teacher_id')
        .eq('class_id', matchedClass.id)
        .eq('is_active', true);
      const teacherIds = (halRows || []).map((h) => h.teacher_id);
      if (teacherIds.length > 0) {
        query = query.in('id', teacherIds);
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }
  }

  const offset = (validated.page - 1) * validated.limit;
  query = query
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + validated.limit - 1);

  const { data: teachersData, count } = await query;

  // 4. Resolve email accounts from Supabase Auth
  const emailByProfileId = new Map<string, string>();
  if (user?.email) {
    emailByProfileId.set(user.id, user.email);
  }

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      for (const au of authUsersData?.users || []) {
        if (au.email) {
          emailByProfileId.set(au.id, au.email);
        }
      }
    } catch {
      // Fallback jika listUsers gagal
    }
  }

  const teachers: TeacherRow[] = (teachersData || []).map((t) => {
    const hs = normalizeHalaqahRelation(t.halaqahs);
    const activeHs = hs.filter((h) => h.is_active);
    const resolvedEmail =
      (t.profile_id ? emailByProfileId.get(t.profile_id) : undefined) ||
      buildUstadzEmailFromName(t.name);

    return {
      id: t.id,
      name: t.name,
      email: resolvedEmail,
      gender: t.gender,
      whatsapp: t.whatsapp,
      boarding_school: t.boarding_school,
      is_active: t.is_active,
      halaqah_names: activeHs.map((h) => h.name).join(', '),
      class_names: [...new Set(activeHs.map((h) => h.classes?.name).filter(Boolean))].join(', '),
    };
  });

  return (
    <UstadzClient
      teachers={teachers}
      totalCount={count || 0}
      classes={allClasses}
      isAdmin={isAdmin}
      currentPage={validated.page}
      pageSize={validated.limit}
      currentSearch={validated.search}
      currentClass={validated.classLevel.toString()}
      currentInactive={validated.showInactive}
    />
  );
}
