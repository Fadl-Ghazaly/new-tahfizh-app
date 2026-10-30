export interface ValidatedListParams {
  search: string;
  classLevel: number | 'all';
  showInactive: boolean;
  page: number;
  limit: number;
}

export function parseListParams(rawParams: Record<string, string | string[] | undefined>): ValidatedListParams {
  const rawSearch = typeof rawParams.search === 'string' ? rawParams.search : '';
  const cleanedSearch = rawSearch
    .replace(/[^\p{L}\p{N}\s'\-]/gu, '')
    .trim()
    .slice(0, 50);

  const rawClass = typeof rawParams.class === 'string' ? rawParams.class : 'all';
  let classLevel: number | 'all' = 'all';
  if (rawClass !== 'all') {
    const parsedLevel = parseInt(rawClass, 10);
    if (!isNaN(parsedLevel) && parsedLevel >= 7 && parsedLevel <= 12) {
      classLevel = parsedLevel;
    }
  }

  const showInactive = rawParams.inactive === 'true';
  const rawPage = typeof rawParams.page === 'string' ? parseInt(rawParams.page, 10) : 1;
  const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;
  const limit = 20;

  return {
    search: cleanedSearch,
    classLevel,
    showInactive,
    page,
    limit,
  };
}

export function mapDbError(error: { code?: string; message?: string } | null, context: 'santri' | 'ustadz' | 'setoran' = 'santri'): string {
  if (!error) return 'Terjadi kesalahan. Coba lagi.';
  if (error.code === '23505') {
    return context === 'santri' ? 'NISN sudah terdaftar.' : 'Data duplikat terdeteksi.';
  }
  if (error.code === '23503') {
    return 'Data masih dipakai.';
  }
  if (error.code === '23514') {
    return 'Data tidak valid.';
  }
  if (error.code === 'TH000') return 'Sesi tidak valid.';
  if (error.code === 'TH001') return 'Tidak dapat menambah setoran untuk tanggal di masa depan.';
  if (error.code === 'TH002') return 'Jumlah baris tidak valid.';
  if (error.code === 'TH003') return 'Ayat tidak valid (melebihi jumlah ayat surat).';
  if (error.code === 'TH004') return 'Tidak dapat mengubah kehadiran karena masih ada setoran aktif.';
  if (error.code === 'TH005') return 'Setoran tidak ditemukan atau sudah dibatalkan.';
  if (error.code === 'TH006') return 'Rentang ayat ini sudah pernah disetor sebagai sabaq. Batalkan setoran lama bila perlu mengoreksi.';
  if (error.code === 'TH007') return 'Santri tidak ditemukan atau tidak aktif.';
  if (error.code === '42501') return 'Anda tidak memiliki akses ke data santri ini.';
  return 'Terjadi kesalahan. Coba lagi.';
}
