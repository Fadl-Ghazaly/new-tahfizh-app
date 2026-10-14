import { describe, it, expect } from 'vitest'
import { normalizeWhatsApp, validateNisn } from '../lib/validators/common'
import { studentSchema } from '../lib/validators/santri'
import { teacherSchema } from '../lib/validators/ustadz'

describe('Validators & Pure Functions', () => {
  it('normalizes whatsapp numbers correctly', () => {
    expect(normalizeWhatsApp('081234567890')).toBe('081234567890')
    expect(normalizeWhatsApp('6281234567890')).toBe('081234567890')
    expect(normalizeWhatsApp('+6281234567890')).toBe('081234567890')
    expect(normalizeWhatsApp('81234567890')).toBe('081234567890')
  })

  it('validates 10-digit NISN', () => {
    expect(validateNisn('1234567890')).toBe(true)
    expect(validateNisn('12345')).toBe(false)
    expect(validateNisn('123456789a')).toBe(false)
  })

  it('validates student input schema', () => {
    const validData = {
      nisn: '1234567890',
      name: 'Ahmad',
      gender: 'L',
      class_id: 'a0000000-0000-4000-8000-000000000001',
      halaqah_id: 'b0000000-0000-4000-8000-000000000001',
      parent_name: 'Budi',
      parent_whatsapp: '081234567890',
      status: 'ACTIVE',
    }
    const result = studentSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.parent_whatsapp).toBe('081234567890')
    }

    const invalidData = { ...validData, nisn: '12345' }
    expect(studentSchema.safeParse(invalidData).success).toBe(false)
  })

  it('validates teacher input schema', () => {
    const validTeacher = {
      name: 'Ustadz Zaid',
      gender: 'L',
      whatsapp: '+6289876543210',
      boarding_school: 'Darul Ilmi',
      is_active: true,
    }
    const result = teacherSchema.safeParse(validTeacher)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.whatsapp).toBe('089876543210')
    }
  })
})

  it('rejects empty gender, class_id, and halaqah_id with specific messages', () => {
    const emptyData = {
      nisn: '1234567890',
      name: 'Ahmad',
      gender: '',
      class_id: '',
      halaqah_id: '',
      parent_name: 'Budi',
      parent_whatsapp: '081234567890',
      status: 'ACTIVE',
    }
    const result = studentSchema.safeParse(emptyData)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Pilih jenis kelamin.')
      expect(messages).toContain('Pilih kelas.')
      expect(messages).toContain('Pilih halaqah.')
    }
  })

import { zodIssuesToFieldErrors } from '../lib/validators/common'
describe('zodIssuesToFieldErrors', () => {
  it('maps empty form issues to all required fields and handles unknown/symbol paths as _form', () => {
    const invalidResult = studentSchema.safeParse({
      nisn: '',
      name: '',
      gender: '',
      class_id: '',
      halaqah_id: '',
      parent_name: '',
      parent_whatsapp: '',
    })
    expect(invalidResult.success).toBe(false)
    if (!invalidResult.success) {
      const fieldErrors = zodIssuesToFieldErrors(invalidResult.error.issues)
      expect(fieldErrors.nisn).toBeDefined()
      expect(fieldErrors.name).toBeDefined()
      expect(fieldErrors.gender).toBeDefined()
      expect(fieldErrors.class_id).toBeDefined()
      expect(fieldErrors.halaqah_id).toBeDefined()
      expect(fieldErrors.parent_name).toBeDefined()
      expect(fieldErrors.parent_whatsapp).toBeDefined()
    }
  })

  it('produces only one error per field (first issue wins)', () => {
    const issues = [
      { path: ['nisn'], message: 'Error 1 for NISN' },
      { path: ['nisn'], message: 'Error 2 for NISN' },
      { path: ['name'], message: 'Error for Name' },
    ]
    const res = zodIssuesToFieldErrors(issues)
    expect(res.nisn).toBe('Error 1 for NISN')
    expect(res.name).toBe('Error for Name')
  })

  it('maps issues without recognized path to _form', () => {
    const issues = [
      { path: [], message: 'General form error' },
    ]
    const res = zodIssuesToFieldErrors(issues)
    expect(res._form).toBe('General form error')
  })

  it('returns empty object for valid data', () => {
    const validResult = studentSchema.safeParse({
      nisn: '1234567890',
      name: 'Ahmad',
      gender: 'L',
      class_id: 'a0000000-0000-4000-8000-000000000001',
      halaqah_id: 'b0000000-0000-4000-8000-000000000001',
      parent_name: 'Budi',
      parent_whatsapp: '081234567890',
      status: 'ACTIVE',
    })
    expect(validResult.success).toBe(true)
    if (validResult.success) {
      const fieldErrors = zodIssuesToFieldErrors([])
      expect(Object.keys(fieldErrors).length).toBe(0)
    }
  })
})
