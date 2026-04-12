import { NextRequest, NextResponse } from 'next/server';
import {
    recipientEditEmailHtml,
    ownerReviewEmailHtml,
    finalSignedEmailHtml,
    recipientSignRequestEmailHtml,
    timeToSignEmailHtml,
    congratulationsEmailHtml,
    partyBSuggestionsEmailHtml,
    partyARequestChangesEmailHtml,
    recipientInputSubmittedEmailHtml,
    inviteEmailHtml,
    approvalRequestEmailHtml,
    approvalApprovedEmailHtml,
    approvalRejectedEmailHtml,
    inputRequestEmailHtml,
} from '@/lib/email';

// Sample data for previews
const sampleData = {
    draftTitle: 'Mutual NDA - Acme Corp & Beta Industries',
    editLink: 'http://localhost:3000/fillndahtml-public/sample-token',
    signLink: 'http://localhost:3000/sign-nda-public/sample-token',
    downloadLink: 'http://localhost:3000/api/ndas/download/sample-id',
    reviewLink: 'http://localhost:3000/review-changes/sample-token',
    draftLink: 'http://localhost:3000/fillndahtml/sample-id',
    signUpLink: 'http://localhost:3000/signup?invite=sample-token',
    ownerMessage: 'Please review the terms carefully and let me know if you have any questions.',
    signerName: 'Jane Doe',
    senderName: 'John Smith',
    partyBName: 'Jane Doe',
    partyBEmail: 'jane@betaindustries.com',
    approverName: 'Sarah Johnson',
    submitterName: 'Alex Chen',
    inviterName: 'John Smith',
    orgName: 'Acme Corporation',
    revisionNumber: 2,
    changes: [
        { field: 'Governing Law', before: 'California', after: 'New York' },
        { field: 'Term Length', before: '2 years', after: '3 years' },
        { field: 'Party B Address', before: '123 Old Street', after: '456 New Avenue, Suite 100' },
        { field: 'Information Scope', before: 'General business information', after: 'All technical and business information including trade secrets' },
    ],
    suggestions: {
        'governing_law': 'New York',
        'term_months': '36',
        'party_b_address': '456 New Avenue, Suite 100',
    } as Record<string, string>,
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

            case 'recipientEditNoMessage':
                html = recipientEditEmailHtml(
                    sampleData.draftTitle,
                    sampleData.editLink
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

            case 'partyBSuggestions':
                html = partyBSuggestionsEmailHtml(
                    sampleData.draftTitle,
                    sampleData.partyBName,
                    sampleData.partyBEmail,
                    sampleData.suggestions,
                    sampleData.reviewLink
                );
                break;

            case 'partyARequestChanges':
                html = partyARequestChangesEmailHtml(
                    sampleData.draftTitle,
                    'I need the governing law changed to Delaware and the term extended to 3 years. Also please double-check the address.',
                    sampleData.editLink
                );
                break;

            case 'recipientInputSubmitted':
                html = recipientInputSubmittedEmailHtml(
                    sampleData.draftTitle,
                    sampleData.partyBName,
                    sampleData.reviewLink
                );
                break;

            case 'inputRequest':
                html = inputRequestEmailHtml(
                    sampleData.draftTitle,
                    sampleData.editLink,
                    3,
                    'Please fill in your company details and signatory information.'
                );
                break;

            case 'invite':
                html = inviteEmailHtml(
                    sampleData.orgName,
                    sampleData.inviterName,
                    'APPROVER',
                    sampleData.signUpLink
                );
                break;

            case 'inviteContributor':
                html = inviteEmailHtml(
                    sampleData.orgName,
                    sampleData.inviterName,
                    'CONTRIBUTOR',
                    sampleData.signUpLink
                );
                break;

            case 'approvalRequest':
                html = approvalRequestEmailHtml(
                    sampleData.draftTitle,
                    sampleData.submitterName,
                    sampleData.reviewLink
                );
                break;

            case 'approvalApproved':
                html = approvalApprovedEmailHtml(
                    sampleData.draftTitle,
                    sampleData.approverName,
                    sampleData.draftLink
                );
                break;

            case 'approvalRejected':
                html = approvalRejectedEmailHtml(
                    sampleData.draftTitle,
                    sampleData.approverName,
                    'The non-compete clause is too broad. Please narrow the scope to only direct competitors in the SaaS space.',
                    sampleData.draftLink
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
