import { isDateAllowed } from '@/lib/setoran/rules';
import { format, isValid, parseISO } from 'date-fns';

export interface ValidatedSetoranParams {
  date: string;
  type: 'SABAQ' | 'SABQI' | 'MANZIL';
  classLevel: number | 'all';
  ustadzId: string | 'all';
  search: string;
  page: number;
}

export function parseSetoranParams(
  rawParams: Record<string, string | string[] | undefined>,
  role: 'ADMIN' | 'USTADZ',
  todayIso: string
): ValidatedSetoranParams {
  // 1. Date
  const rawDate = typeof rawParams.date === 'string' ? rawParams.date : todayIso;
  let validatedDate = todayIso;
  const parsedDate = parseISO(rawDate);
  if (isValid(parsedDate)) {
    const formatted = format(parsedDate, 'yyyy-MM-dd');
    if (isDateAllowed(role, formatted, todayIso)) {
      validatedDate = formatted;
    }
  }

  // 2. Type
  const rawType = typeof rawParams.type === 'string' ? rawParams.type.toUpperCase() : 'SABAQ';
  const type = ['SABAQ', 'SABQI', 'MANZIL'].includes(rawType) ? (rawType as 'SABAQ' | 'SABQI' | 'MANZIL') : 'SABAQ';

  // 3. Class level
  const rawClass = typeof rawParams.class === 'string' ? rawParams.class : 'all';
  let classLevel: number | 'all' = 'all';
  if (rawClass !== 'all') {
    const parsed = parseInt(rawClass, 10);
    if (!isNaN(parsed) && parsed >= 7 && parsed >= 7 && parsed <= 12) {
      classLevel = parsed;
    }
  }

  // 4. Ustadz
  const rawUstadz = typeof rawParams.ustadz === 'string' ? rawParams.ustadz : 'all';
  const ustadzId = rawUstadz;

  // 5. Search
  const rawSearch = typeof rawParams.q === 'string' ? rawParams.q : '';
  const search = rawSearch.replace(/[^\p{L}\p{N}\s'\-]/gu, '').trim().slice(0, 50);

  // 6. Page
  const rawPage = typeof rawParams.page === 'string' ? parseInt(rawParams.page, 10) : 1;
  const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

  return {
    date: validatedDate,
    type,
    classLevel,
    ustadzId,
    search,
    page,
  };
}
