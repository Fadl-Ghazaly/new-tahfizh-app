'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { setoranFormSchema } from '@/lib/validators/setoran';
import { isDateAllowed, resolveLineCount, validateVoidReason } from '@/lib/setoran/rules';
import { computeLinesForRange } from '@/lib/quran-juz';
import { mapDbError } from '@/lib/validators/list-params';
import { zodIssuesToFieldErrors } from '@/lib/validators/common';

export interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitSetoran(input: {
  studentId: string;
  date: string;
  formData: unknown;
}): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!user.isActive) {
      return { ok: false, error: 'Akun Anda tidak aktif.' };
    }

    // 1. Zod validation
    const parsed = setoranFormSchema.safeParse(input.formData);
    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
      };
    }

    const val = parsed.data;

    // 2. Date window validation
    const todayIso = new Date().toISOString().slice(0, 10);
    if (!isDateAllowed(user.role, input.date, todayIso)) {
      return { ok: false, error: mapDbError({ code: 'TH001' }, 'setoran') };
    }

    const supabase = await createClient();

    // 3. For USTADZ, ensure student belongs to their active halaqah
    if (user.role === 'USTADZ') {
      if (!user.teacherId) {
        return { ok: false, error: 'Akun Anda belum terhubung dengan data ustadz aktif.' };
      }

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, halaqahs!inner(teacher_id)')
        .eq('id', input.studentId)
        .single();

      if (studentError || !student) {
        return { ok: false, error: mapDbError({ code: 'TH007' }, 'setoran') };
      }

      const halaqah = Array.isArray(student.halaqahs) ? student.halaqahs[0] : student.halaqahs;
      if (!halaqah || halaqah.teacher_id !== user.teacherId) {
        return { ok: false, error: mapDbError({ code: '42501' }, 'setoran') };
      }
    }

    // 4. Calculate lines for HADIR / TERLAMBAT
    let finalLineCount: number | null = null;
    if (val.attendance === 'HADIR' || val.attendance === 'TERLAMBAT') {
      const computed = computeLinesForRange(val.juz!, val.surah_id!, val.ayah_start!, val.ayah_end!);
      try {
        finalLineCount = resolveLineCount({
          role: user.role,
          computed,
          requested: val.line_count,
          notes: val.notes,
        });
      } catch (err: unknown) {
        const errCode = (err instanceof Error && err.message === 'TH002') ? 'TH002' : '23514';
        return { ok: false, error: mapDbError({ code: errCode }, 'setoran') };
      }
    }

    // 5. Call RPC submit_setoran
    const { error: rpcError } = await supabase.rpc('submit_setoran', {
      p_student_id: input.studentId,
      p_date: input.date,
      p_attendance: val.attendance,
      p_type: val.type || null,
      p_juz: val.juz || null,
      p_surah_id: val.surah_id || null,
      p_ayah_start: val.ayah_start || null,
      p_ayah_end: val.ayah_end || null,
      p_line_count: finalLineCount,
      p_mistake_count: val.mistake_count || 0,
      p_notes: val.notes || null,
    });

    if (rpcError) {
      console.error('RPC submit_setoran error:', rpcError.code);
      return { ok: false, error: mapDbError(rpcError, 'setoran') };
    }

    revalidatePath('/setoran');
    revalidatePath('/dashboard');
    return { ok: true };

  } catch (err: unknown) {
    console.error('submitSetoran unexpected error:', err);
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi.' };
  }
}

export async function voidSetoran(recordId: string, reason: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!user.isActive) {
      return { ok: false, error: 'Akun Anda tidak aktif.' };
    }

    if (!validateVoidReason(reason)) {
      return { ok: false, error: 'Alasan pembatalan harus antara 3 dan 200 karakter.' };
    }

    const supabase = await createClient();

    // Fetch record date to verify date window
    const { data: record, error: recordError } = await supabase
      .from('memorization_records')
      .select('date, status')
      .eq('id', recordId)
      .single();

    if (recordError || !record) {
      return { ok: false, error: mapDbError({ code: 'TH005' }, 'setoran') };
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    if (!isDateAllowed(user.role, record.date, todayIso)) {
      return { ok: false, error: 'Tanggal setoran ini sudah di luar batas waktu yang diizinkan untuk dibatalkan.' };
    }

    const { error: rpcError } = await supabase.rpc('void_setoran', {
      p_record_id: recordId,
      p_reason: reason.trim(),
    });

    if (rpcError) {
      console.error('RPC void_setoran error:', rpcError.code);
      return { ok: false, error: mapDbError(rpcError, 'setoran') };
    }

    revalidatePath('/setoran');
    revalidatePath('/dashboard');
    return { ok: true };

  } catch (err: unknown) {
    console.error('voidSetoran unexpected error:', err);
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi.' };
  }
}
