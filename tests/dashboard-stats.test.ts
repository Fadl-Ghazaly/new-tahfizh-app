import { describe, it, expect, vi } from 'vitest';
import {
  computeTargetAchievement,
  computeMemorizationStats,
  comparePeriods,
  sumDailyLinesUntil,
  categorizeFluency,
  computeFluencyStats,
  formatCapaianDenganBaris,
  DashboardQueryError,
} from '../lib/dashboard-utils';

// Mock server-only agar lib/queries/dashboard bisa diuji di lingkungan Vitest
vi.mock('server-only', () => ({}));

describe('Dashboard Pure Calculation Utilities', () => {
  describe('computeTargetAchievement (Pie Target)', () => {
    it('314461 baris dari 100 santri menghasilkan target 900.000, 34,9% dan 585.539 sisa baris', () => {
      const res = computeTargetAchievement(314461, 100);
      expect(res.total_lines).toBe(314461);
      expect(res.target_lines).toBe(900000);
      expect(res.percentage).toBe(34.9);
      expect(res.remaining_lines).toBe(585539);
    });

    it('0 santri menghasilkan 0 target, 0% tanpa pembagian dengan nol', () => {
      const res = computeTargetAchievement(0, 0);
      expect(res.target_lines).toBe(0);
      expect(res.percentage).toBe(0);
      expect(res.remaining_lines).toBe(0);
    });

    it('pencapaian melebihi target dibatasi maksimum 100%', () => {
      const res = computeTargetAchievement(950000, 100);
      expect(res.percentage).toBe(100);
      expect(res.remaining_lines).toBe(0);
    });

    it('pembulatan persentase ke 1 desimal', () => {
      // 1000 baris / 900000 = 0.1111% -> 0.1%
      const res = computeTargetAchievement(1000, 100);
      expect(res.percentage).toBe(0.1);
    });
  });

  describe('computeMemorizationStats (Statistik Hafalan Santri)', () => {
    it('menghitung rata-rata, median ganjil, dan maksimum dengan benar', () => {
      const data = [1000, 2000, 3000, 4000, 5000];
      const res = computeMemorizationStats(data);
      expect(res.average_lines).toBe(3000);
      expect(res.median_lines).toBe(3000);
      expect(res.maximum_lines).toBe(5000);
      expect(res.formatted_average).toBe('10 juz, 0 halaman');
      expect(res.formatted_median).toBe('10 juz, 0 halaman');
      expect(res.formatted_maximum).toBe('16 juz, 13 halaman');
    });

    it('menghitung median genap sebagai rata-rata dari dua elemen tengah', () => {
      const data = [1000, 2000, 4000, 5000];
      const res = computeMemorizationStats(data);
      expect(res.median_lines).toBe(3000); // (2000 + 4000) / 2
    });

    it('menguji batas 3000 dan 3001: tepat 3000 TIDAK dihitung, 3001 dihitung di atas 10 juz', () => {
      const with3000 = [1000, 2000, 3000];
      const res1 = computeMemorizationStats(with3000);
      expect(res1.students_above_10_juz).toBe(0);

      const with3001 = [1000, 2000, 3001];
      const res2 = computeMemorizationStats(with3001);
      expect(res2.students_above_10_juz).toBe(1);
    });

    it('mengurutkan salinan array: input acak menghasilkan median benar dan array asli tidak bermutasi', () => {
      const unsorted = [5000, 1000, 4000, 2000, 3000];
      const copy = [...unsorted];
      const res = computeMemorizationStats(unsorted);
      expect(res.median_lines).toBe(3000);
      expect(unsorted).toEqual(copy); // tidak termutasi
    });

    it('daftar kosong aman dan mengembalikan nilai 0', () => {
      const res = computeMemorizationStats([]);
      expect(res.average_lines).toBe(0);
      expect(res.median_lines).toBe(0);
      expect(res.maximum_lines).toBe(0);
      expect(res.students_above_10_juz).toBe(0);
    });
  });

  describe('comparePeriods & sumDailyLinesUntil (Perbandingan Progress)', () => {
    it('sumDailyLinesUntil menjumlahkan sabaq pada rentang hari 1..N yang sama', () => {
      const rows = [
        { day: 1, sabaq: 100 },
        { day: 2, sabaq: 150 },
        { day: 3, sabaq: 200 },
        { day: 4, sabaq: 250 },
      ];
      expect(sumDailyLinesUntil(rows, 3)).toBe(450); // 100 + 150 + 200
    });

    it('sumDailyLinesUntil aman bila N melebihi jumlah hari bulan lalu (mis. N=31 vs 28 hari Februari)', () => {
      const rows = [
        { day: 1, sabaq: 100 },
        { day: 28, sabaq: 200 },
      ];
      expect(sumDailyLinesUntil(rows, 31)).toBe(300);
    });

    it('comparePeriods menghitung delta positif dan persentase perubahan', () => {
      const res = comparePeriods(1200, 1000);
      expect(res.delta).toBe(200);
      expect(res.percentChange).toBe(20.0);
    });

    it('comparePeriods mengembalikan percentChange null bila previousLines = 0', () => {
      const res = comparePeriods(500, 0);
      expect(res.delta).toBe(500);
      expect(res.percentChange).toBeNull();
    });

    it('comparePeriods menghitung selisih negatif dan persentase penurunan', () => {
      const res = comparePeriods(800, 1000);
      expect(res.delta).toBe(-200);
      expect(res.percentChange).toBe(-20.0);
    });
  });

  describe('categorizeFluency & computeFluencyStats', () => {
    it('menguji batas kategori: 90, 89, 75, 74', () => {
      expect(categorizeFluency(95)).toBe('excellent');
      expect(categorizeFluency(90)).toBe('excellent');
      expect(categorizeFluency(89)).toBe('good');
      expect(categorizeFluency(75)).toBe('good');
      expect(categorizeFluency(74)).toBe('needs_work');
      expect(categorizeFluency(0)).toBe('needs_work');
    });

    it('computeFluencyStats mengembalikan rata-rata null bila tidak ada data', () => {
      const res = computeFluencyStats(undefined, '2026-03-01');
      expect(res.month_start).toBe('2026-03-01');
      expect(res.excellent).toBe(0);
      expect(res.good).toBe(0);
      expect(res.needs_work).toBe(0);
      expect(res.total).toBe(0);
      expect(res.avg_score).toBeNull();
    });

    it('rata-rata skor 0 yang valid TIDAK menjadi 100 atau null', () => {
      const row = {
        excellent_count: 0,
        good_count: 0,
        needs_work_count: 5,
        total_records: 5,
        avg_fluency_score: 0,
      };
      const res = computeFluencyStats(row, '2026-03-01');
      expect(res.avg_score).toBe(0);
    });
  });

  describe('formatCapaianDenganBaris', () => {
    it('0 baris menghasilkan "0 juz, 0 halaman"', () => {
      expect(formatCapaianDenganBaris(0)).toBe('0 juz, 0 halaman');
    });

    it('3 baris menghasilkan "0 juz, 0 halaman (3 baris)"', () => {
      expect(formatCapaianDenganBaris(3)).toBe('0 juz, 0 halaman (3 baris)');
    });

    it('14 baris menghasilkan "0 juz, 0 halaman (14 baris)"', () => {
      expect(formatCapaianDenganBaris(14)).toBe('0 juz, 0 halaman (14 baris)');
    });

    it('15 baris menghasilkan "0 juz, 1 halaman"', () => {
      expect(formatCapaianDenganBaris(15)).toBe('0 juz, 1 halaman');
    });

    it('330 baris menghasilkan "1 juz, 2 halaman"', () => {
      expect(formatCapaianDenganBaris(330)).toBe('1 juz, 2 halaman');
    });
  });
});

import { getDashboardSummary } from '../lib/queries/dashboard';

const mockFrom = vi.fn();
vi.mock('../lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));


describe('DashboardQueryError Handling in Query Functions', () => {
  it('melempar DashboardQueryError berisi nama view dan tidak mengembalikan 0 saat error', async () => {
    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: null,
      error: { message: 'relation v_dashboard_summary does not exist' },
    });
    const mockSelect = vi.fn().mockReturnValueOnce({
      single: mockSingle,
    });
    mockFrom.mockReturnValueOnce({
      select: mockSelect,
    });

    await expect(getDashboardSummary()).rejects.toThrow(DashboardQueryError);
    await expect(getDashboardSummary()).rejects.toThrow(/v_dashboard_summary/);
  });
});
