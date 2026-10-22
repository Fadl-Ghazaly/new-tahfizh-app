export interface ValidatedListParams {
  search: string;
  classLevel: number | 'all';
  showInactive: boolean;
  page: number;
  limit: number;
}

export function parseListParams(rawParams: Record<string, string | string[] | undefined>): ValidatedListParams {
  // search: Unicode letters, numbers, spaces, apostrophes, hyphens, max 50 chars
  const rawSearch = typeof rawParams.search === 'string' ? rawParams.search : '';
  const cleanedSearch = rawSearch
    .replace(/[^\p{L}\p{N}\s'\-]/gu, '')
    .trim()
    .slice(0, 50);

  // class: level 7-12 or 'all'
  const rawClass = typeof rawParams.class === 'string' ? rawParams.class : 'all';
  let classLevel: number | 'all' = 'all';
  if (rawClass !== 'all') {
    const parsedLevel = parseInt(rawClass, 10);
    if (!isNaN(parsedLevel) && parsedLevel >= 7 && parsedLevel <= 12) {
      classLevel = parsedLevel;
    }
  }

  // inactive: boolean
  const showInactive = rawParams.inactive === 'true';

  // page: integer >= 1
  const rawPage = typeof rawParams.page === 'string' ? parseInt(rawParams.page, 10) : 1;
  const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

  // limit: fixed 20
  const limit = 20;

  return {
    search: cleanedSearch,
    classLevel,
    showInactive,
    page,
    limit,
  };
}

export function mapDbError(error: { code?: string; message?: string } | null, context: 'santri' | 'ustadz' = 'santri'): string {
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
  return 'Terjadi kesalahan. Coba lagi.';
}
