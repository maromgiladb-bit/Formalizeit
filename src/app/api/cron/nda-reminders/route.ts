import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl, signReminderEmailHtml } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * GET /api/cron/nda-reminders
 * Sends reminder emails to the receiver (Party B) of NDAs that have been sent for
 * signature but are not yet signed or declined.
 *  - First reminder: 48 hours after the NDA was sent.
 *  - Second reminder: 5 days after the NDA was sent.
 * Idempotent: NdaDraft.reminder48hSentAt / reminder5dSentAt are stamped after each
 * send so a re-run never duplicates a reminder.
 *
 * Protect with CRON_SECRET in production: Authorization: Bearer <CRON_SECRET>
 * Schedule daily (see vercel.json); the 48h / 5d windows are evaluated in code.
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const HOUR = 60 * 60 * 1000
    const DAY = 24 * HOUR
    const now = Date.now()
    const cutoff48h = new Date(now - 48 * HOUR) // sentAt <= this → 48h elapsed
    const cutoff5d = new Date(now - 5 * DAY) // sentAt <= this → 5 days elapsed

    // Drafts that are out for signature and not yet finalized.
    const AWAITING_STATES = ['AWAITING_PARTY_B_SIGNATURE', 'AWAITING_PARTY_A_SIGNATURE'] as const

    // Helper: find the receiver (Party B SIGNER) who still has to sign, plus the
    // sign link, for a given draft. Returns null when nobody is pending.
    type ReminderTarget = { email: string; signLink: string }

    async function receiverFor(draftId: string): Promise<ReminderTarget | null> {
        const signer = await prisma.signer.findFirst({
            where: {
                signRequest: { draftId },
                role: 'SIGNER',
                status: { notIn: ['SIGNED', 'DECLINED'] },
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true },
        })
        if (!signer?.email) return null
        return { email: signer.email, signLink: `${getAppUrl()}/sign-nda-public/${signer.id}` }
    }

    // ---- First reminder pass (48h) ----
    const due48h = await prisma.ndaDraft.findMany({
        where: {
            workflowState: { in: [...AWAITING_STATES] },
            reminder48hSentAt: null,
            sentAt: { not: null, lte: cutoff48h },
        },
        select: { id: true, title: true, createdBy: { select: { name: true } } },
    })

    let sent48h = 0
    for (const draft of due48h) {
        try {
            const target = await receiverFor(draft.id)
            if (!target) continue
            await sendEmail({
                to: target.email,
                subject: `Reminder: please sign ${draft.title || 'your NDA'}`,
                html: signReminderEmailHtml(draft.title || 'Untitled NDA', target.signLink, draft.createdBy?.name ?? undefined, false),
            })
            await prisma.ndaDraft.update({
                where: { id: draft.id },
                data: { reminder48hSentAt: new Date() },
            })
            sent48h++
        } catch (e) {
            console.error(`[nda-reminders] 48h reminder failed for draft ${draft.id}:`, e)
        }
    }

    // ---- Second reminder pass (5 days) ----
    const due5d = await prisma.ndaDraft.findMany({
        where: {
            workflowState: { in: [...AWAITING_STATES] },
            reminder5dSentAt: null,
            sentAt: { not: null, lte: cutoff5d },
        },
        select: { id: true, title: true, createdBy: { select: { name: true } } },
    })

    let sent5d = 0
    for (const draft of due5d) {
        try {
            const target = await receiverFor(draft.id)
            if (!target) continue
            await sendEmail({
                to: target.email,
                subject: `Second reminder: please sign ${draft.title || 'your NDA'}`,
                html: signReminderEmailHtml(draft.title || 'Untitled NDA', target.signLink, draft.createdBy?.name ?? undefined, true),
            })
            await prisma.ndaDraft.update({
                where: { id: draft.id },
                data: { reminder5dSentAt: new Date() },
            })
            sent5d++
        } catch (e) {
            console.error(`[nda-reminders] 5d reminder failed for draft ${draft.id}:`, e)
        }
    }

    return NextResponse.json({
        sent48h,
        sent5d,
        scanned: { reminder48h: due48h.length, reminder5d: due5d.length },
    })
}
