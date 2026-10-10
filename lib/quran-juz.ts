/**
 * Data Referensi Al-Qur'an dan Pembagian 30 Juz
 * Pesantren Darul Ilmi.
 *
 * Standar: Mushaf Madinah (114 Surah, 6.236 Ayat).
 * Setiap juz bernilai tepat 300 baris.
 * Satu record setoran HANYA boleh memuat satu juz dan satu surah.
 */

export interface JuzSegment {
  juz: number;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  ayahCount: number;
}

export interface JuzPosition {
  juz: number;
  surahId: number;
  nextAyah: number;
}

export interface SabaqChunk {
  juz: number;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  lineCount: number;
  nextPosition: JuzPosition | null;
  isJuzCompleted: boolean;
}

/**
 * Daftar segmen (surat dan rentang ayat) per juz sesuai Mushaf Madinah.
 * Total ayat across all 30 juz = 6.236 ayat tanpa gap & tanpa overlap.
 */
export const QURAN_JUZ_SEGMENTS: Record<number, JuzSegment[]> = {
  1: [
    { juz: 1, surahId: 1, ayahStart: 1, ayahEnd: 7, ayahCount: 7 },
    { juz: 1, surahId: 2, ayahStart: 1, ayahEnd: 141, ayahCount: 141 },
  ],
  2: [
    { juz: 2, surahId: 2, ayahStart: 142, ayahEnd: 252, ayahCount: 111 },
  ],
  3: [
    { juz: 3, surahId: 2, ayahStart: 253, ayahEnd: 286, ayahCount: 34 },
    { juz: 3, surahId: 3, ayahStart: 1, ayahEnd: 92, ayahCount: 92 },
  ],
  4: [
    { juz: 4, surahId: 3, ayahStart: 93, ayahEnd: 200, ayahCount: 108 },
    { juz: 4, surahId: 4, ayahStart: 1, ayahEnd: 23, ayahCount: 23 },
  ],
  5: [
    { juz: 5, surahId: 4, ayahStart: 24, ayahEnd: 147, ayahCount: 124 },
  ],
  6: [
    { juz: 6, surahId: 4, ayahStart: 148, ayahEnd: 176, ayahCount: 29 },
    { juz: 6, surahId: 5, ayahStart: 1, ayahEnd: 81, ayahCount: 81 },
  ],
  7: [
    { juz: 7, surahId: 5, ayahStart: 82, ayahEnd: 120, ayahCount: 39 },
    { juz: 7, surahId: 6, ayahStart: 1, ayahEnd: 110, ayahCount: 110 },
  ],
  8: [
    { juz: 8, surahId: 6, ayahStart: 111, ayahEnd: 165, ayahCount: 55 },
    { juz: 8, surahId: 7, ayahStart: 1, ayahEnd: 87, ayahCount: 87 },
  ],
  9: [
    { juz: 9, surahId: 7, ayahStart: 88, ayahEnd: 206, ayahCount: 119 },
    { juz: 9, surahId: 8, ayahStart: 1, ayahEnd: 40, ayahCount: 40 },
  ],
  10: [
    { juz: 10, surahId: 8, ayahStart: 41, ayahEnd: 75, ayahCount: 35 },
    { juz: 10, surahId: 9, ayahStart: 1, ayahEnd: 92, ayahCount: 92 },
  ],
  11: [
    { juz: 11, surahId: 9, ayahStart: 93, ayahEnd: 129, ayahCount: 37 },
    { juz: 11, surahId: 10, ayahStart: 1, ayahEnd: 109, ayahCount: 109 },
    { juz: 11, surahId: 11, ayahStart: 1, ayahEnd: 5, ayahCount: 5 },
  ],
  12: [
    { juz: 12, surahId: 11, ayahStart: 6, ayahEnd: 123, ayahCount: 118 },
    { juz: 12, surahId: 12, ayahStart: 1, ayahEnd: 52, ayahCount: 52 },
  ],
  13: [
    { juz: 13, surahId: 12, ayahStart: 53, ayahEnd: 111, ayahCount: 59 },
    { juz: 13, surahId: 13, ayahStart: 1, ayahEnd: 43, ayahCount: 43 },
    { juz: 13, surahId: 14, ayahStart: 1, ayahEnd: 52, ayahCount: 52 },
  ],
  14: [
    { juz: 14, surahId: 15, ayahStart: 1, ayahEnd: 99, ayahCount: 99 },
    { juz: 14, surahId: 16, ayahStart: 1, ayahEnd: 128, ayahCount: 128 },
  ],
  15: [
    { juz: 15, surahId: 17, ayahStart: 1, ayahEnd: 111, ayahCount: 111 },
    { juz: 15, surahId: 18, ayahStart: 1, ayahEnd: 74, ayahCount: 74 },
  ],
  16: [
    { juz: 16, surahId: 18, ayahStart: 75, ayahEnd: 110, ayahCount: 36 },
    { juz: 16, surahId: 19, ayahStart: 1, ayahEnd: 98, ayahCount: 98 },
    { juz: 16, surahId: 20, ayahStart: 1, ayahEnd: 135, ayahCount: 135 },
  ],
  17: [
    { juz: 17, surahId: 21, ayahStart: 1, ayahEnd: 112, ayahCount: 112 },
    { juz: 17, surahId: 22, ayahStart: 1, ayahEnd: 78, ayahCount: 78 },
  ],
  18: [
    { juz: 18, surahId: 23, ayahStart: 1, ayahEnd: 118, ayahCount: 118 },
    { juz: 18, surahId: 24, ayahStart: 1, ayahEnd: 64, ayahCount: 64 },
    { juz: 18, surahId: 25, ayahStart: 1, ayahEnd: 20, ayahCount: 20 },
  ],
  19: [
    { juz: 19, surahId: 25, ayahStart: 21, ayahEnd: 77, ayahCount: 57 },
    { juz: 19, surahId: 26, ayahStart: 1, ayahEnd: 227, ayahCount: 227 },
    { juz: 19, surahId: 27, ayahStart: 1, ayahEnd: 55, ayahCount: 55 },
  ],
  20: [
    { juz: 20, surahId: 27, ayahStart: 56, ayahEnd: 93, ayahCount: 38 },
    { juz: 20, surahId: 28, ayahStart: 1, ayahEnd: 88, ayahCount: 88 },
    { juz: 20, surahId: 29, ayahStart: 1, ayahEnd: 45, ayahCount: 45 },
  ],
  21: [
    { juz: 21, surahId: 29, ayahStart: 46, ayahEnd: 69, ayahCount: 24 },
    { juz: 21, surahId: 30, ayahStart: 1, ayahEnd: 60, ayahCount: 60 },
    { juz: 21, surahId: 31, ayahStart: 1, ayahEnd: 34, ayahCount: 34 },
    { juz: 21, surahId: 32, ayahStart: 1, ayahEnd: 30, ayahCount: 30 },
    { juz: 21, surahId: 33, ayahStart: 1, ayahEnd: 30, ayahCount: 30 },
  ],
  22: [
    { juz: 22, surahId: 33, ayahStart: 31, ayahEnd: 73, ayahCount: 43 },
    { juz: 22, surahId: 34, ayahStart: 1, ayahEnd: 54, ayahCount: 54 },
    { juz: 22, surahId: 35, ayahStart: 1, ayahEnd: 45, ayahCount: 45 },
    { juz: 22, surahId: 36, ayahStart: 1, ayahEnd: 27, ayahCount: 27 },
  ],
  23: [
    { juz: 23, surahId: 36, ayahStart: 28, ayahEnd: 83, ayahCount: 56 },
    { juz: 23, surahId: 37, ayahStart: 1, ayahEnd: 182, ayahCount: 182 },
    { juz: 23, surahId: 38, ayahStart: 1, ayahEnd: 88, ayahCount: 88 },
    { juz: 23, surahId: 39, ayahStart: 1, ayahEnd: 31, ayahCount: 31 },
  ],
  24: [
    { juz: 24, surahId: 39, ayahStart: 32, ayahEnd: 75, ayahCount: 44 },
    { juz: 24, surahId: 40, ayahStart: 1, ayahEnd: 85, ayahCount: 85 },
    { juz: 24, surahId: 41, ayahStart: 1, ayahEnd: 46, ayahCount: 46 },
  ],
  25: [
    { juz: 25, surahId: 41, ayahStart: 47, ayahEnd: 54, ayahCount: 8 },
    { juz: 25, surahId: 42, ayahStart: 1, ayahEnd: 53, ayahCount: 53 },
    { juz: 25, surahId: 43, ayahStart: 1, ayahEnd: 89, ayahCount: 89 },
    { juz: 25, surahId: 44, ayahStart: 1, ayahEnd: 59, ayahCount: 59 },
    { juz: 25, surahId: 45, ayahStart: 1, ayahEnd: 37, ayahCount: 37 },
  ],
  26: [
    { juz: 26, surahId: 46, ayahStart: 1, ayahEnd: 35, ayahCount: 35 },
    { juz: 26, surahId: 47, ayahStart: 1, ayahEnd: 38, ayahCount: 38 },
    { juz: 26, surahId: 48, ayahStart: 1, ayahEnd: 29, ayahCount: 29 },
    { juz: 26, surahId: 49, ayahStart: 1, ayahEnd: 18, ayahCount: 18 },
    { juz: 26, surahId: 50, ayahStart: 1, ayahEnd: 45, ayahCount: 45 },
    { juz: 26, surahId: 51, ayahStart: 1, ayahEnd: 30, ayahCount: 30 },
  ],
  27: [
    { juz: 27, surahId: 51, ayahStart: 31, ayahEnd: 60, ayahCount: 30 },
    { juz: 27, surahId: 52, ayahStart: 1, ayahEnd: 49, ayahCount: 49 },
    { juz: 27, surahId: 53, ayahStart: 1, ayahEnd: 62, ayahCount: 62 },
    { juz: 27, surahId: 54, ayahStart: 1, ayahEnd: 55, ayahCount: 55 },
    { juz: 27, surahId: 55, ayahStart: 1, ayahEnd: 78, ayahCount: 78 },
    { juz: 27, surahId: 56, ayahStart: 1, ayahEnd: 96, ayahCount: 96 },
    { juz: 27, surahId: 57, ayahStart: 1, ayahEnd: 29, ayahCount: 29 },
  ],
  28: [
    { juz: 28, surahId: 58, ayahStart: 1, ayahEnd: 22, ayahCount: 22 },
    { juz: 28, surahId: 59, ayahStart: 1, ayahEnd: 24, ayahCount: 24 },
    { juz: 28, surahId: 60, ayahStart: 1, ayahEnd: 13, ayahCount: 13 },
    { juz: 28, surahId: 61, ayahStart: 1, ayahEnd: 14, ayahCount: 14 },
    { juz: 28, surahId: 62, ayahStart: 1, ayahEnd: 11, ayahCount: 11 },
    { juz: 28, surahId: 63, ayahStart: 1, ayahEnd: 11, ayahCount: 11 },
    { juz: 28, surahId: 64, ayahStart: 1, ayahEnd: 18, ayahCount: 18 },
    { juz: 28, surahId: 65, ayahStart: 1, ayahEnd: 12, ayahCount: 12 },
    { juz: 28, surahId: 66, ayahStart: 1, ayahEnd: 12, ayahCount: 12 },
  ],
  29: [
    { juz: 29, surahId: 67, ayahStart: 1, ayahEnd: 30, ayahCount: 30 },
    { juz: 29, surahId: 68, ayahStart: 1, ayahEnd: 52, ayahCount: 52 },
    { juz: 29, surahId: 69, ayahStart: 1, ayahEnd: 52, ayahCount: 52 },
    { juz: 29, surahId: 70, ayahStart: 1, ayahEnd: 44, ayahCount: 44 },
    { juz: 29, surahId: 71, ayahStart: 1, ayahEnd: 28, ayahCount: 28 },
    { juz: 29, surahId: 72, ayahStart: 1, ayahEnd: 28, ayahCount: 28 },
    { juz: 29, surahId: 73, ayahStart: 1, ayahEnd: 20, ayahCount: 20 },
    { juz: 29, surahId: 74, ayahStart: 1, ayahEnd: 56, ayahCount: 56 },
    { juz: 29, surahId: 75, ayahStart: 1, ayahEnd: 40, ayahCount: 40 },
    { juz: 29, surahId: 76, ayahStart: 1, ayahEnd: 31, ayahCount: 31 },
    { juz: 29, surahId: 77, ayahStart: 1, ayahEnd: 50, ayahCount: 50 },
  ],
  30: [
    { juz: 30, surahId: 78, ayahStart: 1, ayahEnd: 40, ayahCount: 40 },
    { juz: 30, surahId: 79, ayahStart: 1, ayahEnd: 46, ayahCount: 46 },
    { juz: 30, surahId: 80, ayahStart: 1, ayahEnd: 42, ayahCount: 42 },
    { juz: 30, surahId: 81, ayahStart: 1, ayahEnd: 29, ayahCount: 29 },
    { juz: 30, surahId: 82, ayahStart: 1, ayahEnd: 19, ayahCount: 19 },
    { juz: 30, surahId: 83, ayahStart: 1, ayahEnd: 36, ayahCount: 36 },
    { juz: 30, surahId: 84, ayahStart: 1, ayahEnd: 25, ayahCount: 25 },
    { juz: 30, surahId: 85, ayahStart: 1, ayahEnd: 22, ayahCount: 22 },
    { juz: 30, surahId: 86, ayahStart: 1, ayahEnd: 17, ayahCount: 17 },
    { juz: 30, surahId: 87, ayahStart: 1, ayahEnd: 19, ayahCount: 19 },
    { juz: 30, surahId: 88, ayahStart: 1, ayahEnd: 26, ayahCount: 26 },
    { juz: 30, surahId: 89, ayahStart: 1, ayahEnd: 30, ayahCount: 30 },
    { juz: 30, surahId: 90, ayahStart: 1, ayahEnd: 20, ayahCount: 20 },
    { juz: 30, surahId: 91, ayahStart: 1, ayahEnd: 15, ayahCount: 15 },
    { juz: 30, surahId: 92, ayahStart: 1, ayahEnd: 21, ayahCount: 21 },
    { juz: 30, surahId: 93, ayahStart: 1, ayahEnd: 11, ayahCount: 11 },
    { juz: 30, surahId: 94, ayahStart: 1, ayahEnd: 8, ayahCount: 8 },
    { juz: 30, surahId: 95, ayahStart: 1, ayahEnd: 8, ayahCount: 8 },
    { juz: 30, surahId: 96, ayahStart: 1, ayahEnd: 19, ayahCount: 19 },
    { juz: 30, surahId: 97, ayahStart: 1, ayahEnd: 5, ayahCount: 5 },
    { juz: 30, surahId: 98, ayahStart: 1, ayahEnd: 8, ayahCount: 8 },
    { juz: 30, surahId: 99, ayahStart: 1, ayahEnd: 8, ayahCount: 8 },
    { juz: 30, surahId: 100, ayahStart: 1, ayahEnd: 11, ayahCount: 11 },
    { juz: 30, surahId: 101, ayahStart: 1, ayahEnd: 11, ayahCount: 11 },
    { juz: 30, surahId: 102, ayahStart: 1, ayahEnd: 8, ayahCount: 8 },
    { juz: 30, surahId: 103, ayahStart: 1, ayahEnd: 3, ayahCount: 3 },
    { juz: 30, surahId: 104, ayahStart: 1, ayahEnd: 9, ayahCount: 9 },
    { juz: 30, surahId: 105, ayahStart: 1, ayahEnd: 5, ayahCount: 5 },
    { juz: 30, surahId: 106, ayahStart: 1, ayahEnd: 4, ayahCount: 4 },
    { juz: 30, surahId: 107, ayahStart: 1, ayahEnd: 7, ayahCount: 7 },
    { juz: 30, surahId: 108, ayahStart: 1, ayahEnd: 3, ayahCount: 3 },
    { juz: 30, surahId: 109, ayahStart: 1, ayahEnd: 6, ayahCount: 6 },
    { juz: 30, surahId: 110, ayahStart: 1, ayahEnd: 3, ayahCount: 3 },
    { juz: 30, surahId: 111, ayahStart: 1, ayahEnd: 5, ayahCount: 5 },
    { juz: 30, surahId: 112, ayahStart: 1, ayahEnd: 4, ayahCount: 4 },
    { juz: 30, surahId: 113, ayahStart: 1, ayahEnd: 5, ayahCount: 5 },
    { juz: 30, surahId: 114, ayahStart: 1, ayahEnd: 6, ayahCount: 6 },
  ],
};

