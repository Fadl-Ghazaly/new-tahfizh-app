import { describe, it, expect } from 'vitest';
import {
  getInitialDialogState,
  handleJuzChangeState,
  isAyahRangeValid,
  formatSetoranDateIndonesian,
  calculateStudentRowSummary,
} from '@/lib/setoran/dialog-state';
import { MemorizationRecordRow } from '@/app/(app)/setoran/riwayat-dialog';

describe('Setoran Dialog State & Pure Helpers', () => {
  describe('getInitialDialogState', () => {
    it('mengembalikan state awal bersih tanpa nilai bawaan juz/surat/ayat', () => {
      const state = getInitialDialogState(null);
      expect(state.attendance).toBe('');
      expect(state.juz).toBe('');
      expect(state.surahId).toBe('');
      expect(state.ayahStart).toBe('');
      expect(state.ayahEnd).toBe('');
      expect(state.lineCount).toBe('');
      expect(state.manualOverride).toBe(false);
      expect(state.mistakeCount).toBe(0);
      expect(state.notes).toBe('');
    });

    it('mengisi attendance jika santri sudah memiliki riwayat absensi', () => {
      const state = getInitialDialogState('HADIR');
      expect(state.attendance).toBe('HADIR');
      expect(state.juz).toBe('');
      expect(state.surahId).toBe('');
    });
  });

  describe('handleJuzChangeState', () => {
    it('mengosongkan surat, rentang ayat, dan jumlah baris saat juz diubah', () => {
      const prevState = {
        attendance: 'HADIR',
        juz: '1',
        surahId: '1',
        ayahStart: '1',
        ayahEnd: '7',
        manualOverride: true,
        lineCount: '15',
        mistakeCount: 2,
        notes: 'Catatan sebelumnya',
      };

      const newState = handleJuzChangeState(prevState, '2');
      expect(newState.juz).toBe('2');
      expect(newState.surahId).toBe('');
      expect(newState.ayahStart).toBe('');
      expect(newState.ayahEnd).toBe('');
      expect(newState.lineCount).toBe('');
      expect(newState.manualOverride).toBe(false);
      // Data lain seperti kehadiran dan catatan tetap terjaga
      expect(newState.attendance).toBe('HADIR');
      expect(newState.mistakeCount).toBe(2);
      expect(newState.notes).toBe('Catatan sebelumnya');
    });
  });

  describe('isAyahRangeValid', () => {
    it('valid untuk rentang ayat yang benar dalam segmen juz', () => {
      // Juz 1, Surah 1 (Al-Fatihah 1-7)
      expect(isAyahRangeValid(1, 1, 1, 7)).toBe(true);
      expect(isAyahRangeValid(1, 1, 1, 5)).toBe(true);

      // Juz 30, An-Nas (Surah 114: 1-6)
      expect(isAyahRangeValid(30, 114, 1, 6)).toBe(true);
    });

    it('tidak valid jika juz/surat/ayat belum diisi atau di luar segmen', () => {
      expect(isAyahRangeValid(null, null, null, null)).toBe(false);
      expect(isAyahRangeValid(1, null, 1, 7)).toBe(false);
      expect(isAyahRangeValid(1, 1, null, 7)).toBe(false);
      expect(isAyahRangeValid(1, 1, 5, 2)).toBe(false); // start > end
      expect(isAyahRangeValid(1, 1, 1, 8)).toBe(false); // Al-Fatihah hanya 7 ayat
      expect(isAyahRangeValid(1, 114, 1, 6)).toBe(false); // Surah 114 ada di juz 30, bukan juz 1
    });
  });

  describe('formatSetoranDateIndonesian', () => {
    it('memformat tanggal ISO menjadi format Indonesia panjang dengan zona Asia/Jakarta', () => {
      expect(formatSetoranDateIndonesian('2026-11-04')).toBe('4 November 2026');
      expect(formatSetoranDateIndonesian('2026-01-15')).toBe('15 Januari 2026');
    });

    it('menangani string tidak valid secara anggun', () => {
      expect(formatSetoranDateIndonesian('')).toBe('');
      expect(formatSetoranDateIndonesian('invalid')).toBe('invalid');
    });
  });

  describe('calculateStudentRowSummary', () => {
    const sampleRecords: MemorizationRecordRow[] = [
      {
        id: 'r1',
        type: 'SABAQ',
        juz: 1,
        surah_id: 1,
        ayah_start: 1,
        ayah_end: 7,
        line_count: 5,
        mistake_count: 0,
        fluency_score: 100,
        notes: null,
      },
      {
        id: 'r2',
        type: 'SABAQ',
        juz: 1,
        surah_id: 2,
        ayah_start: 1,
        ayah_end: 5,
        line_count: 10,
        mistake_count: 1,
        fluency_score: 95,
        notes: null,
      },
      {
        id: 'r3',
        type: 'SABQI',
        juz: 1,
        surah_id: 1,
        ayah_start: 1,
        ayah_end: 7,
        line_count: 5,
        mistake_count: 0,
        fluency_score: 100,
        notes: null,
      },
    ];

    it('menghitung ringkasan kehadiran, jumlah setoran, dan akumulasi baris untuk tab aktif', () => {
      const attendanceMap = { 's1': 'HADIR' };

      const summarySabaq = calculateStudentRowSummary('s1', attendanceMap, sampleRecords, 'SABAQ');
      expect(summarySabaq.attendanceStatus).toBe('HADIR');
      expect(summarySabaq.selectedTypeRecordCount).toBe(2);
      expect(summarySabaq.selectedTypeTotalLines).toBe(15);

      const summarySabqi = calculateStudentRowSummary('s1', attendanceMap, sampleRecords, 'SABQI');
      expect(summarySabqi.attendanceStatus).toBe('HADIR');
      expect(summarySabqi.selectedTypeRecordCount).toBe(1);
      expect(summarySabqi.selectedTypeTotalLines).toBe(5);

      const summaryManzil = calculateStudentRowSummary('s1', attendanceMap, sampleRecords, 'MANZIL');
      expect(summaryManzil.attendanceStatus).toBe('HADIR');
      expect(summaryManzil.selectedTypeRecordCount).toBe(0);
      expect(summaryManzil.selectedTypeTotalLines).toBe(0);
    });

    it('menangani santri tanpa data absensi dan tanpa setoran', () => {
      const summary = calculateStudentRowSummary('s2', {}, [], 'SABAQ');
      expect(summary.attendanceStatus).toBeNull();
      expect(summary.selectedTypeRecordCount).toBe(0);
      expect(summary.selectedTypeTotalLines).toBe(0);
    });
  });
});

