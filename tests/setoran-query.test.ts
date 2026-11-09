import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/server
vi.mock('next/server', () => ({
  connection: vi.fn(),
}));

import { SetoranContent } from '@/app/(app)/setoran/setoran-content';

// Spies for student query builder
const studentInSpy = vi.fn();
const studentEqSpy = vi.fn();
const studentIlikeSpy = vi.fn();
const studentOrderSpy = vi.fn();
const studentRangeSpy = vi.fn();

let currentRole: 'ADMIN' | 'USTADZ' = 'ADMIN';

// Build student query builder chain
function createStudentQueryChain() {
  const chain: Record<string, unknown> = {
    eq: vi.fn((col: string, val: unknown) => {
      studentEqSpy(col, val);
      return chain;
    }),
    in: vi.fn((col: string, val: unknown) => {
      studentInSpy(col, val);
      return chain;
    }),
    ilike: vi.fn((col: string, val: unknown) => {
      studentIlikeSpy(col, val);
      return chain;
    }),
    order: vi.fn(() => {
      studentOrderSpy();
      return chain;
    }),
    range: vi.fn(() => {
      studentRangeSpy();
      return Promise.resolve({ data: [], count: 0 });
    }),
  };
  return chain;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: currentRole, is_active: true },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === 'teachers') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string) => {
              if (col === 'profile_id') {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'teacher-ustadz-1', is_active: true },
                    error: null,
                  }),
                };
              }
              // For ADMIN list
              return {
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 'teacher-danis', name: 'Daniswara Perdana' }],
                  error: null,
                }),
              };
            }),
          })),
        };
      }

      if (table === 'classes') {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'class-7-id', name: 'Kelas 7', level: 7 },
                { id: 'class-12-id', name: 'Kelas 12', level: 12 },
              ],
              error: null,
            }),
          })),
        };
      }

      if (table === 'quran_surahs') {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 1, number: 1, name_latin: 'Al-Fatihah' },
                { id: 2, number: 2, name_latin: 'Al-Baqarah' },
              ],
              error: null,
            }),
          })),
        };
      }

      if (table === 'halaqahs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: string) => ({
              eq: vi.fn(() => {
                if (col === 'teacher_id' && val === 'teacher-danis') {
                  return Promise.resolve({
                    data: [{ id: 'halaqah-danis-1' }, { id: 'halaqah-danis-2' }],
                    error: null,
                  });
                }
                if (col === 'teacher_id' && val === 'teacher-ustadz-1') {
                  return Promise.resolve({
                    data: [{ id: 'halaqah-ustadz-1' }],
                    error: null,
                  });
                }
                return Promise.resolve({ data: [], error: null });
              }),
            })),
          })),
        };
      }

      if (table === 'students') {
        return {
          select: vi.fn(() => createStudentQueryChain()),
        };
      }

      if (table === 'attendance') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === 'memorization_records') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          })),
        };
      }

      return {
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    }),
  })),
}));

describe('SetoranContent Query Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentRole = 'ADMIN';
  });

  it('menerapkan filter kelas pada students.class_id, BUKAN pada relasi tersemat classes.level', async () => {
    await SetoranContent({
      searchParams: Promise.resolve({ class: '12' }),
    });

    // Harus memanggil in('class_id', ['class-12-id'])
    expect(studentInSpy).toHaveBeenCalledWith('class_id', ['class-12-id']);

    // JANGAN PERNAH memanggil eq('classes.level', ...)
    expect(studentEqSpy).not.toHaveBeenCalledWith('classes.level', expect.anything());
  });

  it('menerapkan filter ustadz pada students.halaqah_id, BUKAN pada relasi tersemat halaqahs.teacher_id', async () => {
    await SetoranContent({
      searchParams: Promise.resolve({ ustadz: 'teacher-danis' }),
    });

    // Harus memanggil in('halaqah_id', ['halaqah-danis-1', 'halaqah-danis-2'])
    expect(studentInSpy).toHaveBeenCalledWith('halaqah_id', ['halaqah-danis-1', 'halaqah-danis-2']);

    // JANGAN PERNAH memanggil eq('halaqahs.teacher_id', ...)
    expect(studentEqSpy).not.toHaveBeenCalledWith('halaqahs.teacher_id', expect.anything());
  });

  it('mengunci role USTADZ selalu pada halaqah_id miliknya meskipun tanpa parameter ustadz', async () => {
    currentRole = 'USTADZ';

    await SetoranContent({
      searchParams: Promise.resolve({}),
    });

    // Otomatis terkunci pada halaqah milik teacher-ustadz-1
    expect(studentInSpy).toHaveBeenCalledWith('halaqah_id', ['halaqah-ustadz-1']);
    expect(studentEqSpy).not.toHaveBeenCalledWith('halaqahs.teacher_id', expect.anything());
  });

  it('menggabungkan filter kelas dan filter ustadz secara bersamaan pada kolom students', async () => {
    await SetoranContent({
      searchParams: Promise.resolve({ class: '12', ustadz: 'teacher-danis' }),
    });

    expect(studentInSpy).toHaveBeenCalledWith('class_id', ['class-12-id']);
    expect(studentInSpy).toHaveBeenCalledWith('halaqah_id', ['halaqah-danis-1', 'halaqah-danis-2']);
    expect(studentEqSpy).not.toHaveBeenCalledWith('classes.level', expect.anything());
    expect(studentEqSpy).not.toHaveBeenCalledWith('halaqahs.teacher_id', expect.anything());
  });
});
