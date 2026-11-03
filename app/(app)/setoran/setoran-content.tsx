import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseSetoranParams } from '@/lib/validators/setoran-params';
import { EmptyState } from '@/components/layout/empty-state';
import { BookOpenCheck } from 'lucide-react';
import { SetoranClient, StudentSetoranItem, SetoranClientClassOption, SetoranClientTeacherOption } from './setoran-client';
import { allowedDateWindow } from '@/lib/setoran/rules';
import { MemorizationRecordRow } from './riwayat-dialog';

export async function SetoranContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const rawParams = await searchParams;

  const todayIso = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <EmptyState
        icon={<BookOpenCheck className="h-8 w-8 text-primary" />}
        title="Sesi tidak ditemukan"
        description="Silakan masuk kembali untuk mengakses halaman ini."
      />
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    return (
      <EmptyState
        icon={<BookOpenCheck className="h-8 w-8 text-primary" />}
        title="Akun tidak aktif"
        description="Akun Anda sedang dinonaktifkan, silakan hubungi admin."
      />
    );
  }

  const role = profile.role as 'ADMIN' | 'USTADZ';
  let teacherId: string | null = null;

  if (role === 'USTADZ') {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, is_active')
      .eq('profile_id', user.id)
      .single();

    if (!teacher || !teacher.is_active) {
      return (
        <EmptyState
          icon={<BookOpenCheck className="h-8 w-8 text-primary" />}
          title="Akun Belum Terhubung"
          description="Akun Anda belum terhubung dengan data ustadz aktif, hubungi admin."
        />
      );
    }
    teacherId = teacher.id;
  }

  const validated = parseSetoranParams(rawParams, role, todayIso);
  const dateLimits = allowedDateWindow(role, todayIso);

  const [classesRes, teachersRes] = await Promise.all([
    supabase.from('classes').select('id, name, level').order('level', { ascending: true }),
    role === 'ADMIN' ? supabase.from('teachers').select('id, name').eq('is_active', true).order('name') : Promise.resolve({ data: [] }),
  ]);

  const classes: SetoranClientClassOption[] = classesRes.data || [];
  const teachers: SetoranClientTeacherOption[] = teachersRes.data || [];

  let query = supabase
    .from('students')
    .select('id, nisn, name, gender, class_id, classes(name, level), halaqahs(id, name, teacher_id, teachers(name))', { count: 'exact' })
    .eq('status', 'ACTIVE');

  if (role === 'USTADZ' && teacherId) {
    query = query.eq('halaqahs.teacher_id', teacherId);
  } else if (role === 'ADMIN' && validated.ustadzId !== 'all') {
    query = query.eq('halaqahs.teacher_id', validated.ustadzId);
  }

  if (validated.classLevel !== 'all') {
    query = query.eq('classes.level', validated.classLevel);
  }

  if (validated.search) {
    query = query.ilike('name', `%${validated.search}%`);
  }

  const from = (validated.page - 1) * 20;
  const to = from + 19;
  query = query.order('name', { ascending: true }).range(from, to);

  const { data: students, count } = await query;
  const studentList = students || [];
  const studentIds = studentList.map((s) => s.id);

  const attendances: Record<string, string> = {};
  const dailyRecords: Record<string, MemorizationRecordRow[]> = {};

  if (studentIds.length > 0) {
    const [attRes, recRes] = await Promise.all([
      supabase
        .from('attendance')
        .select('student_id, status')
        .eq('date', validated.date)
        .in('student_id', studentIds),
      supabase
        .from('memorization_records')
        .select('id, student_id, type, juz, surah_id, ayah_start, ayah_end, line_count, mistake_count, fluency_score, notes, status')
        .eq('date', validated.date)
        .eq('status', 'ACTIVE')
        .in('student_id', studentIds),
    ]);

    (attRes.data || []).forEach((a) => {
      attendances[a.student_id] = a.status;
    });

    (recRes.data || []).forEach((r) => {
      if (!dailyRecords[r.student_id]) {
        dailyRecords[r.student_id] = [];
      }
      dailyRecords[r.student_id].push({
        id: r.id,
        type: r.type,
        juz: r.juz,
        surah_id: r.surah_id,
        ayah_start: r.ayah_start,
        ayah_end: r.ayah_end,
        line_count: r.line_count,
        mistake_count: r.mistake_count,
        fluency_score: r.fluency_score,
        notes: r.notes,
      });
    });
  }

  const items: StudentSetoranItem[] = studentList.map((s) => {
    const classObj = Array.isArray(s.classes) ? s.classes[0] : s.classes;
    const className = classObj?.name || '-';

    const halaqahObj = Array.isArray(s.halaqahs) ? s.halaqahs[0] : s.halaqahs;
    const halaqahName = halaqahObj?.name || '-';
    
    let rawTeacherName = '-';
    if (halaqahObj?.teachers) {
      const teacherObj = Array.isArray(halaqahObj.teachers) ? halaqahObj.teachers[0] : halaqahObj.teachers;
      if (teacherObj?.name) {
        rawTeacherName = teacherObj.name;
      }
    }

    const allRecords = dailyRecords[s.id] || [];
    const recordsForType = allRecords.filter((r) => r.type === validated.type);
    const totalLines = recordsForType.reduce((acc, r) => acc + (r.line_count || 0), 0);

    return {
      id: s.id,
      name: s.name,
      className,
      halaqahName,
      rawTeacherName,
      attendanceStatus: attendances[s.id] || null,
      selectedTypeRecordCount: recordsForType.length,
      selectedTypeTotalLines: totalLines,
      allDailyRecords: allRecords,
    };
  });

  return (
    <SetoranClient
      role={role}
      params={validated}
      dateLimits={dateLimits}
      classes={classes}
      teachers={teachers}
      items={items}
      totalCount={count || 0}
    />
  );
}
