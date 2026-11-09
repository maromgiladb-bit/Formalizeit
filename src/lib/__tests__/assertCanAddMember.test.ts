import { describe, it, expect, vi, beforeEach } from 'vitest'

const flags = vi.hoisted(() => ({ paid: true }))

vi.mock('@/lib/featureFlags', () => ({
  get PAID_PLANS_ENABLED() { return flags.paid },
  BETA_LABEL: true,
  FORMI_ENABLED: false,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { organization: { findUnique: vi.fn() } },
}))

import { assertCanAddMember } from '@/organizations/limits'
import { prisma } from '@/lib/prisma'

const mockFindOrg = vi.mocked(prisma.organization.findUnique)

function org(billingPlan: string, members: number) {
  return { id: 'o', billingPlan, settings: null, _count: { memberships: members } } as any
}

describe('assertCanAddMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flags.paid = true
  })

  it('paid plans on: FREE is capped at 1 user', async () => {
    mockFindOrg.mockResolvedValue(org('FREE', 1))
    await expect(assertCanAddMember('o')).rejects.toThrow('maximum number of users')
  })

  it('beta: FREE allows up to 10 users', async () => {
    flags.paid = false
    mockFindOrg.mockResolvedValue(org('FREE', 9))
    await expect(assertCanAddMember('o')).resolves.toBeUndefined()
  })

  it('beta: FREE is blocked at 10 users', async () => {
    flags.paid = false
    mockFindOrg.mockResolvedValue(org('FREE', 10))
    await expect(assertCanAddMember('o')).rejects.toThrow('maximum number of users')
  })

  it('beta: PRO stays at 1 user', async () => {
    flags.paid = false
    mockFindOrg.mockResolvedValue(org('PRO', 1))
    await expect(assertCanAddMember('o')).rejects.toThrow('maximum number of users')
  })
})
