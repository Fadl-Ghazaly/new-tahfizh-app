import { describe, it, expect } from 'vitest';
import {
  schoolSettingsSchema,
  userProfileSchema,
  changePasswordSchema,
  THEME_OPTIONS,
} from '@/lib/validators/pengaturan';

describe('Pengaturan Validators Tests', () => {
  describe('schoolSettingsSchema', () => {
    it('memvalidasi nama pesantren dan tema yang valid', () => {
      const validData = {
        school_name: 'Pesantren Darul Ilmi Lampung',
        logo_url: 'https://example.com/logo.png',
        theme: 'theme-1',
      };

      const result = schoolSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('memperbolehkan logo_url kosong atau null', () => {
      const dataEmptyLogo = {
        school_name: 'Pesantren Darul Ilmi',
        logo_url: '',
        theme: 'theme-2',
      };

      const result = schoolSettingsSchema.safeParse(dataEmptyLogo);
      expect(result.success).toBe(true);
    });

    it('menolak nama pesantren kurang dari 3 karakter', () => {
      const data = {
        school_name: 'Ab',
        theme: 'theme-1',
      };

      const result = schoolSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('minimal 3 karakter');
      }
    });

    it('menolak pilihan tema di luar opsi tema 1-6', () => {
      const data = {
        school_name: 'Pesantren Darul Ilmi',
        theme: 'theme-7',
      };

      const result = schoolSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Pilihan tema tidak valid');
      }
    });

    it('memastikan THEME_OPTIONS memiliki 6 tema lengkap sesuai DESIGN.md', () => {
      expect(THEME_OPTIONS).toHaveLength(6);
      expect(THEME_OPTIONS.map((t) => t.value)).toEqual([
        'theme-1',
        'theme-2',
        'theme-3',
        'theme-4',
        'theme-5',
        'theme-6',
      ]);
      expect(THEME_OPTIONS.map((t) => t.label)).toEqual([
        'Zamrud (Default)',
        'Samudra',
        'Ungu Royal',
        'Senja',
        'Mawar',
        'Malam (Gelap)',
      ]);
    });
  });

  describe('userProfileSchema', () => {
    it('memvalidasi nama lengkap dan nomor telepon yang valid', () => {
      const data = {
        full_name: 'Ustadz Ahmad Al-Hafizh',
        phone: '081234567890',
      };

      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('memperbolehkan nomor telepon kosong', () => {
      const data = {
        full_name: 'Ustadz Danis',
        phone: '',
      };

      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('menolak nama lengkap kurang dari 3 karakter', () => {
      const data = {
        full_name: 'Xy',
      };

      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('minimal 3 karakter');
      }
    });
  });

  describe('changePasswordSchema', () => {
    it('memvalidasi kecocokan kata sandi baru dan konfirmasi', () => {
      const data = {
        current_password: 'oldPassword123',
        new_password: 'newPassword123',
        confirm_password: 'newPassword123',
      };

      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('menolak jika konfirmasi kata sandi berbeda', () => {
      const data = {
        current_password: 'oldPassword123',
        new_password: 'newPassword123',
        confirm_password: 'differentPassword',
      };

      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Konfirmasi kata sandi tidak cocok');
      }
    });

    it('menolak kata sandi baru yang kurang dari 6 karakter', () => {
      const data = {
        current_password: 'oldPassword123',
        new_password: '12345',
        confirm_password: '12345',
      };

      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('minimal 6 karakter');
      }
    });
  });
});

