import { Award, AlertTriangle } from 'lucide-react';
import { getTopTenBest, getTopTenNeedsAttention } from '@/lib/queries/dashboard';

export async function TopTenTablesSection({ currentMonthStart }: { currentMonthStart: string }) {
  const [bestList, attentionList] = await Promise.all([
    getTopTenBest(),
    getTopTenNeedsAttention(currentMonthStart),
  ]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      {/* Top 10 Hafalan Terbaik */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Top 10 Hafalan Terbaik</h3>
            <p className="text-xs text-slate-500">Santri dengan capaian kumulatif dan kelancaran tertinggi</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Nama Santri</th>
                <th className="py-2.5 px-3">Halaqah</th>
                <th className="py-2.5 px-3 text-right">Capaian</th>
                <th className="py-2.5 px-3 text-center">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {bestList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    Belum ada data hafalan
                  </td>
                </tr>
              ) : (
                bestList.map((item, idx) => (
                  <tr key={item.student_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-700">#{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {item.student_name}
                      <div className="text-[11px] text-slate-400">{item.nisn}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-xs">
                      {item.halaqah_name}
                      <div className="text-[11px] text-slate-400">{item.teacher_name}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600 whitespace-nowrap">
                      {item.formatted_capaian}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        {item.avg_fluency_score !== null ? `${item.avg_fluency_score}%` : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 Butuh Perhatian */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Top 10 Butuh Perhatian</h3>
            <p className="text-xs text-slate-500">Santri dengan aktivitas sabaq terendah di bulan berjalan</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Nama Santri</th>
                <th className="py-2.5 px-3">Halaqah</th>
                <th className="py-2.5 px-3 text-right">Bulan Ini</th>
                <th className="py-2.5 px-3 text-right">Total Hafalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {attentionList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    Semua santri aktif menyetor bulan ini
                  </td>
                </tr>
              ) : (
                attentionList.map((item, idx) => (
                  <tr key={item.student_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-700">#{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{item.student_name}</td>
                    <td className="py-3 px-3 text-slate-600 text-xs">
                      {item.halaqah_name}
                      <div className="text-[11px] text-slate-400">{item.teacher_name}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-rose-600 whitespace-nowrap">
                      {item.formatted_monthly}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 whitespace-nowrap text-xs">
                      {item.formatted_total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
