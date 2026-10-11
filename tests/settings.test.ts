import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeTheme, getPublicSchoolSettings } from '../lib/settings';

vi.mock('server-only', () => ({}));

// Mock next/cache
vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

// Mock @supabase/supabase-js
const mockRpc = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}));

describe('Settings & Theme Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
  });

  it('normalizeTheme menerima nilai theme-1 sampai theme-6', () => {
    expect(normalizeTheme('theme-1')).toBe('theme-1');
    expect(normalizeTheme('theme-2')).toBe('theme-2');
    expect(normalizeTheme('theme-3')).toBe('theme-3');
    expect(normalizeTheme('theme-4')).toBe('theme-4');
    expect(normalizeTheme('theme-5')).toBe('theme-5');
    expect(normalizeTheme('theme-6')).toBe('theme-6');
  });

  it('normalizeTheme mengembalikan theme-1 untuk nilai invalid, null, undefined, atau asing', () => {
    expect(normalizeTheme('theme-7')).toBe('theme-1');
    expect(normalizeTheme('invalid')).toBe('theme-1');
    expect(normalizeTheme(null)).toBe('theme-1');
    expect(normalizeTheme(undefined)).toBe('theme-1');
    expect(normalizeTheme(123)).toBe('theme-1');
  });

  it('RPC sukses mengembalikan nama, logo, dan tema yang ternormalisasi', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ school_name: 'Ma\'had Al-Qur\'an', logo_url: 'https://logo.png', theme: 'theme-4' }],
      error: null,
    });

    const settings = await getPublicSchoolSettings();
    expect(settings).toEqual({
      school_name: 'Ma\'had Al-Qur\'an',
      logo_url: 'https://logo.png',
      theme: 'theme-4',
    });
  });

  it('RPC sukses dengan tema asing mengembalikan tema ternormalisasi ke theme-1', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ school_name: 'Pesantren X', logo_url: null, theme: 'custom-dark' }],
      error: null,
    });

    const settings = await getPublicSchoolSettings();
    expect(settings).toEqual({
      school_name: 'Pesantren X',
      logo_url: null,
      theme: 'theme-1',
    });
  });

  it('RPC gagal mengembalikan nilai default (Pesantren Darul Ilmi, theme-1) TANPA melempar error', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection error' },
    });

    const settings = await getPublicSchoolSettings();
    expect(settings).toEqual({
      school_name: 'Pesantren Darul Ilmi',
      logo_url: null,
      theme: 'theme-1',
    });
  });

  it('RPC mengembalikan data kosong mengembalikan nilai default', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const settings = await getPublicSchoolSettings();
    expect(settings).toEqual({
      school_name: 'Pesantren Darul Ilmi',
      logo_url: null,
      theme: 'theme-1',
    });
  });
});
