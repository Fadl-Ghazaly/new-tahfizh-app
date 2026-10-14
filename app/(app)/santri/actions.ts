'use server'

import { requireAdmin } from '@/lib/auth/require-admin'
import { studentSchema } from '@/lib/validators/santri'
import { validateStudentHalaqahRule } from '@/lib/validators/santri-rules'
import { mapDbError } from '@/lib/validators/list-params'
import { revalidatePath } from 'next/cache'

export async function createStudent(rawInput: unknown) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) {
    return { ok: false, error: authError || 'Akses ditolak.' }
  }

  const parsed = studentSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  // Verify halaqah rule
  const { data: halaqah, error: halaqahError } = await supabase
    .from('halaqahs')
    .select('id, class_id, is_active')
    .eq('id', data.halaqah_id)
    .single()

  if (halaqahError) {
    console.error('Error fetching halaqah:', halaqahError.code, halaqahError.message)
  }

  const ruleCheck = validateStudentHalaqahRule(data.class_id, halaqah)
  if (!ruleCheck.valid) {
    return { ok: false, error: ruleCheck.error }
  }

  const { error: insertError } = await supabase.from('students').insert({
    nisn: data.nisn,
    name: data.name,
    gender: data.gender,
    class_id: data.class_id,
    halaqah_id: data.halaqah_id,
    parent_name: data.parent_name,
    parent_whatsapp: data.parent_whatsapp,
    status: data.status,
  })

  if (insertError) {
    console.error('Error inserting student:', insertError.code, insertError.message)
    return { ok: false, error: mapDbError(insertError) }
  }

  revalidatePath('/santri')
  return { ok: true }
}

export async function updateStudent(id: string, rawInput: unknown) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) {
    return { ok: false, error: authError || 'Akses ditolak.' }
  }

  const parsed = studentSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  // Verify halaqah rule
  const { data: halaqah, error: halaqahError } = await supabase
    .from('halaqahs')
    .select('id, class_id, is_active')
    .eq('id', data.halaqah_id)
    .single()

  if (halaqahError) {
    console.error('Error fetching halaqah:', halaqahError.code, halaqahError.message)
  }

  const ruleCheck = validateStudentHalaqahRule(data.class_id, halaqah)
  if (!ruleCheck.valid) {
    return { ok: false, error: ruleCheck.error }
  }

  const { error: updateError } = await supabase
    .from('students')
    .update({
      nisn: data.nisn,
      name: data.name,
      gender: data.gender,
      class_id: data.class_id,
      halaqah_id: data.halaqah_id,
      parent_name: data.parent_name,
      parent_whatsapp: data.parent_whatsapp,
      status: data.status,
    })
    .eq('id', id)

  if (updateError) {
    console.error('Error updating student:', updateError.code, updateError.message)
    return { ok: false, error: mapDbError(updateError) }
  }

  revalidatePath('/santri')
  return { ok: true }
}

export async function setStudentStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED') {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) {
    return { ok: false, error: authError || 'Akses ditolak.' }
  }

  if (status === 'ACTIVE') {
    // Check if student's halaqah is active
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('halaqah_id')
      .eq('id', id)
      .single()

    if (studentError) {
      console.error('Error fetching student for activation:', studentError.code, studentError.message)
    }

    if (student) {
      const { data: halaqah, error: halError } = await supabase
        .from('halaqahs')
        .select('is_active')
        .eq('id', student.halaqah_id)
        .single()

      if (halError) {
        console.error('Error fetching student halaqah for activation:', halError.code, halError.message)
      }

      if (halaqah && !halaqah.is_active) {
        return { ok: false, error: 'Tidak dapat mengaktifkan santri karena halaqahnya sedang nonaktif. Pindahkan halaqah terlebih dahulu.' }
      }
    }
  }

  const { error } = await supabase
    .from('students')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Error setting student status:', error.code, error.message)
    return { ok: false, error: mapDbError(error) }
  }

  revalidatePath('/santri')
  return { ok: true }
}
