import { Suspense } from 'react';
import { DashboardToast } from './dashboard-toast';
import { DashboardContent } from './dashboard-content';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeletons';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <DashboardToast />
      </Suspense>

      {/* Header Banner Statis */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard Pesantren Darul Ilmi</h1>
          <p className="text-emerald-100 text-xs md:text-sm mt-1">
            Sistem Manajemen Hafalan Al-Qur&apos;an (Sabaq, Sabqi, Manzil)
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span>Zona Waktu: Asia/Jakarta (WIB)</span>
        </div>
      </div>

      {/* Konten Dinamis di dalam Suspense dengan DashboardSkeleton */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
