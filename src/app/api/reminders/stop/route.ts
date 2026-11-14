import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAppUrl } from '@/lib/email'
import { verifyReminderStopToken } from '@/lib/reminderOptOut'

export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function stop(draftId: string, token: string): Promise<boolean> {
  if (!UUID_RE.test(draftId) || !verifyReminderStopToken(draftId, token)) return false
  // Idempotent: only stamps the first time. Does not touch the signing link or any
  // other email (round notifications and the signed copy still go out).
  await prisma.ndaDraft.updateMany({
    where: { id: draftId, remindersStoppedAt: null },
    data: { remindersStoppedAt: new Date() },
  })
  return true
}

/**
 * GET never changes state (email scanners prefetch links). Old/bookmarked links
 * are forwarded to the confirmation page, where the person presses the button.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const qs = new URLSearchParams({ d: url.searchParams.get('d') ?? '', t: url.searchParams.get('t') ?? '' })
  return NextResponse.redirect(`${getAppUrl()}/reminders-stopped/confirm?${qs}`, 303)
}

/**
 * POST stops the reminders. Two callers:
 *  - the confirmation page form (sends `redirect=1`) -> 303 to the result page
 *  - mail-client one-click unsubscribe (no `redirect`) -> JSON
 */
export async function POST(req: Request) {
  const url = new URL(req.url)
  const ok = await stop(url.searchParams.get('d') ?? '', url.searchParams.get('t') ?? '')

  let wantsRedirect = false
  try {
    wantsRedirect = (await req.formData()).get('redirect') === '1'
  } catch {
    // Not a form body (e.g. JSON / empty): treat as one-click.
  }
  if (wantsRedirect) {
    return NextResponse.redirect(`${getAppUrl()}/reminders-stopped${ok ? '' : '?status=invalid'}`, 303)
  }
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 })
}
