'use client';

import { StudentMutabaahCardData } from '@/lib/laporan/types';
import { MutabaahChart } from './mutabaah-chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrintDateIndonesian } from '@/lib/formatters';

export interface MutabaahSantriCardProps {
  cardData: StudentMutabaahCardData;
  schoolName?: string;
  logoUrl?: string | null;
}

export function MutabaahSantriCard({
  cardData,
  schoolName = 'PESANTREN DARUL ILMI',
  logoUrl = null,
}: MutabaahSantriCardProps) {
  const { student, period, progress, attendance, chartData, records } = cardData;

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case 'SABAQ':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'SABQI':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      case 'MANZIL':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      default:
        return '';
    }
  };

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-6 print:w-full print:p-0 print:text-black print:shadow-none print:border-none">
      {/* KOP / Header Laporan Resmi */}
      <div className="border-b-2 border-black/20 print:border-b-2 print:border-black pb-4 text-center space-y-1">
        {logoUrl && (
          <div className="flex justify-center pb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo Pesantren" className="h-12 w-12 object-contain" />
          </div>
        )}
        <h2 className="text-xl font-bold tracking-tight text-foreground uppercase print:text-black">
          {schoolName}
        </h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold print:text-black">
          Lembaga Tahfizh Al-Qur&apos;an &bull; Mushaf Madinah Standar 300 Baris / Juz
        </p>
        <h3 className="text-base font-bold text-primary pt-2 uppercase print:text-black">
          LAPORAN MUTABA&apos;AH TAHFIZH AL-QUR&apos;AN SANTRI
        </h3>
        <p className="text-xs text-muted-foreground font-medium print:text-black">
          Periode: {period.monthName} {period.year} | Kelas: {student.className} | Ustadz: {student.teacherName}
        </p>
      </div>

      {/* Profil Santri */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl text-sm border print:border print:border-black print:bg-transparent print:text-black print:p-3">
        <div>
          <span className="text-xs text-muted-foreground block print:text-black">Nama Santri</span>
          <span className="font-semibold text-foreground print:text-black">{student.name}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block print:text-black">NISN</span>
          <span className="font-medium text-foreground print:text-black">{student.nisn || '-'}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block print:text-black">Kelas / Halaqah</span>
          <span className="font-medium text-foreground print:text-black">
            {student.className} / {student.halaqahName}
          </span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block print:text-black">Ustadz Pembina</span>
          <span className="font-medium text-foreground print:text-black">{student.teacherName}</span>
        </div>
      </div>

      {/* Ringkasan Metrik Capaian */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center print:gap-2">
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-xl print:border print:border-black print:bg-transparent print:p-2">
          <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300 print:text-black">
            Sabaq Bulan Ini
          </div>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1 print:text-black">
            {progress.monthSabaqLines} <span className="text-xs font-normal">baris</span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 print:text-black">
            {progress.monthSabaqFormatted}
          </div>
        </div>

        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 rounded-xl print:border print:border-black print:bg-transparent print:p-2">
          <div className="text-xs font-medium text-blue-800 dark:text-blue-300 print:text-black">
            Sabqi / Manzil (Muroja&apos;ah)
          </div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1 print:text-black">
            {progress.monthSabqiLines} / {progress.monthManzilLines}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 print:text-black">baris disetorkan</div>
        </div>

        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 rounded-xl print:border print:border-black print:bg-transparent print:p-2">
          <div className="text-xs font-medium text-amber-800 dark:text-amber-300 print:text-black">
            Akumulasi 30 Juz
          </div>
          <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1 print:text-black">
            {progress.lifetimePercent}%
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 print:text-black">
            {progress.lifetimeFormatted} ({progress.lifetimeSabaqLines} baris)
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl print:border print:border-black print:bg-transparent print:p-2">
          <div className="text-xs font-medium text-muted-foreground print:text-black">
            Kehadiran &amp; Kelancaran
          </div>
          <div className="text-lg font-bold text-foreground mt-1 print:text-black">
            {attendance.persentaseHadir}% &bull; Nilai {progress.averageFluency}
          </div>
          <div className="text-xs text-muted-foreground print:text-black">
            {attendance.hadir + attendance.terlambat} hadir dari {attendance.totalHari} hari
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik Tren Harian (Hidden on print to save ink/layout space) */}
      <div className="print:hidden space-y-2">
        <h4 className="text-sm font-semibold text-foreground">
          Grafik Aktivitas Setoran Harian
        </h4>
        <MutabaahChart data={chartData} />
      </div>

      {/* Tabel Log Riwayat Setoran */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground print:text-black">
          Rincian Setoran Hafalan ({records.length} aktivitas)
        </h4>
        <div className="rounded-lg border overflow-hidden print:border print:border-black">
          <Table className="print:w-full print:border-collapse print:text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40 print:bg-transparent print:border-b-2 print:border-black">
                <TableHead className="w-10 text-xs print:text-black print:font-bold">No</TableHead>
                <TableHead className="text-xs print:text-black print:font-bold">Tanggal</TableHead>
                <TableHead className="text-xs print:text-black print:font-bold">Kategori</TableHead>
                <TableHead className="text-xs print:text-black print:font-bold">Surat &amp; Ayat</TableHead>
                <TableHead className="text-xs text-right print:text-black print:font-bold">Baris</TableHead>
                <TableHead className="text-xs text-center print:text-black print:font-bold">Salah</TableHead>
                <TableHead className="text-xs text-center print:text-black print:font-bold">Nilai</TableHead>
                <TableHead className="text-xs print:text-black print:font-bold">Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground print:text-black">
                    Belum ada setoran hafalan tercatat pada periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r, idx) => (
                  <TableRow key={r.id} className="print:border-b print:border-gray-300">
                    <TableCell className="text-xs font-medium print:text-black">{idx + 1}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap print:text-black">{r.date}</TableCell>
                    <TableCell className="text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border print:border-none print:p-0 print:font-bold print:text-black ${typeBadgeVariant(r.type)}`}>
                        {r.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs print:text-black">
                      <span className="font-medium print:text-black">{r.surahName}</span> : {r.ayahStart}-{r.ayahEnd}
                      <span className="text-[10px] text-muted-foreground block print:text-black">Juz {r.juz}</span>
                    </TableCell>
                    <TableCell className="text-xs text-right font-semibold print:text-black">{r.lineCount}</TableCell>
                    <TableCell className="text-xs text-center print:text-black">{r.mistakeCount}</TableCell>
                    <TableCell className="text-xs text-center font-bold print:text-black">{r.fluencyScore}</TableCell>
                    <TableCell className="text-xs text-muted-foreground italic max-w-xs truncate print:text-black print:not-italic">
                      {r.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Area Tanda Tangan Pengesahan (Khusus untuk Cetak & Dokumen Resmi) */}
      <div className="pt-8 border-t grid grid-cols-2 gap-8 text-center text-xs print:grid print:grid-cols-2 print:mt-8 print:pt-4 print:text-black print:border-t-2 print:border-black">
        <div className="space-y-16">
          <div>
            <p className="text-muted-foreground print:text-black">Mengetahui,</p>
            <p className="font-semibold text-foreground print:font-bold print:text-black">Orang Tua / Wali Santri</p>
          </div>
          <div className="border-b w-44 mx-auto border-foreground/30 print:border-black" />
          <p className="text-muted-foreground print:text-black">({student.parentName || '...........................................'})</p>
        </div>

        <div className="space-y-16">
          <div>
            <p className="text-muted-foreground print:text-black">Bandar Lampung, {formatPrintDateIndonesian()}</p>
            <p className="font-semibold text-foreground print:font-bold print:text-black">Ustadz Pengampu / Pembina</p>
          </div>
          <div className="border-b w-44 mx-auto border-foreground/30 print:border-black" />
          <p className="font-medium text-foreground print:text-black">({student.teacherName})</p>
        </div>
      </div>
    </div>
  );
}
