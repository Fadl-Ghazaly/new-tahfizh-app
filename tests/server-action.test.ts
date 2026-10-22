import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })) }))
vi.mock('server-only', () => ({}))

const { mockAuthUser, mockProfile, mockHalaqahs, mockTeacherUpdate } = vi.hoisted(() => ({
  mockAuthUser: { id: 'admin-1' },
  mockProfile: { role: 'ADMIN', is_active: true },
  mockHalaqahs: [] as { name: string; is_active: boolean }[],
  mockTeacherUpdate: vi.fn<(payload: unknown) => void>(() => {}),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockAuthUser }, error: null })),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn(async () => ({ data: mockProfile, error: null })),
            }),
          }),
        }
      }
      if (table === 'halaqahs') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                then: (cb: (res: { data: { name: string }[]; error: null }) => unknown) =>
                  cb({
                    data: mockHalaqahs.filter((h) => h.is_active),
                    error: null,
                  }),
              }),
            }),
          }),
        }
      }
      if (table === 'teachers') {
        return {
          update: (payload: unknown) => {
            mockTeacherUpdate(payload)
            return {
              eq: vi.fn(async () => ({ error: null })),
            }
          },
          insert: vi.fn(async () => ({ error: null })),
        }
      }
      return {}
    }),
  })),
}))

import { setTeacherStatus, updateTeacher } from '../app/(app)/ustadz/actions'
import { mapDbError } from '../lib/validators/list-params'

describe('Comprehensive Ustadz Server Actions Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthUser.id = 'admin-1'
    mockProfile.role = 'ADMIN'
    mockProfile.is_active = true
    mockHalaqahs.length = 0
  })

  it('(a) setTeacherStatus denied for non-admin without any write calls', async () => {
    mockProfile.role = 'USTADZ'
    const res = await setTeacherStatus('t1', false)
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/Akses ditolak/)
    expect(mockTeacherUpdate).not.toHaveBeenCalled()
  })

  it('(b) setTeacherStatus denied if active halaqahs exist and update is NOT called', async () => {
    mockHalaqahs.push({ name: 'Halaqah 7A', is_active: true })
    const res = await setTeacherStatus('t1', false)
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/Ustadz ini masih mengampu Halaqah 7A/)
    expect(mockTeacherUpdate).not.toHaveBeenCalled()
  })

  it('(c) setTeacherStatus allowed if halaqah is inactive', async () => {
    mockHalaqahs.push({ name: 'Halaqah 7A', is_active: false })
    const res = await setTeacherStatus('t1', false)
    expect(res.ok).toBe(true)
    expect(mockTeacherUpdate).toHaveBeenCalledWith({ is_active: false })
  })

  it('(d) reactivating teacher (is_active = true) is always allowed without halaqah checks', async () => {
    mockHalaqahs.push({ name: 'Halaqah 7A', is_active: true })
    const res = await setTeacherStatus('t1', true)
    expect(res.ok).toBe(true)
    expect(mockTeacherUpdate).toHaveBeenCalledWith({ is_active: true })
  })

  it('(e) updateTeacher ignores is_active and correctly normalizes whatsapp and boarding school', async () => {
    const input = {
      name: 'Ustadz Zaki',
      gender: 'L',
      whatsapp: '+6281234567890',
      boarding_school: '',
      is_active: false,
    }
    const res = await updateTeacher('t1', input)
    expect(res.ok).toBe(true)
    expect(mockTeacherUpdate).toHaveBeenCalledTimes(1)
    const payload = (mockTeacherUpdate.mock.calls as unknown[][])[0]?.[0] as Record<string, unknown>
    expect(payload).not.toHaveProperty('is_active')
    expect(payload.whatsapp).toBe('081234567890')
    expect(payload.boarding_school).toBeNull()
  })

  it('(f) database error is mapped via mapDbError without exposing original message', async () => {
    const rawError = { code: '23505', message: 'duplicate key value violates unique constraint "teachers_pkey"' }
    const mapped = mapDbError(rawError, 'ustadz')
    expect(mapped).toBe('Data duplikat terdeteksi.')
    expect(mapped).not.toContain('teachers_pkey')
    expect(mapped).not.toContain('duplicate key value')
  })
})
