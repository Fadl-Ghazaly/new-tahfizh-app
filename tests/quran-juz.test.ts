import { describe, it, expect } from 'vitest';
import {
  QURAN_JUZ_SEGMENTS,
  getJuzSegments,
  getTotalAyahsInJuz,
  getJuzStartPosition,
  getNextSabaqChunk,
} from '../lib/quran-juz';

describe('Data Referensi 30 Juz Al-Qur\'an', () => {
  it('memiliki tepat 30 juz', () => {
    const keys = Object.keys(QURAN_JUZ_SEGMENTS).map(Number);
    expect(keys.length).toBe(30);
    expect(Math.min(...keys)).toBe(1);
    expect(Math.max(...keys)).toBe(30);
  });

  it('memiliki total ayat semua 30 juz tepat 6236 ayat', () => {
    let totalAyahs = 0;
    for (let j = 1; j <= 30; j++) {
      totalAyahs += getTotalAyahsInJuz(j);
    }
    expect(totalAyahs).toBe(6236);
  });

  it('tidak memiliki ayat yang terlewat atau tumpang tindih dari 1:1 s.d. 114:6', () => {
    let lastSurah = 1;
    let lastAyah = 0;

    for (let j = 1; j <= 30; j++) {
      const segments = getJuzSegments(j);
      for (const seg of segments) {
        expect(seg.ayahStart).toBeLessThanOrEqual(seg.ayahEnd);
        expect(seg.ayahCount).toBe(seg.ayahEnd - seg.ayahStart + 1);

        if (seg.surahId === lastSurah) {
          // Ayat harus persis kelanjutan dari ayat sebelumnya
          expect(seg.ayahStart).toBe(lastAyah + 1);
        } else {
          // Pindah ke surah berikutnya (harus nomor berurutan dan mulai dari ayat 1)
          expect(seg.surahId).toBe(lastSurah + 1);
          expect(seg.ayahStart).toBe(1);
        }

        lastSurah = seg.surahId;
        lastAyah = seg.ayahEnd;
      }
    }

    // Harus berakhir di surah 114 ayat 6
    expect(lastSurah).toBe(114);
    expect(lastAyah).toBe(6);
  });

  it('memiliki 30 awal juz yang sama persis dengan daftar kanonik standar', () => {
    const canonicalStarts: Array<{ juz: number; surah: number; ayah: number }> = [
      { juz: 1, surah: 1, ayah: 1 },
      { juz: 2, surah: 2, ayah: 142 },
      { juz: 3, surah: 2, ayah: 253 },
      { juz: 4, surah: 3, ayah: 93 },
      { juz: 5, surah: 4, ayah: 24 },
      { juz: 6, surah: 4, ayah: 148 },
      { juz: 7, surah: 5, ayah: 82 },
      { juz: 8, surah: 6, ayah: 111 },
      { juz: 9, surah: 7, ayah: 88 },
      { juz: 10, surah: 8, ayah: 41 },
      { juz: 11, surah: 9, ayah: 93 },
      { juz: 12, surah: 11, ayah: 6 },
      { juz: 13, surah: 12, ayah: 53 },
      { juz: 14, surah: 15, ayah: 1 },
      { juz: 15, surah: 17, ayah: 1 },
      { juz: 16, surah: 18, ayah: 75 },
      { juz: 17, surah: 21, ayah: 1 },
      { juz: 18, surah: 23, ayah: 1 },
      { juz: 19, surah: 25, ayah: 21 },
      { juz: 20, surah: 27, ayah: 56 },
      { juz: 21, surah: 29, ayah: 46 },
      { juz: 22, surah: 33, ayah: 31 },
      { juz: 23, surah: 36, ayah: 28 },
      { juz: 24, surah: 39, ayah: 32 },
      { juz: 25, surah: 41, ayah: 47 },
      { juz: 26, surah: 46, ayah: 1 },
      { juz: 27, surah: 51, ayah: 31 },
      { juz: 28, surah: 58, ayah: 1 },
      { juz: 29, surah: 67, ayah: 1 },
      { juz: 30, surah: 78, ayah: 1 },
    ];

    for (const item of canonicalStarts) {
      const startPos = getJuzStartPosition(item.juz);
      expect(startPos.juz).toBe(item.juz);
      expect(startPos.surahId).toBe(item.surah);
      expect(startPos.nextAyah).toBe(item.ayah);
    }
  });

  it('memastikan Surah 29:45 termasuk Juz 20 dan Surah 29:46 termasuk Juz 21', () => {
    const juz20 = getJuzSegments(20);
    const seg29InJuz20 = juz20.find((s) => s.surahId === 29);
    expect(seg29InJuz20).toBeDefined();
    expect(seg29InJuz20!.ayahEnd).toBe(45);
    expect(seg29InJuz20!.ayahStart).toBeLessThanOrEqual(45);

    const juz21 = getJuzSegments(21);
    const seg29InJuz21 = juz21.find((s) => s.surahId === 29);
    expect(seg29InJuz21).toBeDefined();
    expect(seg29InJuz21!.ayahStart).toBe(46);
  });
});

