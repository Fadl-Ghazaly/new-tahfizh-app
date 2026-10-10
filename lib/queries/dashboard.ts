import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { formatCapaian } from '@/lib/tahfizh';
import { Database } from '@/lib/database.types';
import {
  fillDailyStats,
  DailyStatItem,
  DashboardQueryError,
  selectNeedsAttention,
  AttentionOutputItem,
} from '@/lib/dashboard-utils';

export type DashboardSummaryRow = Database['public']['Views']['v_dashboard_summary']['Row'];
export type StudentRankingRow = Database['public']['Views']['v_student_rankings']['Row'];
export type StudentMonthlyProgressRow = Database['public']['Views']['v_student_monthly_progress']['Row'];
export type DailyMemorizationStatsRow = Database['public']['Views']['v_daily_memorization_stats']['Row'];
export type ClassStudentCountRow = Database['public']['Views']['v_class_student_count']['Row'];
export type ClassMonthlyProgressRow = Database['public']['Views']['v_class_monthly_progress']['Row'];
export type FluencyDistributionRow = Database['public']['Views']['v_fluency_distribution']['Row'];
export type JuzDistributionRow = Database['public']['Views']['v_juz_distribution']['Row'];

export interface DashboardSummary {
  total_students: number;
  total_teachers: number;
  total_halaqahs: number;
  total_sabaq_lines: number;
}

export interface StudentRankingItem {
  student_id: string;
  student_name: string;
  nisn: string;
  gender: 'L' | 'P';
  class_id: string | null;
  class_name: string;
  class_level: number;
  halaqah_id: string | null;
  halaqah_name: string;
  teacher_name: string;
  total_sabaq_lines: number;
  avg_fluency_score: number | null;
  total_juz_floor: number;
  ranking: number;
  formatted_capaian: string;
}

export interface ClassProgressItem {
  class_id: string;
  class_name: string;
  class_level: number;
  student_count: number;
  prev_sabaq_lines: number;
  current_sabaq_lines: number;
}

export interface FluencyStatsData {
  prevMonth: {
    month_start: string;
    excellent: number;
    good: number;
    needs_work: number;
    total: number;
    avg_score: number | null;
  };
  currentMonth: {
    month_start: string;
    excellent: number;
    good: number;
    needs_work: number;
    total: number;
    avg_score: number | null;
  };
}

export interface JuzDistributionData {
  group_0_1: number;
  group_2_5: number;
  group_6_10: number;
  group_11_20: number;
  group_21_30: number;
  total_students: number;
}

export interface TargetAchievementData {
  total_lines: number;
  target_lines: number;
  percentage: number;
  remaining_lines: number;
  description: string;
}

export interface MemorizationStatsData {
  average_lines: number;
  median_lines: number;
  maximum_lines: number;
  formatted_average: string;
  formatted_median: string;
  formatted_maximum: string;
  students_above_10_juz: number;
}

export interface ProgressSummaryData {
  current_month_lines_to_date: number;
  prev_month_lines_to_date: number;
  difference_lines: number;
  percentage_change: number | null;
}

/**
 * 4 Kartu Metrik Utama
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('v_dashboard_summary')
    .select('*')
    .single();

  if (error) {
    throw new DashboardQueryError('v_dashboard_summary', error.message);
  }

  return {
    total_students: Number(data?.total_students ?? 0),
    total_teachers: Number(data?.total_teachers ?? 0),
    total_halaqahs: Number(data?.total_halaqahs ?? 0),
    total_sabaq_lines: Number(data?.total_sabaq_lines ?? 0),
  };
}

/**
 * Top 10 Hafalan Terbaik
 */
export async function getTopTenBest(): Promise<StudentRankingItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('v_student_rankings')
    .select('*')
    .order('ranking', { ascending: true })
    .order('student_name', { ascending: true })
    .limit(10);

  if (error) {
    throw new DashboardQueryError('v_student_rankings', error.message);
  }

  return (data ?? []).map((item) => ({
    student_id: item.student_id ?? '',
    student_name: item.student_name ?? '-',
    nisn: item.nisn ?? '-',
    gender: (item.gender as 'L' | 'P') ?? 'L',
    class_id: item.class_id,
    class_name: item.class_name ?? '-',
    class_level: Number(item.class_level ?? 0),
    halaqah_id: item.halaqah_id,
    halaqah_name: item.halaqah_name ?? '-',
    teacher_name: item.teacher_name ?? '-',
    total_sabaq_lines: Number(item.total_sabaq_lines ?? 0),
    avg_fluency_score: item.avg_fluency_score !== null ? Number(item.avg_fluency_score) : null,
    total_juz_floor: Number(item.total_juz_floor ?? 0),
    ranking: Number(item.ranking ?? 0),
    formatted_capaian: formatCapaian(Number(item.total_sabaq_lines ?? 0)),
  }));
}

/**
 * Top 10 Butuh Perhatian (Aktivitas terendah di bulan berjalan)
 */
