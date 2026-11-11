'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MonthlyStudentSummaryRow } from '@/lib/laporan/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPrintDateIndonesian } from '@/lib/formatters';

export interface RekapBulananTableProps {
  rows: MonthlyStudentSummaryRow[];
  onSelectStudent?: (studentId: string) => void;
  periodLabel?: string;
  classLabel?: string;
  ustadzLabel?: string;
  schoolName?: string;
  logoUrl?: string | null;
}

export function RekapBulananTable({
  rows,
  onSelectStudent,
  periodLabel,
  classLabel,
  ustadzLabel,
  schoolName = 'PESANTREN DARUL ILMI',
  logoUrl = null,
}: RekapBulananTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground shadow-sm print:border-none print:p-6">
        Tidak ada data setoran santri yang ditemukan pada periode dan filter ini.
      </div>
    );
  }

  const renderTrend = (current: number, prev: number) => {
    if (prev === 0 && current === 0) {
      return (
        <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5">
          <Minus className="h-3 w-3" /> 0
        </span>
      );
    }
    const diff = current - prev;
    if (diff > 0) {
      return (
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-0.5">
          <TrendingUp className="h-3 w-3" /> +{diff}
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium inline-flex items-center gap-0.5">
          <TrendingDown className="h-3 w-3" /> {diff}
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  };

  return (
    <div className="space-y-4 print:space-y-6">
      {/* KOP Dokumen Resmi Khusus Cetak */}
      <div className="hidden print:block border-b-2 border-black pb-4 text-center space-y-1">
        {logoUrl && (
          <div className="flex justify-center pb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo Pesantren" className="h-12 w-12 object-contain" />
          </div>
        )}
        <h1 className="text-xl font-bold tracking-tight uppercase text-black">
          {schoolName}
        </h1>
        <p className="text-xs uppercase tracking-widest font-semibold text-black">
          Lembaga Tahfizh Al-Qur&apos;an &bull; Mushaf Madinah Standar 300 Baris / Juz
        </p>
        <h2 className="text-base font-bold pt-2 uppercase text-black">
          REKAPITULASI CAPAIAN TAHFIZH BULANAN
        </h2>
        <p className="text-xs font-medium text-black">
          Periode: {periodLabel || '-'} | Kelas: {classLabel || 'Semua Kelas'} | Ustadz: {ustadzLabel || 'Semua Ustadz'}
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden print:w-full print:p-0 print:text-black print:shadow-none print:border-none">
        <div className="overflow-x-auto print:overflow-visible">
          <Table className="print:w-full print:border-collapse print:text-xs">
            <TableHeader>
              <TableRow className="print:border-b-2 print:border-black">
                <TableHead className="w-12 font-medium print:text-black print:font-bold">No</TableHead>
                <TableHead className="font-medium print:text-black print:font-bold">Santri</TableHead>
                <TableHead className="font-medium print:text-black print:font-bold">Kelas / Halaqah</TableHead>
                <TableHead className="font-medium text-right print:text-black print:font-bold">Sabaq (Bln Ini)</TableHead>
                <TableHead className="font-medium text-right print:text-black print:font-bold">Sabqi / Manzil</TableHead>
                <TableHead className="font-medium print:text-black print:font-bold">Progres 30 Juz</TableHead>
                <TableHead className="font-medium text-center print:text-black print:font-bold">Kehadiran</TableHead>
                <TableHead className="font-medium text-center print:text-black print:font-bold">Nilai Rata-rata</TableHead>
                <TableHead className="font-medium text-right print:text-black print:font-bold print:hidden">Tren (vs 1 bln lalu)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.studentId}
                  className={`print:border-b print:border-gray-300 ${onSelectStudent ? 'cursor-pointer hover:bg-muted/50 print:cursor-default' : ''}`}
                  onClick={() => onSelectStudent && onSelectStudent(row.studentId)}
                >
                  <TableCell className="font-medium print:text-black">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground print:text-black">{row.name}</div>
                    <div className="text-xs text-muted-foreground print:text-black">NISN: {row.nisn || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium print:text-black">{row.className}</div>
                    <div className="text-xs text-muted-foreground print:text-black">
                      {row.halaqahName} <span className="italic">({row.teacherName})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400 print:text-black">
                      {row.sabaqLines} baris
                    </div>
                    <div className="text-xs text-muted-foreground print:text-black">{row.sabaqFormatted}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm print:text-black">
                      <span className="text-blue-600 dark:text-blue-400 print:text-black font-medium">{row.sabqiLines}</span>
                      <span className="text-muted-foreground print:text-black"> / </span>
                      <span className="text-amber-600 dark:text-amber-400 print:text-black font-medium">{row.manzilLines}</span>
                    </div>
                    <div className="text-xs text-muted-foreground print:text-black">baris</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 print:hidden">
                      <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, row.lifetimeProgressPercent))}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{row.lifetimeProgressPercent}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground print:text-black mt-0.5">
                      <span className="hidden print:inline font-bold">{row.lifetimeProgressPercent}% &bull; </span>
                      {row.lifetimeSabaqLines} / 9000 baris
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={row.attendance.persentaseHadir >= 80 ? 'secondary' : 'outline'}
                      className={`print:border-none print:bg-transparent print:p-0 print:font-semibold print:text-black ${
                        row.attendance.persentaseHadir >= 90
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ''
                      }`}
                    >
                      {row.attendance.persentaseHadir}%
                    </Badge>
                    <div className="text-xs text-muted-foreground print:text-black mt-0.5">
                      {row.attendance.hadir + row.attendance.terlambat}/{row.attendance.totalHari} hari
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-sm print:text-black">{row.averageFluency}</span>
                  </TableCell>
                  <TableCell className="text-right print:hidden">
                    {renderTrend(row.sabaqLines, row.trendPrevMonth)}
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
            <p className="font-bold">Orang Tua / Wali Santri</p>
          </div>
          <div className="border-b w-48 mx-auto border-black" />
          <p>(........................................................)</p>
        </div>

        <div className="space-y-16">
          <div>
            <p>Bandar Lampung, {formatPrintDateIndonesian()}</p>
            <p className="font-bold">Ustadz Pengampu / Pembina Halaqah</p>
          </div>
          <div className="border-b w-48 mx-auto border-black" />
          <p>({ustadzLabel || 'Ustadz Pembina'})</p>
        </div>
      </div>
    </div>
  );
}

