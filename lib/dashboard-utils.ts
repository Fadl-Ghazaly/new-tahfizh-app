import { formatCapaian } from './tahfizh';

export class DashboardQueryError extends Error {
  viewName: string;
  dbMessage: string;

  constructor(viewName: string, dbMessage: string) {
    super(`Dashboard query error on view '${viewName}': ${dbMessage}`);
    this.name = 'DashboardQueryError';
    this.viewName = viewName;
    this.dbMessage = dbMessage;
  }
}

export interface RankingInputItem {
  student_id: string;
  student_name: string;
  halaqah_name: string | null;
  teacher_name: string | null;
  total_sabaq_lines: number;
}

export interface AttentionOutputItem {
  student_id: string;
  student_name: string;
  halaqah_name: string;
  teacher_name: string;
  monthly_sabaq_lines: number;
  total_sabaq_lines: number;
  formatted_monthly: string;
  formatted_total: string;
}

/**
 * Mendapatkan rentang tanggal bulan berjalan dan bulan lalu dalam zona waktu Asia/Jakarta.
 * referenceDate wajib dioper untuk memastikan determinisme dan kemampuan uji.
 */
export function getJakartaMonthStarts(referenceDate: Date): {
  currentMonthStart: string;
  prevMonthStart: string;
  todayDayOfMonth: number;
  daysInCurrentMonth: number;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(referenceDate);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value ?? '2026', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value ?? '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value ?? '1', 10);

  const currentMonthStart = `${year}-${String(month).padStart(2, '0')}-01`;

  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;

  const daysInCurrentMonth = new Date(year, month, 0).getDate();

  return {
    currentMonthStart,
    prevMonthStart,
    todayDayOfMonth: day,
    daysInCurrentMonth,
  };
}

export interface DailyStatInput {
  day_of_month: number;
  sabaq_lines: number;
  sabqi_lines: number;
  manzil_lines: number;
}

export interface DailyStatItem {
  day: number;
  sabaq: number;
  sabqi: number;
  manzil: number;
  total: number;
}

/**
 * Mengisi hari 1..totalDays dengan data riil atau 0 bila tidak ada.
 */
export function fillDailyStats(rawData: DailyStatInput[], totalDays: number): DailyStatItem[] {
  const map = new Map<number, DailyStatInput>();
  rawData.forEach((row) => {
    map.set(Number(row.day_of_month), row);
  });

  const result: DailyStatItem[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const row = map.get(d);
    const sabaq = Number(row?.sabaq_lines ?? 0);
    const sabqi = Number(row?.sabqi_lines ?? 0);
    const manzil = Number(row?.manzil_lines ?? 0);
    result.push({
      day: d,
      sabaq,
      sabqi,
      manzil,
      total: sabaq + sabqi + manzil,
    });
  }

  return result;
}

/**
 * Mengelompokkan total baris sabaq ke 5 kelompok juz (lantai / floor):
 * 0-1 juz (kurang dari 2 juz), 2-5, 6-10, 11-20, 21-30.
 */
export function categorizeJuzFloor(totalLines: number): '0 - 1 juz' | '2 - 5 juz' | '6 - 10 juz' | '11 - 20 juz' | '21 - 30 juz' {
  const juz = Math.floor(totalLines / 300);
  if (juz <= 1) return '0 - 1 juz';
  if (juz <= 5) return '2 - 5 juz';
  if (juz <= 10) return '6 - 10 juz';
  if (juz <= 20) return '11 - 20 juz';
  return '21 - 30 juz';
}

/**
 * Membangun daftar Top 10 Butuh Perhatian dari ranking dan peta bulanan.
 */
export function selectNeedsAttention(
  rankings: RankingInputItem[],
  monthlyMap: Map<string, number>
): AttentionOutputItem[] {
  const combined = rankings.map((r) => {
    const monthlyLines = monthlyMap.get(r.student_id) ?? 0;
    const totalLines = Number(r.total_sabaq_lines ?? 0);
    return {
      student_id: r.student_id,
      student_name: r.student_name,
      halaqah_name: r.halaqah_name ?? '-',
      teacher_name: r.teacher_name ?? '-',
      monthly_sabaq_lines: monthlyLines,
      total_sabaq_lines: totalLines,
      formatted_monthly: formatCapaianDenganBaris(monthlyLines),
      formatted_total: formatCapaian(totalLines),
    };
  });

  combined.sort((a, b) => {
    if (a.monthly_sabaq_lines !== b.monthly_sabaq_lines) {
      return a.monthly_sabaq_lines - b.monthly_sabaq_lines;
    }
    if (a.total_sabaq_lines !== b.total_sabaq_lines) {
      return a.total_sabaq_lines - b.total_sabaq_lines;
    }
    return a.student_name.localeCompare(b.student_name, 'id');
  });

  return combined.slice(0, 10);
}

