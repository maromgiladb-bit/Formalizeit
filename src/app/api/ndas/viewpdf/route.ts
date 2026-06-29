import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getSignedS3Url } from '@/lib/s3'

export const runtime = 'nodejs'

/**
 * GET /api/ndas/viewpdf?draftId=xxx   (authenticated) — dashboard "View PDF"
 * GET /api/ndas/viewpdf?signerId=xxx  (bearer token)  — counterparty / email links
 *
 * Access model (two paths, both authorized before any work is done):
 *  - draftId: caller must be logged in AND either an active member of the draft's
 *    organization or a signer linked to the draft.
 *  - signerId: the signer's UUID acts as a scoped bearer token (same model as the
 *    public sign link) granting access only to that signer's own NDA — no login needed.
 * Authorization runs first so the regenerate-on-demand branch (Puppeteer + S3 write)
 * can never be triggered by an unauthorized caller.
 */
export async function GET(request: NextRequest) {
    try {
        const draftIdParam = request.nextUrl.searchParams.get('draftId')
        const signerIdParam = request.nextUrl.searchParams.get('signerId')

        if (!draftIdParam && !signerIdParam) {
            return NextResponse.json(
                { error: 'Missing draftId or signerId parameter' },
                { status: 400 }
            )
        }

        // Resolve + authorize the target draft before doing any work.
        let draftId: string
        if (signerIdParam) {
            // Bearer-token path: a valid signer id grants access to its own NDA only.
            const signer = await prisma.signer.findUnique({
                where: { id: signerIdParam },
                select: { signRequest: { select: { draftId: true } } },
            })
            if (!signer?.signRequest?.draftId) {
                return NextResponse.json({ error: 'NDA not found' }, { status: 404 })
            }
            draftId = signer.signRequest.draftId
        } else {
            // Authenticated path: require login + membership or a linked signer on this draft.
            const { userId } = await auth()
            if (!userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            const dbUser = await prisma.user.findUnique({
                where: { externalId: userId },
                select: { id: true },
            })
            if (!dbUser) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            const draft = await prisma.ndaDraft.findUnique({
                where: { id: draftIdParam! },
                select: { organizationId: true },
            })
            if (!draft) {
                return NextResponse.json({ error: 'NDA not found' }, { status: 404 })
            }
            const [membership, linkedSigner] = await Promise.all([
                prisma.membership.findFirst({
                    where: { userId: dbUser.id, organizationId: draft.organizationId, status: 'ACTIVE' },
                    select: { id: true },
                }),
                prisma.signer.findFirst({
                    where: { userId: dbUser.id, signRequest: { draftId: draftIdParam! } },
                    select: { id: true },
                }),
            ])
            if (!membership && !linkedSigner) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
            draftId = draftIdParam!
        }

        // Find the latest sign request for this draft
        const signRequest = await prisma.signRequest.findFirst({
            where: { draftId },
            orderBy: { createdAt: 'desc' },
            include: {
                ndaPdfs: {
                    orderBy: { createdAt: 'desc' },
                },
                draft: {
                    select: { content: true, templateId: true, title: true, workflowState: true },
                },
            },
        })

        // Prefer a stored SIGNED PDF, fall back to SENT.
        let pdf =
            signRequest?.ndaPdfs.find((p) => p.kind === 'SIGNED') ||
            signRequest?.ndaPdfs.find((p) => p.kind === 'SENT')

        // Regenerate-on-demand fallback: completed NDAs whose SIGNED PDF was never
        // persisted (e.g. an earlier storeNdaPdf failure, or pre-dating PDF storage)
        // would otherwise 404 here. Rebuild the signed PDF from the draft content,
        // store it, and serve it.
        if (
            signRequest &&
            (!pdf || !pdf.s3Key) &&
            signRequest.draft?.workflowState === 'COMPLETE' &&
            signRequest.draft.content
        ) {
            try {
                const { renderNdaHtml } = await import('@/lib/renderNdaHtml')
                const { renderHtmlToPdf } = await import('@/lib/htmlToPdf')
                const { storeNdaPdf } = await import('@/lib/storeNdaPdf')
                const { getAppUrl } = await import('@/lib/email')

                const html = await renderNdaHtml(
                    signRequest.draft.content as Record<string, unknown>,
                    signRequest.draft.templateId || 'professional_mutual_nda_v1'
                )
                const pdfBuffer = await renderHtmlToPdf(html, {
                    pageWidthPx: 900,
                    baseUrl: getAppUrl(),
                    isA4: true,
                })

                await storeNdaPdf({ signRequestId: signRequest.id, kind: 'SIGNED', pdfBuffer })
                console.log('✅ Regenerated missing SIGNED PDF for draft', draftId)

                pdf = (await prisma.ndaPdf.findUnique({
                    where: { signRequestId_kind: { signRequestId: signRequest.id, kind: 'SIGNED' } },
                })) ?? undefined
            } catch (regenError) {
                console.error('❌ Failed to regenerate SIGNED PDF:', regenError)
            }
        }

        if (!pdf || !pdf.s3Key) {
            return NextResponse.json(
                { error: 'No PDF found for this NDA' },
                { status: 404 }
            )
        }

        // Generate a presigned URL (valid for 5 minutes)
        const presignedUrl = await getSignedS3Url(pdf.s3Key, 300)

        // Redirect to the presigned URL so the browser opens the PDF
        return NextResponse.redirect(presignedUrl)
    } catch (error) {
        console.error('❌ Error fetching PDF:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch PDF',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