describe('getNextSabaqChunk (Pemotong Setoran Sabaq)', () => {
  it('memotong setoran tepat di batas surah (satu record satu surah)', () => {
    // Di Juz 30, Surah An-Nasr (110) hanya memiliki 3 ayat.
    // Jika requestedLines besar, ia tetap tidak boleh melompat ke Surah 111 dalam 1 record.
    const pos = { juz: 30, surahId: 110, nextAyah: 1 };
    const chunk = getNextSabaqChunk(pos, 30); // minta banyak baris

    expect(chunk.juz).toBe(30);
    expect(chunk.surahId).toBe(110);
    expect(chunk.ayahStart).toBe(1);
    expect(chunk.ayahEnd).toBe(3); // dipotong di akhir Surah 110
    expect(chunk.nextPosition).toEqual({
      juz: 30,
      surahId: 111,
      nextAyah: 1,
    });
    expect(chunk.isJuzCompleted).toBe(false);
  });

  it('memotong setoran tepat di akhir juz dan menandai isJuzCompleted', () => {
    // Surah 114 (An-Nas) adalah surah terakhir di Juz 30 (6 ayat).
    const pos = { juz: 30, surahId: 114, nextAyah: 1 };
    const chunk = getNextSabaqChunk(pos, 30);

    expect(chunk.juz).toBe(30);
    expect(chunk.surahId).toBe(114);
    expect(chunk.ayahStart).toBe(1);
    expect(chunk.ayahEnd).toBe(6);
    expect(chunk.nextPosition).toBeNull();
    expect(chunk.isJuzCompleted).toBe(true);
  });

  it('mengambil posisi awal juz dengan benar', () => {
    expect(getJuzStartPosition(1)).toEqual({ juz: 1, surahId: 1, nextAyah: 1 });
    expect(getJuzStartPosition(30)).toEqual({ juz: 30, surahId: 78, nextAyah: 1 });
    expect(getJuzStartPosition(29)).toEqual({ juz: 29, surahId: 67, nextAyah: 1 });
  });

  it('menghasilkan lineCount valid antara 1 dan 300 untuk setiap chunk', () => {
    let currentPos: { juz: number; surahId: number; nextAyah: number } | null =
      getJuzStartPosition(30);
    let totalJuzLines = 0;
    let iterationCount = 0;

    while (currentPos && iterationCount < 500) {
      iterationCount++;
      const chunk = getNextSabaqChunk(currentPos, 15);
      expect(chunk.lineCount).toBeGreaterThanOrEqual(1);
      expect(chunk.lineCount).toBeLessThanOrEqual(300);
      expect(chunk.ayahEnd).toBeGreaterThanOrEqual(chunk.ayahStart);
      totalJuzLines += chunk.lineCount;

      currentPos = chunk.nextPosition;
    }

    // Memastikan Juz 30 selesai dilalui
    expect(currentPos).toBeNull();
    expect(totalJuzLines).toBe(300);
  });

  it('menghabiskan seluruh Al-Qur\'an 30 juz dengan variasi 3-40 baris: tepat 300 baris/juz dan tepat 9000 total baris', () => {
    let grandTotalLines = 0;

    for (let j = 1; j <= 30; j++) {
      let pos: { juz: number; surahId: number; nextAyah: number } | null = getJuzStartPosition(j);
      let juzLines = 0;
      let step = 0;

      while (pos) {
        step++;
        // Variasikan permintaan baris antara 3 dan 40 secara deterministik
        const requested = 3 + ((step * 7 + j * 13) % 38); // 3 s.d. 40
        const chunk = getNextSabaqChunk(pos, requested);

        // Verifikasi integer dan rentang [1, 300]
        expect(Number.isInteger(chunk.lineCount)).toBe(true);
        expect(chunk.lineCount).toBeGreaterThanOrEqual(1);
        expect(chunk.lineCount).toBeLessThanOrEqual(300);

        // Verifikasi 1 juz dan 1 surah per record
        expect(chunk.juz).toBe(j);
        expect(chunk.ayahEnd).toBeGreaterThanOrEqual(chunk.ayahStart);

        juzLines += chunk.lineCount;

        if (chunk.isJuzCompleted) {
          expect(chunk.nextPosition).toBeNull();
        }

        pos = chunk.nextPosition;
      }

      // Setiap juz harus bernilai TEPAT 300 baris
      expect(juzLines).toBe(300);
      grandTotalLines += juzLines;
    }

    // Seluruh 30 juz harus bernilai TEPAT 9000 baris
    expect(grandTotalLines).toBe(9000);
  });
});

