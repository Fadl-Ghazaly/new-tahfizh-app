'use server'

import { requireAdmin } from '@/lib/auth/require-admin'
import { studentSchema, StudentInput } from '@/lib/validators/santri'
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

  // Verify halaqah exists, is active, and its class_id matches data.class_id
  const { data: halaqah, error: halaqahError } = await supabase
    .from('halaqahs')
    .select('id, class_id, is_active')
    .eq('id', data.halaqah_id)
    .single()

  if (halaqahError || !halaqah) {
    return { ok: false, error: 'Halaqah yang dipilih tidak ditemukan.' }
  }

  if (!halaqah.is_active) {
    return { ok: false, error: 'Tidak dapat memasukkan santri ke halaqah yang nonaktif.' }
  }

  if (halaqah.class_id !== data.class_id) {
    return { ok: false, error: 'Kelas santri harus sama dengan class_id halaqah.' }
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
    if (insertError.code === '23505') {
      return { ok: false, error: 'NISN sudah terdaftar.' }
    }
    return { ok: false, error: 'Gagal menambahkan santri: ' + insertError.message }
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

  // Verify halaqah
  const { data: halaqah, error: halaqahError } = await supabase
    .from('halaqahs')
    .select('id, class_id, is_active')
    .eq('id', data.halaqah_id)
    .single()

  if (halaqahError || !halaqah) {
    return { ok: false, error: 'Halaqah yang dipilih tidak ditemukan.' }
  }

  if (!halaqah.is_active) {
    return { ok: false, error: 'Tidak dapat memindahkan santri ke halaqah yang nonaktif.' }
  }

  if (halaqah.class_id !== data.class_id) {
    return { ok: false, error: 'Kelas santri harus sama dengan class_id halaqah.' }
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
    if (updateError.code === '23505') {
      return { ok: false, error: 'NISN sudah terdaftar.' }
    }
    return { ok: false, error: 'Gagal memperbarui santri: ' + updateError.message }
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
    const { data: student } = await supabase
      .from('students')
      .select('halaqah_id')
      .eq('id', id)
      .single()

    if (student) {
      const { data: halaqah } = await supabase
        .from('halaqahs')
        .select('is_active')
        .eq('id', student.halaqah_id)
        .single()

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
    return { ok: false, error: 'Gagal mengubah status santri: ' + error.message }
  }

  revalidatePath('/santri')
  return { ok: true }
}
