import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSignedS3Url } from '@/lib/s3'

export const runtime = 'nodejs'

/**
 * GET /api/ndas/viewpdf?draftId=xxx
 * Fetches a stored PDF from S3 via presigned URL redirect.
 * Used by dashboard "View PDF" buttons and email links.
 */
export async function GET(request: NextRequest) {
    try {
        const draftId = request.nextUrl.searchParams.get('draftId')

        if (!draftId) {
            return NextResponse.json(
                { error: 'Missing draftId parameter' },
                { status: 400 }
            )
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
