import { z } from 'zod';

export const setoranFormSchema = z.object({
  attendance: z.enum(['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA'], {
    message: 'Status kehadiran wajib dipilih',
  }),
  type: z.enum(['SABAQ', 'SABQI', 'MANZIL']).nullable().optional(),
  juz: z.coerce.number().int().min(1).max(30).nullable().optional(),
  surah_id: z.coerce.number().int().min(1).max(114).nullable().optional(),
  ayah_start: z.coerce.number().int().min(1).nullable().optional(),
  ayah_end: z.coerce.number().int().min(1).nullable().optional(),
  line_count: z.coerce.number().int().min(1).max(300).nullable().optional(),
  mistake_count: z.coerce.number().int().min(0).max(50).default(0),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.attendance === 'HADIR' || data.attendance === 'TERLAMBAT') {
    if (!data.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['type'],
        message: 'Jenis setoran wajib diisi untuk kehadiran Hadir atau Terlambat',
      });
    }
    if (!data.juz) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['juz'],
        message: 'Juz wajib diisi',
      });
    }
    if (!data.surah_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['surah_id'],
        message: 'Surat wajib diisi',
      });
    }
    if (!data.ayah_start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ayah_start'],
        message: 'Ayat mulai wajib diisi',
      });
    }
    if (!data.ayah_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ayah_end'],
        message: 'Ayat selesai wajib diisi',
      });
    }
    if (data.ayah_start && data.ayah_end && data.ayah_start > data.ayah_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ayah_end'],
        message: 'Ayat selesai harus lebih besar atau sama dengan ayat mulai',
      });
    }
    if (!data.line_count || data.line_count < 1 || data.line_count > 300) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['line_count'],
        message: 'Jumlah baris harus antara 1 dan 300',
      });
    }
  } else {
    if (data.type || data.juz || data.surah_id || data.ayah_start || data.ayah_end || (data.line_count && data.line_count > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['attendance'],
        message: 'Status Izin, Sakit, atau Alpha tidak boleh disertai data setoran hafalan',
      });
    }
  }
});

export type SetoranFormValues = z.infer<typeof setoranFormSchema>;