/**
 * Mengambil daftar segmen (surah, ayat awal, ayat akhir) untuk suatu juz (1–30).
 */
export function getJuzSegments(juz: number): JuzSegment[] {
  if (juz < 1 || juz > 30) {
    throw new Error(`Nomor juz tidak valid: ${juz}. Harus antara 1 dan 30.`);
  }
  return QURAN_JUZ_SEGMENTS[juz] ?? [];
}

/**
 * Mengambil total ayat dalam suatu juz.
 */
export function getTotalAyahsInJuz(juz: number): number {
  return getJuzSegments(juz).reduce((sum, seg) => sum + seg.ayahCount, 0);
}

/**
 * Mengembalikan posisi awal suatu juz (ayat pertama dari segmen pertama).
 */
export function getJuzStartPosition(juz: number): JuzPosition {
  const segments = getJuzSegments(juz);
  if (segments.length === 0) {
    throw new Error(`Segmen untuk juz ${juz} kosong.`);
  }
  return {
    juz,
    surahId: segments[0].surahId,
    nextAyah: segments[0].ayahStart,
  };
}

/**
 * Menghitung indeks global ayat (1-based) di dalam suatu juz.
 */
export function getAyahGlobalIndexInJuz(
  juz: number,
  surahId: number,
  ayah: number
): number {
  const segments = getJuzSegments(juz);
  let globalIndex = 0;

  for (const seg of segments) {
    if (seg.surahId === surahId) {
      if (ayah < seg.ayahStart || ayah > seg.ayahEnd) {
        throw new Error(
          `Ayat ${ayah} di luar rentang segmen juz ${juz} (surah ${surahId}: ${seg.ayahStart}-${seg.ayahEnd})`
        );
      }
      globalIndex += ayah - seg.ayahStart + 1;
      return globalIndex;
    }
    globalIndex += seg.ayahCount;
  }

  throw new Error(`Surah ${surahId} tidak ditemukan di juz ${juz}`);
}

