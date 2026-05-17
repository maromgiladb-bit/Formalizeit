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
    signerName: 'Jane Doe',
    signerCompany: 'Beta Industries',
    senderName: 'John Smith',
    senderCompany: 'Acme Corporation',
    revisionNumber: 2,
    changes: [
        { field: 'Governing Law', before: 'California', after: 'New York' },
        { field: 'Term Years', before: '2 years', after: '3 years' },
        { field: 'Party 2 Address', before: '123 Old Street', after: '456 New Avenue, Suite 100' },
        { field: 'Information Scope', before: 'General business information', after: 'All technical and business information including trade secrets' },
    ],
};

interface EmailMeta {
    html: string;
    subject: string;
    from: string;
    to: string;
}

export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    try {
        const { templateId } = await request.json();

        let result: EmailMeta | null = null;

        switch (templateId) {
            case 'recipientEdit':
                result = {
                    subject: `${sampleData.senderName} from ${sampleData.senderCompany} sent you an NDA to review`,
                    from: `${sampleData.senderName} via Formalize It <noreply@formalizeit.app>`,
                    to: `Party B (recipient) <partyb@example.com>`,
                    html: recipientEditEmailHtml(
                        sampleData.draftTitle,
                        sampleData.editLink,
                        sampleData.ownerMessage,
                        sampleData.senderName
                    ),
                };
                break;

            case 'ownerReview':
                result = {
                    subject: `Review requested – ${sampleData.signerName} from ${sampleData.signerCompany} made changes to the NDA`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `${sampleData.senderName} (Party A) <partya@example.com>`,
                    html: ownerReviewEmailHtml(
                        sampleData.draftTitle,
                        sampleData.revisionNumber,
                        sampleData.reviewLink,
                        sampleData.changes
                    ),
                };
                break;

            case 'finalSigned':
                result = {
                    subject: `Congratulations! Your NDA is complete`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `Both parties`,
                    html: finalSignedEmailHtml(
                        sampleData.draftTitle,
                        sampleData.downloadLink
                    ),
                };
                break;

            case 'recipientSignRequest':
                result = {
                    subject: `${sampleData.senderName} from ${sampleData.senderCompany} sent you an NDA to sign`,
                    from: `${sampleData.senderName} via Formalize It <noreply@formalizeit.app>`,
                    to: `Party B (recipient) <partyb@example.com>`,
                    html: recipientSignRequestEmailHtml(
                        sampleData.draftTitle,
                        sampleData.signLink
                    ),
                };
                break;

            case 'timeToSign':
                result = {
                    subject: `Time to sign! ${sampleData.signerName} from ${sampleData.signerCompany} has already signed the NDA`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `${sampleData.senderName} (Party A) <partya@example.com>`,
                    html: timeToSignEmailHtml(
                        sampleData.draftTitle,
                        sampleData.signLink,
                        `${sampleData.signerName} from ${sampleData.signerCompany}`
                    ),
                };
                break;

            case 'congratulations':
                result = {
                    subject: `Congratulations! Your NDA is complete`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `Both parties`,
                    html: congratulationsEmailHtml(
                        sampleData.draftTitle,
                        sampleData.downloadLink
                    ),
                };
                break;

            default:
                return NextResponse.json({ error: 'Unknown template ID' }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Email preview error:', error);
        return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }
}
