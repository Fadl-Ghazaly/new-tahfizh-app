import { z } from 'zod'
import { normalizeWhatsApp } from './common'

export const studentSchema = z.object({
  nisn: z.string().trim().regex(/^\d{10}$/, 'NISN harus tepat 10 digit angka.'),
  name: z.string().trim().min(2, 'Nama santri minimal 2 karakter.'),
  gender: z.enum(['L', 'P'], { message: 'Pilih jenis kelamin.' }),
  class_id: z.string().trim().min(1, 'Pilih kelas.').uuid('Kelas tidak valid.'),
  halaqah_id: z.string().trim().min(1, 'Pilih halaqah.').uuid('Halaqah tidak valid.'),
  parent_name: z.string().trim().min(2, 'Nama orangtua minimal 2 karakter.'),
  parent_whatsapp: z
    .string()
    .trim()
    .min(10, 'Nomor WhatsApp minimal 10 digit.')
    .transform((val) => normalizeWhatsApp(val)),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED']).default('ACTIVE'),
})

export type StudentInput = z.infer<typeof studentSchema>
