import { describe, it, expect } from 'vitest';
import { parseLaporanParams } from '@/lib/validators/laporan-params';
import {
  calculateAttendanceSummary,
  calculateAverageFluency,
  getMonthDateRange,
  getTwoPreviousMonths,
  buildDailyChartPoints,
  aggregateHalaqahPerformance,
  getMonthName,
  resolveMatchingClassIds,
  resolveMatchingHalaqahIds,
} from '@/lib/laporan/queries';
import {
  generateRekapBulananCsv,
  generateMutabaahRecordsCsv,
} from '@/lib/laporan/csv';
import { MonthlyStudentSummaryRow, MutabaahRecordDetail } from '@/lib/laporan/types';

describe('Laporan Logic & Pure Aggregation Tests', () => {
  describe('parseLaporanParams', () => {
    it('menggunakan nilai default saat parameter kosong', () => {
      const now = new Date();
      const params = parseLaporanParams({}, 'ADMIN');
      expect(params.tab).toBe('rekap-bulanan');
      expect(params.month).toBe(now.getMonth() + 1);
      expect(params.year).toBe(now.getFullYear());
      expect(params.classLevel).toBe('all');
      expect(params.ustadzId).toBe('all');
      expect(params.studentId).toBeNull();
    });

    it('mengunci ustadzId untuk role USTADZ', () => {
      const params = parseLaporanParams({ ustadz: 'other-uuid' }, 'USTADZ', 'my-teacher-id');
      expect(params.ustadzId).toBe('my-teacher-id');
    });

    it('memvalidasi tab, bulan, tahun, dan kelas yang valid (mendukung classLevel dan ustadzId)', () => {
      const params = parseLaporanParams(
        {
          tab: 'mutabaah-santri',
          month: '10',
          year: '2025',
          classLevel: '12',
          ustadzId: 'teacher-123',
          studentId: 'student-456',
        },
        'ADMIN'
      );

      expect(params.tab).toBe('mutabaah-santri');
      expect(params.month).toBe(10);
      expect(params.year).toBe(2025);
      expect(params.classLevel).toBe(12);
      expect(params.ustadzId).toBe('teacher-123');
      expect(params.studentId).toBe('student-456');
    });

    it('mendukung backward compatibility parameter legacy class dan ustadz', () => {
      const params = parseLaporanParams(
        {
          class: '8',
          ustadz: 'teacher-legacy',
        },
        'ADMIN'
      );

      expect(params.classLevel).toBe(8);
      expect(params.ustadzId).toBe('teacher-legacy');
    });

    it('menangani input tidak valid dengan fallback aman', () => {
      const params = parseLaporanParams(
        {
          tab: 'invalid-tab',
          month: '99',
          year: '1900',
          class: '99',
        },
        'ADMIN'
      );

      const now = new Date();
      expect(params.tab).toBe('rekap-bulanan');
      expect(params.month).toBe(now.getMonth() + 1);
      expect(params.year).toBe(now.getFullYear());
      expect(params.classLevel).toBe('all');
    });
  });

  describe('getMonthDateRange & getTwoPreviousMonths', () => {
    it('menghitung rentang tanggal awal dan akhir bulan dengan benar', () => {
      // November: 30 hari
      expect(getMonthDateRange(2026, 11)).toEqual({
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      });

      // Februari tahun kabisat 2028: 29 hari
      expect(getMonthDateRange(2028, 2)).toEqual({
        startDate: '2028-02-01',
        endDate: '2028-02-29',
      });
    });

    it('menghitung 2 bulan sebelumnya dengan benar melintasi pergantian tahun', () => {
      // Bulan Januari 2026 -> 1 bln lalu: Des 2025, 2 bln lalu: Nov 2025
      const prev = getTwoPreviousMonths(2026, 1);
      expect(prev).toHaveLength(2);
      expect(prev[0]).toEqual({
        year: 2025,
        month: 12,
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      });
      expect(prev[1]).toEqual({
        year: 2025,
        month: 11,
        startDate: '2025-11-01',
        endDate: '2025-11-30',
      });
    });

    it('mengembalikan nama bulan Indonesia', () => {
      expect(getMonthName(1)).toBe('Januari');
      expect(getMonthName(11)).toBe('November');
      expect(getMonthName(12)).toBe('Desember');
    });
  });

  describe('calculateAttendanceSummary', () => {
    it('menghitung rincian status dan persentase kehadiran (Hadir + Terlambat)', () => {
      const records = [
        { status: 'HADIR' },
        { status: 'HADIR' },
        { status: 'TERLAMBAT' },
        { status: 'IZIN' },
        { status: 'SAKIT' },
        { status: 'ALPHA' },
      ];

      const summary = calculateAttendanceSummary(records);
      expect(summary.hadir).toBe(2);
      expect(summary.terlambat).toBe(1);
      expect(summary.izin).toBe(1);
      expect(summary.sakit).toBe(1);
      expect(summary.alpha).toBe(1);
      expect(summary.totalHari).toBe(6);
      // (2 + 1) / 6 = 50%
      expect(summary.persentaseHadir).toBe(50);
    });

    it('menangani data kehadiran kosong tanpa pembagian nol', () => {
      const summary = calculateAttendanceSummary([]);
      expect(summary.totalHari).toBe(0);
      expect(summary.persentaseHadir).toBe(0);
    });
  });

  describe('calculateAverageFluency', () => {
    it('menghitung rata-rata nilai kelancaran pembulatan bulat', () => {
      expect(calculateAverageFluency([100, 95, 90])).toBe(95);
      expect(calculateAverageFluency([85, 90])).toBe(88);
    });

    it('mengembalikan 100 jika tidak ada riwayat nilai', () => {
      expect(calculateAverageFluency([])).toBe(100);
    });
  });

  describe('buildDailyChartPoints', () => {
    it('memetakan baris sabaq, sabqi, dan manzil untuk seluruh hari dalam bulan', () => {
      const records = [
        { date: '2026-11-02', type: 'SABAQ', line_count: 15 },
        { date: '2026-11-02', type: 'SABQI', line_count: 10 },
        { date: '2026-11-03', type: 'MANZIL', line_count: 30 },
      ];

      const points = buildDailyChartPoints(2026, 11, records);
      expect(points).toHaveLength(30); // November memiliki 30 hari

      const day2 = points.find((p) => p.day === 2);
      expect(day2?.sabaq).toBe(15);
      expect(day2?.sabqi).toBe(10);
      expect(day2?.manzil).toBe(0);

      const day3 = points.find((p) => p.day === 3);
      expect(day3?.sabaq).toBe(0);
      expect(day3?.manzil).toBe(30);

      const day1 = points.find((p) => p.day === 1);
      expect(day1?.sabaq).toBe(0);
    });
  });

  describe('aggregateHalaqahPerformance', () => {
    it('mengelompokkan kinerja per halaqah secara agregat', () => {
      const summaries: MonthlyStudentSummaryRow[] = [
        {
          studentId: 's1',
          name: 'Santri 1',
          nisn: '123',
          className: 'Kelas 7',
          halaqahName: 'Halaqah Abu Bakar',
          teacherName: 'Ust. Danis',
          sabaqLines: 50,
          sabqiLines: 20,
          manzilLines: 30,
          sabaqFormatted: '0 juz, 3 halaman',
          lifetimeSabaqLines: 300,
          lifetimeProgressPercent: 3.33,
          attendance: { hadir: 10, terlambat: 0, izin: 0, sakit: 0, alpha: 0, totalHari: 10, persentaseHadir: 100 },
          averageFluency: 90,
          trendPrevMonth: 40,
          trendTwoMonthsAgo: 30,
        },
        {
          studentId: 's2',
          name: 'Santri 2',
          nisn: '124',
          className: 'Kelas 7',
          halaqahName: 'Halaqah Abu Bakar',
          teacherName: 'Ust. Danis',
          sabaqLines: 30,
          sabqiLines: 10,
          manzilLines: 10,
          sabaqFormatted: '0 juz, 2 halaman',
          lifetimeSabaqLines: 150,
          lifetimeProgressPercent: 1.67,
          attendance: { hadir: 8, terlambat: 0, izin: 2, sakit: 0, alpha: 0, totalHari: 10, persentaseHadir: 80 },
          averageFluency: 100,
          trendPrevMonth: 20,
          trendTwoMonthsAgo: 20,
        },
      ];

      const result = aggregateHalaqahPerformance(summaries);
      expect(result).toHaveLength(1);
      const h = result[0];
      expect(h.halaqahName).toBe('Halaqah Abu Bakar');
      expect(h.studentCount).toBe(2);
      expect(h.totalSabaqLines).toBe(80);
      expect(h.totalSabqiLines).toBe(30);
      expect(h.totalManzilLines).toBe(40);
      expect(h.averageAttendancePercent).toBe(90); // (100 + 80) / 2
      expect(h.averageFluency).toBe(95); // (90 + 100) / 2
    });
  });

  describe('2-Stage Filter Resolvers (Pola 05c)', () => {
    it('resolveMatchingClassIds memfilter ID kelas berdasarkan level', () => {
      const classes = [
        { id: 'c-7a', level: 7 },
        { id: 'c-7b', level: 7 },
        { id: 'c-8a', level: 8 },
        { id: 'c-12a', level: 12 },
      ];

      expect(resolveMatchingClassIds(classes, 'all')).toBeNull();
      expect(resolveMatchingClassIds(classes, 7)).toEqual(['c-7a', 'c-7b']);
      expect(resolveMatchingClassIds(classes, 8)).toEqual(['c-8a']);
      expect(resolveMatchingClassIds(classes, 9)).toEqual([]);
    });

    it('resolveMatchingHalaqahIds memfilter ID halaqah aktif milik guru yang dipilih', () => {
      const halaqahs = [
        { id: 'h-1', teacher_id: 'ustadz-a', is_active: true },
        { id: 'h-2', teacher_id: 'ustadz-a', is_active: false },
        { id: 'h-3', teacher_id: 'ustadz-b', is_active: true },
      ];

      expect(resolveMatchingHalaqahIds(halaqahs, null)).toBeNull();
      expect(resolveMatchingHalaqahIds(halaqahs, 'ustadz-a')).toEqual(['h-1']);
      expect(resolveMatchingHalaqahIds(halaqahs, 'ustadz-b')).toEqual(['h-3']);
      expect(resolveMatchingHalaqahIds(halaqahs, 'ustadz-c')).toEqual([]);
    });
  });

  describe('CSV Generation', () => {
    it('menghasilkan CSV rekap bulanan dengan escaping tanda kutip yang benar', () => {
      const summaries: MonthlyStudentSummaryRow[] = [
        {
          studentId: 's1',
          name: 'Ahmad, "Zaki"',
          nisn: '123456',
          className: 'Kelas 12',
          halaqahName: 'Halaqah Umar',
          teacherName: 'Ust. Kajen',
          sabaqLines: 100,
          sabqiLines: 50,
          manzilLines: 40,
          sabaqFormatted: '0 juz, 6 halaman',
          lifetimeSabaqLines: 900,
          lifetimeProgressPercent: 10,
          attendance: { hadir: 20, terlambat: 0, izin: 0, sakit: 0, alpha: 0, totalHari: 20, persentaseHadir: 100 },
          averageFluency: 98,
          trendPrevMonth: 90,
          trendTwoMonthsAgo: 85,
        },
      ];

      const csv = generateRekapBulananCsv(summaries, 'November', 2026);
      expect(csv).toContain('"Rekapitulasi Bulanan Tahfizh - Pesantren Darul Ilmi"');
      expect(csv).toContain('"Periode: November 2026"');
      // Escaped quote check
      expect(csv).toContain('"Ahmad, ""Zaki"""');
      expect(csv).toContain('"Kelas 12"');
    });

    it('menghasilkan CSV mutabaah santri dengan detail setoran', () => {
      const records: MutabaahRecordDetail[] = [
        {
          id: 'r1',
          date: '2026-11-04',
          type: 'SABAQ',
          juz: 1,
          surahId: 1,
          surahName: '1. Al-Fatihah',
          ayahStart: 1,
          ayahEnd: 7,
          lineCount: 5,
          mistakeCount: 0,
          fluencyScore: 100,
          notes: 'Lancar sekali',
        },
      ];

      const csv = generateMutabaahRecordsCsv('Adika', '998877', records, 'November', 2026);
      expect(csv).toContain('"Buku Mutaba\'ah Tahfizh Santri - Pesantren Darul Ilmi"');
      expect(csv).toContain('"Nama Santri: Adika (NISN: 998877)"');
      expect(csv).toContain('1. Al-Fatihah');
      expect(csv).toContain('Lancar sekali');
    });
  });
});

