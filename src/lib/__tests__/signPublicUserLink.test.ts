import { describe, it, expect, vi, beforeEach } from 'vitest'

// --------------------------------------------------------------------------
// Mock prisma – we test the user-linking logic from sign-public route in
// isolation by extracting it to a testable helper function format.
// --------------------------------------------------------------------------
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    signer: {
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

/**
 * This is the extracted logic from sign-public/route.ts that links a signer
 * to an existing user account by email after they sign.
 *
 * Keeping it as a standalone function makes it fully unit-testable without
 * needing to wire up the full Next.js request/response pipeline.
 */
async function linkSignerToUser(signerId: string, signerEmail: string): Promise<boolean> {
  const matchedUser = await prisma.user.findUnique({
    where: { email: signerEmail },
    select: { id: true },
  })

  if (matchedUser) {
    await prisma.signer.update({
      where: { id: signerId },
      data: { userId: matchedUser.id },
    })
    return true
  }

  return false
}

// --------------------------------------------------------------------------

describe('linkSignerToUser (sign-public user account linking)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('links userId when a user exists with the signer email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-uuid-abc' } as never)
    vi.mocked(prisma.signer.update).mockResolvedValue({} as never)

    const linked = await linkSignerToUser('signer-id-1', 'user@example.com')

    expect(linked).toBe(true)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: { id: true },
    })
    expect(prisma.signer.update).toHaveBeenCalledWith({
      where: { id: 'signer-id-1' },
      data: { userId: 'user-uuid-abc' },
    })
  })

  it('does NOT call signer.update when no user is found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const linked = await linkSignerToUser('signer-id-2', 'stranger@example.com')

    expect(linked).toBe(false)
    expect(prisma.signer.update).not.toHaveBeenCalled()
  })

  it('handles unknown user emails gracefully without throwing', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(linkSignerToUser('id', 'no@one.io')).resolves.toBe(false)
  })
})