/**
 * Menghitung akumulasi baris hingga indeks ayat tertentu di dalam suatu juz.
 * Menggunakan rumus kumulatif: round((k * 300) / totalAyahsInJuz).
 * Pada k = 0 menghasilkan 0, pada k = totalAyahs menghasilkan tepat 300.
 */
export function getCumulativeLinesInJuz(
  juz: number,
  globalAyahIndex: number
): number {
  if (globalAyahIndex <= 0) return 0;
  const totalAyahs = getTotalAyahsInJuz(juz);
  if (globalAyahIndex >= totalAyahs) return 300;
  return Math.round((globalAyahIndex * 300) / totalAyahs);
}

/**
 * Mengambil potongan berikutnya (chunk) untuk setoran sabaq berdasarkan requestedLines.
 *
 * ATURAN WAJIB:
 * 1. Setiap record HANYA boleh memuat satu juz dan satu surah.
 * 2. Baris dihitung menggunakan selisih baris kumulatif:
 *    lines = cum(end) - cum(start - 1).
 *    Telescoping sum menjamin total baris per juz TEPAT 300 dan 30 juz TEPAT 9000.
 * 3. Setiap potongan dijamin memiliki lineCount bulat antara 1 dan 300.
 * 4. Jika memotong di tengah surah akan menyisakan sisa ayat dengan 0 baris,
 *    potongan diperluas untuk menghabiskan surah tersebut.
 */
