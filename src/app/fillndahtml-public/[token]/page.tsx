import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import FillNDAPublicClient from './FillNDAPublicClient';

type FieldState = "readonly" | "editable" | "pending_suggestion";

interface FieldStates {
    [key: string]: FieldState;
}

interface Suggestion {
    oldValue: string;
    newValue: string;
    suggestedBy: "party_a" | "party_b";
}

interface Suggestions {
    [key: string]: Suggestion;
}

/**
 * Public page for Party B to fill/review NDA fields
 * Token is the Signer ID
 * Supports bidirectional editing loop — both parties use the same review UI:
 *   - Incoming changes from the other party appear as "pending_suggestion" (accept/reject/counter)
 *   - All other fields are "readonly" with a "Suggest Change" button
 *   - Party B's empty pendingInputFields are "editable" (fields Party A asked B to fill)
 */
export default async function FillNDAPublicPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    // Find signer by ID with revisions
    const signer = await prisma.signer.findUnique({
        where: { id: token },
        include: {
            signRequest: {
                include: {
                    draft: {
                        include: {
                            revisions: {
                                orderBy: { createdAt: 'desc' },
                                take: 5 // Get recent revisions to find suggestions
                            }
                        }
                    },
                    organization: true,
                },
            },
        },
    });

    if (!signer) {
        notFound();
    }

    // Redirect to success page if already signed
    if (signer.status === 'SIGNED') {
        redirect(`/sign-nda-public/${signer.id}/success`);
    }

    const draft = signer.signRequest.draft;

    // Get workflow state with type assertion
    const extendedDraft = draft as typeof draft & {
        workflowState?: string;
        pendingInputFields?: string[];
        lastEditedBy?: string;
    };
    const workflowState = extendedDraft.workflowState || 'AWAITING_PARTY_B_REVIEW';

    // Determine if this is Party A (APPROVER) or Party B (SIGNER)
    const isPartyA = signer.role === 'APPROVER';

    // Allowed workflow states differ based on who's accessing
    const allowedStatesPartyA = ['AWAITING_PARTY_A_REVIEW', 'AWAITING_PARTY_A_SIGNATURE'];
    const allowedStatesPartyB = ['AWAITING_PARTY_B_REVIEW', 'AWAITING_INPUT', 'DRAFT', 'AWAITING_PARTY_B_SIGNATURE'];

    const allowedStates = isPartyA ? allowedStatesPartyA : allowedStatesPartyB;

    if (!allowedStates.includes(workflowState)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">ℹ️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {workflowState === 'COMPLETE' ? 'Already Completed' : 'Not Available'}
                    </h1>
                    <p className="text-gray-600">
                        {workflowState === 'COMPLETE'
                            ? 'This NDA has already been completed.'
                            : isPartyA
                                ? 'This NDA is not currently awaiting your review.'
                                : 'This NDA is not currently accepting your input.'}
                    </p>
                </div>
            </div>
        );
    }

    const formData = (draft.content as Record<string, unknown>) || {};
    const templateId = (formData.templateId as string) || 'professional_mutual_nda_v1';
    const pendingInputFields = (extendedDraft.pendingInputFields as string[]) || [];

    const allFields = [
        "docName", "effective_date", "term_months", "confidentiality_period_months",
        "party_a_name", "party_a_address", "party_a_phone",
        "party_a_signatory_name", "party_a_title", "party_a_email",
        "party_b_name", "party_b_address", "party_b_phone",
        "party_b_signatory_name", "party_b_title", "party_b_email",
        "governing_law", "ip_ownership", "non_solicit", "exclusivity", "additional_terms",
    ];

    // ── Build incoming suggestions ──────────────────────────────────────────
    // These come from the OTHER party's latest revision:
    //   Party A reviewing → sees Party B's filledFields + suggestedChanges
    //   Party B reviewing → sees Party A's suggestedChanges (counter-proposals)
    // We merge filledFields + suggestedChanges so ALL other-party changes are visible.
    const incomingSuggestions: Suggestions = {};
    const latestRevision = draft.revisions[0];
    if (latestRevision) {
        const revContent = latestRevision.content as Record<string, unknown>;
        const submittedBy = revContent.submittedBy as string | undefined;

        // Only show suggestions from the OTHER party
        const isFromOtherParty = isPartyA
            ? submittedBy !== signer.email  // Party A sees submissions not from themselves
            : submittedBy !== signer.email; // Party B sees submissions not from themselves

        if (isFromOtherParty) {
            const revSuggestions = revContent.suggestedChanges as Record<string, string> | undefined;
            const revFilledFields = revContent.filledFields as Record<string, string> | undefined;

            // Merge: filledFields are what Party B directly typed into requested fields;
            // suggestedChanges are explicit suggestions for locked fields.
            // Both should surface as "suggestions" for the reviewing party.
            const allChanges: Record<string, string> = {
                ...(revFilledFields || {}),
                ...(revSuggestions || {}),
            };

            for (const [field, newValue] of Object.entries(allChanges)) {
                if (newValue?.trim()) {
                    const currentValue = (formData[field] as string) || "";
                    // Only surface as suggestion if the value actually differs
                    if (newValue !== currentValue) {
                        incomingSuggestions[field] = {
                            oldValue: currentValue,
                            newValue,
                            suggestedBy: isPartyA ? "party_b" : "party_a"
                        };
                    }
                }
            }
        }
    }

    // ── Compute field states ────────────────────────────────────────────────
    // Both parties use the same review model:
    //   pending_suggestion → field changed by other party (accept/reject/counter)
    //   editable           → Party B only: empty fields Party A asked B to fill
    //   readonly           → everything else (locked, but "Suggest Change" is available)
    const fieldStates: FieldStates = {};

    for (const field of allFields) {
        if (incomingSuggestions[field]) {
            fieldStates[field] = "pending_suggestion";
        } else if (!isPartyA) {
            // Party B: fields Party A asked to fill that are still empty → editable
            const fieldValue = formData[field] as string | undefined;
            const isEmpty = !fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim());
            if (pendingInputFields.includes(field) && isEmpty) {
                fieldStates[field] = "editable";
            } else {
                fieldStates[field] = "readonly";
            }
        } else {
            // Party A: no directly editable fields — use suggestions only
            fieldStates[field] = "readonly";
        }
    }

    // Generate HTML preview server-side with proper field mappings
    const templateData = {
        ...formData,
        party_1_name: formData.party_a_name || '',
        party_1_address: formData.party_a_address || '',
        party_1_signatory_name: formData.party_a_signatory_name || '',
        party_1_signatory_title: formData.party_a_title || '',
        party_1_phone: formData.party_a_phone || '',
        party_1_emails_joined: formData.party_a_email || '',
        party_2_name: formData.party_b_name || '',
        party_2_address: formData.party_b_address || '',
        party_2_signatory_name: formData.party_b_signatory_name || '',
        party_2_signatory_title: formData.party_b_title || '',
        party_2_phone: formData.party_b_phone || '',
        party_2_emails_joined: formData.party_b_email || '',
        effective_date_long: formData.effective_date ? new Date(formData.effective_date as string).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '',
        governing_law_full: formData.governing_law || '',
        term_years_number: formData.term_months ? Math.floor(parseInt(formData.term_months as string) / 12) : '',
        term_years_words: formData.term_months ? (Math.floor(parseInt(formData.term_months as string) / 12) === 1 ? 'one' : 'two') : '',
        purpose: 'evaluating a potential business relationship',
        information_scope_text: 'All information and materials',
    };
    const initialHtml = await renderNdaHtml(templateData, templateId);

    return (
        <FillNDAPublicClient
            signerId={signer.id}
            signerEmail={signer.email}
            signerName={signer.name || ''}
            ndaTitle={draft.title || 'Untitled NDA'}
            formData={formData as Record<string, string | boolean>}
            templateId={templateId}
            pendingInputFields={pendingInputFields}
            fieldStates={fieldStates}
            incomingSuggestions={incomingSuggestions}
            initialHtml={initialHtml}
            draftId={draft.id}
            isPartyA={isPartyA}
        />
    );
}
