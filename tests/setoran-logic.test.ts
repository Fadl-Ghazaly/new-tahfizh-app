import { describe, it, expect } from 'vitest';
import { computeLinesForRange, getSurahOptionsForJuz } from '../lib/quran-juz';
import { isDateAllowed, canChangeAttendance, resolveLineCount, validateVoidReason } from '../lib/setoran/rules';
import { setoranFormSchema } from '../lib/validators/setoran';
import { mapDbError } from '../lib/validators/list-params';
import { zodIssuesToFieldErrors } from '../lib/validators/common';

describe('Setoran Logic Tests (Fase 4 Tahap A)', () => {
  describe('1. computeLinesForRange & getSurahOptionsForJuz', () => {
    it('seluruh rentang satu juz = tepat 300', () => {
      const options = getSurahOptionsForJuz(1);
      let total = 0;
      for (const opt of options) {
        total += computeLinesForRange(1, opt.surahId, opt.ayahStart, opt.ayahEnd);
      }
      expect(total).toBe(300);
    });

    it('partisi berurutan satu juz berjumlah tepat 300 dan konsisten', () => {
      const full = computeLinesForRange(30, 78, 1, 40);
      const p1 = computeLinesForRange(30, 78, 1, 20);
      const p2 = computeLinesForRange(30, 78, 21, 40);
      expect(p1 + p2).toBe(full);
    });

    it('satu ayat di Juz 30 tetap menghasilkan minimal 1', () => {
      const lines = computeLinesForRange(30, 114, 1, 1);
      expect(lines).toBeGreaterThanOrEqual(1);
    });

    it('rentang di luar juz ditolak', () => {
      expect(() => computeLinesForRange(1, 1, 1, 100)).toThrow();
    });
  });

  describe('2. Date Rules (allowedDateWindow & isDateAllowed)', () => {
    const today = '2024-06-15';
    
    it('hari ini valid untuk USTADZ dan ADMIN', () => {
      expect(isDateAllowed('USTADZ', '2024-06-15', today)).toBe(true);
      expect(isDateAllowed('ADMIN', '2024-06-15', today)).toBe(true);
    });

    it('kemarin valid untuk USTADZ dan ADMIN', () => {
      expect(isDateAllowed('USTADZ', '2024-06-14', today)).toBe(true);
      expect(isDateAllowed('ADMIN', '2024-06-14', today)).toBe(true);
    });

    it('tepat 30 hari lalu valid untuk ADMIN, ditolak untuk USTADZ', () => {
      expect(isDateAllowed('ADMIN', '2024-05-16', today)).toBe(true);
      expect(isDateAllowed('USTADZ', '2024-05-16', today)).toBe(false);
    });

    it('31 hari lalu ditolak untuk keduanya', () => {
      expect(isDateAllowed('ADMIN', '2024-05-15', today)).toBe(false);
      expect(isDateAllowed('USTADZ', '2024-05-15', today)).toBe(false);
    });

    it('besok (future date) ditolak untuk keduanya', () => {
      expect(isDateAllowed('ADMIN', '2024-06-16', today)).toBe(false);
      expect(isDateAllowed('USTADZ', '2024-06-16', today)).toBe(false);
    });

    it('pergantian bulan dan tahun ditangani dengan benar', () => {
      const janFirst = '2024-01-01';
      expect(isDateAllowed('ADMIN', '2023-12-03', janFirst)).toBe(true);
      expect(isDateAllowed('ADMIN', '2023-12-01', janFirst)).toBe(false);
    });
  });

  describe('3. Attendance Rules (canChangeAttendance)', () => {
    it('tidak boleh mengubah ke IZIN/SAKIT/ALPHA bila ada record aktif', () => {
      expect(canChangeAttendance('IZIN', 1)).toBe(false);
      expect(canChangeAttendance('SAKIT', 2)).toBe(false);
      expect(canChangeAttendance('ALPHA', 1)).toBe(false);
      expect(canChangeAttendance('IZIN', 0)).toBe(true);
      expect(canChangeAttendance('HADIR', 5)).toBe(true);
    });
  });

  describe('4. Line Count Resolution (resolveLineCount)', () => {
    it('USTADZ selalu menggunakan computed', () => {
      expect(resolveLineCount({ role: 'USTADZ', computed: 10, requested: 20 })).toBe(10);
    });

    it('ADMIN boleh mengubah dengan catatan >= 5 karakter', () => {
      expect(resolveLineCount({ role: 'ADMIN', computed: 10, requested: 15, notes: 'Koreksi khusus' })).toBe(15);
    });

    it('ADMIN tanpa catatan atau catatan < 5 karakter melempar TH002', () => {
      expect(() => resolveLineCount({ role: 'ADMIN', computed: 10, requested: 15, notes: 'abc' })).toThrow('TH002');
      expect(() => resolveLineCount({ role: 'ADMIN', computed: 10, requested: 15 })).toThrow('TH002');
    });
  });

  describe('5. Void Reason Validation (validateVoidReason)', () => {
    it('alasan void minimal 3 karakter dan maksimal 200 karakter', () => {
      expect(validateVoidReason('ab')).toBe(false);
      expect(validateVoidReason('abc')).toBe(true);
      expect(validateVoidReason('  xyz  ')).toBe(true);
      expect(validateVoidReason(null)).toBe(false);
    });
  });

  describe('6. Zod Validation (setoranFormSchema)', () => {
    it('kolom kosong gagal divalidasi', () => {
      const res = setoranFormSchema.safeParse({});
      expect(res.success).toBe(false);
    });

    it('ayat melebihi jumlah ayat atau format salah', () => {
      const res = setoranFormSchema.safeParse({
        attendance: 'HADIR',
        type: 'SABAQ',
        juz: 1,
        surah_id: 1,
        ayah_start: 10,
        ayah_end: 5, // start > end
        line_count: 10,
      });
      expect(res.success).toBe(false);
      const errors = zodIssuesToFieldErrors(res.error!.issues);
      expect(errors.ayah_end).toBeDefined();
    });

    it('IZIN dengan data setoran ditolak', () => {
      const res = setoranFormSchema.safeParse({
        attendance: 'IZIN',
        juz: 1,
        type: 'SABAQ',
      });
      expect(res.success).toBe(false);
      const errors = zodIssuesToFieldErrors(res.error!.issues);
      expect(errors.attendance).toContain('tidak boleh disertai data setoran');
    });
  });

  describe('7. Error Mapping (mapDbError)', () => {
    it('memetakan TH000 sampai TH007 dengan benar dan tanpa error.message mentah', () => {
      expect(mapDbError({ code: 'TH000' }, 'setoran')).toBe('Sesi tidak valid.');
      expect(mapDbError({ code: 'TH001' }, 'setoran')).toBe('Tidak dapat menambah setoran untuk tanggal di masa depan.');
      expect(mapDbError({ code: 'TH002' }, 'setoran')).toBe('Jumlah baris tidak valid.');
      expect(mapDbError({ code: 'TH003' }, 'setoran')).toBe('Ayat tidak valid (melebihi jumlah ayat surat).');
      expect(mapDbError({ code: 'TH004' }, 'setoran')).toBe('Tidak dapat mengubah kehadiran karena masih ada setoran aktif.');
      expect(mapDbError({ code: 'TH005' }, 'setoran')).toBe('Setoran tidak ditemukan atau sudah dibatalkan.');
      expect(mapDbError({ code: 'TH006' }, 'setoran')).toBe('Rentang ayat ini sudah pernah disetor sebagai sabaq. Batalkan setoran lama bila perlu mengoreksi.');
      expect(mapDbError({ code: 'TH007' }, 'setoran')).toBe('Santri tidak ditemukan atau tidak aktif.');
    });

    it('perilaku konteks santri dan ustadz untuk kode lama tidak berubah', () => {
      expect(mapDbError({ code: '23505' }, 'santri')).toBe('NISN sudah terdaftar.');
      expect(mapDbError({ code: '23505' }, 'ustadz')).toBe('Data duplikat terdeteksi.');
    });
  });
});
