'use server'

import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateTeacherDeactivationRule } from '@/lib/validators/ustadz-rules'
import { teacherSchema } from '@/lib/validators/ustadz'
import { buildUstadzEmailFromName, DEFAULT_USTADZ_PASSWORD } from '@/lib/ustadz/provision-email'
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

  // Otomatis buatkan akun email @darulilmi.test jika admin client tersedia
  let profileId: string | null = null
  const adminClient = createAdminClient()
  if (adminClient) {
    try {
      const { data: authList } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })
      const usedEmails = new Set<string>(
        (authList?.users || []).map((u) => (u.email || '').toLowerCase()).filter(Boolean)
      )
      const generatedEmail = buildUstadzEmailFromName(data.name, usedEmails)
      const { data: created } = await adminClient.auth.admin.createUser({
        email: generatedEmail,
        password: DEFAULT_USTADZ_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: data.name },
      })
      if (created?.user) {
        profileId = created.user.id
        await adminClient.from('profiles').upsert({
          id: profileId,
          full_name: data.name,
          role: 'USTADZ',
          phone: data.whatsapp,
          is_active: true,
        })
      }
    } catch {
      // Lanjutkan pembuatan ustadz meskipun auto-provision gagal
    }
  }

  const insertPayload: Record<string, unknown> = {
    name: data.name,
    gender: data.gender,
    whatsapp: data.whatsapp,
    boarding_school: data.boarding_school,
  }
  if (profileId) {
    insertPayload.profile_id = profileId
  }

  const { error: insertError } = await supabase.from('teachers').insert(insertPayload)

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
