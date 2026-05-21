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
    signerCompany: 'Beta Industries',
    senderName: 'John Smith',
    senderCompany: 'Acme Corporation',
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

            case 'recipientEditNoMessage':
                result = {
                    subject: `${sampleData.senderName} from ${sampleData.senderCompany} sent you an NDA to review`,
                    from: `${sampleData.senderName} via Formalize It <noreply@formalizeit.app>`,
                    to: `Party B (recipient) <partyb@example.com>`,
                    html: recipientEditEmailHtml(
                        sampleData.draftTitle,
                        sampleData.editLink
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

            case 'partyBSuggestions':
                result = {
                    subject: `Review requested – ${sampleData.partyBName} from ${sampleData.signerCompany} made suggestions on the NDA`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `${sampleData.senderName} (Party A) <partya@example.com>`,
                    html: partyBSuggestionsEmailHtml(
                        sampleData.draftTitle,
                        sampleData.partyBName,
                        sampleData.partyBEmail,
                        sampleData.suggestions,
                        sampleData.reviewLink
                    ),
                };
                break;

            case 'partyARequestChanges':
                result = {
                    subject: `${sampleData.senderName} from ${sampleData.senderCompany} requested changes on the NDA`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `Party B (recipient) <partyb@example.com>`,
                    html: partyARequestChangesEmailHtml(
                        sampleData.draftTitle,
                        'I need the governing law changed to Delaware and the term extended to 3 years. Also please double-check the address.',
                        sampleData.editLink
                    ),
                };
                break;

            case 'recipientInputSubmitted':
                result = {
                    subject: `${sampleData.partyBName} filled in their details – "${sampleData.draftTitle}" is ready`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `${sampleData.senderName} (Party A) <partya@example.com>`,
                    html: recipientInputSubmittedEmailHtml(
                        sampleData.draftTitle,
                        sampleData.partyBName,
                        sampleData.reviewLink
                    ),
                };
                break;

            case 'inputRequest':
                result = {
                    subject: `${sampleData.senderName} from ${sampleData.senderCompany} needs your input on an NDA`,
                    from: `${sampleData.senderName} via Formalize It <noreply@formalizeit.app>`,
                    to: `Party B (recipient) <partyb@example.com>`,
                    html: inputRequestEmailHtml(
                        sampleData.draftTitle,
                        sampleData.editLink,
                        3,
                        'Please fill in your company details and signatory information.'
                    ),
                };
                break;

            case 'invite':
                result = {
                    subject: `${sampleData.inviterName} invited you to join ${sampleData.orgName}`,
                    from: `${sampleData.inviterName} via Formalize It <noreply@formalizeit.app>`,
                    to: `New team member <newmember@example.com>`,
                    html: inviteEmailHtml(
                        sampleData.orgName,
                        sampleData.inviterName,
                        'SIGNER',
                        sampleData.signUpLink
                    ),
                };
                break;

            case 'inviteContributor':
                result = {
                    subject: `${sampleData.inviterName} invited you to join ${sampleData.orgName}`,
                    from: `${sampleData.inviterName} via Formalize It <noreply@formalizeit.app>`,
                    to: `New team member <newmember@example.com>`,
                    html: inviteEmailHtml(
                        sampleData.orgName,
                        sampleData.inviterName,
                        'CONTRIBUTOR',
                        sampleData.signUpLink
                    ),
                };
                break;

            case 'approvalRequest':
                result = {
                    subject: `Approval needed – ${sampleData.submitterName} submitted a draft for review`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `${sampleData.approverName} (Approver) <approver@example.com>`,
                    html: approvalRequestEmailHtml(
                        sampleData.draftTitle,
                        sampleData.submitterName,
                        sampleData.reviewLink
                    ),
                };
                break;

            case 'approvalApproved':
                result = {
                    subject: `Your draft was approved – you can now send "${sampleData.draftTitle}"`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `${sampleData.submitterName} (Contributor) <contributor@example.com>`,
                    html: approvalApprovedEmailHtml(
                        sampleData.draftTitle,
                        sampleData.approverName,
                        sampleData.draftLink
                    ),
                };
                break;

            case 'approvalRejected':
                result = {
                    subject: `Revisions needed on your draft – "${sampleData.draftTitle}"`,
                    from: `Formalize It <noreply@formalizeit.app>`,
                    to: `${sampleData.submitterName} (Contributor) <contributor@example.com>`,
                    html: approvalRejectedEmailHtml(
                        sampleData.draftTitle,
                        sampleData.approverName,
                        'The non-compete clause is too broad. Please narrow the scope to only direct competitors in the SaaS space.',
                        sampleData.draftLink
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
