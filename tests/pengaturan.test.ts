import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  schoolSettingsSchema,
  academicSettingsSchema,
  userProfileSchema,
  changePasswordSchema,
  toggleUserStatusSchema,
  adminResetPasswordSchema,
  THEME_OPTIONS,
  DEFAULT_ACADEMIC_SETTINGS,
} from '@/lib/validators/pengaturan';
import * as requireUserModule from '@/lib/auth/require-user';
import {
  toggleUserStatusAction,
  updateAcademicSettingsAction,
  adminResetPasswordAction,
  updateSchoolSettingsAction,
} from '@/app/(app)/pengaturan/actions';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));
const mockUpdateUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}));

const mockUpdateUserById = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
  })),
}));

describe('Pengaturan Validators & Server Actions Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('schoolSettingsSchema', () => {
    it('memvalidasi nama pesantren dan URL logo yang valid', () => {
      const validData = {
        school_name: 'Pesantren Darul Ilmi Lampung',
        logo_url: 'https://example.com/logo.png',
        theme: 'theme-1',
      };

      const result = schoolSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('menerima logo dalam format Base64 Data URL (PNG/SVG/WebP/ICO)', () => {
      const dataUrlData = {
        school_name: 'Pesantren Darul Ilmi',
        logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        theme: 'theme-2',
      };

      const result = schoolSettingsSchema.safeParse(dataUrlData);
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
    });

    it('menolak pilihan tema di luar opsi tema 1-6', () => {
      const data = {
        school_name: 'Pesantren Darul Ilmi',
        theme: 'theme-7',
      };

      const result = schoolSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('memastikan THEME_OPTIONS memiliki 6 tema lengkap sesuai DESIGN.md', () => {
      expect(THEME_OPTIONS).toHaveLength(6);
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

  describe('academicSettingsSchema', () => {
    it('memvalidasi konfigurasi akademik default dengan benar', () => {
      const res = academicSettingsSchema.safeParse(DEFAULT_ACADEMIC_SETTINGS);
      expect(res.success).toBe(true);
    });

    it('menolak format tahun ajaran yang salah', () => {
      const res = academicSettingsSchema.safeParse({
        ...DEFAULT_ACADEMIC_SETTINGS,
        academic_year: '2026-2027',
      });
      expect(res.success).toBe(false);
    });

    it('menolak nilai baris per halaman atau penalti di luar batas wajar', () => {
      expect(
        academicSettingsSchema.safeParse({
          ...DEFAULT_ACADEMIC_SETTINGS,
          lines_per_page: 0,
        }).success
      ).toBe(false);

      expect(
        academicSettingsSchema.safeParse({
          ...DEFAULT_ACADEMIC_SETTINGS,
          mistake_penalty: 105,
        }).success
      ).toBe(false);
    });
  });

  describe('userProfileSchema & changePasswordSchema', () => {
    it('memvalidasi profil dan nomor telepon yang valid', () => {
      const result = userProfileSchema.safeParse({
        full_name: 'Ustadz Ahmad Al-Hafizh',
        phone: '081234567890',
      });
      expect(result.success).toBe(true);
    });

    it('memvalidasi kecocokan kata sandi baru dan konfirmasi', () => {
      const result = changePasswordSchema.safeParse({
        current_password: 'oldPassword123',
        new_password: 'newPassword123',
        confirm_password: 'newPassword123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('toggleUserStatusSchema & adminResetPasswordSchema', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('memvalidasi payload toggle status pengguna', () => {
      expect(
        toggleUserStatusSchema.safeParse({
          user_id: validUuid,
          is_active: false,
        }).success
      ).toBe(true);
    });

    it('memvalidasi payload reset password oleh admin', () => {
      expect(
        adminResetPasswordSchema.safeParse({
          user_id: validUuid,
          new_password: 'ustadzBaru123',
          confirm_password: 'ustadzBaru123',
        }).success
      ).toBe(true);
    });
  });

  describe('Server Actions Pengaturan (RBAC & Mutasi)', () => {
    const adminUuid = '11111111-1111-4111-8111-111111111111';
    const targetUuid = '22222222-2222-4222-8222-222222222222';

    it('menolak USTADZ mengakses toggleUserStatusAction (RBAC)', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: targetUuid,
        role: 'USTADZ',
        isActive: true,
        teacherId: 't1',
      });

      const res = await toggleUserStatusAction({
        user_id: adminUuid,
        is_active: false,
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Hanya Admin');
    });

    it('mencegah ADMIN menonaktifkan akunnya sendiri', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: adminUuid,
        role: 'ADMIN',
        isActive: true,
        teacherId: null,
      });

      const res = await toggleUserStatusAction({
        user_id: adminUuid,
        is_active: false,
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('tidak dapat menonaktifkan akun Anda sendiri');
    });

    it('mengizinkan ADMIN mengaktifkan/menonaktifkan akun pengguna lain', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: adminUuid,
        role: 'ADMIN',
        isActive: true,
        teacherId: null,
      });
      mockUpdateEq.mockResolvedValueOnce({ error: null });

      const res = await toggleUserStatusAction({
        user_id: targetUuid,
        is_active: false,
      });

      expect(res.ok).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    });

    it('mengizinkan ADMIN menyimpan konfigurasi akademik', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: adminUuid,
        role: 'ADMIN',
        isActive: true,
        teacherId: null,
      });
      mockUpdateUser.mockResolvedValueOnce({ error: null });
      mockUpdateUserById.mockResolvedValueOnce({ error: null });

      const res = await updateAcademicSettingsAction({
        academic_year: '2026/2027',
        semester: 'GENAP',
        lines_per_page: 15,
        lines_per_juz: 300,
        mistake_penalty: 5,
      });

      expect(res.ok).toBe(true);
      expect(mockUpdateUser).toHaveBeenCalled();
    });

    it('mengizinkan ADMIN mereset password pengguna lain', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: adminUuid,
        role: 'ADMIN',
        isActive: true,
        teacherId: null,
      });
      mockUpdateUserById.mockResolvedValueOnce({ error: null });

      const res = await adminResetPasswordAction({
        user_id: targetUuid,
        new_password: 'passwordBaru123',
        confirm_password: 'passwordBaru123',
      });

      expect(res.ok).toBe(true);
      expect(mockUpdateUserById).toHaveBeenCalledWith(targetUuid, {
        password: 'passwordBaru123',
      });
    });

    it('menolak USTADZ mengubah identitas pesantren (updateSchoolSettingsAction)', async () => {
      vi.spyOn(requireUserModule, 'requireUser').mockResolvedValueOnce({
        userId: targetUuid,
        role: 'USTADZ',
        isActive: true,
        teacherId: 't1',
      });

      const res = await updateSchoolSettingsAction({
        school_name: 'Pesantren Baru',
        logo_url: '',
        theme: 'theme-1',
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Hanya Admin');
    });
  });
});
