import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
} from 'lucide-react';
import { getDashboardSummary } from '@/lib/queries/dashboard';

export async function StatCardsSection() {
  const summary = await getDashboardSummary();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Total Santri */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Total Santri</span>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">
            {summary.total_students.toLocaleString('id-ID')}{' '}
            <span className="text-sm font-normal text-blue-100">Santri</span>
          </div>
          <div className="text-xs text-blue-100">Santri aktif terdaftar</div>
        </div>
      </div>

      {/* Total Ustadz */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Total Ustadz</span>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">
            {summary.total_teachers.toLocaleString('id-ID')}{' '}
            <span className="text-sm font-normal text-emerald-100">Ustadz</span>
          </div>
          <div className="text-xs text-emerald-100">Pengampu halaqah aktif</div>
        </div>
      </div>

      {/* Total Kelas Halaqah */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-100">Total Kelas Halaqah</span>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">
            {summary.total_halaqahs.toLocaleString('id-ID')}{' '}
            <span className="text-sm font-normal text-amber-100">Halaqah</span>
          </div>
          <div className="text-xs text-amber-100">Kelompok bimbingan tahfizh</div>
        </div>
      </div>

      {/* Total Baris Hafalan */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 to-rose-700 text-white p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-pink-100">Total Baris Hafalan</span>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">
            {summary.total_sabaq_lines.toLocaleString('id-ID')}{' '}
            <span className="text-sm font-normal text-pink-100">Baris</span>
          </div>
          <div className="text-xs text-pink-100">Akumulasi sabaq aktif seluruh santri</div>
        </div>
      </div>
    </div>
  );
}
