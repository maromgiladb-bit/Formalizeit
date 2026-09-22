import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl, recipientInputSubmittedEmailHtml, partyBSuggestionsEmailHtml, negotiationReviewEmailHtml } from '@/lib/email'
import { createNotificationsForOrgSigners } from '@/lib/notifications'
import { newSignLinkExpiry } from '@/lib/signLink'
import { applyNegotiationRound, pendingSuggestionsFromRevision, type SuggestionResponses } from '@/lib/negotiation'
import { persistNegotiationRound } from '@/lib/negotiationRound'
import { rateLimitRequest, tooManyRequests, MINUTE } from '@/lib/rateLimit'

/**
 * Submit filled fields from Party B (public, no auth required)
 * POST /api/ndas/submit-input
 */
export async function POST(request: NextRequest) {
    try {
        // The signer id is the only credential here, so throttle guessing.
        const limit = rateLimitRequest(request, 'submit-input', 30, MINUTE)
        if (!limit.ok) return tooManyRequests(limit)

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
                        draft: {
                            include: {
                                revisions: { orderBy: { createdAt: 'desc' }, take: 1 },
                            }
                        },
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

        const currentContent = (draft.content as Record<string, unknown>) || {}

        // What the OTHER party proposed last round, as the server knows it. We
        // resolve "accepted" against this rather than against the client's own
        // claim, so a tampered client can't accept a value never offered. Same
        // helper the review page uses, so shown == resolvable.
        const incomingSuggestions = pendingSuggestionsFromRevision(
            draft.revisions[0]?.content,
            signer.email,
        )

        // Resolve the round. `draft.content` is the AGREED document: counters and
        // fresh suggestions stay out of it until the other side accepts them.
        const round = applyNegotiationRound({
            currentContent,
            filledFields,
            suggestedChanges,
            responses: (suggestionResponses || {}) as SuggestionResponses,
            incomingSuggestions,
        })

        // If Party B submitted, clear "ask receiver" flags for what they actually
        // filled in — not for fields they rejected or countered.
        const contentOverlay: Record<string, unknown> = {}
        if (!isPartyA) {
            for (const field of Object.keys(round.appliedFilledFields)) {
                contentOverlay[`${field}_ask_receiver`] = false
            }
        }

        // Determine workflow state.
        // A party may proceed to signature ONLY when they fully agreed: no fresh
        // suggestions AND every response to the other side's proposals was an
        // acceptance. Any rejection or counter sends the NDA back for another round —
        // a rejection is a disagreement, not an endpoint (you can't unilaterally sign
        // a version the other party hasn't agreed to).
        let newWorkflowState = draft.workflowState;
        const hasSuggestions = round.hasFreshSuggestions
        const fullyAccepted = round.fullyAccepted;

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

        const { revisionId } = await persistNegotiationRound({
            draftId: draft.id,
            organizationId: draft.organizationId,
            signRequestId: signer.signRequestId,
            actor: { kind: 'signer', signerId: signer.id, email: signer.email, isPartyA },
            round,
            newWorkflowState,
            contentOverlay,
        })

        // Update signer status
        await prisma.signer.update({
            where: { id: signerId },
            data: { status: 'VIEWED' }
        })

        // Email notifications logic
        const owner = signer.signRequest.createdBy
        const summary = round.summary

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
                        round.outgoingSuggestions,
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
            revisionId,
            redirectUrl
        })
    } catch (error) {
        console.error('Submit input error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to submit input'
        }, { status: 500 })
    }
}

