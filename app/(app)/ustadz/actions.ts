'use server'

import { requireAdmin } from '@/lib/auth/require-admin'
import { validateTeacherDeactivationRule } from '@/lib/validators/ustadz-rules'
import { teacherSchema } from '@/lib/validators/ustadz'
import { revalidatePath } from 'next/cache'

export async function createTeacher(rawInput: unknown) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) {
    return { ok: false, error: authError || 'Akses ditolak.' }
  }

  const parsed = teacherSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error: insertError } = await supabase.from('teachers').insert({
    name: data.name,
    gender: data.gender,
    whatsapp: data.whatsapp,
    boarding_school: data.boarding_school,
    
  })

  if (insertError) {
    return { ok: false, error: 'Gagal menambahkan ustadz: ' + insertError.message }
  }

  revalidatePath('/ustadz')
  return { ok: true }
}

export async function updateTeacher(id: string, rawInput: unknown) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) {
    return { ok: false, error: authError || 'Akses ditolak.' }
  }

  const parsed = teacherSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error: updateError } = await supabase
    .from('teachers')
    .update({
      name: data.name,
      gender: data.gender,
      whatsapp: data.whatsapp,
      boarding_school: data.boarding_school,
      
    })
    .eq('id', id)

  if (updateError) {
    return { ok: false, error: 'Gagal memperbarui ustadz: ' + updateError.message }
  }

  revalidatePath('/ustadz')
  return { ok: true }
}

export async function setTeacherStatus(id: string, is_active: boolean) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) {
    return { ok: false, error: authError || 'Akses ditolak.' }
  }

  if (!is_active) {
    // Check if teacher still leads active halaqahs
    const { data: halaqahs, error: halError } = await supabase
      .from('halaqahs')
      .select('name')
      .eq('teacher_id', id)
      .eq('is_active', true)

    if (halError) {
      return { ok: false, error: 'Gagal memeriksa halaqah ustadz.' }
    }

    if (halaqahs && halaqahs.length > 0) {
      const rule = validateTeacherDeactivationRule(halaqahs)
      if (!rule.valid && rule.error) {
        return { ok: false, error: rule.error }
      }
    }
  }

  const { error } = await supabase
    .from('teachers')
    .update({ is_active })
    .eq('id', id)

  if (error) {
    return { ok: false, error: 'Gagal mengubah status ustadz: ' + error.message }
  }

  revalidatePath('/ustadz')
  return { ok: true }
}