export async function getTopTenNeedsAttention(
  currentMonthStart: string
): Promise<AttentionOutputItem[]> {
  const supabase = await createClient();

  // Batas 1000 santri; jika santri > 1000 perlu paginasi
  const { data: rankings, error: rankErr } = await supabase
    .from('v_student_rankings')
    .select('student_id, student_name, halaqah_name, teacher_name, total_sabaq_lines')
    .limit(1000);

  if (rankErr) {
    throw new DashboardQueryError('v_student_rankings', rankErr.message);
  }

  const { data: monthlyData, error: monthErr } = await supabase
    .from('v_student_monthly_progress')
    .select('student_id, monthly_sabaq_lines')
    .eq('month_start', currentMonthStart)
    .limit(1000);

  if (monthErr) {
    throw new DashboardQueryError('v_student_monthly_progress', monthErr.message);
  }

  const monthlyMap = new Map<string, number>();
  if (monthlyData) {
    monthlyData.forEach((m) => {
      if (m.student_id) {
        monthlyMap.set(m.student_id, Number(m.monthly_sabaq_lines ?? 0));
      }
    });
  }

  const rankingInput = (rankings ?? []).map((r) => ({
    student_id: r.student_id ?? '',
    student_name: r.student_name ?? '-',
    halaqah_name: r.halaqah_name,
    teacher_name: r.teacher_name,
    total_sabaq_lines: Number(r.total_sabaq_lines ?? 0),
  }));

  return selectNeedsAttention(rankingInput, monthlyMap);
}

/**
 * Baris Harian Sabaq/Sabqi/Manzil
 */
export async function getDailyMemorizationStats(
  currentMonthStart: string,
  prevMonthStart: string,
  todayDayOfMonth: number
): Promise<{
  prevMonthStats: DailyStatItem[];
  currentMonthStats: DailyStatItem[];
}> {
  const supabase = await createClient();

  const { data: prevData, error: prevErr } = await supabase
    .from('v_daily_memorization_stats')
    .select('*')
    .eq('month_start', prevMonthStart)
    .limit(31);

  if (prevErr) {
    throw new DashboardQueryError('v_daily_memorization_stats', prevErr.message);
  }

  const { data: currentData, error: curErr } = await supabase
    .from('v_daily_memorization_stats')
    .select('*')
    .eq('month_start', currentMonthStart)
    .limit(31);

  if (curErr) {
    throw new DashboardQueryError('v_daily_memorization_stats', curErr.message);
  }

  const prevMonthDays = new Date(
    parseInt(prevMonthStart.slice(0, 4), 10),
    parseInt(prevMonthStart.slice(5, 7), 10),
    0
  ).getDate();

  const prevMonthStats = fillDailyStats(
    (prevData ?? []).map((r) => ({
      day_of_month: Number(r.day_of_month ?? 0),
      sabaq_lines: Number(r.sabaq_lines ?? 0),
      sabqi_lines: Number(r.sabqi_lines ?? 0),
      manzil_lines: Number(r.manzil_lines ?? 0),
    })),
    prevMonthDays
  );

  const currentMonthStats = fillDailyStats(
    (currentData ?? []).map((r) => ({
      day_of_month: Number(r.day_of_month ?? 0),
      sabaq_lines: Number(r.sabaq_lines ?? 0),
      sabqi_lines: Number(r.sabqi_lines ?? 0),
      manzil_lines: Number(r.manzil_lines ?? 0),
    })),
    todayDayOfMonth
  );

  return {
    prevMonthStats,
    currentMonthStats,
  };
}

/**
 * Distribusi & Statistik Nilai Kelancaran
 */
export async function getFluencyStats(
  currentMonthStart: string,
  prevMonthStart: string
): Promise<FluencyStatsData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('v_fluency_distribution')
    .select('*')
    .in('month_start', [prevMonthStart, currentMonthStart])
    .limit(2);

  if (error) {
    throw new DashboardQueryError('v_fluency_distribution', error.message);
  }

  const map = new Map<string, FluencyDistributionRow>();
  if (data) {
    data.forEach((row) => {
      if (row.month_start) {
        map.set(row.month_start, row);
      }
    });
  }

  const parseRow = (row: FluencyDistributionRow | undefined, ms: string) => {
    if (!row) {
      return {
        month_start: ms,
        excellent: 0,
        good: 0,
        needs_work: 0,
        total: 0,
        avg_score: null,
      };
    }
    return {
      month_start: ms,
      excellent: Number(row.excellent_count ?? 0),
      good: Number(row.good_count ?? 0),
      needs_work: Number(row.needs_work_count ?? 0),
      total: Number(row.total_records ?? 0),
      avg_score: row.avg_fluency_score !== null ? Number(row.avg_fluency_score) : null,
    };
  };

  return {
    prevMonth: parseRow(map.get(prevMonthStart), prevMonthStart),
    currentMonth: parseRow(map.get(currentMonthStart), currentMonthStart),
  };
}

