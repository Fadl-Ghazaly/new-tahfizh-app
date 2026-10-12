import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only
vi.mock('server-only', () => ({}))

// State tiruan dengan vi.hoisted
const { mockAuthState, mockProfileState } = vi.hoisted(() => {
  return {
    mockAuthState: {
      user: null as { id: string } | null,
      error: null as { message: string } | null,
    },
    mockProfileState: {
      data: null as { role: string; is_active: boolean } | null,
      error: null as { message: string } | null,
    },
  }
})

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
  })),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockAuthState.user },
        error: mockAuthState.error,
      })),
    },
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          single: vi.fn(async () => ({
            data: mockProfileState.data,
            error: mockProfileState.error,
          })),
        }),
      }),
    })),
  })),
}))

import { requireAdmin } from '../lib/auth/require-admin'

describe('requireAdmin Helper Guard', () => {
  beforeEach(() => {
    mockAuthState.user = null
    mockAuthState.error = null
    mockProfileState.data = null
    mockProfileState.error = null
  })

  it('rejects unauthenticated user', async () => {
    mockAuthState.user = null
    const res = await requireAdmin()
    expect(res.error).toMatch(/Unauthorized/)
    expect(res.supabase).toBeNull()
  })

  it('rejects user without profile', async () => {
    mockAuthState.user = { id: 'u1' }
    mockProfileState.data = null
    mockProfileState.error = { message: 'Not found' }
    const res = await requireAdmin()
    expect(res.error).toMatch(/Profil pengguna tidak ditemukan/)
    expect(res.supabase).toBeNull()
  })

  it('rejects non-admin role (e.g. USTADZ)', async () => {
    mockAuthState.user = { id: 'u1' }
    mockProfileState.data = { role: 'USTADZ', is_active: true }
    const res = await requireAdmin()
    expect(res.error).toMatch(/Hanya Admin aktif/)
    expect(res.supabase).toBeNull()
  })

  it('rejects inactive admin', async () => {
    mockAuthState.user = { id: 'u1' }
    mockProfileState.data = { role: 'ADMIN', is_active: false }
    const res = await requireAdmin()
    expect(res.error).toMatch(/Hanya Admin aktif/)
    expect(res.supabase).toBeNull()
  })

  it('allows active admin', async () => {
    mockAuthState.user = { id: 'u1' }
    mockProfileState.data = { role: 'ADMIN', is_active: true }
    const res = await requireAdmin()
    expect(res.error).toBeNull()
    expect(res.supabase).not.toBeNull()
    expect(res.user?.id).toBe('u1')
  })
})
