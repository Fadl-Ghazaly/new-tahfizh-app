/**
 * Utilitas dan konstanta perhitungan capaian tahfizh Al-Qur'an
 * Pesantren Darul Ilmi.
 *
 * Aturan domain:
 * - 15 baris = 1 halaman
 * - 20 halaman = 1 juz
 * - 1 juz = 300 baris
 * - 30 juz = 600 halaman = 9.000 baris
 * - Nilai kelancaran: 100 dikurangi 5 per kesalahan (min 0)
 */

export const BARIS_PER_HALAMAN = 15;
export const HALAMAN_PER_JUZ = 20;
export const BARIS_PER_JUZ = 300;
export const TOTAL_BARIS_30_JUZ = 9000;

export interface JuzHalamanCapaian {
  juz: number;
  halaman: number;
  barisSisa: number;
}

/**
 * Mengonversi jumlah baris menjadi jumlah halaman penuh (dibulatkan ke bawah).
 */
export function barisKeHalaman(totalBaris: number): number {
  if (totalBaris <= 0) return 0;
  return Math.floor(totalBaris / BARIS_PER_HALAMAN);
}

/**
 * Mengonversi jumlah baris menjadi rincian juz, halaman di dalam juz berjalan,
 * dan sisa baris yang belum membentuk 1 halaman penuh.
 */
export function barisKeJuzHalaman(totalBaris: number): JuzHalamanCapaian {
  if (totalBaris <= 0) {
    return { juz: 0, halaman: 0, barisSisa: 0 };
  }

  const juz = Math.floor(totalBaris / BARIS_PER_JUZ);
  const sisaSetelahJuz = totalBaris % BARIS_PER_JUZ;
  const halaman = Math.floor(sisaSetelahJuz / BARIS_PER_HALAMAN);
  const barisSisa = sisaSetelahJuz % BARIS_PER_HALAMAN;

  return { juz, halaman, barisSisa };
}

/**
 * Memformat total baris hafalan menjadi teks standar capaian "X juz, Y halaman".
 *
 * Contoh:
 * - 330 baris (22 halaman) -> "1 juz, 2 halaman"
 * - 225 baris (15 halaman) -> "0 juz, 15 halaman"
 * - 0 baris                -> "0 juz, 0 halaman"
 * - 9000 baris             -> "30 juz, 0 halaman"
 */
export function formatCapaian(totalBaris: number): string {
  const { juz, halaman } = barisKeJuzHalaman(totalBaris);
  return `${juz} juz, ${halaman} halaman`;
}

/**
 * Menghitung persentase progres capaian hafalan dari target 30 juz (9.000 baris).
 * Nilai dibatasi maksimal 100%.
 */
export function persenProgress(totalBaris: number): number {
  if (totalBaris <= 0) return 0;
  const raw = (totalBaris / TOTAL_BARIS_30_JUZ) * 100;
  return Math.min(Math.round(raw * 100) / 100, 100);
}

/**
 * Menghitung nilai kelancaran (fluency score) hafalan.
 * Nilai awal = 100, setiap kesalahan bernilai -5, nilai minimum = 0.
 */
export function hitungNilai(jumlahKesalahan: number): number {
  if (jumlahKesalahan <= 0) return 100;
  return Math.max(100 - 5 * Math.floor(jumlahKesalahan), 0);
}
