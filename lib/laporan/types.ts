export type LaporanTab = 'rekap-bulanan' | 'mutabaah-santri' | 'kinerja-halaqah';

export interface LaporanFilterParams {
  tab: LaporanTab;
  month: number; // 1-12
  year: number;  // e.g. 2026
  classLevel: number | 'all';
  ustadzId: string | 'all';
  studentId: string | null;
}

export interface MonthOption {
  value: string;
  label: string;
}

export interface YearOption {
  value: string;
  label: string;
}

export interface ClassFilterOption {
  id: string;
  name: string;
  level: number;
}

export interface TeacherFilterOption {
  id: string;
  name: string;
}

export interface StudentFilterOption {
  id: string;
  name: string;
  className: string;
  halaqahName: string;
}

export interface AttendanceSummary {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpha: number;
  totalHari: number;
  persentaseHadir: number; // 0-100
}

export interface MonthlyStudentSummaryRow {
  studentId: string;
  name: string;
  nisn: string;
  className: string;
  halaqahName: string;
  teacherName: string;
  sabaqLines: number;
  sabqiLines: number;
  manzilLines: number;
  sabaqFormatted: string; // e.g. "1 juz, 5 halaman"
  lifetimeSabaqLines: number;
  lifetimeProgressPercent: number; // 0-100% dari 30 juz
  attendance: AttendanceSummary;
  averageFluency: number; // 0-100
  trendTwoMonthsAgo: number; // sabaq lines 2 bulan lalu
  trendPrevMonth: number;    // sabaq lines 1 bulan lalu
}

export interface DailyChartPoint {
  date: string;
  day: number;
  sabaq: number;
  sabqi: number;
  manzil: number;
}

export interface MutabaahRecordDetail {
  id: string;
  date: string;
  type: 'SABAQ' | 'SABQI' | 'MANZIL';
  juz: number;
  surahId: number;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  lineCount: number;
  mistakeCount: number;
  fluencyScore: number;
  notes: string | null;
}

export interface StudentMutabaahCardData {
  student: {
    id: string;
    name: string;
    nisn: string;
    className: string;
    halaqahName: string;
    teacherName: string;
    parentName: string | null;
  };
  period: {
    month: number;
    monthName: string;
    year: number;
  };
  progress: {
    lifetimeSabaqLines: number;
    lifetimeFormatted: string;
    lifetimePercent: number;
    monthSabaqLines: number;
    monthSabaqFormatted: string;
    monthSabqiLines: number;
    monthManzilLines: number;
    averageFluency: number;
  };
  attendance: AttendanceSummary;
  chartData: DailyChartPoint[];
  records: MutabaahRecordDetail[];
}

export interface HalaqahPerformanceRow {
  halaqahId: string;
  halaqahName: string;
  teacherName: string;
  className: string;
  studentCount: number;
  averageAttendancePercent: number;
  totalSabaqLines: number;
  totalSabqiLines: number;
  totalManzilLines: number;
  averageFluency: number;
}