/**
 * Capaian dan Snapshot Santri per Kelas
 */
export async function getClassProgress(
  currentMonthStart: string,
  prevMonthStart: string
): Promise<ClassProgressItem[]> {
  const supabase = await createClient();

  const { data: counts, error: countErr } = await supabase
    .from('v_class_student_count')
    .select('*')
    .order('class_level', { ascending: true })
    .limit(20);

  if (countErr) {
    throw new DashboardQueryError('v_class_student_count', countErr.message);
  }

  const { data: monthlyData, error: monthErr } = await supabase
    .from('v_class_monthly_progress')
    .select('*')
    .in('month_start', [prevMonthStart, currentMonthStart])
    .limit(40);

  if (monthErr) {
    throw new DashboardQueryError('v_class_monthly_progress', monthErr.message);
  }

  const prevMap = new Map<string, number>();
  const currentMap = new Map<string, number>();

  if (monthlyData) {
    monthlyData.forEach((m) => {
      if (m.class_id) {
        if (m.month_start === prevMonthStart) {
          prevMap.set(m.class_id, Number(m.total_sabaq_lines ?? 0));
        } else if (m.month_start === currentMonthStart) {
          currentMap.set(m.class_id, Number(m.total_sabaq_lines ?? 0));
        }
      }
    });
  }

  return (counts ?? []).map((c) => ({
    class_id: c.class_id ?? '',
    class_name: c.class_name ?? '-',
    class_level: Number(c.class_level ?? 0),
    student_count: Number(c.student_count ?? 0),
    prev_sabaq_lines: prevMap.get(c.class_id ?? '') ?? 0,
    current_sabaq_lines: currentMap.get(c.class_id ?? '') ?? 0,
  }));
}

/**
 * Distribusi 5 Kelompok Juz
 */
export async function getJuzDistribution(): Promise<JuzDistributionData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('v_juz_distribution')
    .select('*')
    .single();

  if (error) {
    throw new DashboardQueryError('v_juz_distribution', error.message);
  }

  return {
    group_0_1: Number(data?.group_0_1 ?? 0),
    group_2_5: Number(data?.group_2_5 ?? 0),
    group_6_10: Number(data?.group_6_10 ?? 0),
    group_11_20: Number(data?.group_11_20 ?? 0),
    group_21_30: Number(data?.group_21_30 ?? 0),
    total_students: Number(data?.total_students ?? 0),
  };
}

/**
 * 7.a. Target Pencapaian (Target Achievement)
 */
export async function getTargetAchievement(): Promise<TargetAchievementData> {
  const summary = await getDashboardSummary();
  const targetLines = summary.total_students * 9000;
  const percentage = targetLines > 0
    ? Math.min(100, Math.round((summary.total_sabaq_lines / targetLines) * 1000) / 10)
    : 0;
  const remainingLines = Math.max(0, targetLines - summary.total_sabaq_lines);

  return {
    total_lines: summary.total_sabaq_lines,
    target_lines: targetLines,
    percentage,
    remaining_lines: remainingLines,
    description: 'dari target 30 juz seluruh santri',
  };
}

/**
 * 7.b. Statistik Hafalan Santri (Memorization Stats)
 */
export async function getMemorizationStats(): Promise<MemorizationStatsData> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('v_student_rankings')
    .select('total_sabaq_lines')
    .order('total_sabaq_lines', { ascending: true })
    .limit(1000);

  if (error) {
    throw new DashboardQueryError('v_student_rankings', error.message);
  }

  const totals = (data ?? []).map((d) => Number(d.total_sabaq_lines ?? 0));
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

  const studentsAbove10Juz = totals.filter((t) => t >= 3000).length;

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
 * 7.c. Ringkasan Progress Tahfidz (Progress Summary)
 * Membandingkan hari 1..N bulan berjalan vs hari 1..N bulan lalu
 */
export async function getProgressSummary(
  currentMonthStart: string,
  prevMonthStart: string,
  todayDayOfMonth: number
): Promise<ProgressSummaryData> {
  const stats = await getDailyMemorizationStats(currentMonthStart, prevMonthStart, todayDayOfMonth);

  const currentLinesToDate = stats.currentMonthStats.reduce((sum, d) => sum + d.sabaq, 0);
  const prevLinesToDate = stats.prevMonthStats
    .filter((d) => d.day <= todayDayOfMonth)
    .reduce((sum, d) => sum + d.sabaq, 0);

  const difference = currentLinesToDate - prevLinesToDate;
  const percentageChange = prevLinesToDate > 0
    ? Math.round(((currentLinesToDate - prevLinesToDate) / prevLinesToDate) * 1000) / 10
    : null;

  return {
    current_month_lines_to_date: currentLinesToDate,
    prev_month_lines_to_date: prevLinesToDate,
    difference_lines: difference,
    percentage_change: percentageChange,
  };
}
