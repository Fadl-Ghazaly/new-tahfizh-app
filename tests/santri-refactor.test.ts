import { describe, it, expect } from 'vitest'
import { parseListParams, mapDbError } from '../lib/validators/list-params'
import { validateStudentHalaqahRule } from '../lib/validators/santri-rules'

describe('parseListParams', () => {
  it('whitelists unicode letters, spaces, hyphens, and apostrophes', () => {
    expect(parseListParams({ search: "O'Brien" }).search).toBe("O'Brien")
    expect(parseListParams({ search: 'Siti Nur-Aini' }).search).toBe('Siti Nur-Aini')
    expect(parseListParams({ search: 'Müller' }).search).toBe('Müller')
  })

  it('strips dangerous characters and injection syntax', () => {
    expect(parseListParams({ search: 'a,b' }).search).toBe('ab')
    expect(parseListParams({ search: '(test)' }).search).toBe('test')
    expect(parseListParams({ search: '100%' }).search).toBe('100')
    expect(parseListParams({ search: 'hello.world' }).search).toBe('helloworld')
    expect(parseListParams({ search: 'x%,id.not.is.null' }).search).toBe('xidnotisnull')
  })

  it('limits search length to 50 characters', () => {
    const longString = 'a'.repeat(70)
    expect(parseListParams({ search: longString }).search.length).toBe(50)
  })

  it('validates class level 7-12', () => {
    expect(parseListParams({ class: '7' }).classLevel).toBe(7)
    expect(parseListParams({ class: '12' }).classLevel).toBe(12)
    expect(parseListParams({ class: '6' }).classLevel).toBe('all')
    expect(parseListParams({ class: '13' }).classLevel).toBe('all')
    expect(parseListParams({ class: 'invalid' }).classLevel).toBe('all')
    expect(parseListParams({ class: 'all' }).classLevel).toBe('all')
  })

  it('validates page number and keeps limit fixed at 20', () => {
    expect(parseListParams({ page: '3' }).page).toBe(3)
    expect(parseListParams({ page: '-1' }).page).toBe(1)
    expect(parseListParams({ page: '0' }).page).toBe(1)
    expect(parseListParams({ page: 'abc' }).page).toBe(1)
    expect(parseListParams({ limit: '100'  }).limit).toBe(20)
  })
})

describe('mapDbError', () => {
  it('maps 23505 to NISN error', () => {
    expect(mapDbError({ code: '23505', message: 'duplicate key value violates unique constraint' })).toBe('NISN sudah terdaftar.')
  })

  it('maps 23503 to foreign key error', () => {
    expect(mapDbError({ code: '23503', message: 'violates foreign key constraint' })).toBe('Data masih dipakai.')
  })

  it('maps 23514 to check constraint error', () => {
    expect(mapDbError({ code: '23514', message: 'check constraint violation' })).toBe('Data tidak valid.')
  })

  it('never leaks database error message on unknown or missing error', () => {
    const res = mapDbError({ code: '99999', message: 'sensitive db internal structure leaked' })
    expect(res).toBe('Terjadi kesalahan. Coba lagi.')
    expect(res).not.toContain('sensitive')

    expect(mapDbError(null)).toBe('Terjadi kesalahan. Coba lagi.')
  })
})

describe('validateStudentHalaqahRule', () => {
  it('allows valid active halaqah with matching class', () => {
    const res = validateStudentHalaqahRule('class-7a', { class_id: 'class-7a', is_active: true })
    expect(res.valid).toBe(true)
    expect(res.error).toBeUndefined()
  })

  it('rejects inactive halaqah', () => {
    const res = validateStudentHalaqahRule('class-7a', { class_id: 'class-7a', is_active: false })
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/nonaktif/)
  })

  it('rejects halaqah from different class', () => {
    const res = validateStudentHalaqahRule('class-7a', { class_id: 'class-8a', is_active: true })
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/Kelas santri harus sama/)
  })

  it('rejects non-existent halaqah', () => {
    const res = validateStudentHalaqahRule('class-7a', null)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/tidak ditemukan/)
  })
})
