import { formatCapaian } from './tahfizh';

export interface DailyStatItem {
  day: number;
  sabaq: number;
  sabqi: number;
  manzil: number;
  total: number;
}

export class DashboardQueryError extends Error {
  constructor(public viewName: string, message: string) {
    super(`Gagal memuat kueri dashboard dari view [${viewName}]: ${message}`);
    this.name = 'DashboardQueryError';
  }
}

export function getJakartaMonthStarts(referenceDate?: Date): {
  currentMonthStart: string;
  prevMonthStart: string;
  todayDayOfMonth: number;
  daysInCurrentMonth: number;
} {
  const d = referenceDate || new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      partMap[p.type] = p.value;
    }
  }
  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  const currentMonthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const daysInCurrentMonth = new Date(year, month, 0).getDate();
  return { currentMonthStart, prevMonthStart, todayDayOfMonth: day, daysInCurrentMonth };
}

export function fillDailyStats(
  rows: Array<{ day_of_month: number; sabaq_lines: number; sabqi_lines: number; manzil_lines: number }>,
  maxDay: number
): DailyStatItem[] {
  const map = new Map<number, { sabaq: number; sabqi: number; manzil: number }>();
  for (const r of rows) {
    map.set(r.day_of_month, { sabaq: r.sabaq_lines || 0, sabqi: r.sabqi_lines || 0, manzil: r.manzil_lines || 0 });
  }
  const result: DailyStatItem[] = [];
  for (let day = 1; day <= maxDay; day++) {
    const stat = map.get(day) || { sabaq: 0, sabqi: 0, manzil: 0 };
    result.push({ day, sabaq: stat.sabaq, sabqi: stat.sabqi, manzil: stat.manzil, total: stat.sabaq + stat.sabqi + stat.manzil });
  }
  return result;
}

export function categorizeJuzFloor(totalLines: number): string {
  const juzFloor = Math.floor(Math.max(0, totalLines) / 300);
  if (juzFloor <= 1) return '0 - 1 juz';
  if (juzFloor <= 5) return '2 - 5 juz';
  if (juzFloor <= 10) return '6 - 10 juz';
  if (juzFloor <= 20) return '11 - 20 juz';
  return '21 - 30 juz';
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
 * Fungsi murni untuk pemilihan "Top 10 butuh perhatian".
 * Urutan:
 * 1. monthly_sabaq_lines menaik (terendah dulu)
 * 2. total_sabaq_lines menaik (terendah dulu) sebagai pemutus seri kedua
 * 3. student_name secara alfabetis localeCompare('id') sebagai pemutus seri ketiga
 * Santri tanpa record bulanan bernilai 0 dan tetap ikut.
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
      formatted_monthly: formatCapaian(monthlyLines),
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
