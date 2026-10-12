import { Suspense } from 'react';
import { connection } from 'next/server';
import { getJakartaMonthStarts } from '@/lib/dashboard-utils';
import {
  getTargetAchievement,
  getMemorizationStats,
  getProgressSummary,
  getDailyMemorizationStats,
  getFluencyStats,
  getClassProgress,
  getJuzDistribution,
} from '@/lib/queries/dashboard';
import { StatCardsSection } from '@/components/dashboard/stat-cards';
import { TopTenTablesSection } from '@/components/dashboard/top-ten-tables';
import { DailyMemorizationChart } from '@/components/dashboard/daily-memorization-chart';
import { FluencyDistributionChart } from '@/components/dashboard/fluency-distribution-chart';
import { ClassProgressChart } from '@/components/dashboard/class-progress-chart';
import { TargetAchievementPie } from '@/components/dashboard/target-achievement-pie';
import { JuzDistributionChart } from '@/components/dashboard/juz-distribution-chart';
import {
  StatCardsSkeleton,
  TwoColSkeleton,
} from '@/components/dashboard/dashboard-skeletons';
import { TrendingUp } from 'lucide-react';

export async function DashboardContent() {
  await connection();
  const { currentMonthStart, prevMonthStart, todayDayOfMonth } = getJakartaMonthStarts(new Date());

  return (
    <div className="space-y-6">
      {/* 4 Kartu Metrik Utama */}
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCardsSection />
      </Suspense>

      {/* Top 10 Terbaik & Butuh Perhatian */}
      <Suspense fallback={<TwoColSkeleton height={300} />}>
        <TopTenTablesSection currentMonthStart={currentMonthStart} />
      </Suspense>

      {/* Grafik Baris Harian & Progress */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Statistik Baris Harian Hafalan</h3>
              <p className="text-xs text-slate-500">Perkembangan setoran Sabaq, Sabqi, dan Manzil bulan berjalan</p>
            </div>
          </div>
          <Suspense fallback={<div className="h-[350px] bg-slate-50 animate-pulse rounded-xl mt-4" />}>
            <DailyStatsWrapper currentMonthStart={currentMonthStart} prevMonthStart={prevMonthStart} todayDayOfMonth={todayDayOfMonth} />
          </Suspense>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Pencapaian Target 30 Juz</h3>
            <p className="text-xs text-slate-500 mb-4">Akumulasi sabaq seluruh santri aktif</p>
            <Suspense fallback={<div className="h-[250px] bg-slate-50 animate-pulse rounded-xl" />}>
              <TargetPieWrapper />
            </Suspense>
          </div>
          <Suspense fallback={<div className="h-16 bg-slate-50 animate-pulse rounded-xl mt-4" />}>
            <ProgressSummaryWidget currentMonthStart={currentMonthStart} prevMonthStart={prevMonthStart} todayDayOfMonth={todayDayOfMonth} />
          </Suspense>
        </div>
      </div>

      {/* Distribusi Nilai Kelancaran & Capaian Kelas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Distribusi Nilai Kelancaran</h3>
              <p className="text-xs text-slate-500">Perbandingan skor fluency bulan lalu vs berjalan</p>
            </div>
          </div>
          <Suspense fallback={<div className="h-[300px] bg-slate-50 animate-pulse rounded-xl mt-4" />}>
            <FluencyWrapper currentMonthStart={currentMonthStart} prevMonthStart={prevMonthStart} />
          </Suspense>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Capaian Tahfidz per Kelas</h3>
              <p className="text-xs text-slate-500">Total baris sabaq dicapai tiap tingkat kelas (7-12)</p>
            </div>
          </div>
          <Suspense fallback={<div className="h-[300px] bg-slate-50 animate-pulse rounded-xl mt-4" />}>
            <ClassProgressWrapper currentMonthStart={currentMonthStart} prevMonthStart={prevMonthStart} />
          </Suspense>
        </div>
      </div>

      {/* Statistik Hafalan Santri & Distribusi 5 Kelompok Juz */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Statistik Hafalan Santri</h3>
            <p className="text-xs text-slate-500 mb-6">Ringkasan capaian santri secara keseluruhan</p>
            <Suspense fallback={<div className="h-48 bg-slate-50 animate-pulse rounded-xl" />}>
              <MemorizationStatsWidget />
            </Suspense>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Distribusi Hafalan 5 Kelompok Juz</h3>
              <p className="text-xs text-slate-500">Jumlah santri aktif berdasarkan lantai juz kumulatif</p>
            </div>
          </div>
          <Suspense fallback={<div className="h-[300px] bg-slate-50 animate-pulse rounded-xl mt-4" />}>
            <JuzDistributionWrapper />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function DailyStatsWrapper({ currentMonthStart, prevMonthStart, todayDayOfMonth }: { currentMonthStart: string; prevMonthStart: string; todayDayOfMonth: number }) {
  const { currentMonthStats, prevMonthStats } = await getDailyMemorizationStats(currentMonthStart, prevMonthStart, todayDayOfMonth);
  return <DailyMemorizationChart currentMonthStats={currentMonthStats} prevMonthStats={prevMonthStats} />;
}

async function TargetPieWrapper() {
  const data = await getTargetAchievement();
  return <TargetAchievementPie data={data} />;
}

async function ProgressSummaryWidget({ currentMonthStart, prevMonthStart, todayDayOfMonth }: { currentMonthStart: string; prevMonthStart: string; todayDayOfMonth: number }) {
  const summary = await getProgressSummary(currentMonthStart, prevMonthStart, todayDayOfMonth);
  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between mt-4">
      <div>
        <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Progress s.d. Hari Ini</div>
        <div className="text-sm font-bold text-emerald-900 mt-0.5">
          {summary.current_month_lines_to_date.toLocaleString('id-ID')} Baris <span className="text-xs font-normal text-emerald-700">(Bulan Ini)</span>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 ${summary.difference_lines >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
          <TrendingUp className="w-3 h-3" />
          {summary.difference_lines >= 0 ? `+${summary.difference_lines}` : summary.difference_lines} baris
        </div>
        <div className="text-[11px] text-emerald-700 mt-1">vs rentang sama bulan lalu</div>
      </div>
    </div>
  );
}

async function FluencyWrapper({ currentMonthStart, prevMonthStart }: { currentMonthStart: string; prevMonthStart: string }) {
  const data = await getFluencyStats(currentMonthStart, prevMonthStart);
  return <FluencyDistributionChart data={data} />;
}

async function ClassProgressWrapper({ currentMonthStart, prevMonthStart }: { currentMonthStart: string; prevMonthStart: string }) {
  const data = await getClassProgress(currentMonthStart, prevMonthStart);
  return <ClassProgressChart data={data} />;
}

async function MemorizationStatsWidget() {
  const stats = await getMemorizationStats();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
        <span className="text-xs text-slate-600">Rata-rata Hafalan</span>
        <span className="text-sm font-bold text-slate-900">{stats.formatted_average}</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
        <span className="text-xs text-slate-600">Median Hafalan</span>
        <span className="text-sm font-bold text-slate-900">{stats.formatted_median}</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
        <span className="text-xs text-slate-600">Capaian Maksimum</span>
        <span className="text-sm font-bold text-emerald-600">{stats.formatted_maximum}</span>
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
        <span className="text-xs font-semibold text-emerald-800">Santri Hafalan &gt; 10 Juz</span>
        <span className="text-sm font-bold text-emerald-900">{stats.students_above_10_juz} Santri</span>
      </div>
    </div>
  );
}

async function JuzDistributionWrapper() {
  const data = await getJuzDistribution();
  return <JuzDistributionChart data={data} />;
}
