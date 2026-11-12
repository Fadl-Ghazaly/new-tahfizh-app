import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { parseSetoranParams } from '@/lib/validators/setoran-params';
import { EmptyState } from '@/components/layout/empty-state';
import { BookOpenCheck } from 'lucide-react';
import {
  SetoranClient,
  StudentSetoranItem,
  SetoranClientClassOption,
  SetoranClientTeacherOption,
  SetoranSurahOption,
} from './setoran-client';
import { allowedDateWindow } from '@/lib/setoran/rules';
import { calculateStudentRowSummary } from '@/lib/setoran/dialog-state';
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

  // 1. Auth & Profile Check via shared in-memory request cache
  let authUser;
  try {
    authUser = await requireUser();
  } catch {
    return (
      <EmptyState
        icon={<BookOpenCheck className="h-8 w-8 text-primary" />}
        title="Sesi tidak ditemukan"
        description="Silakan masuk kembali untuk mengakses halaman ini."
      />
    );
  }

  if (!authUser.isActive) {
    return (
      <EmptyState
        icon={<BookOpenCheck className="h-8 w-8 text-primary" />}
        title="Akun tidak aktif"
        description="Akun Anda sedang dinonaktifkan, silakan hubungi admin."
      />
    );
  }

  const role = authUser.role;
  const teacherId = authUser.teacherId;

  if (role === 'USTADZ' && !teacherId) {
    return (
      <EmptyState
        icon={<BookOpenCheck className="h-8 w-8 text-primary" />}
        title="Akun Belum Terhubung"
        description="Akun Anda belum terhubung dengan data ustadz aktif, hubungi admin."
      />
    );
  }

  const validated = parseSetoranParams(rawParams, role, todayIso);
  const dateLimits = allowedDateWindow(role, todayIso);

  const [classesRes, teachersRes, surahsRes] = await Promise.all([
    supabase.from('classes').select('id, name, level').order('level', { ascending: true }),
    role === 'ADMIN' ? supabase.from('teachers').select('id, name').eq('is_active', true).order('name') : Promise.resolve({ data: [] }),
    supabase.from('quran_surahs').select('id, number, name_latin').order('number', { ascending: true }),
  ]);

  const classes: SetoranClientClassOption[] = classesRes.data || [];
  const teachers: SetoranClientTeacherOption[] = teachersRes.data || [];
  const surahs: SetoranSurahOption[] = (surahsRes.data || []).map((s) => ({
    id: s.id,
    number: s.number,
    nameLatin: s.name_latin,
  }));

  // Resolve target halaqah IDs for ustadz restriction or admin ustadz filter
  const targetTeacherId = role === 'USTADZ' ? teacherId : (validated.ustadzId !== 'all' ? validated.ustadzId : null);
  let targetHalaqahIds: string[] | null = null;

  if (targetTeacherId) {
    const { data: halaqahRows } = await supabase
      .from('halaqahs')
      .select('id')
      .eq('teacher_id', targetTeacherId)
      .eq('is_active', true);

    targetHalaqahIds = (halaqahRows || []).map((h) => h.id);
  }

  let query = supabase
    .from('students')
    .select('id, nisn, name, gender, class_id, halaqah_id, classes(name, level), halaqahs(id, name, teacher_id, teachers(name))', { count: 'exact' })
    .eq('status', 'ACTIVE');

  // Filter halaqah on main students table
  if (targetHalaqahIds !== null) {
    if (targetHalaqahIds.length > 0) {
      query = query.in('halaqah_id', targetHalaqahIds);
    } else {
      query = query.eq('halaqah_id', '00000000-0000-0000-0000-000000000000');
    }
  }

  // Filter class on main students table
  if (validated.classLevel !== 'all') {
    const matchingClassIds = classes
      .filter((c) => c.level === validated.classLevel)
      .map((c) => c.id);

    if (matchingClassIds.length > 0) {
      query = query.in('class_id', matchingClassIds);
    } else {
      query = query.eq('class_id', '00000000-0000-0000-0000-000000000000');
    }
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
    const summary = calculateStudentRowSummary(s.id, attendances, allRecords, validated.type);

    return {
      id: s.id,
      name: s.name,
      className,
      halaqahName,
      rawTeacherName,
      attendanceStatus: summary.attendanceStatus,
      selectedTypeRecordCount: summary.selectedTypeRecordCount,
      selectedTypeTotalLines: summary.selectedTypeTotalLines,
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
      surahs={surahs}
      items={items}
      totalCount={count || 0}
    />
  );
}
