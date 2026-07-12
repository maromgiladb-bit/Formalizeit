import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl, recipientInputSubmittedEmailHtml, partyBSuggestionsEmailHtml, negotiationReviewEmailHtml } from '@/lib/email'
import { createNotificationsForOrgSigners } from '@/lib/notifications'
import { newSignLinkExpiry, refreshSignLinkExpiryForRequest } from '@/lib/signLink'
import { summarizeResponses, isFullyAccepted, type SuggestionResponses } from '@/lib/negotiation'

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
        const isPartyA = signer.role === 'SENDER';

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

        // Determine workflow state.
        // A party may proceed to signature ONLY when they fully agreed: no fresh
        // suggestions AND every response to the other side's proposals was an
        // acceptance. Any rejection or counter sends the NDA back for another round —
        // a rejection is a disagreement, not an endpoint (you can't unilaterally sign
        // a version the other party hasn't agreed to).
        let newWorkflowState = draft.workflowState;
        const hasSuggestions = !!(suggestedChanges &&
            Object.values(suggestedChanges).some(v => v && (v as string).trim()))
        const responses = (suggestionResponses || {}) as SuggestionResponses;
        const fullyAccepted = isFullyAccepted(responses, hasSuggestions);

        let redirectUrl: string | undefined;

        if (isPartyA) {
            if (fullyAccepted) {
                // Party A accepted everything -> Party A signs.
                newWorkflowState = 'AWAITING_PARTY_A_SIGNATURE';
                redirectUrl = `${getAppUrl()}/sign-nda-public/${signer.id}`;
            } else {
                // Party A rejected and/or countered -> back to Party B for another round.
                newWorkflowState = 'AWAITING_PARTY_B_REVIEW';
            }
        } else {
            if (fullyAccepted) {
                // Party B filled/accepted with nothing outstanding -> Party B signs.
                newWorkflowState = 'AWAITING_PARTY_B_SIGNATURE';
                redirectUrl = `${getAppUrl()}/sign-nda-public/${signer.id}`;
            } else {
                // Party B suggested, rejected, or countered -> back to Party A for review.
                newWorkflowState = 'AWAITING_PARTY_A_REVIEW';
            }
        }

        // Create revision to track changes
        // IMPORTANT: for the review UI, the other party needs to see ALL changes as "suggestions".
        // We store suggestedChanges = merge of filledFields + explicit suggestedChanges.
        // This way page.tsx can surface them all as incomingSuggestions for the reviewer.
        const allChangesAssuggested: Record<string, string> = {
            ...(filledFields || {}),
            ...(suggestedChanges || {}),
        };

        const revision = await prisma.ndaRevision.create({
            data: {
                draftId: draft.id,
                content: {
                    filledFields,          // keep raw filled fields for history
                    suggestedChanges: allChangesAssuggested,  // merged, used by review UI
                    suggestionResponses,   // Track responses
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

        // Activity: Party B submitted — keep all open links alive (reset inactivity clock).
        try { await refreshSignLinkExpiryForRequest(signer.signRequestId) } catch (e) { console.error('refresh expiry failed:', e) }

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
        const summary = summarizeResponses(responses)

        // Create review link - always use fillndahtml-public
        let reviewLink: string | undefined

        if (!isPartyA && !fullyAccepted) {
            // Party B suggested / rejected / countered -> back to Party A for review.
            // Reuse the Party A reviewer token if it exists, otherwise create one.
            let partyAReviewer = await prisma.signer.findFirst({
                where: {
                    signRequestId: signer.signRequestId,
                    role: 'SENDER'
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
                        role: 'SENDER',
                        status: 'PENDING',
                        expiresAt: newSignLinkExpiry(),
                    }
                })
            }
            reviewLink = `${getAppUrl()}/fillndahtml-public/${partyAReviewer.id}`
        } else if (isPartyA && !fullyAccepted) {
            // Party A rejected and/or countered -> email Party B a summary and send back.
            const partyBSigner = await prisma.signer.findFirst({
                where: {
                    signRequestId: signer.signRequestId,
                    role: 'SIGNER',
                    email: { not: owner.email }
                }
            })

            if (partyBSigner) {
                // Reset Party B status to PENDING as they need to review the response.
                await prisma.signer.update({
                    where: { id: partyBSigner.id },
                    data: { status: 'PENDING' }
                })

                reviewLink = `${getAppUrl()}/fillndahtml-public/${partyBSigner.id}`
                const actorName = (currentContent.party_a_name as string) || owner.name || owner.email
                await sendEmail({
                    to: partyBSigner.email,
                    subject: `${actorName} reviewed your changes – ${draft.title || 'NDA'}`,
                    html: negotiationReviewEmailHtml(
                        draft.title || 'Untitled NDA',
                        actorName,
                        summary,
                        reviewLink,
                    ),
                    // Party A responded — let Party B reply back to the sender.
                    replyTo: owner.email,
                })
            }
        } else if (!isPartyA && fullyAccepted) {
            // Party B ready to sign -> Link to Party B
            reviewLink = `${getAppUrl()}/fillndahtml-public/${signer.id}`
        }


        // Notify the owner (Party A) when Party B acts. When Party A is acting we
        // already emailed Party B above.
        if (reviewLink && !isPartyA) {
            try {
                const partyBLabel = `${signer.name || signer.email}${(currentContent.party_b_name as string) ? ` from ${currentContent.party_b_name as string}` : ''}`
                // Distinguish fresh suggestions (use the suggestions template) from
                // responses to Party A's proposals (use the accept/reject/counter summary).
                const changesHtml = hasSuggestions
                    ? partyBSuggestionsEmailHtml(
                        draft.title || 'Untitled NDA',
                        signer.name || signer.email,
                        signer.email,
                        (suggestedChanges as Record<string, string>) || {},
                        reviewLink
                    )
                    : negotiationReviewEmailHtml(
                        draft.title || 'Untitled NDA',
                        signer.name || signer.email,
                        summary,
                        reviewLink,
                    )
                await sendEmail({
                    to: owner.email,
                    subject: !fullyAccepted
                        ? `Review requested – ${partyBLabel} responded to the NDA`
                        : `${signer.name || signer.email} filled in their details – "${draft.title || 'NDA'}" is ready`,
                    html: !fullyAccepted
                        ? changesHtml
                        : recipientInputSubmittedEmailHtml(draft.title || 'Untitled NDA', signer.name || signer.email, reviewLink),
                    // Route the sender's reply straight back to the receiver who submitted.
                    replyTo: signer.email,
                })
                console.log('✅ Owner notification email sent')
            } catch (emailError) {
                console.error('❌ Failed to send owner notification:', emailError)
            }
        }

        // In-app notification: Party B responded (suggested / rejected / countered) → notify org signers
        if (!isPartyA && !fullyAccepted) {
            try {
                const partyBName = signer.name || signer.email
                await createNotificationsForOrgSigners(
                    draft.organizationId,
                    null,
                    'NDA_CHANGES_REQUESTED',
                    'Party B responded to the NDA',
                    `${partyBName} responded to "${draft.title || 'Untitled NDA'}" — review before signing`,
                    `/dashboard#nda-${draft.id}`,
                    draft.id
                )
            } catch (e) {
                console.error('Failed to create changes notification:', e)
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

