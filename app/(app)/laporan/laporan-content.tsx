import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/layout/empty-state';
import { BookOpenCheck } from 'lucide-react';
import { parseLaporanParams } from '@/lib/validators/laporan-params';
import {
  calculateAttendanceSummary,
  calculateAverageFluency,
  getMonthDateRange,
  getTwoPreviousMonths,
  getMonthName,
  buildDailyChartPoints,
  aggregateHalaqahPerformance,
  resolveMatchingClassIds,
} from '@/lib/laporan/queries';
import {
  MonthlyStudentSummaryRow,
  StudentMutabaahCardData,
  MutabaahRecordDetail,
  ClassFilterOption,
  TeacherFilterOption,
  StudentFilterOption,
} from '@/lib/laporan/types';
import { barisKeJuzHalaman, formatCapaian, persenProgress } from '@/lib/tahfizh';
import { LaporanClient } from './laporan-client';

export async function LaporanContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const rawParams = await searchParams;
  const supabase = await createClient();

  // 1. Auth & Profile Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <EmptyState
        icon={<BookOpenCheck className="h-8 w-8 text-primary" />}
        title="Sesi tidak ditemukan"
        description="Silakan masuk kembali untuk mengakses halaman laporan."
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

  // 2. Validate query params
  const validated = parseLaporanParams(rawParams, role, teacherId);

  // 3. Fetch reference master data
  const [classesRes, teachersRes, surahsRes] = await Promise.all([
    supabase.from('classes').select('id, name, level').order('level', { ascending: true }),
    role === 'ADMIN'
      ? supabase.from('teachers').select('id, name').eq('is_active', true).order('name')
      : Promise.resolve({ data: [] }),
    supabase.from('quran_surahs').select('id, number, name_latin').order('number', { ascending: true }),
  ]);

  const classes: ClassFilterOption[] = classesRes.data || [];
  const teachers: TeacherFilterOption[] = teachersRes.data || [];
  const surahsMap = new Map<number, string>();
  (surahsRes.data || []).forEach((s) => {
    surahsMap.set(s.id, `${s.number}. ${s.name_latin}`);
  });

  // 4. Resolve halaqah restrictions for USTADZ or ADMIN filter
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

  // 5. Query matching active students
  let studentQuery = supabase
    .from('students')
    .select('id, nisn, name, class_id, halaqah_id, parent_name, classes(name, level), halaqahs(id, name, teacher_id, teachers(name))')
    .eq('status', 'ACTIVE');

  if (targetHalaqahIds !== null) {
    if (targetHalaqahIds.length > 0) {
      studentQuery = studentQuery.in('halaqah_id', targetHalaqahIds);
    } else {
      studentQuery = studentQuery.eq('halaqah_id', '00000000-0000-0000-0000-000000000000');
    }
  }

  if (validated.classLevel !== 'all') {
    const matchingClassIds = resolveMatchingClassIds(classes, validated.classLevel) || [];

    if (matchingClassIds.length > 0) {
      studentQuery = studentQuery.in('class_id', matchingClassIds);
    } else {
      studentQuery = studentQuery.eq('class_id', '00000000-0000-0000-0000-000000000000');
    }
  }

  const { data: rawStudents } = await studentQuery.order('name', { ascending: true });
  const studentList = rawStudents || [];
  const studentIds = studentList.map((s) => s.id);

  // 6. Calculate date intervals
  const { startDate, endDate } = getMonthDateRange(validated.year, validated.month);
  const twoPrevMonths = getTwoPreviousMonths(validated.year, validated.month);
  const prev1Range = twoPrevMonths[0];
  const prev2Range = twoPrevMonths[1];

  // 7. Parallel fetch attendance, records in month, and historical records via views
  const emptyRes = { data: [] };
  const [
    attendanceRes,
    monthRecordsRes,
    lifetimeSabaqRes,
    prev1SabaqRes,
    prev2SabaqRes,
  ] = studentIds.length > 0
    ? await Promise.all([
        supabase
          .from('attendance')
          .select('student_id, status, date')
          .gte('date', startDate)
          .lte('date', endDate)
          .in('student_id', studentIds)
          .limit(10000),
        supabase
          .from('memorization_records')
          .select('id, student_id, date, type, juz, surah_id, ayah_start, ayah_end, line_count, mistake_count, fluency_score, notes')
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('status', 'ACTIVE')
          .in('student_id', studentIds)
          .order('date', { ascending: true })
          .limit(10000),
        supabase
          .from('v_student_rankings')
          .select('student_id, total_sabaq_lines')
          .in('student_id', studentIds),
        supabase
          .from('v_student_monthly_progress')
          .select('student_id, monthly_sabaq_lines')
          .eq('month_start', prev1Range.startDate)
          .in('student_id', studentIds),
        supabase
          .from('v_student_monthly_progress')
          .select('student_id, monthly_sabaq_lines')
          .eq('month_start', prev2Range.startDate)
          .in('student_id', studentIds),
      ])
    : [emptyRes, emptyRes, emptyRes, emptyRes, emptyRes];

  // Index attendance by student_id
  const studentAttendanceMap = new Map<string, Array<{ status: string }>>();
  (attendanceRes.data || []).forEach((a) => {
    if (!studentAttendanceMap.has(a.student_id)) {
      studentAttendanceMap.set(a.student_id, []);
    }
    studentAttendanceMap.get(a.student_id)!.push({ status: a.status });
  });

  // Index month records by student_id
  interface RecordDbRow {
    id: string;
    student_id: string;
    date: string;
    type: 'SABAQ' | 'SABQI' | 'MANZIL';
    juz: number;
    surah_id: number;
    ayah_start: number;
    ayah_end: number;
    line_count: number;
    mistake_count: number;
    fluency_score: number;
    notes: string | null;
  }
  const studentMonthRecordsMap = new Map<string, RecordDbRow[]>();
  (monthRecordsRes.data || []).forEach((r) => {
    if (!studentMonthRecordsMap.has(r.student_id)) {
      studentMonthRecordsMap.set(r.student_id, []);
    }
    studentMonthRecordsMap.get(r.student_id)!.push(r as RecordDbRow);
  });

  // Index lifetime sabaq lines by student_id (from v_student_rankings)
  const lifetimeSabaqMap = new Map<string, number>();
  (lifetimeSabaqRes.data || []).forEach((r) => {
    lifetimeSabaqMap.set(r.student_id, Number(r.total_sabaq_lines || 0));
  });

  // Index prev1 sabaq lines by student_id (from v_student_monthly_progress)
  const prev1SabaqMap = new Map<string, number>();
  (prev1SabaqRes.data || []).forEach((r) => {
    prev1SabaqMap.set(r.student_id, Number(r.monthly_sabaq_lines || 0));
  });

  // Index prev2 sabaq lines by student_id (from v_student_monthly_progress)
  const prev2SabaqMap = new Map<string, number>();
  (prev2SabaqRes.data || []).forEach((r) => {
    prev2SabaqMap.set(r.student_id, Number(r.monthly_sabaq_lines || 0));
  });

  // 8. Build monthly summaries
  const monthlySummaries: MonthlyStudentSummaryRow[] = studentList.map((s) => {
    const classObj = Array.isArray(s.classes) ? s.classes[0] : s.classes;
    const className = classObj?.name || '-';

    const halaqahObj = Array.isArray(s.halaqahs) ? s.halaqahs[0] : s.halaqahs;
    const halaqahName = halaqahObj?.name || '-';

    let teacherName = '-';
    if (halaqahObj?.teachers) {
      const tObj = Array.isArray(halaqahObj.teachers) ? halaqahObj.teachers[0] : halaqahObj.teachers;
      if (tObj?.name) teacherName = tObj.name;
    }

    const attRecords = studentAttendanceMap.get(s.id) || [];
    const attendance = calculateAttendanceSummary(attRecords);

    const mRecords = studentMonthRecordsMap.get(s.id) || [];
    let sabaqLines = 0;
    let sabqiLines = 0;
    let manzilLines = 0;
    const fluencyScores: number[] = [];

    for (const r of mRecords) {
      if (r.type === 'SABAQ') sabaqLines += r.line_count || 0;
      else if (r.type === 'SABQI') sabqiLines += r.line_count || 0;
      else if (r.type === 'MANZIL') manzilLines += r.line_count || 0;

      if (typeof r.fluency_score === 'number') {
        fluencyScores.push(r.fluency_score);
      }
    }

    const lifetimeSabaq = lifetimeSabaqMap.get(s.id) || 0;
    const lifetimeProgress = persenProgress(lifetimeSabaq);
    const avgFluency = calculateAverageFluency(fluencyScores);

    const sabaqJuzHalaman = barisKeJuzHalaman(sabaqLines);
    const sabaqFormatted = sabaqLines > 0
      ? `${sabaqJuzHalaman.juz > 0 ? `${sabaqJuzHalaman.juz} juz, ` : ''}${sabaqJuzHalaman.halaman} hal${sabaqJuzHalaman.barisSisa > 0 ? ` +${sabaqJuzHalaman.barisSisa} baris` : ''}`
      : '0 baris';

    return {
      studentId: s.id,
      name: s.name,
      nisn: s.nisn,
      className,
      halaqahName,
      teacherName,
      sabaqLines,
      sabqiLines,
      manzilLines,
      sabaqFormatted,
      lifetimeSabaqLines: lifetimeSabaq,
      lifetimeProgressPercent: lifetimeProgress,
      attendance,
      averageFluency: avgFluency,
      trendPrevMonth: prev1SabaqMap.get(s.id) || 0,
      trendTwoMonthsAgo: prev2SabaqMap.get(s.id) || 0,
    };
  });

  // 9. Build Student Filter Options
  const studentOptions: StudentFilterOption[] = studentList.map((s) => {
    const classObj = Array.isArray(s.classes) ? s.classes[0] : s.classes;
    const halaqahObj = Array.isArray(s.halaqahs) ? s.halaqahs[0] : s.halaqahs;
    return {
      id: s.id,
      name: s.name,
      className: classObj?.name || '-',
      halaqahName: halaqahObj?.name || '-',
    };
  });

  // 10. Selected student for Mutabaah Card
  let selectedStudentCard: StudentMutabaahCardData | null = null;
  const targetStudentId = validated.studentId || (studentList[0]?.id ?? null);

  if (targetStudentId) {
    const targetStudent = studentList.find((s) => s.id === targetStudentId);
    const targetSummary = monthlySummaries.find((s) => s.studentId === targetStudentId);

    if (targetStudent && targetSummary) {
      const recordsForStudent = studentMonthRecordsMap.get(targetStudentId) || [];
      const mutabaahRecords: MutabaahRecordDetail[] = recordsForStudent.map((r) => ({
        id: r.id,
        date: r.date,
        type: r.type,
        juz: r.juz,
        surahId: r.surah_id,
        surahName: surahsMap.get(r.surah_id) || `Surat ${r.surah_id}`,
        ayahStart: r.ayah_start,
        ayahEnd: r.ayah_end,
        lineCount: r.line_count,
        mistakeCount: r.mistake_count,
        fluencyScore: r.fluency_score,
        notes: r.notes,
      }));

      const chartPoints = buildDailyChartPoints(
        validated.year,
        validated.month,
        recordsForStudent
      );

      selectedStudentCard = {
        student: {
          id: targetStudent.id,
          name: targetStudent.name,
          nisn: targetStudent.nisn,
          className: targetSummary.className,
          halaqahName: targetSummary.halaqahName,
          teacherName: targetSummary.teacherName,
          parentName: targetStudent.parent_name,
        },
        period: {
          month: validated.month,
          monthName: getMonthName(validated.month),
          year: validated.year,
        },
        progress: {
          lifetimeSabaqLines: targetSummary.lifetimeSabaqLines,
          lifetimeFormatted: formatCapaian(targetSummary.lifetimeSabaqLines),
          lifetimePercent: targetSummary.lifetimeProgressPercent,
          monthSabaqLines: targetSummary.sabaqLines,
          monthSabaqFormatted: targetSummary.sabaqFormatted,
          monthSabqiLines: targetSummary.sabqiLines,
          monthManzilLines: targetSummary.manzilLines,
          averageFluency: targetSummary.averageFluency,
        },
        attendance: targetSummary.attendance,
        chartData: chartPoints,
        records: mutabaahRecords,
      };
    }
  }

  // 11. Aggregate Halaqah Performance
  const halaqahRows = aggregateHalaqahPerformance(monthlySummaries);

  return (
    <LaporanClient
      role={role}
      params={validated}
      classes={classes}
      teachers={teachers}
      students={studentOptions}
      monthlySummaries={monthlySummaries}
      studentCardData={selectedStudentCard}
      halaqahPerformanceRows={halaqahRows}
    />
  );
}

