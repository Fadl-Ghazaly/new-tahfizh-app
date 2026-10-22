import { z } from 'zod'
import { normalizeWhatsApp } from './common'

export const teacherSchema = z.object({
  name: z.string().trim().min(2, 'Nama ustadz minimal 2 karakter.'),
  gender: z.enum(['L', 'P'], { message: 'Pilih jenis kelamin.' }),
  whatsapp: z
    .string()
    .trim()
    .min(10, 'Nomor WhatsApp minimal 10 digit.')
    .transform((val) => normalizeWhatsApp(val)),
  boarding_school: z
    .string()
    .trim()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional(),
})

export type TeacherInput = z.infer<typeof teacherSchema>
