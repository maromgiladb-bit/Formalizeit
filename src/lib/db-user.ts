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
  if (existing) {
    // Honour a claim-by-token even for returning users (e.g. they signed an NDA
    // at a different address and came back to claim it).
    await claimSignerByCookie(existing.id)
    return existing
  }

  // Slow path: first time this Clerk user hits our DB
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!email) return null

  // All of the user's verified Clerk emails — so NDAs sent to any of them get claimed.
  const verifiedEmails = (clerkUser?.emailAddresses ?? [])
    .filter(e => e.verification?.status === 'verified')
    .map(e => e.emailAddress)
  const allEmails = verifiedEmails.length > 0 ? verifiedEmails : [email]

  // Check if a placeholder user was created via invite
  const placeholder = await prisma.user.findUnique({
    where: { email },
    include,
  })

  // --- Account Recovery ---
  // If this user deleted their account within the last 30 days and is re-registering
  // with the same email, restore their account (all NDAs, signers, memberships intact).
  if (placeholder?.status === 'pending_deletion') {
    const restored = await prisma.user.update({
      where: { id: placeholder.id },
      data: {
        externalId: clerkUserId,
        name: clerkUser?.fullName || clerkUser?.firstName || placeholder.name,
        image: clerkUser?.imageUrl || placeholder.image,
        deletedAt: null,
        status: 'active',
      },
      include,
    })
    return restored
  }

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

      // Claim any NDA signer records that were sent to this user before they existed
      await claimPendingSigners(allEmails, merged.id)
      await claimSignerByCookie(merged.id)

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

  // No record at all: create new user + personal org + administrator membership atomically
  const displayName = clerkUser?.fullName || clerkUser?.firstName || email.split('@')[0]
  const slugBase = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        externalId: clerkUserId,
        email,
        name: displayName,
        image: clerkUser?.imageUrl,
      },
    })

    const org = await tx.organization.create({
      data: {
        name: displayName,
        slug,
        ownerUserId: user.id,
      },
    })

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
        isSigner: true,
      },
    })

    return tx.user.findUnique({
      where: { id: user.id },
      include: { memberships: { include: { organization: true } } },
    })
  })

  if (!created) throw new Error('Failed to create user with personal organization')

  // Set active-org cookie so first request resolves immediately
  try {
    const cookieStore = await cookies()
    cookieStore.set('active-org-id', created.memberships[0].organizationId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  } catch {
    // cookies() may not be available in all contexts (e.g. webhooks) — skip silently
  }

  // Claim any NDA signer records that were sent to this user before they existed
  await claimPendingSigners(allEmails, created.id)
  await claimSignerByCookie(created.id)

  return created
}

/**
 * Claim-by-token: a counterparty who signed an NDA without an account may create
 * one from the public page. We stash the signer id in the `pending-claim-signer`
 * cookie there; here we bind that Signer to the new user regardless of which email
 * they signed up with, then clear the cookie. This covers the case where the
 * signup email differs from the address the NDA was sent to.
 */
async function claimSignerByCookie(userId: string): Promise<void> {
  // cookies() throws outside a request scope (e.g. Stripe webhooks, scripts). Since
  // ensureDbUser now runs this on every auth, treat an unavailable cookie store as
  // "nothing to claim" rather than letting it break user resolution.
  let cookieStore: Awaited<ReturnType<typeof cookies>>
  try {
    cookieStore = await cookies()
  } catch {
    return
  }
  const signerId = cookieStore.get('pending-claim-signer')?.value
  if (!signerId) return
  try {
    await prisma.signer.updateMany({
      where: { id: signerId, userId: null },
      data: { userId },
    })
  } catch (e) {
    console.error('[claimSignerByCookie] failed:', e)
  } finally {
    cookieStore.delete('pending-claim-signer')
  }
}
