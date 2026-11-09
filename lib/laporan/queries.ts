import {
  AttendanceSummary,
  DailyChartPoint,
  HalaqahPerformanceRow,
  MonthlyStudentSummaryRow,
} from './types';

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function getMonthName(monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) return '';
  return INDONESIAN_MONTHS[monthNumber - 1];
}

export function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01`;
  // Day 0 of next month gives the last day of the current month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { startDate, endDate };
}

export function getTwoPreviousMonths(year: number, month: number): Array<{
  year: number;
  month: number;
  startDate: string;
  endDate: string;
}> {
  const result = [];
  for (let offset = 1; offset <= 2; offset++) {
    let prevMonth = month - offset;
    let prevYear = year;
    while (prevMonth < 1) {
      prevMonth += 12;
      prevYear -= 1;
    }
    const { startDate, endDate } = getMonthDateRange(prevYear, prevMonth);
    result.push({ year: prevYear, month: prevMonth, startDate, endDate });
  }
  return result;
}

export function calculateAttendanceSummary(
  records: Array<{ status: string }>
): AttendanceSummary {
  let hadir = 0;
  let terlambat = 0;
  let izin = 0;
  let sakit = 0;
  let alpha = 0;

  for (const r of records) {
    switch (r.status) {
      case 'HADIR': hadir++; break;
      case 'TERLAMBAT': terlambat++; break;
      case 'IZIN': izin++; break;
      case 'SAKIT': sakit++; break;
      case 'ALPHA': alpha++; break;
    }
  }

  const totalHari = records.length;
  const persentaseHadir = totalHari > 0 ? Math.round(((hadir + terlambat) / totalHari) * 100) : 0;

  return {
    hadir,
    terlambat,
    izin,
    sakit,
    alpha,
    totalHari,
    persentaseHadir,
  };
}

export function calculateAverageFluency(
  scores: number[]
): number {
  if (scores.length === 0) return 100;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round(sum / scores.length);
}

export function buildDailyChartPoints(
  year: number,
  month: number,
  records: Array<{ date: string; type: string; line_count: number }>
): DailyChartPoint[] {
  const lastDay = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const points: DailyChartPoint[] = [];

  const dayMap = new Map<number, { sabaq: number; sabqi: number; manzil: number }>();
  for (let d = 1; d <= lastDay; d++) {
    dayMap.set(d, { sabaq: 0, sabqi: 0, manzil: 0 });
  }

  for (const r of records) {
    const day = parseInt(r.date.split('-')[2], 10);
    const existing = dayMap.get(day);
    if (existing) {
      if (r.type === 'SABAQ') existing.sabaq += r.line_count || 0;
      else if (r.type === 'SABQI') existing.sabqi += r.line_count || 0;
      else if (r.type === 'MANZIL') existing.manzil += r.line_count || 0;
    }
  }

  for (let d = 1; d <= lastDay; d++) {
    const val = dayMap.get(d) || { sabaq: 0, sabqi: 0, manzil: 0 };
    points.push({
      date: `${year}-${pad(month)}-${pad(d)}`,
      day: d,
      sabaq: val.sabaq,
      sabqi: val.sabqi,
      manzil: val.manzil,
    });
  }

  return points;
}

export function aggregateHalaqahPerformance(
  summaries: MonthlyStudentSummaryRow[]
): HalaqahPerformanceRow[] {
  const map = new Map<string, {
    halaqahId: string;
    halaqahName: string;
    teacherName: string;
    className: string;
    studentCount: number;
    totalAttendancePercent: number;
    totalSabaqLines: number;
    totalSabqiLines: number;
    totalManzilLines: number;
    totalFluency: number;
  }>();

  for (const s of summaries) {
    const key = s.halaqahName;
    if (!map.has(key)) {
      map.set(key, {
        halaqahId: s.halaqahName,
        halaqahName: s.halaqahName,
        teacherName: s.teacherName,
        className: s.className,
        studentCount: 0,
        totalAttendancePercent: 0,
        totalSabaqLines: 0,
        totalSabqiLines: 0,
        totalManzilLines: 0,
        totalFluency: 0,
      });
    }

    const group = map.get(key)!;
    group.studentCount += 1;
    group.totalAttendancePercent += s.attendance.persentaseHadir;
    group.totalSabaqLines += s.sabaqLines;
    group.totalSabqiLines += s.sabqiLines;
    group.totalManzilLines += s.manzilLines;
    group.totalFluency += s.averageFluency;
  }

  const result: HalaqahPerformanceRow[] = [];
  map.forEach((g) => {
    const count = g.studentCount || 1;
    result.push({
      halaqahId: g.halaqahId,
      halaqahName: g.halaqahName,
      teacherName: g.teacherName,
      className: g.className,
      studentCount: g.studentCount,
      averageAttendancePercent: Math.round(g.totalAttendancePercent / count),
      totalSabaqLines: g.totalSabaqLines,
      totalSabqiLines: g.totalSabqiLines,
      totalManzilLines: g.totalManzilLines,
      averageFluency: Math.round(g.totalFluency / count),
    });
  });

  return result.sort((a, b) => a.halaqahName.localeCompare(b.halaqahName));
}

/**
 * Filter 2-tahap (pola 05c):
 * Menemukan ID halaqah aktif milik target teacher tanpa filter embedded relation.
 */
export function resolveMatchingHalaqahIds(
  halaqahs: Array<{ id: string; teacher_id: string; is_active: boolean }>,
  targetTeacherId: string | null
): string[] | null {
  if (!targetTeacherId) return null;
  return halaqahs
    .filter((h) => h.is_active && h.teacher_id === targetTeacherId)
    .map((h) => h.id);
}

/**
 * Filter 2-tahap (pola 05c):
 * Menemukan ID kelas berdasarkan level (7-12) tanpa filter embedded relation.
 */
export function resolveMatchingClassIds(
  classes: Array<{ id: string; level: number }>,
  classLevel: number | 'all'
): string[] | null {
  if (classLevel === 'all') return null;
  return classes
    .filter((c) => c.level === classLevel)
    .map((c) => c.id);
}
