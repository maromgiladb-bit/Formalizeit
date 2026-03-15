import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, ownerReviewEmailHtml, getAppUrl, recipientInputSubmittedEmailHtml, partyBSuggestionsEmailHtml } from '@/lib/email'

/**
 * Submit filled fields from Party B (public, no auth required)
 * POST /api/ndas/submit-input
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { signerId, draftId, filledFields, suggestedChanges, suggestionResponses } = body

        if (!signerId || !draftId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Find signer
        const signer = await prisma.signer.findUnique({
            where: { id: signerId },
            include: {
                signRequest: {
                    include: {
                        draft: true,
                        createdBy: true,
                    }
                }
            }
        })

        if (!signer) {
            return NextResponse.json({ error: 'Invalid signer' }, { status: 404 })
        }

        const draft = signer.signRequest.draft
        const isPartyA = signer.role === 'APPROVER';

        // Verify draft is in correct state
        const allowedStates = ['AWAITING_PARTY_B_REVIEW', 'AWAITING_INPUT', 'DRAFT', 'AWAITING_PARTY_A_REVIEW', 'AWAITING_PARTY_A_SIGNATURE']
        if (!allowedStates.includes(draft.workflowState)) {
            return NextResponse.json({ error: 'Draft is in an invalid workflow state for input submission' }, { status: 400 })
        }

        // Explicitly validate signer role vs workflow state
        if (isPartyA) {
            const partyAStates = ['AWAITING_PARTY_A_REVIEW', 'AWAITING_PARTY_A_SIGNATURE']
            if (!partyAStates.includes(draft.workflowState)) {
                return NextResponse.json({ error: 'Party A is not allowed to submit input in the current workflow state' }, { status: 400 })
            }
        } else {
            const partyBStates = ['AWAITING_PARTY_B_REVIEW', 'AWAITING_INPUT', 'DRAFT']
            if (!partyBStates.includes(draft.workflowState)) {
                return NextResponse.json({ error: 'Party B is not allowed to submit input in the current workflow state' }, { status: 400 })
            }
        }

        // Merge filled fields into draft content
        const currentContent = (draft.content as Record<string, unknown>) || {}
        let newContent = {
            ...currentContent,
            ...(filledFields || {}),
        }

        // If Party B submitted, clear "ask receiver" flags
        if (!isPartyA && filledFields) {
            newContent = {
                ...newContent,
                ...Object.keys(filledFields).reduce((acc, field) => {
                    acc[`${field}_ask_receiver`] = false
                    return acc
                }, {} as Record<string, boolean>)
            }
        }

        // Apply accepted suggestions if provided (Party A approving B's suggestions)
        // suggestionResponses: { field: { action: 'accepted' | 'rejected' | 'countered', counterValue?: string } }
        // The client already updates formValues/filledFields with accepted values, 
        // so `filledFields` might already contain the new values. 
        // But let's ensure we track the resolution in the revision metadata if needed.

        // Determine workflow state
        let newWorkflowState = draft.workflowState;
        const hasSuggestions = suggestedChanges &&
            Object.values(suggestedChanges).some(v => v && (v as string).trim())

        let redirectUrl: string | undefined;

        if (isPartyA) {
            // Party A Submission
            if (hasSuggestions) {
                // Party A countered -> Back to Party B
                newWorkflowState = 'AWAITING_PARTY_B_REVIEW';
            } else {
                // Party A approved (accepted/rejected all, no counters) -> Proceed to Signature
                // Party A signs first in this flow? Or B?
                // "proceed to sign from party a after aproving changes" implies A signs now.
                newWorkflowState = 'AWAITING_PARTY_A_SIGNATURE';

                // If Party A is also the owner/user, they might want to sign immediately.
                // We should return a redirect URL to the signing page.
                // For Party A (owner), signing is usually done via /sign-nda/[id] or similar?
                // Or maybe via the same public interface if they are using a token?
                // Using fillndahtml-public as the unified interface, so redirect to same token?
                // But the UI needs to switch to "Sign Mode". 
                // Currently fillndahtml-public handles signing if state is AWAITING_SIGNATURE.

                // If we stay on fillndahtml-public, we can just reload or redirect to same URL.
                // Client side will see new state and show sign UI.
                redirectUrl = `${getAppUrl()}/sign-nda-public/${signer.id}`;
            }
        } else {
            // Party B Submission
            if (hasSuggestions) {
                // Party B suggests -> Party A review
                newWorkflowState = 'AWAITING_PARTY_A_REVIEW';
            } else {
                // Party B fills/approves -> Party B signs
                newWorkflowState = 'AWAITING_PARTY_B_SIGNATURE';
                redirectUrl = `${getAppUrl()}/sign-nda-public/${signer.id}`;
            }
        }

        // Create revision to track changes
        const revision = await prisma.ndaRevision.create({
            data: {
                draftId: draft.id,
                content: {
                    filledFields,
                    suggestedChanges,
                    suggestionResponses, // Track responses
                    submittedBy: signer.email,
                    submittedAt: new Date().toISOString()
                }
            }
        })


        // Update draft with new state and track who made last edit
        await prisma.ndaDraft.update({
            where: { id: draft.id },
            data: {
                content: newContent,
                workflowState: newWorkflowState,
                lastEditedBy: isPartyA ? 'party_a' : 'party_b',
                pendingInputFields: [] // Clear pending fields
            }
        })

        // Update signer status
        await prisma.signer.update({
            where: { id: signerId },
            data: { status: 'VIEWED' }
        })

        // Link revision to sign request
        await prisma.signRequest.update({
            where: { id: signer.signRequestId },
            data: { revisionId: revision.id }
        })

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                signRequestId: signer.signRequestId,
                signerId: signer.id,
                eventType: 'UPDATED',
                metadata: {
                    action: isPartyA ? 'party_a_review' : 'party_b_submitted_input',
                    filled_fields: filledFields ? Object.keys(filledFields) : [],
                    has_suggestions: hasSuggestions,
                    new_state: newWorkflowState
                }
            }
        })

        // Email notifications logic
        const owner = signer.signRequest.createdBy

        // Create review link - always use fillndahtml-public
        let reviewLink: string | undefined

        if (!isPartyA && hasSuggestions) {
            // Party B suggests -> Create Party A reviewer token if not exists (or reuse)
            // We can create a new one or find existing.
            // Simplified: create new for each round or update status.
            // Upsert Party A Approver - Reuse existing if possible to avoid duplicates
            let partyAReviewer = await prisma.signer.findFirst({
                where: {
                    signRequestId: signer.signRequestId,
                    role: 'APPROVER'
                }
            })

            if (partyAReviewer) {
                // Reset status to PENDING for re-review
                partyAReviewer = await prisma.signer.update({
                    where: { id: partyAReviewer.id },
                    data: { status: 'PENDING' }
                })
            } else {
                // Create if doesn't exist (fallback)
                partyAReviewer = await prisma.signer.create({
                    data: {
                        signRequestId: signer.signRequestId,
                        email: owner.email,
                        name: owner.name || 'Party A',
                        role: 'APPROVER',
                        status: 'PENDING'
                    }
                })
            }
            reviewLink = `${getAppUrl()}/fillndahtml-public/${partyAReviewer.id}`
        } else if (isPartyA && hasSuggestions) {
            // Party A counters -> Email Party B
            // Need to find Party B's signer token. 
            // We have signerId of Party A. We need the OTHER signer.
            const partyBSigner = await prisma.signer.findFirst({
                where: {
                    signRequestId: signer.signRequestId,
                    role: 'SIGNER',
                    email: { not: owner.email }
                }
            })

            if (partyBSigner) {
                // Reset Party B status to PENDING as they need to review counter-offer
                await prisma.signer.update({
                    where: { id: partyBSigner.id },
                    data: { status: 'PENDING' }
                })

                reviewLink = `${getAppUrl()}/fillndahtml-public/${partyBSigner.id}`
                // Send email to Party B
                await sendEmail({
                    to: partyBSigner.email,
                    subject: `Review Required: Counter-proposal for ${draft.title || 'NDA'}`,
                    html: ownerReviewEmailHtml( // Reusing template for now, ideal to have specific one
                        draft.title || 'Untitled NDA',
                        1,
                        reviewLink,
                        [] // TODO: generate diff
                    )
                })
            }
        } else if (!isPartyA && !hasSuggestions) {
            // Party B ready to sign -> Link to Party B
            reviewLink = `${getAppUrl()}/fillndahtml-public/${signer.id}`
        }


        // Only send owner email if we have a reviewLink valid for the owner, AND it's not Party A acting
        // If Party A is acting (isPartyA), we handled email to Party B above if needed.
        if (reviewLink && !isPartyA) {
            try {
                await sendEmail({
                    to: owner.email,
                    subject: hasSuggestions
                        ? `Review Required: Changes to ${draft.title || 'NDA'}`
                        : `Ready for Signature: ${draft.title || 'NDA'} - Party B provided information`,
                    html: hasSuggestions
                        ? partyBSuggestionsEmailHtml(
                            draft.title || 'Untitled NDA',
                            signer.name || signer.email,
                            signer.email,
                            (suggestedChanges as Record<string, string>) || {},
                            reviewLink
                        )
                        : recipientInputSubmittedEmailHtml(draft.title || 'Untitled NDA', signer.name || signer.email, reviewLink)
                })
                console.log('✅ Owner notification email sent')
            } catch (emailError) {
                console.error('❌ Failed to send owner notification:', emailError)
            }
        }

        return NextResponse.json({
            success: true,
            newWorkflowState,
            hasSuggestions,
            revisionId: revision.id,
            redirectUrl
        })
    } catch (error) {
        console.error('Submit input error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to submit input'
        }, { status: 500 })
    }
}