/**
 * Format capaian dengan tambahan keterangan baris bila 0 < lines < 15.
 */
export function formatCapaianDenganBaris(lines: number): string {
  const base = formatCapaian(lines);
  if (lines > 0 && lines < 15) {
    return `${base} (${lines} baris)`;
  }
  return base;
}

/**
 * 1. Compute Target Achievement (Pie Target)
 */
export function computeTargetAchievement(totalSabaqLines: number, totalStudents: number) {
  const targetLines = totalStudents * 9000;
  const percentage = targetLines > 0
    ? Math.min(100, Math.round((totalSabaqLines / targetLines) * 1000) / 10)
    : 0;
  const remainingLines = Math.max(0, targetLines - totalSabaqLines);

  return {
    total_lines: totalSabaqLines,
    target_lines: targetLines,
    percentage,
    remaining_lines: remainingLines,
    description: 'dari target 30 juz seluruh santri',
  };
}

/**
 * 2. Compute Memorization Stats (Statistik Hafalan Santri)
 * Mengurutkan salinan array (tidak mengubah array masukan).
 * Di atas 10 juz = total LEBIH DARI 3000 baris (t > 3000).
 */
export function computeMemorizationStats(studentTotals: number[]) {
  const totals = [...studentTotals].sort((a, b) => a - b);
  if (totals.length === 0) {
    return {
      average_lines: 0,
      median_lines: 0,
      maximum_lines: 0,
      formatted_average: formatCapaian(0),
      formatted_median: formatCapaian(0),
      formatted_maximum: formatCapaian(0),
      students_above_10_juz: 0,
    };
  }

  const sum = totals.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / totals.length);
  const max = totals[totals.length - 1];
  const mid = Math.floor(totals.length / 2);
  const median = totals.length % 2 === 0
    ? Math.round((totals[mid - 1] + totals[mid]) / 2)
    : totals[mid];

  const studentsAbove10Juz = totals.filter((t) => t > 3000).length;

  return {
    average_lines: avg,
    median_lines: median,
    maximum_lines: max,
    formatted_average: formatCapaian(avg),
    formatted_median: formatCapaian(median),
    formatted_maximum: formatCapaian(max),
    students_above_10_juz: studentsAbove10Juz,
  };
}

/**
 * 3. Compare Periods (Perbandingan Progress Tahfidz)
 */
export function comparePeriods(currentLines: number, previousLines: number) {
  const difference = currentLines - previousLines;
  const percentageChange = previousLines > 0
    ? Math.round(((currentLines - previousLines) / previousLines) * 1000) / 10
    : null;

  return {
    delta: difference,
    percentChange: percentageChange,
  };
}

/**
 * 4. Sum Daily Lines Until (Menjumlahkan baris sabaq hari 1..N yang sama)
 */
export function sumDailyLinesUntil(dailyRows: Array<{ day: number; sabaq: number }>, dayOfMonth: number): number {
  return dailyRows
    .filter((d) => d.day <= dayOfMonth)
    .reduce((sum, d) => sum + d.sabaq, 0);
}

/**
 * 5. Categorize Fluency Score
 */
export function categorizeFluency(score: number): 'excellent' | 'good' | 'needs_work' {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  return 'needs_work';
}

/**
 * 6. Compute Fluency Stats
 */
export function computeFluencyStats(
  row: { excellent_count?: number | null; good_count?: number | null; needs_work_count?: number | null; total_records?: number | null; avg_fluency_score?: number | null } | undefined,
  monthStart: string
) {
  if (!row) {
    return {
      month_start: monthStart,
      excellent: 0,
      good: 0,
      needs_work: 0,
      total: 0,
      avg_score: null,
    };
  }
  return {
    month_start: monthStart,
    excellent: Number(row.excellent_count ?? 0),
    good: Number(row.good_count ?? 0),
    needs_work: Number(row.needs_work_count ?? 0),
    total: Number(row.total_records ?? 0),
    avg_score: row.avg_fluency_score !== null && row.avg_fluency_score !== undefined ? Number(row.avg_fluency_score) : null,
  };
}
