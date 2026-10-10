import { describe, it, expect } from 'vitest';
import {
  getJakartaMonthStarts,
  fillDailyStats,
  categorizeJuzFloor,
  selectNeedsAttention,
  RankingInputItem,
} from '../lib/dashboard-utils';

describe('Dashboard Transform Helpers', () => {
  it('menangani pergantian tahun (Januari -> Desember tahun lalu) dengan zona waktu Asia/Jakarta', () => {
    const refJan = new Date('2026-01-15T02:00:00+07:00');
    const janResult = getJakartaMonthStarts(refJan);
    expect(janResult.currentMonthStart).toBe('2026-01-01');
    expect(janResult.prevMonthStart).toBe('2025-12-01');
    expect(janResult.todayDayOfMonth).toBe(15);
    expect(janResult.daysInCurrentMonth).toBe(31);

    const refNewYear = new Date('2025-01-01T00:30:00+07:00');
    const nyResult = getJakartaMonthStarts(refNewYear);
    expect(nyResult.currentMonthStart).toBe('2025-01-01');
    expect(nyResult.prevMonthStart).toBe('2024-12-01');
    expect(nyResult.todayDayOfMonth).toBe(1);
    expect(nyResult.daysInCurrentMonth).toBe(31);
  });

  it('mengisi hari tanpa data dengan 0 dan tidak menggambar hari yang belum terjadi di bulan berjalan', () => {
    const rawData = [
      { day_of_month: 2, sabaq_lines: 10, sabqi_lines: 5, manzil_lines: 2 },
      { day_of_month: 5, sabaq_lines: 20, sabqi_lines: 10, manzil_lines: 5 },
    ];
    const todayDayOfMonth = 10;
    const filled = fillDailyStats(rawData, todayDayOfMonth);

    expect(filled.length).toBe(10);
    expect(filled[0]).toEqual({ day: 1, sabaq: 0, sabqi: 0, manzil: 0, total: 0 });
    expect(filled[1]).toEqual({ day: 2, sabaq: 10, sabqi: 5, manzil: 2, total: 17 });
    expect(filled[9]).toEqual({ day: 10, sabaq: 0, sabqi: 0, manzil: 0, total: 0 });
    expect(filled.find((f) => f.day === 11)).toBeUndefined();
  });

  it('menguji batas floor: 599 baris masuk "0 - 1 juz" (Kurang dari 2 juz), 600 baris masuk "2 - 5 juz"', () => {
    expect(categorizeJuzFloor(0)).toBe('0 - 1 juz');
    expect(categorizeJuzFloor(300)).toBe('0 - 1 juz');
    expect(categorizeJuzFloor(599)).toBe('0 - 1 juz');
    expect(categorizeJuzFloor(600)).toBe('2 - 5 juz');
    expect(categorizeJuzFloor(1800)).toBe('6 - 10 juz');
  });

  it('selectNeedsAttention: 100 santri masuk menghasilkan tepat 10, santri 0 baris ikut, 3 tingkat pemutus seri', () => {
    const rankings: RankingInputItem[] = [];
    const monthlyMap = new Map<string, number>();

    // Buat 100 santri
    for (let i = 1; i <= 100; i++) {
      const id = `id-${i}`;
      rankings.push({
        student_id: id,
        student_name: `Santri ${String(i).padStart(3, '0')}`,
        halaqah_name: 'Halaqah 7A',
        teacher_name: 'Ust. Zaid',
        total_sabaq_lines: i * 10,
      });
      if (i > 10) {
        monthlyMap.set(id, i % 5);
      }
    }

    const result = selectNeedsAttention(rankings, monthlyMap);
    expect(result.length).toBe(10);

    const zeroMonthlyCount = result.filter((r) => r.monthly_sabaq_lines === 0).length;
    expect(zeroMonthlyCount).toBeGreaterThan(0);

    // Pemutus seri tingkat 1: monthly_sabaq_lines (sama-sama 0)
    // Pemutus seri tingkat 2: total_sabaq_lines terendah (id-1 total 10 vs id-2 total 20)
    expect(result[0].student_id).toBe('id-1');
    expect(result[1].student_id).toBe('id-2');

    // Uji pemutus seri tingkat 3: nama santri localeCompare 'id' saat monthly dan total sama
    const tiedRankings: RankingInputItem[] = [
      { student_id: 'b', student_name: 'Budi', halaqah_name: 'H1', teacher_name: 'U1', total_sabaq_lines: 50 },
      { student_id: 'a', student_name: 'Ali', halaqah_name: 'H1', teacher_name: 'U1', total_sabaq_lines: 50 },
    ];
    const tiedMap = new Map<string, number>([['a', 0], ['b', 0]]);
    const tiedResult = selectNeedsAttention(tiedRankings, tiedMap);
    expect(tiedResult[0].student_name).toBe('Ali');
    expect(tiedResult[1].student_name).toBe('Budi');

    // Uji input kurang dari 10 santri tetap aman
    const smallRankings = rankings.slice(0, 5);
    const smallResult = selectNeedsAttention(smallRankings, monthlyMap);
    expect(smallResult.length).toBe(5);
  });
});
