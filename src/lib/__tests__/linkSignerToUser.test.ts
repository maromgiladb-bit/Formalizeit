import { describe, it, expect, vi, beforeEach } from 'vitest'

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
import { linkSignerToUser } from '@/lib/linkSignerToUser'

describe('linkSignerToUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('links userId when a user exists with the signer email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-uuid-abc' } as never)
    vi.mocked(prisma.signer.update).mockResolvedValue({} as never)

    const result = await linkSignerToUser('signer-id-1', 'user@example.com')

    expect(result).toEqual({ linked: true, userId: 'user-uuid-abc' })
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

    const result = await linkSignerToUser('signer-id-2', 'stranger@example.com')

    expect(result).toEqual({ linked: false, userId: null })
    expect(prisma.signer.update).not.toHaveBeenCalled()
  })

  it('handles unknown user emails gracefully without throwing', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(linkSignerToUser('id', 'no@one.io')).resolves.toEqual({
      linked: false,
      userId: null,
    })
  })

  it('normalises mixed-case email before querying', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-uuid-xyz' } as never)
    vi.mocked(prisma.signer.update).mockResolvedValue({} as never)

    await linkSignerToUser('signer-id-3', 'User@Example.COM')

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: { id: true },
    })
  })

  it('trims whitespace from email before querying', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-uuid-trim' } as never)
    vi.mocked(prisma.signer.update).mockResolvedValue({} as never)

    await linkSignerToUser('signer-id-4', '  user@example.com  ')

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: { id: true },
    })
  })
})
