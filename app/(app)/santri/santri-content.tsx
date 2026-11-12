import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { parseListParams } from '@/lib/validators/list-params';
import { SantriClient, ClassOption, HalaqahOption, StudentRow } from './santri-client';

export async function SantriContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const rawParams = await searchParams;
  const validated = parseListParams(rawParams);

  const supabase = await createClient();

  // 1. Fetch user role & linked teacher via shared in-memory request cache
  let isAdmin = false;
  let role: 'ADMIN' | 'USTADZ' = 'USTADZ';
  let ustadzTeacherId: string | null = null;

  try {
    const authUser = await requireUser();
    if (authUser.isActive) {
      role = authUser.role;
      isAdmin = role === 'ADMIN';
      ustadzTeacherId = authUser.teacherId;
    }
  } catch {
    // Sesi ditangani oleh layout
  }

  // 2. Fetch active classes & halaqahs
  const [classesRes, halaqahsRes] = await Promise.all([
    supabase.from('classes').select('id, name, level').order('level', { ascending: true }),
    supabase
      .from('halaqahs')
      .select('id, name, class_id, teacher_id, is_active, teachers(name)')
      .eq('is_active', true),
  ]);

  const allClasses: ClassOption[] = (classesRes.data || []).map((c) => ({
    id: c.id,
    name: c.name,
    level: c.level,
  }));

  const rawHalaqahs = halaqahsRes.data || [];
  const filteredRawHalaqahs = isAdmin
    ? rawHalaqahs
    : rawHalaqahs.filter((h) => ustadzTeacherId !== null && h.teacher_id === ustadzTeacherId);

  const ustadzHalaqahIds = filteredRawHalaqahs.map((h) => h.id);

  const activeHalaqahs: HalaqahOption[] = filteredRawHalaqahs.map((h) => {
    const teacherName = Array.isArray(h.teachers)
      ? h.teachers[0]?.name
      : (h.teachers as { name: string } | null)?.name;
    return {
      id: h.id,
      name: h.name,
      class_id: h.class_id,
      teacher_name: teacherName || null,
    };
  });

  // Scope classes dropdown for USTADZ to classes of their own halaqahs
  const allowedClassIds = new Set(filteredRawHalaqahs.map((h) => h.class_id));
  const classes: ClassOption[] = isAdmin
    ? allClasses
    : allClasses.filter((c) => allowedClassIds.has(c.id));

  // 3. Build query for students list
  let query = supabase
    .from('students')
    .select('*, classes(name), halaqahs(name, teachers(name))', { count: 'exact' });

  // RBAC: USTADZ hanya boleh melihat santri pada halaqah yang dijaganya
  if (!isAdmin) {
    if (ustadzHalaqahIds.length > 0) {
      query = query.in('halaqah_id', ustadzHalaqahIds);
    } else {
      query = query.eq('halaqah_id', '00000000-0000-0000-0000-000000000000');
    }
  }

  if (!validated.showInactive) {
    query = query.eq('status', 'ACTIVE');
  }

  if (validated.classLevel !== 'all') {
    const matchedClass = allClasses.find((c) => c.level === validated.classLevel);
    if (matchedClass) {
      query = query.eq('class_id', matchedClass.id);
    }
  }

  if (validated.search) {
    query = query.or(`name.ilike.%${validated.search}%,nisn.ilike.%${validated.search}%`);
  }

  const offset = (validated.page - 1) * validated.limit;
  query = query
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + validated.limit - 1);

  const { data: studentsData, count } = await query;

  const students: StudentRow[] = (studentsData || []).map((s) => {
    const className = (s.classes as { name: string } | null)?.name || '-';
    const halaqahObj = s.halaqahs as {
      name: string;
      teachers?: { name: string } | { name: string }[] | null;
    } | null;
    const halaqahName = halaqahObj?.name || '-';
    const tObj = halaqahObj?.teachers;
    const teacherName = Array.isArray(tObj) ? tObj[0]?.name : tObj?.name || '-';

    return {
      id: s.id,
      nisn: s.nisn,
      name: s.name,
      gender: s.gender,
      class_id: s.class_id,
      halaqah_id: s.halaqah_id,
      parent_name: s.parent_name,
      parent_whatsapp: s.parent_whatsapp,
      status: s.status,
      class_name: className,
      halaqah_name: halaqahName,
      teacher_name: teacherName || '-',
    };
  });

  const canEdit = isAdmin || ustadzHalaqahIds.length > 0;

  return (
    <SantriClient
      students={students}
      totalCount={count || 0}
      classes={classes}
      activeHalaqahs={activeHalaqahs}
      isAdmin={isAdmin}
      canEdit={canEdit}
      currentPage={validated.page}
      pageSize={validated.limit}
      currentSearch={validated.search}
      currentClass={validated.classLevel.toString()}
      currentInactive={validated.showInactive}
    />
  );
}
