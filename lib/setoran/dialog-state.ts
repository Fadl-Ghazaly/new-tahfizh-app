import { QURAN_JUZ_SEGMENTS } from '@/lib/quran-juz';
import { MemorizationRecordRow } from '@/app/(app)/setoran/riwayat-dialog';

export interface DialogFormState {
  attendance: string;
  juz: string;
  surahId: string;
  ayahStart: string;
  ayahEnd: string;
  manualOverride: boolean;
  lineCount: string;
  mistakeCount: number;
  notes: string;
}

export function getInitialDialogState(attendanceStatus: string | null | undefined): DialogFormState {
  return {
    attendance: attendanceStatus || '',
    juz: '',
    surahId: '',
    ayahStart: '',
    ayahEnd: '',
    manualOverride: false,
    lineCount: '',
    mistakeCount: 0,
    notes: '',
  };
}

export function handleJuzChangeState(prevState: DialogFormState, newJuz: string): DialogFormState {
  return {
    ...prevState,
    juz: newJuz,
    surahId: '',
    ayahStart: '',
    ayahEnd: '',
    lineCount: '',
    manualOverride: false,
  };
}

export function isAyahRangeValid(
  juz: number | null | undefined,
  surahId: number | null | undefined,
  ayahStart: number | null | undefined,
  ayahEnd: number | null | undefined
): boolean {
  if (!juz || !surahId || !ayahStart || !ayahEnd) return false;
  if (juz < 1 || juz > 30) return false;
  if (ayahStart < 1 || ayahEnd < 1 || ayahStart > ayahEnd) return false;

  const segments = QURAN_JUZ_SEGMENTS[juz];
  if (!segments) return false;

  const seg = segments.find((s) => s.surahId === surahId);
  if (!seg) return false;

  return ayahStart >= seg.ayahStart && ayahEnd <= seg.ayahEnd;
}

export function formatSetoranDateIndonesian(dateIso: string): string {
  if (!dateIso) return '';
  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateIso;

  // Use midday UTC to be immune to timezone offsets
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export interface StudentRowSummary {
  attendanceStatus: string | null;
  selectedTypeRecordCount: number;
  selectedTypeTotalLines: number;
}

export function calculateStudentRowSummary(
  studentId: string,
  attendanceMap: Record<string, string>,
  records: MemorizationRecordRow[],
  activeType: 'SABAQ' | 'SABQI' | 'MANZIL'
): StudentRowSummary {
  const attendanceStatus = attendanceMap[studentId] || null;
  const recordsForType = records.filter((r) => r.type === activeType);
  const selectedTypeRecordCount = recordsForType.length;
  const selectedTypeTotalLines = recordsForType.reduce((acc, r) => acc + (r.line_count || 0), 0);

  return {
    attendanceStatus,
    selectedTypeRecordCount,
    selectedTypeTotalLines,
  };
}

