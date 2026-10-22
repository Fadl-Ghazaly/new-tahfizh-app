import { describe, it, expect } from 'vitest'
import { validateTeacherDeactivationRule, normalizeHalaqahRelation } from '../lib/validators/ustadz-rules'
import { teacherSchema } from '../lib/validators/ustadz'
import { mapDbError } from '../lib/validators/list-params'

describe('Teacher Deactivation Rule & Validators', () => {
  it('allows deactivation when no active halaqahs exist (empty, null name)', () => {
    expect(validateTeacherDeactivationRule([]).valid).toBe(true)
    expect(validateTeacherDeactivationRule([{ name: '' }, { name: null }]).valid).toBe(true)
  })

  it('formats error message for 1 halaqah', () => {
    const res = validateTeacherDeactivationRule([{ name: 'Halaqah 8B' }])
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Ustadz ini masih mengampu Halaqah 8B. Ganti ustadz pengampunya terlebih dahulu.')
  })

  it('formats error message for 2 halaqahs (using "dan")', () => {
    const res = validateTeacherDeactivationRule([{ name: 'Halaqah 8A' }, { name: 'Halaqah 8B' }])
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Ustadz ini masih mengampu Halaqah 8A dan Halaqah 8B. Ganti ustadz pengampunya terlebih dahulu.')
  })

  it('formats error message for 3 or more halaqahs (using oxford comma style with "dan")', () => {
    const res = validateTeacherDeactivationRule([
      { name: 'Halaqah 8A' },
      { name: 'Halaqah 8B' },
      { name: 'Halaqah 9A' },
    ])
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Ustadz ini masih mengampu Halaqah 8A, Halaqah 8B, dan Halaqah 9A. Ganti ustadz pengampunya terlebih dahulu.')
  })

  it('validates teacher input schema with boarding school normalization', () => {
    const valid = {
      name: 'Ustadz Zaki',
      gender: 'L',
      whatsapp: '081234567890',
      boarding_school: '',
    }
    const result = teacherSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.boarding_school).toBeNull()
      expect(result.data.whatsapp).toBe('081234567890')
    }
  })

  it('mapDbError is context-aware for santri and ustadz', () => {
    expect(mapDbError({ code: '23505' }, 'santri')).toBe('NISN sudah terdaftar.')
    expect(mapDbError({ code: '23505' }, 'ustadz')).toBe('Data duplikat terdeteksi.')
    expect(mapDbError({ code: '23503' })).toBe('Data masih dipakai.')
    expect(mapDbError(null)).toBe('Terjadi kesalahan. Coba lagi.')
  })
})

describe('normalizeHalaqahRelation', () => {
  it('handles null, undefined, and non-array inputs safely', () => {
    expect(normalizeHalaqahRelation(null)).toEqual([])
    expect(normalizeHalaqahRelation(undefined)).toEqual([])
    expect(normalizeHalaqahRelation('string')).toEqual([])
  })

  it('handles single valid object', () => {
    const single = { id: '1', name: 'H1', class_id: 'c1', is_active: true, classes: { name: '7A' } }
    expect(normalizeHalaqahRelation(single)).toEqual([single])
  })

  it('filters out malformed items and keeps valid ones in array', () => {
    const valid = { id: '1', name: 'H1', class_id: 'c1', is_active: true, classes: null }
    const invalid1 = { id: 123, name: 'H2', class_id: 'c1', is_active: true }
    const invalid2 = { id: '2', name: 'H3', class_id: 'c1' }
    const list = [valid, invalid1, invalid2, 'not-an-object', null]
    expect(normalizeHalaqahRelation(list)).toEqual([valid])
  })
})
