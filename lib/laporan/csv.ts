import { MonthlyStudentSummaryRow, MutabaahRecordDetail } from './types';

function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  // If field contains comma, quote, or newline, escape internal quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generateRekapBulananCsv(
  rows: MonthlyStudentSummaryRow[],
  monthName: string,
  year: number
): string {
  const headers = [
    'No',
    'NISN',
    'Nama Santri',
    'Kelas',
    'Halaqah',
    'Ustadz Pengampu',
    'Sabaq Bulan Ini (Baris)',
    'Konversi Sabaq',
    'Sabqi Bulan Ini (Baris)',
    'Manzil Bulan Ini (Baris)',
    'Total Akumulasi Sabaq (Baris)',
    'Progres 30 Juz (%)',
    'Hari Hadir',
    'Total Hari',
    'Kehadiran (%)',
    'Rata-rata Kelancaran',
    'Sabaq 1 Bln Lalu (Baris)',
    'Sabaq 2 Bln Lalu (Baris)',
  ];

  const lines: string[] = [
    `"Rekapitulasi Bulanan Tahfizh - Pesantren Darul Ilmi"`,
    `"Periode: ${monthName} ${year}"`,
    '',
    headers.map(escapeCsvField).join(','),
  ];

  rows.forEach((row, index) => {
    const data = [
      index + 1,
      row.nisn || '-',
      row.name,
      row.className,
      row.halaqahName,
      row.teacherName,
      row.sabaqLines,
      row.sabaqFormatted,
      row.sabqiLines,
      row.manzilLines,
      row.lifetimeSabaqLines,
      `${row.lifetimeProgressPercent}%`,
      row.attendance.hadir + row.attendance.terlambat,
      row.attendance.totalHari,
      `${row.attendance.persentaseHadir}%`,
      row.averageFluency,
      row.trendPrevMonth,
      row.trendTwoMonthsAgo,
    ];
    lines.push(data.map(escapeCsvField).join(','));
  });

  return lines.join('\r\n');
}

export function generateMutabaahRecordsCsv(
  studentName: string,
  nisn: string,
  records: MutabaahRecordDetail[],
  monthName: string,
  year: number
): string {
  const headers = [
    'No',
    'Tanggal',
    'Kategori',
    'Juz',
    'Surat',
    'Ayat',
    'Jumlah Baris',
    'Kesalahan',
    'Nilai Kelancaran',
    'Catatan',
  ];

  const lines: string[] = [
    `"Buku Mutaba'ah Tahfizh Santri - Pesantren Darul Ilmi"`,
    `"Nama Santri: ${studentName} (NISN: ${nisn || '-'})"`,
    `"Periode: ${monthName} ${year}"`,
    '',
    headers.map(escapeCsvField).join(','),
  ];

  records.forEach((r, idx) => {
    const data = [
      idx + 1,
      r.date,
      r.type,
      r.juz,
      r.surahName,
      `${r.ayahStart}-${r.ayahEnd}`,
      r.lineCount,
      r.mistakeCount,
      r.fluencyScore,
      r.notes || '-',
    ];
    lines.push(data.map(escapeCsvField).join(','));
  });

  return lines.join('\r\n');
}

export function triggerCsvDownload(csvContent: string, fileName: string): void {
  // Add UTF-8 BOM so Excel opens it with proper encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

