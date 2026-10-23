'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { LEGAL_VERSION } from '@/lib/legalVersions'

/** Records the current user's acceptance of the current Terms + Privacy Policy. */
export async function acceptTerms(): Promise<{ ok: boolean }> {
  const { userId } = await auth()
  if (!userId) return { ok: false }
  const result = await prisma.user.updateMany({
    where: { externalId: userId },
    data: { termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION },
  })
  return { ok: result.count > 0 }
}
