import { describe, it, expect } from 'vitest';
import {
  BARIS_PER_HALAMAN,
  HALAMAN_PER_JUZ,
  BARIS_PER_JUZ,
  TOTAL_BARIS_30_JUZ,
  barisKeHalaman,
  barisKeJuzHalaman,
  formatCapaian,
  persenProgress,
  hitungNilai,
} from '../lib/tahfizh';

describe('Konstanta Tahfizh', () => {
  it('memiliki nilai konstanta domain yang sesuai PRD & RULES', () => {
    expect(BARIS_PER_HALAMAN).toBe(15);
    expect(HALAMAN_PER_JUZ).toBe(20);
    expect(BARIS_PER_JUZ).toBe(300);
    expect(TOTAL_BARIS_30_JUZ).toBe(9000);
  });
});

describe('barisKeHalaman', () => {
  it('menghitung halaman penuh dari jumlah baris dengan benar', () => {
    expect(barisKeHalaman(0)).toBe(0);
    expect(barisKeHalaman(14)).toBe(0);
    expect(barisKeHalaman(15)).toBe(1);
    expect(barisKeHalaman(29)).toBe(1);
    expect(barisKeHalaman(30)).toBe(2);
    expect(barisKeHalaman(330)).toBe(22);
    expect(barisKeHalaman(9000)).toBe(600);
  });

  it('menangani input negatif dengan aman', () => {
    expect(barisKeHalaman(-10)).toBe(0);
  });
});

describe('barisKeJuzHalaman', () => {
  it('mengonversi total baris menjadi { juz, halaman, barisSisa }', () => {
    expect(barisKeJuzHalaman(0)).toEqual({ juz: 0, halaman: 0, barisSisa: 0 });
    expect(barisKeJuzHalaman(225)).toEqual({ juz: 0, halaman: 15, barisSisa: 0 });
    expect(barisKeJuzHalaman(330)).toEqual({ juz: 1, halaman: 2, barisSisa: 0 });
    expect(barisKeJuzHalaman(338)).toEqual({ juz: 1, halaman: 2, barisSisa: 8 });
    expect(barisKeJuzHalaman(9000)).toEqual({ juz: 30, halaman: 0, barisSisa: 0 });
  });

  it('menangani input negatif dengan aman', () => {
    expect(barisKeJuzHalaman(-50)).toEqual({ juz: 0, halaman: 0, barisSisa: 0 });
  });
});

describe('formatCapaian (Wajib Lulus Kasus Uji)', () => {
  it('memformat 330 baris (22 halaman) -> "1 juz, 2 halaman"', () => {
    expect(formatCapaian(330)).toBe('1 juz, 2 halaman');
  });

  it('memformat 225 baris (15 halaman) -> "0 juz, 15 halaman"', () => {
    expect(formatCapaian(225)).toBe('0 juz, 15 halaman');
  });

  it('memformat 0 baris -> "0 juz, 0 halaman"', () => {
    expect(formatCapaian(0)).toBe('0 juz, 0 halaman');
  });

  it('memformat 9000 baris -> "30 juz, 0 halaman"', () => {
    expect(formatCapaian(9000)).toBe('30 juz, 0 halaman');
  });

  it('memformat capaian parsial lainnya secara tepat', () => {
    expect(formatCapaian(600)).toBe('2 juz, 0 halaman');
    expect(formatCapaian(615)).toBe('2 juz, 1 halaman');
  });
});

describe('persenProgress', () => {
  it('menghitung persentase dari target 9000 baris', () => {
    expect(persenProgress(0)).toBe(0);
    expect(persenProgress(900)).toBe(10);
    expect(persenProgress(4500)).toBe(50);
    expect(persenProgress(9000)).toBe(100);
  });

  it('tidak melebihi 100% jika melebihi 9000 baris', () => {
    expect(persenProgress(9500)).toBe(100);
  });

  it('menangani input negatif dengan aman', () => {
    expect(persenProgress(-100)).toBe(0);
  });
});

describe('hitungNilai', () => {
  it('menghitung skor default 100 jika kesalahan 0', () => {
    expect(hitungNilai(0)).toBe(100);
  });

  it('mengurangi 5 per kesalahan', () => {
    expect(hitungNilai(1)).toBe(95);
    expect(hitungNilai(2)).toBe(90);
    expect(hitungNilai(4)).toBe(80);
    expect(hitungNilai(10)).toBe(50);
    expect(hitungNilai(20)).toBe(0);
  });

  it('tidak pernah menghasilkan nilai di bawah 0', () => {
    expect(hitungNilai(21)).toBe(0);
    expect(hitungNilai(50)).toBe(0);
  });

  it('menangani angka kesalahan negatif dengan aman', () => {
    expect(hitungNilai(-1)).toBe(100);
  });
});
