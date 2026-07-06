import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/cron/expire-sign-links
 * Marks stale signing links as EXPIRED. Signing tokens (the `Signer.id` used in
 * public sign/review/fill links) carry a 2-week `expiresAt`. Read-time guards on
 * the sign page and sign-public API are the source of truth; this sweep keeps the
 * stored status accurate so the dashboard can surface a "Resend NDA" action and
 * reporting reflects reality.
 *
 * A signer is expired when `expiresAt < now` and it is still open
 * (PENDING/SENT/VIEWED). When every signer on a SignRequest is terminal
 * (EXPIRED/SIGNED/DECLINED) and at least one is EXPIRED, the parent SignRequest is
 * marked EXPIRED too.
 *
 * Protect with CRON_SECRET in production: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  // Fail closed: a missing CRON_SECRET must block everyone, not disable the only auth.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Expire open signers whose link has lapsed.
  const staleSigners = await prisma.signer.findMany({
    where: {
      expiresAt: { not: null, lt: now },
      status: { in: ['PENDING', 'SENT', 'VIEWED'] },
    },
    select: { id: true, signRequestId: true },
  })

  // Expire every stale signer in one statement, then derive the affected
  // SignRequests from the rows we already fetched (avoids an N+1 update loop).
  const affectedRequestIds = new Set(staleSigners.map((s) => s.signRequestId))
  const { count: signersExpired } = staleSigners.length
    ? await prisma.signer.updateMany({
        where: { id: { in: staleSigners.map((s) => s.id) } },
        data: { status: 'EXPIRED' },
      })
    : { count: 0 }

  // Mark a SignRequest EXPIRED when all its signers are terminal and none remain open.
  let requestsExpired = 0
  for (const requestId of affectedRequestIds) {
    try {
      const openCount = await prisma.signer.count({
        where: { signRequestId: requestId, status: { in: ['PENDING', 'SENT', 'VIEWED'] } },
      })
      if (openCount > 0) continue

      const signedCount = await prisma.signer.count({
        where: { signRequestId: requestId, status: 'SIGNED' },
      })
      // Don't override an already-completed request.
      const request = await prisma.signRequest.findUnique({
        where: { id: requestId },
        select: { status: true, signers: { select: { id: true } } },
      })
      if (!request || request.status === 'SIGNED') continue
      if (signedCount === request.signers.length) continue

      await prisma.signRequest.update({ where: { id: requestId }, data: { status: 'EXPIRED' } })
      requestsExpired++
    } catch (e) {
      console.error(`[expire-sign-links] failed to expire sign request ${requestId}:`, e)
    }
  }

  return NextResponse.json({
    signersExpired,
    requestsExpired,
    scanned: staleSigners.length,
  })
}
