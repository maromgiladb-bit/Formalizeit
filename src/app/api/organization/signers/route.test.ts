import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    membership: { findMany: vi.fn() },
  },
}))
vi.mock('@/lib/db-organization', () => ({ getActiveOrganization: vi.fn() }))

import { GET } from './route'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'

const mockAuth = vi.mocked(auth)
const mockUser = vi.mocked(prisma.user.findUnique)
const mockMemberships = vi.mocked(prisma.membership.findMany)
const mockActiveOrg = vi.mocked(getActiveOrganization)

describe('GET /api/organization/signers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'clerk-cur' } as any)
    mockActiveOrg.mockResolvedValue({ organizationId: 'org-1' } as any)
    mockUser.mockResolvedValue({ id: 'cur-user' } as any)
  })

  it('returns authorized signers excluding the current user', async () => {
    mockMemberships.mockResolvedValue([
      { user: { id: 'cur-user', name: 'Me', email: 'me@test.com' } },
      { user: { id: 's1', name: 'Signer One', email: 's1@test.com' } },
      { user: { id: 's2', name: '', email: 's2@test.com' } },
    ] as any)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.signers).toEqual([
      { id: 's1', name: 'Signer One', email: 's1@test.com' },
      { id: 's2', name: '', email: 's2@test.com' },
    ])
  })

  it('omits members with no email', async () => {
    mockMemberships.mockResolvedValue([
      { user: { id: 's1', name: 'Signer One', email: 's1@test.com' } },
      { user: { id: 's3', name: 'No Email', email: '' } },
    ] as any)

    const res = await GET()
    const data = await res.json()

    expect(data.signers).toEqual([{ id: 's1', name: 'Signer One', email: 's1@test.com' }])
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 404 when there is no active organization', async () => {
    mockActiveOrg.mockResolvedValue(null as any)
    const res = await GET()
    expect(res.status).toBe(404)
  })
})
