import { z } from 'zod';

export const THEME_OPTIONS = [
  { value: 'theme-1', label: 'Zamrud (Default)' },
  { value: 'theme-2', label: 'Samudra' },
  { value: 'theme-3', label: 'Ungu Royal' },
  { value: 'theme-4', label: 'Senja' },
  { value: 'theme-5', label: 'Mawar' },
  { value: 'theme-6', label: 'Malam (Gelap)' },
] as const;

export const ACADEMIC_YEAR_OPTIONS = [
  { value: '2024/2025', label: '2024/2025' },
  { value: '2025/2026', label: '2025/2026' },
  { value: '2026/2027', label: '2026/2027' },
  { value: '2027/2028', label: '2027/2028' },
] as const;

export const SEMESTER_OPTIONS = [
  { value: 'GANJIL', label: 'Semester Ganjil (Juli – Desember)' },
  { value: 'GENAP', label: 'Semester Genap (Januari – Juni)' },
] as const;

export const ALLOWED_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
] as const;

export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Validasi URL logo: menerima URL http/https, path relatif (/...), atau Data URL Base64 gambar.
 */
const logoUrlValidator = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (val === '') return true;
      if (val.startsWith('/')) return true;
      if (/^data:image\/(png|jpeg|jpg|svg\+xml|webp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/=]+$/i.test(val)) {
        return true;
      }
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Format berkas atau URL logo tidak valid' }
  );

export const schoolSettingsSchema = z.object({
  school_name: z
    .string()
    .trim()
    .min(3, 'Nama pesantren minimal 3 karakter')
    .max(100, 'Nama pesantren maksimal 100 karakter'),
  logo_url: logoUrlValidator.nullable().optional(),
  theme: z.enum(['theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6'], {
    message: 'Pilihan tema tidak valid',
  }),
});

export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;

export const academicSettingsSchema = z.object({
  academic_year: z
    .string()
    .trim()
    .regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran harus YYYY/YYYY (contoh: 2026/2027)'),
  semester: z.enum(['GANJIL', 'GENAP'], {
    message: 'Semester harus GANJIL atau GENAP',
  }),
  lines_per_page: z
    .number()
    .int('Jumlah baris per halaman harus bilangan bulat')
    .min(1, 'Minimal 1 baris per halaman')
    .max(50, 'Maksimal 50 baris per halaman'),
  lines_per_juz: z
    .number()
    .int('Jumlah baris per Juz harus bilangan bulat')
    .min(10, 'Minimal 10 baris per Juz')
    .max(1000, 'Maksimal 1000 baris per Juz'),
  mistake_penalty: z
    .number()
    .int('Bobot pengurangan nilai harus bilangan bulat')
    .min(1, 'Minimal pengurangan 1 poin')
    .max(100, 'Maksimal pengurangan 100 poin'),
});

export type AcademicSettingsInput = z.infer<typeof academicSettingsSchema>;

export const DEFAULT_ACADEMIC_SETTINGS: AcademicSettingsInput = {
  academic_year: '2026/2027',
  semester: 'GANJIL',
  lines_per_page: 15,
  lines_per_juz: 300,
  mistake_penalty: 5,
};

export const userProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  phone: z
    .string()
    .trim()
    .regex(/^([0-9\s+()-]{8,20})?$/, 'Nomor telepon tidak valid')
    .or(z.literal(''))
    .nullable()
    .optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
    new_password: z.string().min(6, 'Kata sandi baru minimal 6 karakter'),
    confirm_password: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirm_password'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const toggleUserStatusSchema = z.object({
  user_id: z.string().uuid('ID pengguna tidak valid'),
  is_active: z.boolean(),
});

export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;

export const adminResetPasswordSchema = z
  .object({
    user_id: z.string().uuid('ID pengguna tidak valid'),
    new_password: z.string().min(6, 'Kata sandi baru minimal 6 karakter'),
    confirm_password: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirm_password'],
  });

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
