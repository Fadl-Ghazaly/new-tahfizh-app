import { LaporanFilterParams, LaporanTab } from '../laporan/types';

export function parseLaporanParams(
  rawParams: Record<string, string | string[] | undefined>,
  userRole: 'ADMIN' | 'USTADZ',
  userTeacherId: string | null = null
): LaporanFilterParams {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Tab
  const rawTab = typeof rawParams.tab === 'string' ? rawParams.tab : 'rekap-bulanan';
  const tab: LaporanTab = ['rekap-bulanan', 'mutabaah-santri', 'kinerja-halaqah'].includes(rawTab)
    ? (rawTab as LaporanTab)
    : 'rekap-bulanan';

  // 2. Month
  const rawMonth = typeof rawParams.month === 'string' ? parseInt(rawParams.month, 10) : currentMonth;
  const month = !isNaN(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : currentMonth;

  // 3. Year
  const rawYear = typeof rawParams.year === 'string' ? parseInt(rawParams.year, 10) : currentYear;
  const year = !isNaN(rawYear) && rawYear >= 2024 && rawYear <= 2035 ? rawYear : currentYear;

  // 4. Class level (support both 'classLevel' and legacy 'class')
  const rawClass = typeof rawParams.classLevel === 'string'
    ? rawParams.classLevel
    : typeof rawParams.class === 'string'
      ? rawParams.class
      : 'all';
  let classLevel: number | 'all' = 'all';
  if (rawClass !== 'all') {
    const parsedLevel = parseInt(rawClass, 10);
    if (!isNaN(parsedLevel) && parsedLevel >= 7 && parsedLevel <= 12) {
      classLevel = parsedLevel;
    }
  }

  // 5. Ustadz filter (support both 'ustadzId' and legacy 'ustadz')
  let ustadzId: string | 'all' = 'all';
  if (userRole === 'USTADZ') {
    ustadzId = userTeacherId || 'all';
  } else {
    const rawUstadz = typeof rawParams.ustadzId === 'string'
      ? rawParams.ustadzId
      : typeof rawParams.ustadz === 'string'
        ? rawParams.ustadz
        : 'all';
    if (rawUstadz.trim() !== '') {
      ustadzId = rawUstadz === 'all' ? 'all' : rawUstadz.trim();
    }
  }

  // 6. Student ID
  const studentId = typeof rawParams.studentId === 'string' && rawParams.studentId.trim() !== ''
    ? rawParams.studentId.trim()
    : null;

  return {
    tab,
    month,
    year,
    classLevel,
    ustadzId,
    studentId,
  };
}

