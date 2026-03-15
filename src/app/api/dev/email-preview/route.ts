import { NextRequest, NextResponse } from 'next/server';
import {
    recipientEditEmailHtml,
    ownerReviewEmailHtml,
    finalSignedEmailHtml,
    recipientSignRequestEmailHtml,
    timeToSignEmailHtml,
    congratulationsEmailHtml,
} from '@/lib/email';

// Sample data for previews
const sampleData = {
    draftTitle: 'Mutual NDA - Acme Corp & Beta Industries',
    editLink: 'http://localhost:3000/fillndahtml-public/sample-token',
    signLink: 'http://localhost:3000/sign-nda-public/sample-token',
    downloadLink: 'http://localhost:3000/api/ndas/download/sample-id',
    reviewLink: 'http://localhost:3000/review-changes/sample-token',
    ownerMessage: 'Please review the terms carefully and let me know if you have any questions.',
    signerName: 'Jane Doe from Beta Industries',
    senderName: 'John Smith from Acme Corporation',
    revisionNumber: 2,
    changes: [
        { field: 'Governing Law', before: 'California', after: 'New York' },
        { field: 'Term Years', before: '2 years', after: '3 years' },
        { field: 'Party 2 Address', before: '123 Old Street', after: '456 New Avenue, Suite 100' },
        { field: 'Information Scope', before: 'General business information', after: 'All technical and business information including trade secrets' },
    ],
};

export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    try {
        const { templateId } = await request.json();

        let html = '';

        switch (templateId) {
            case 'recipientEdit':
                html = recipientEditEmailHtml(
                    sampleData.draftTitle,
                    sampleData.editLink,
                    sampleData.ownerMessage,
                    sampleData.senderName
                );
                break;

            case 'ownerReview':
                html = ownerReviewEmailHtml(
                    sampleData.draftTitle,
                    sampleData.revisionNumber,
                    sampleData.reviewLink,
                    sampleData.changes
                );
                break;

            case 'finalSigned':
                html = finalSignedEmailHtml(
                    sampleData.draftTitle,
                    sampleData.downloadLink
                );
                break;

            case 'recipientSignRequest':
                html = recipientSignRequestEmailHtml(
                    sampleData.draftTitle,
                    sampleData.signLink
                );
                break;

            case 'timeToSign':
                html = timeToSignEmailHtml(
                    sampleData.draftTitle,
                    sampleData.signLink,
                    sampleData.signerName
                );
                break;

            case 'congratulations':
                html = congratulationsEmailHtml(
                    sampleData.draftTitle,
                    sampleData.downloadLink
                );
                break;

            default:
                return NextResponse.json({ error: 'Unknown template ID' }, { status: 400 });
        }

        return NextResponse.json({ html });
    } catch (error) {
        console.error('Email preview error:', error);
        return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }
}
