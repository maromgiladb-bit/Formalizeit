import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { claimPendingSigners } from '@/lib/claimPendingSigners'

/**
 * Ensures the authenticated Clerk user has a corresponding database User record.
 * Handles three cases:
 *   1. User already exists by externalId (fast path — single indexed query)
 *   2. Placeholder user exists by email (invited user merge)
 *   3. No user exists at all (create new)
 */
export async function ensureDbUser(clerkUserId: string) {
  const include = {
    memberships: {
      include: { organization: true },
    },
  }

  // Fast path: user already linked by externalId
  const existing = await prisma.user.findUnique({
    where: { externalId: clerkUserId },
    include,
  })
  if (existing) return existing

  // Slow path: first time this Clerk user hits our DB
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!email) return null

  // Check if a placeholder user was created via invite
  const placeholder = await prisma.user.findUnique({
    where: { email },
    include,
  })

  if (placeholder) {
    // Merge: update placeholder externalId to real Clerk ID
    try {
      const merged = await prisma.user.update({
        where: { id: placeholder.id },
        data: {
          externalId: clerkUserId,
          name: clerkUser?.fullName || clerkUser?.firstName || placeholder.name,
          image: clerkUser?.imageUrl || placeholder.image,
        },
        include,
      })

      // Auto-set active org cookie for the invited user
      if (merged.memberships.length > 0) {
        const cookieStore = await cookies()
        const activeOrgId = cookieStore.get('active-org-id')?.value
        const hasValid = merged.memberships.some(m => m.organizationId === activeOrgId)
        if (!hasValid) {
          cookieStore.set('active-org-id', merged.memberships[0].organizationId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
          })
        }
      }

      // Claim any NDA signer records that were sent to this email before the user existed
      await claimPendingSigners(email, merged.id)

      return merged
    } catch {
      // Concurrent request may have already completed the merge
      const retried = await prisma.user.findUnique({
        where: { externalId: clerkUserId },
        include,
      })
      if (retried) return retried
      throw new Error('Failed to merge invited user')
    }
  }

  // No record at all: create new user
  const created = await prisma.user.create({
    data: {
      externalId: clerkUserId,
      email,
      name: clerkUser?.fullName || clerkUser?.firstName || email.split('@')[0],
      image: clerkUser?.imageUrl,
    },
    include,
  })

  // Claim any NDA signer records that were sent to this email before the user existed
  await claimPendingSigners(email, created.id)

  return created
}
