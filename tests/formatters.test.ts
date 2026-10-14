import { describe, it, expect } from 'vitest'
import {
  optionLabel,
  getGenderOptions,
  resolveHalaqahOnClassChange,
  withUstadzTitle,
  buildHalaqahLabel,
} from '../lib/formatters'

describe('formatters & optionLabel', () => {
  const mockOptions = [
    { value: 'uuid-7', label: 'Kelas 7' },
    { value: 'uuid-8', label: 'Kelas 8' },
  ]

  it('returns option label when value is known', () => {
    expect(optionLabel(mockOptions, 'uuid-7', 'Pilih...')).toBe('Kelas 7')
  })

  it('returns placeholder when value is unknown UUID', () => {
    expect(optionLabel(mockOptions, 'uuid-999', 'Pilih kelas')).toBe('Pilih kelas')
  })

  it('returns placeholder when value is null, undefined, or empty string', () => {
    expect(optionLabel(mockOptions, null, 'Pilih kelas')).toBe('Pilih kelas')
    expect(optionLabel(mockOptions, undefined, 'Pilih kelas')).toBe('Pilih kelas')
    expect(optionLabel(mockOptions, '', 'Pilih kelas')).toBe('Pilih kelas')
  })

  it('never returns raw UUID when unknown', () => {
    const result = optionLabel(mockOptions, 'unknown-uuid-xyz', 'Pilih kelas')
    expect(result).not.toBe('unknown-uuid-xyz')
    expect(result).toBe('Pilih kelas')
  })

  it('formats gender options correctly', () => {
    const genderOpts = getGenderOptions()
    expect(optionLabel(genderOpts, 'L', 'Pilih JK')).toBe('Laki-laki')
    expect(optionLabel(genderOpts, 'P', 'Pilih JK')).toBe('Perempuan')
    expect(optionLabel(genderOpts, 'X', 'Pilih JK')).toBe('Pilih JK')
  })

  it('resets halaqah when class changes if halaqah does not belong to new class', () => {
    const halaqahs = [
      { id: 'h1', class_id: 'class-7' },
      { id: 'h2', class_id: 'class-8' },
    ]
    expect(resolveHalaqahOnClassChange('class-8', 'h1', halaqahs)).toBe('')
    expect(resolveHalaqahOnClassChange('class-8', 'h2', halaqahs)).toBe('h2')
    expect(resolveHalaqahOnClassChange('class-8', '', halaqahs)).toBe('')
  })
})

describe('withUstadzTitle', () => {
  it('adds Ust. title when missing or with spaces', () => {
    expect(withUstadzTitle('Zaki')).toBe('Ust. Zaki')
    expect(withUstadzTitle('  Zaki  ')).toBe('Ust. Zaki')
  })

  it('keeps existing title variations without duplicating', () => {
    expect(withUstadzTitle('Ust. Zaki')).toBe('Ust. Zaki')
    expect(withUstadzTitle('ust Zaki')).toBe('ust Zaki')
    expect(withUstadzTitle('UST. Zaki')).toBe('UST. Zaki')
    expect(withUstadzTitle('Ust.Zaki')).toBe('Ust.Zaki')
    expect(withUstadzTitle('Ustad Zaki')).toBe('Ustad Zaki')
    expect(withUstadzTitle('Ustadz Zaki')).toBe('Ustadz Zaki')
    expect(withUstadzTitle('Ustadzah Siti')).toBe('Ustadzah Siti')
    expect(withUstadzTitle('Ustaz Zaki')).toBe('Ustaz Zaki')
    expect(withUstadzTitle('Ustazah Siti')).toBe('Ustazah Siti')
  })

  it('does not treat words starting with Ust as titles', () => {
    expect(withUstadzTitle('Ustman Hakim')).toBe('Ust. Ustman Hakim')
    expect(withUstadzTitle('Ustiawan')).toBe('Ust. Ustiawan')
  })

  it('returns empty string for empty, whitespace, or null', () => {
    expect(withUstadzTitle('')).toBe('')
    expect(withUstadzTitle('   ')).toBe('')
    expect(withUstadzTitle(null)).toBe('')
    expect(withUstadzTitle(undefined)).toBe('')
  })
})

describe('buildHalaqahLabel', () => {
  it('formats halaqah label with teacher name', () => {
    expect(buildHalaqahLabel('Halaqah 12B', 'Luwar Haikal')).toBe('Halaqah 12B (Ust. Luwar Haikal)')
  })

  it('does not duplicate title if teacher name already has Ust.', () => {
    expect(buildHalaqahLabel('Halaqah 12B', 'Ust. Luwar Haikal')).toBe('Halaqah 12B (Ust. Luwar Haikal)')
    expect(buildHalaqahLabel('Halaqah 12B', 'Ustadz Luwar Haikal')).toBe('Halaqah 12B (Ustadz Luwar Haikal)')
  })

  it('returns halaqah name alone if teacher name is empty, whitespace, null, or undefined', () => {
    expect(buildHalaqahLabel('Halaqah 12B', '')).toBe('Halaqah 12B')
    expect(buildHalaqahLabel('Halaqah 12B', '   ')).toBe('Halaqah 12B')
    expect(buildHalaqahLabel('Halaqah 12B', null)).toBe('Halaqah 12B')
    expect(buildHalaqahLabel('Halaqah 12B', undefined)).toBe('Halaqah 12B')
  })
})
