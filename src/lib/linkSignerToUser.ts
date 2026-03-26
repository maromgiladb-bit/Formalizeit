import { prisma } from '@/lib/prisma'

/**
 * Links a Signer record to an existing User account by matching on email
 * (case-insensitive). Called after a public-link signature is submitted.
 *
 * Returns `{ linked: true, userId }` if a matching user was found and the
 * Signer row was updated, or `{ linked: false, userId: null }` otherwise.
 *
 * This is intentionally non-throwing so callers can wrap it in a try/catch
 * and treat a failure as non-critical (signing must still succeed).
 */
export async function linkSignerToUser(
  signerId: string,
  signerEmail: string
): Promise<{ linked: boolean; userId: string | null }> {
  try {
    const normalizedEmail = signerEmail.trim().toLowerCase()

    const matchedUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (matchedUser) {
      await prisma.signer.update({
        where: { id: signerId },
        data: { userId: matchedUser.id },
      })
      return { linked: true, userId: matchedUser.id }
    }

    return { linked: false, userId: null }
  } catch (_error) {
    // Intentionally non-throwing: treat any Prisma/database error as a non-critical failure.
    return { linked: false, userId: null }
  }
}