export function getNextSabaqChunk(
  currentPos: JuzPosition,
  requestedLines: number
): SabaqChunk {
  const { juz, surahId, nextAyah } = currentPos;
  const segments = getJuzSegments(juz);

  // Cari segmen yang cocok dengan surahId dan rentang nextAyah
  const segIndex = segments.findIndex(
    (s) => s.surahId === surahId && nextAyah >= s.ayahStart && nextAyah <= s.ayahEnd
  );

  if (segIndex === -1) {
    throw new Error(
      `Posisi tidak valid di juz ${juz}: surah ${surahId}, ayat ${nextAyah}`
    );
  }

  const currentSegment = segments[segIndex];
  const globalStart = getAyahGlobalIndexInJuz(juz, surahId, nextAyah);
  const startCum = getCumulativeLinesInJuz(juz, globalStart - 1);
  const safeRequestedLines = Math.max(1, Math.min(300, Math.round(requestedLines)));
  const targetCum = Math.min(300, startCum + safeRequestedLines);

  const globalSegmentEnd = getAyahGlobalIndexInJuz(juz, surahId, currentSegment.ayahEnd);
  const segEndCum = getCumulativeLinesInJuz(juz, globalSegmentEnd);

  // Cari ayat akhir terbaik di dalam segmen
  let bestAyah = nextAyah;

  for (let a = nextAyah; a <= currentSegment.ayahEnd; a++) {
    const gIdx = getAyahGlobalIndexInJuz(juz, surahId, a);
    const cum = getCumulativeLinesInJuz(juz, gIdx);

    // Harus menghasilkan setidaknya 1 baris
    if (cum - startCum < 1) {
      bestAyah = a;
      continue;
    }

    if (cum <= targetCum) {
      bestAyah = a;
    } else {
      // Jika ayat pertama yang menghasilkan >= 1 baris sudah melebihi targetCum,
      // kita harus tetap mengambilnya agar lineCount >= 1
      if (bestAyah === nextAyah && cum - startCum >= 1) {
        bestAyah = a;
      }
      break;
    }
  }

  // Pengaman: Jika sisa ayat di segmen ini setelah bestAyah bernilai 0 baris,
  // serap seluruh sisa ayat segmen ini agar tidak ada chunk 0 baris di panggilan berikutnya
  if (bestAyah < currentSegment.ayahEnd) {
    const bestGlobal = getAyahGlobalIndexInJuz(juz, surahId, bestAyah);
    const bestCum = getCumulativeLinesInJuz(juz, bestGlobal);
    const remainingLinesInSegment = segEndCum - bestCum;
    if (remainingLinesInSegment < 1) {
      bestAyah = currentSegment.ayahEnd;
    }
  }

  const globalEnd = getAyahGlobalIndexInJuz(juz, surahId, bestAyah);
  const endCum = getCumulativeLinesInJuz(juz, globalEnd);
  const lineCount = endCum - startCum;

  if (lineCount < 1 || lineCount > 300) {
    throw new Error(
      `Perhitungan lineCount di luar batas: ${lineCount} (juz ${juz}, surah ${surahId}: ${nextAyah}-${bestAyah})`
    );
  }

  const isLastAyahInSegment = bestAyah >= currentSegment.ayahEnd;
  const isLastSegmentInJuz = segIndex === segments.length - 1;
  const isJuzCompleted = isLastAyahInSegment && isLastSegmentInJuz;

  let nextPosition: JuzPosition | null = null;
  if (!isJuzCompleted) {
    if (isLastAyahInSegment) {
      const nextSeg = segments[segIndex + 1];
      nextPosition = {
        juz,
        surahId: nextSeg.surahId,
        nextAyah: nextSeg.ayahStart,
      };
    } else {
      nextPosition = {
        juz,
        surahId,
        nextAyah: bestAyah + 1,
      };
    }
  }

  return {
    juz,
    surahId,
    ayahStart: nextAyah,
    ayahEnd: bestAyah,
    lineCount,
    nextPosition,
    isJuzCompleted,
  };
}
