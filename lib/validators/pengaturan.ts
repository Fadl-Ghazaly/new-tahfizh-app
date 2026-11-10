import { z } from 'zod';

export const THEME_OPTIONS = [
  { value: 'theme-1', label: 'Zamrud (Default)' },
  { value: 'theme-2', label: 'Samudra' },
  { value: 'theme-3', label: 'Ungu Royal' },
  { value: 'theme-4', label: 'Senja' },
  { value: 'theme-5', label: 'Mawar' },
  { value: 'theme-6', label: 'Malam (Gelap)' },
] as const;

export const schoolSettingsSchema = z.object({
  school_name: z
    .string()
    .trim()
    .min(3, 'Nama pesantren minimal 3 karakter')
    .max(100, 'Nama pesantren maksimal 100 karakter'),
  logo_url: z
    .string()
    .trim()
    .url('Format URL logo tidak valid')
    .or(z.literal(''))
    .nullable()
    .optional(),
  theme: z.enum(['theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6'], {
    message: 'Pilihan tema tidak valid',
  }),
});

export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;

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

