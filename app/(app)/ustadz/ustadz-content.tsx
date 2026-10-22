import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseListParams } from '@/lib/validators/list-params';
import { normalizeHalaqahRelation } from '@/lib/validators/ustadz-rules';
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
  const classesRes = await supabase.from('classes').select('id, name, level').order('level', { ascending: true });

  // 3. Query teachers with inner join to halaqahs for filter
  let query = supabase
    .from('teachers')
    .select('*, halaqahs(id, name, class_id, is_active, classes(name))', { count: 'exact' });

  if (!validated.showInactive || !isAdmin) {
    query = query.eq('is_active', true);
  }

  if (validated.search) {
    query = query.ilike('name', `%${validated.search}%`);
  }

  if (validated.classLevel !== 'all') {
    // Only teachers who have active halaqahs in this class
    query = query.filter('halaqahs.class_id', 'eq', validated.classLevel).filter('halaqahs.is_active', 'eq', true);
  }

  const offset = (validated.page - 1) * validated.limit;
  query = query
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + validated.limit - 1);

  const { data: teachersData, count } = await query;

  const teachers: TeacherRow[] = (teachersData || []).map((t) => {
const hs = normalizeHalaqahRelation(t.halaqahs);
    const activeHs = hs.filter(h => h.is_active);
    
    return {
      id: t.id,
      name: t.name,
      gender: t.gender,
      whatsapp: t.whatsapp,
      boarding_school: t.boarding_school,
      is_active: t.is_active,
      halaqah_names: activeHs.map(h => h.name).join(', '),
      class_names: [...new Set(activeHs.map(h => h.classes?.name).filter(Boolean))].join(', '),
    };
  });

  return (
    <UstadzClient
      teachers={teachers}
      totalCount={count || 0}
      classes={classesRes.data || []}
      isAdmin={isAdmin}
      currentPage={validated.page}
      pageSize={validated.limit}
      currentSearch={validated.search}
      currentClass={validated.classLevel.toString()}
      currentInactive={validated.showInactive}
    />
  );
}
