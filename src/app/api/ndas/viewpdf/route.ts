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
            },
        })

        if (!signRequest || signRequest.ndaPdfs.length === 0) {
            return NextResponse.json(
                { error: 'No PDF found for this NDA' },
                { status: 404 }
            )
        }

        // Prefer SIGNED PDF, fall back to SENT
        const pdf =
            signRequest.ndaPdfs.find((p) => p.kind === 'SIGNED') ||
            signRequest.ndaPdfs.find((p) => p.kind === 'SENT')

        if (!pdf || !pdf.s3Key) {
            return NextResponse.json(
                { error: 'PDF record found but no S3 key' },
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
