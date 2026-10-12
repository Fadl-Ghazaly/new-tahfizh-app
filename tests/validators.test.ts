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
