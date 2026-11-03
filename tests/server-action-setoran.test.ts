import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitSetoran, voidSetoran } from '../app/(app)/setoran/actions';
import * as requireUserModule from '../lib/auth/require-user';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase
const mockRpc = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

describe('Server Actions Setoran', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitSetoran', () => {
    it('menolak bila user tidak aktif', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: 'u1',
        role: 'ADMIN',
        isActive: false,
        teacherId: null,
      });

      const res = await submitSetoran({
        studentId: 's1',
        date: new Date().toISOString().slice(0, 10),
        formData: { attendance: 'IZIN' },
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe('Akun Anda tidak aktif.');
    });

    it('menolak tanggal di luar batas waktu dengan pesan TH001', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: 'u1',
        role: 'USTADZ',
        isActive: true,
        teacherId: 't1',
      });

      // 5 days ago is invalid for USTADZ
      const res = await submitSetoran({
        studentId: 's1',
        date: '2020-01-01',
        formData: { attendance: 'IZIN' },
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Tidak dapat menambah setoran untuk tanggal di masa depan.');
    });

    it('USTADZ untuk santri di luar halaqahnya ditolak 42501 tanpa memanggil rpc', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: 'u1',
        role: 'USTADZ',
        isActive: true,
        teacherId: 't1',
      });

      mockSingle.mockResolvedValueOnce({
        data: { id: 's1', halaqahs: { teacher_id: 't2' } }, // different teacher!
        error: null,
      });

      const res = await submitSetoran({
        studentId: 's1',
        date: new Date().toISOString().slice(0, 10),
        formData: { attendance: 'IZIN' },
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe('Anda tidak memiliki akses ke data santri ini.');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('menangkap TH002 dari resolveLineCount dan memetakannya dengan aman', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: 'u1',
        role: 'ADMIN',
        isActive: true,
        teacherId: null,
      });

      // Override line_count without notes
      const res = await submitSetoran({
        studentId: 's1',
        date: new Date().toISOString().slice(0, 10),
        formData: {
          attendance: 'HADIR',
          type: 'SABAQ',
          juz: 1,
          surah_id: 1,
          ayah_start: 1,
          ayah_end: 7,
          line_count: 50, // requested differs from computed (5)
          notes: '',      // notes empty -> throws TH002
        },
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe('Jumlah baris tidak valid.');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('ADMIN HADIR berhasil memanggil rpc dengan parameter yang tepat', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: 'u1',
        role: 'ADMIN',
        isActive: true,
        teacherId: null,
      });

      mockRpc.mockResolvedValueOnce({ error: null });

      const res = await submitSetoran({
        studentId: 's1',
        date: new Date().toISOString().slice(0, 10),
        formData: {
          attendance: 'HADIR',
          type: 'SABAQ',
          juz: 1,
          surah_id: 1,
          ayah_start: 1,
          ayah_end: 7,
          line_count: 5,
          mistake_count: 2,
          notes: 'Al-Fatihah lancar',
        },
      });

      expect(res.ok).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('submit_setoran', expect.objectContaining({
        p_student_id: 's1',
        p_attendance: 'HADIR',
        p_type: 'SABAQ',
        p_juz: 1,
        p_surah_id: 1,
        p_ayah_start: 1,
        p_ayah_end: 7,
        p_line_count: 5,
        p_mistake_count: 2,
        p_notes: 'Al-Fatihah lancar',
      }));
    });
  });

  describe('voidSetoran', () => {
    it('menolak alasan yang terlalu pendek tanpa memanggil rpc', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: 'u1',
        role: 'ADMIN',
        isActive: true,
        teacherId: null,
      });

      const res = await voidSetoran('rec1', 'ab');
      expect(res.ok).toBe(false);
      expect(res.error).toContain('Alasan pembatalan harus antara 3 dan 200 karakter');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('memetakan galat rpc TH005 dengan benar', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: 'u1',
        role: 'ADMIN',
        isActive: true,
        teacherId: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { date: new Date().toISOString().slice(0, 10), status: 'ACTIVE' },
        error: null,
      });

      mockRpc.mockResolvedValueOnce({ error: { code: 'TH005', message: 'raw db message' } });

      const res = await voidSetoran('rec1', 'Salah input ayat');
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Setoran tidak ditemukan atau sudah dibatalkan.');
      expect(res.error).not.toContain('raw db message');
    });
  });
});
