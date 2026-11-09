'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HalaqahPerformanceRow } from '@/lib/laporan/types';
import { formatPrintDateIndonesian } from '@/lib/formatters';

export interface KinerjaHalaqahTableProps {
  rows: HalaqahPerformanceRow[];
  periodLabel?: string;
}

export function KinerjaHalaqahTable({ rows, periodLabel }: KinerjaHalaqahTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground shadow-sm print:border-none print:p-6">
        Tidak ada data kinerja halaqah pada periode dan filter ini.
      </div>
    );
  }

  return (
    <div className="space-y-4 print:space-y-6">
      {/* KOP Dokumen Resmi Khusus Cetak */}
      <div className="hidden print:block border-b-2 border-black pb-4 text-center space-y-1">
        <h1 className="text-xl font-bold tracking-tight uppercase text-black">
          PESANTREN DARUL ILMI
        </h1>
        <p className="text-xs uppercase tracking-widest font-semibold text-black">
          Lembaga Tahfizh Al-Qur&apos;an &bull; Mushaf Madinah Standar 300 Baris / Juz
        </p>
        <h2 className="text-base font-bold pt-2 uppercase text-black">
          LAPORAN REKAPITULASI KINERJA HALAQAH
        </h2>
        <p className="text-xs font-medium text-black">
          Periode: {periodLabel || '-'}
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden print:w-full print:p-0 print:text-black print:shadow-none print:border-none">
        <div className="overflow-x-auto print:overflow-visible">
          <Table className="print:w-full print:border-collapse print:text-xs">
            <TableHeader>
              <TableRow className="print:border-b-2 print:border-black">
                <TableHead className="w-12 font-medium print:text-black print:font-bold">No</TableHead>
                <TableHead className="font-medium print:text-black print:font-bold">Halaqah</TableHead>
                <TableHead className="font-medium print:text-black print:font-bold">Ustadz Pembina</TableHead>
                <TableHead className="font-medium print:text-black print:font-bold">Tingkat Kelas</TableHead>
                <TableHead className="font-medium text-center print:text-black print:font-bold">Jumlah Santri</TableHead>
                <TableHead className="font-medium text-center print:text-black print:font-bold">Kehadiran Rata-rata</TableHead>
                <TableHead className="font-medium text-right print:text-black print:font-bold">Total Sabaq</TableHead>
                <TableHead className="font-medium text-right print:text-black print:font-bold">Total Sabqi / Manzil</TableHead>
                <TableHead className="font-medium text-center print:text-black print:font-bold">Rata-rata Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.halaqahId} className="print:border-b print:border-gray-300">
                  <TableCell className="font-medium print:text-black">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground print:text-black">{row.halaqahName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-foreground print:text-black">{row.teacherName}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground print:text-black">{row.className}</span>
                  </TableCell>
                  <TableCell className="text-center font-medium print:text-black">
                    {row.studentCount} santri
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={row.averageAttendancePercent >= 80 ? 'secondary' : 'outline'}
                      className={`print:border-none print:bg-transparent print:p-0 print:font-semibold print:text-black ${
                        row.averageAttendancePercent >= 90
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ''
                      }`}
                    >
                      {row.averageAttendancePercent}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                      {row.totalSabaqLines}
                    </span>{' '}
                    <span className="text-xs text-muted-foreground print:text-black">baris</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-blue-600 dark:text-blue-400 print:text-black font-medium">{row.totalSabqiLines}</span>
                    <span className="text-muted-foreground print:text-black"> / </span>
                    <span className="text-amber-600 dark:text-amber-400 print:text-black font-medium">{row.totalManzilLines}</span>
                    <span className="text-xs text-muted-foreground block print:text-black">baris</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-sm text-foreground print:text-black">{row.averageFluency}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Blok Tanda Tangan Pengesahan Resmi Khusus Cetak */}
      <div className="hidden print:grid print:grid-cols-2 print:mt-8 print:pt-4 text-center text-xs text-black">
        <div className="space-y-16">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Bagian Tahfizh</p>
          </div>
          <div className="border-b w-48 mx-auto border-black" />
          <p>(........................................................)</p>
        </div>

        <div className="space-y-16">
          <div>
            <p>Bandar Lampung, {formatPrintDateIndonesian()}</p>
            <p className="font-bold">Koordinator Halaqah</p>
          </div>
          <div className="border-b w-48 mx-auto border-black" />
          <p>(........................................................)</p>
        </div>
      </div>
    </div>
  );
}

