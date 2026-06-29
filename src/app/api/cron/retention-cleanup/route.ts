import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { deleteFromS3 } from '@/lib/s3'
import { sendEmail, getAppUrl } from '@/lib/email'
import { createNotificationsForAllOrgMembers } from '@/lib/notifications'

export const runtime = 'nodejs'

/**
 * GET /api/cron/retention-cleanup
 * Enforces the 5-year retention policy for FREE-plan signed NDAs.
 *  - Notice pass: 30 days before deletion, notify the company (email + in-app) once.
 *  - Delete pass: at 5 years, purge the document content + signed PDFs from S3 but
 *    keep the draft row and a minimal RETENTION_DELETED audit event for legal trail.
 * PRO/ENTERPRISE are retained indefinitely while the subscription is active.
 *
 * Protect with CRON_SECRET in production: Authorization: Bearer <CRON_SECRET>
 * Schedule daily (see vercel.json).
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    // Fail closed: a missing CRON_SECRET must block everyone (this endpoint deletes
    // data), not disable the only auth. Vercel cron sends Authorization: Bearer <secret>.
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const DAY = 24 * 60 * 60 * 1000
    const FIVE_YEARS = 5 * 365 * DAY
    const NOTICE_LEAD = 30 * DAY
    const now = Date.now()
    const deleteCutoff = new Date(now - FIVE_YEARS) // completedAt <= this → delete
    const noticeCutoff = new Date(now - FIVE_YEARS + NOTICE_LEAD) // within 30 days of deletion

    // ---- Notice pass ----
    const toNotify = await prisma.ndaDraft.findMany({
        where: {
            workflowState: 'COMPLETE',
            organization: { billingPlan: 'FREE' },
            retentionNoticeSentAt: null,
            completedAt: { lte: noticeCutoff, gt: deleteCutoff },
        },
        select: { id: true, title: true, organizationId: true, completedAt: true, createdBy: { select: { email: true } } },
    })

    let noticed = 0
    for (const draft of toNotify) {
        const deleteOn = draft.completedAt ? new Date(draft.completedAt.getTime() + FIVE_YEARS) : null
        const deleteOnLabel = deleteOn ? deleteOn.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'soon'
        const docName = draft.title || 'your NDA'

        try {
            await createNotificationsForAllOrgMembers(
                draft.organizationId,
                null,
                'NDA_COMPLETED',
                'Document scheduled for deletion',
                `${docName} reaches the 5-year free-plan retention limit on ${deleteOnLabel}. Download it or upgrade to keep it.`,
                `${getAppUrl()}/dashboard`,
                draft.id,
            )
            if (draft.createdBy?.email) {
                await sendEmail({
                    to: draft.createdBy.email,
                    subject: `Action needed: ${docName} will be deleted on ${deleteOnLabel}`,
                    html: `<p>${docName} reaches the 5-year retention limit for free accounts on <strong>${deleteOnLabel}</strong>.</p>
<p>To keep it, download a copy from your dashboard or upgrade your plan before that date. After deletion we retain only a minimal audit record.</p>
<p><a href="${getAppUrl()}/dashboard">Open your dashboard</a></p>`,
                })
            }
            await prisma.ndaDraft.update({
                where: { id: draft.id },
                data: { retentionNoticeSentAt: new Date() },
            })
            noticed++
        } catch (e) {
            console.error(`[retention] notice failed for draft ${draft.id}:`, e)
        }
    }

    // ---- Delete pass ----
    const toDelete = await prisma.ndaDraft.findMany({
        where: {
            workflowState: 'COMPLETE',
            organization: { billingPlan: 'FREE' },
            completedAt: { lte: deleteCutoff },
            content: { not: Prisma.DbNull }, // skip already-purged drafts
        },
        select: {
            id: true,
            organizationId: true,
            completedAt: true,
            signRequests: { select: { ndaPdfs: { select: { id: true, s3Key: true } } } },
        },
    })

    let deleted = 0
    for (const draft of toDelete) {
        try {
            const pdfs = draft.signRequests.flatMap(sr => sr.ndaPdfs)
            for (const pdf of pdfs) {
                if (pdf.s3Key) {
                    try {
                        await deleteFromS3(pdf.s3Key)
                    } catch (e) {
                        console.error(`[retention] S3 delete failed for ${pdf.s3Key}:`, e)
                    }
                }
            }
            await prisma.ndaPdf.deleteMany({ where: { id: { in: pdfs.map(p => p.id) } } })

            // Purge document content; keep the row + audit trail.
            await prisma.ndaDraft.update({
                where: { id: draft.id },
                data: { content: Prisma.DbNull, pendingInputFields: Prisma.DbNull },
            })

            await prisma.auditEvent.create({
                data: {
                    organizationId: draft.organizationId,
                    draftId: draft.id,
                    eventType: 'RETENTION_DELETED',
                    metadata: {
                        reason: '5-year free-plan retention',
                        completedAt: draft.completedAt?.toISOString() ?? null,
                        deletedPdfCount: pdfs.length,
                    },
                },
            })
            deleted++
        } catch (e) {
            console.error(`[retention] delete failed for draft ${draft.id}:`, e)
        }
    }

    return NextResponse.json({
        noticed,
        deleted,
        scanned: { notice: toNotify.length, delete: toDelete.length },
    })
}
