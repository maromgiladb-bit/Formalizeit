"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useDebouncedPreview } from "@/hooks/useDebouncedPreview";
import { sanitizeForHtml } from "@/lib/sanitize";

// All required fields (except additional_terms)
const REQUIRED_FIELDS = [
    "docName",
    "effective_date",
    "term_months",
    "confidentiality_period_months",
    "party_a_name",
    "party_a_address",
    "party_a_signatory_name",
    "party_a_title",
    "party_b_name",
    "party_b_address",
    "party_b_signatory_name",
    "party_b_title",
    "party_b_email",
    "governing_law",
    "ip_ownership",
    "non_solicit",
    "exclusivity",
];

// Field state types
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

interface FormValues {
    [key: string]: string | boolean;
}

interface FillNDAPublicClientProps {
    signerId: string;
    signerEmail: string;
    signerName: string;
    ndaTitle: string;
    formData: FormValues;
    templateId: string;
    pendingInputFields: string[];
    fieldStates: FieldStates;
    incomingSuggestions: Suggestions;
    initialHtml: string;
    draftId: string;
    isPartyA?: boolean;
}

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
    docName: "Document Title",
    effective_date: "Effective Date",
    term_months: "Agreement Term (months)",
    confidentiality_period_months: "Confidentiality Period (months)",
    party_a_name: "Company/Party Name",
    party_a_address: "Address",
    party_a_phone: "Phone Number",
    party_a_signatory_name: "Signatory Name",
    party_a_title: "Signatory Title",
    party_a_email: "Email Address",
    party_b_name: "Company/Party Name",
    party_b_address: "Address",
    party_b_phone: "Phone Number",
    party_b_signatory_name: "Signatory Name",
    party_b_title: "Signatory Title",
    party_b_email: "Email Address",
    purpose: "Purpose of Confidential Information Swap",
    governing_law: "Governing Law",
    ip_ownership: "IP Ownership Clause",
    non_solicit: "Non-Solicitation Clause",
    exclusivity: "Exclusivity Clause",
    additional_terms: "Additional Terms",
};

export default function FillNDAPublicClient({
    signerId,
    signerEmail,
    signerName,
    ndaTitle,
    formData: initialFormData,
    templateId,
    pendingInputFields,
    fieldStates: initialFieldStates,
    incomingSuggestions,
    initialHtml,
    draftId,
    isPartyA = false,
}: FillNDAPublicClientProps) {
    const router = useRouter();

    // Form values - starts with data from server
    const [formValues, setFormValues] = useState<FormValues>(initialFormData);

    // My suggested changes (field -> new value)
    const [mySuggestions, setMySuggestions] = useState<Record<string, string>>({});

    // Which fields are showing the suggest-change input
    const [showingSuggestionFor, setShowingSuggestionFor] = useState<Set<string>>(new Set());

    // Responses to incoming suggestions (accept/reject/counter)
    const [suggestionResponses, setSuggestionResponses] = useState<Record<string, "accepted" | "rejected" | "countered">>({});

    // Counter values for rejected+countered suggestions
    const [counterValues, setCounterValues] = useState<Record<string, string>>({});

    // UI State
    const [showLivePreview, setShowLivePreview] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const steps = ["Document", "Party A", "Party B", "Clauses", "Review"];

    // Maps template field names → form step numbers (mirrors internal fillndahtml)
    const FIELD_STEP_MAP: Record<string, number> = {
        effective_date: 0, term_months: 0, confidentiality_period_months: 0, docName: 0,
        party_a_name: 1, party_a_address: 1, party_a_phone: 1, party_a_signatory_name: 1, party_a_title: 1, party_a_email: 1,
        party_b_name: 2, party_b_address: 2, party_b_phone: 2, party_b_signatory_name: 2, party_b_title: 2, party_b_email: 2,
        purpose: 3, governing_law: 3, ip_ownership: 3, non_solicit: 3, exclusivity: 3, additional_terms: 3,
        information_scope_text: 3,
    };

    // Listen for click-to-field messages from the preview iframe
    useEffect(() => {
        const handleFieldClick = (e: MessageEvent) => {
            if (e.data?.type === 'field-click' && e.data.field) {
                const fieldName = e.data.field as string;
                const targetStep = FIELD_STEP_MAP[fieldName];
                if (targetStep !== undefined && step !== targetStep) {
                    setStep(targetStep);
                }
                setTimeout(() => {
                    const fieldLabels: Record<string, string[]> = {
                        effective_date: ['effective date'],
                        term_months: ['term'],
                        confidentiality_period_months: ['confidentiality period'],
                        docName: ['document title'],
                        party_a_name: ['party name', 'company'],
                        party_a_address: ['address'],
                        party_a_phone: ['phone'],
                        party_a_signatory_name: ['signatory', 'authorized'],
                        party_a_title: ['title'],
                        party_a_email: ['email'],
                        party_b_name: ['party name', 'company'],
                        party_b_address: ['address'],
                        party_b_phone: ['phone'],
                        party_b_signatory_name: ['signatory', 'authorized'],
                        party_b_title: ['title'],
                        party_b_email: ['email'],
                        purpose: ['purpose'],
                        governing_law: ['governing law', 'jurisdiction'],
                        ip_ownership: ['ip ownership'],
                        non_solicit: ['non-solicit'],
                        exclusivity: ['exclusivity'],
                        additional_terms: ['additional'],
                        information_scope_text: ['scope', 'information'],
                    };
                    const allInputs = document.querySelectorAll('input, textarea, select');
                    for (const el of allInputs) {
                        const htmlEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                        const parentDiv = htmlEl.closest('div');
                        if (parentDiv) {
                            const label = parentDiv.querySelector('label');
                            if (label) {
                                const labelText = label.textContent?.toLowerCase() || '';
                                const matchLabels = fieldLabels[fieldName];
                                if (matchLabels && matchLabels.some(ml => labelText.includes(ml))) {
                                    htmlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setTimeout(() => htmlEl.focus(), 300);
                                    htmlEl.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.6)';
                                    setTimeout(() => { htmlEl.style.boxShadow = ''; }, 2000);
                                    return;
                                }
                            }
                        }
                    }
                }, targetStep !== undefined && step !== targetStep ? 400 : 50);
            }
        };
        window.addEventListener('message', handleFieldClick);
        return () => window.removeEventListener('message', handleFieldClick);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // Prepare template data for preview
    // First, merge form values with any suggestions
    const mergedValues = {
        ...formValues,
        // Apply my suggestions (overwrite existing values)
        ...Object.fromEntries(
            Object.entries(mySuggestions).filter(([, v]) => v).map(([k, v]) => [k, v])
        ),
    };

    const templateData = {
        ...mergedValues,
        templateId,
        // Map to template fields using merged values (including suggestions)
        party_1_name: sanitizeForHtml(mySuggestions.party_a_name || mergedValues.party_a_name as string || ""),
        party_1_address: sanitizeForHtml(mySuggestions.party_a_address || mergedValues.party_a_address as string || ""),
        party_1_signatory_name: sanitizeForHtml(mySuggestions.party_a_signatory_name || mergedValues.party_a_signatory_name as string || ""),
        party_1_signatory_title: sanitizeForHtml(mySuggestions.party_a_title || mergedValues.party_a_title as string || ""),
        party_1_phone: sanitizeForHtml(mySuggestions.party_a_phone || mergedValues.party_a_phone as string || ""),
        party_1_emails_joined: sanitizeForHtml(mySuggestions.party_a_email || mergedValues.party_a_email as string || ""),
        party_2_name: sanitizeForHtml(mySuggestions.party_b_name || mergedValues.party_b_name as string || ""),
        party_2_address: sanitizeForHtml(mySuggestions.party_b_address || mergedValues.party_b_address as string || ""),
        party_2_signatory_name: sanitizeForHtml(mySuggestions.party_b_signatory_name || mergedValues.party_b_signatory_name as string || ""),
        party_2_signatory_title: sanitizeForHtml(mySuggestions.party_b_title || mergedValues.party_b_title as string || ""),
        party_2_phone: sanitizeForHtml(mySuggestions.party_b_phone || mergedValues.party_b_phone as string || ""),
        party_2_emails_joined: sanitizeForHtml(mySuggestions.party_b_email || mergedValues.party_b_email as string || ""),
        effective_date_long: mergedValues.effective_date ? new Date(mergedValues.effective_date as string).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '',
        governing_law_full: sanitizeForHtml(mySuggestions.governing_law || mergedValues.governing_law as string || ""),
        term_years_number: mergedValues.term_months ? Math.floor(parseInt(mergedValues.term_months as string) / 12) : '',
        term_years_words: mergedValues.term_months ? (Math.floor(parseInt(mergedValues.term_months as string) / 12) === 1 ? 'one' : 'two') : '',
        purpose: sanitizeForHtml(mySuggestions.purpose || mergedValues.purpose as string || ""),
        information_scope_text: 'All information and materials',
        ip_ownership: sanitizeForHtml(mySuggestions.ip_ownership || mergedValues.ip_ownership as string || ""),
        additional_terms: sanitizeForHtml(mySuggestions.additional_terms || mergedValues.additional_terms as string || ""),
    };

    // Debounced preview (using public endpoint for unauthenticated users)
    const { data: previewData, loading: previewLoading } = useDebouncedPreview(
        "/api/ndas/preview-html-public",
        templateData,
        500
    );
    const previewHtml = previewData?.html || initialHtml;

    // Compute completion percentage
    const computeCompletionPercent = () => {
        if (pendingInputFields.length === 0) return 100;
        const filled = pendingInputFields.filter(field => {
            const val = formValues[field];
            return val && typeof val === "string" && val.trim();
        }).length;
        return Math.round((filled / pendingInputFields.length) * 100);
    };

    // Get field state — driven entirely by the fieldStates computed server-side
    const getFieldState = (field: string): FieldState => {
        return initialFieldStates[field] || "readonly";
    };

    // Check if form is complete
    const isComplete = pendingInputFields.every(
        field => (formValues[field] as string)?.trim()
    );

    // Step navigation
    const goNext = () => { if (step < steps.length - 1) setStep(step + 1); };
    const goBack = () => { if (step > 0) setStep(step - 1); };
    const goToStep = (target: number) => { setStep(target); };

    // Validate all required fields
    const validateAllFields = (): { isValid: boolean; missingFields: string[] } => {
        const missingFields: string[] = [];
        for (const field of REQUIRED_FIELDS) {
            const value = formValues[field];
            if (!value || (typeof value === "string" && !value.trim())) {
                missingFields.push(FIELD_LABELS[field] || field);
            }
        }
        return { isValid: missingFields.length === 0, missingFields };
    };

    const getChangedTextFields = (): Record<string, string> => {
        const changed: Record<string, string> = {};

        for (const [field, value] of Object.entries(formValues)) {
            if (typeof value !== "string") continue;

            const initialValue = typeof initialFormData[field] === "string"
                ? (initialFormData[field] as string)
                : "";

            if (value !== initialValue) {
                changed[field] = value;
            }
        }

        return changed;
    };

    // Check if Party B made any changes (suggestions or filled requested fields)
    const hasPartyBMadeChanges = (): boolean => {
        // Check for suggestions
        const hasSuggestions = Object.values(mySuggestions).some(v => v?.trim());

        // Check if any editable fields (Party A asked to fill) were filled/changed
        const filledRequestedFields = pendingInputFields.some(field => {
            const initialValue = initialFormData[field] as string || '';
            const currentValue = formValues[field] as string || '';
            return initialValue !== currentValue && currentValue.trim() !== '';
        });

        return hasSuggestions || filledRequestedFields;
    };

    // Handle proceed to sign
    const handleProceedToSign = async () => {
        setError(null);
        setValidationErrors([]);

        const { isValid, missingFields } = validateAllFields();

        if (!isValid) {
            setValidationErrors(missingFields);
            setError(`Please fill in all required fields. Missing: ${missingFields.slice(0, 3).join(", ")}${missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : ""}`);
            return;
        }

        if (isPartyA) {
            setIsSubmitting(true);

            try {
                const changedFields = getChangedTextFields();
                const responses: Record<string, { action: string; counterValue?: string }> = {};

                for (const [field, action] of Object.entries(suggestionResponses)) {
                    responses[field] = { action };
                    if (action === "countered") {
                        responses[field].counterValue = counterValues[field];
                    }
                }

                const response = await fetch("/api/ndas/submit-input", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        signerId,
                        draftId,
                        filledFields: Object.keys(changedFields).length > 0 ? changedFields : undefined,
                        suggestionResponses: Object.keys(responses).length > 0 ? responses : undefined,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to save changes before signing");
                }

                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                    return;
                }

                window.location.href = `/sign-nda-public/${signerId}`;
                return;
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
                return;
            } finally {
                setIsSubmitting(false);
            }
        }

        // Store form data in sessionStorage for the sign page
        sessionStorage.setItem('ndaSignData', JSON.stringify({
            draftId,
            signerId,
            values: formValues,
            htmlContent: previewHtml,
            partyBEmail: formValues.party_b_email,
            partyBName: formValues.party_b_name,
        }));

        // Always redirect to sign-nda-public for both parties (Party A and Party B)
        router.push(`/sign-nda-public/${signerId}`);
    };

    // Handle suggest change toggle
    const toggleSuggestion = (field: string) => {
        setShowingSuggestionFor(prev => {
            const next = new Set(prev);
            if (next.has(field)) {
                next.delete(field);
                setMySuggestions(s => ({ ...s, [field]: "" }));
            } else {
                next.add(field);
            }
            return next;
        });
    };

    // Handle accepting incoming suggestion
    const acceptSuggestion = (field: string) => {
        const suggestion = incomingSuggestions[field];
        if (suggestion) {
            setFormValues(prev => ({ ...prev, [field]: suggestion.newValue }));
            setSuggestionResponses(prev => ({ ...prev, [field]: "accepted" }));
        }
    };

    // Handle rejecting incoming suggestion
    const rejectSuggestion = (field: string) => {
        setSuggestionResponses(prev => ({ ...prev, [field]: "rejected" }));
    };

    // Handle counter-proposing
    const counterSuggestion = (field: string, value: string) => {
        setCounterValues(prev => ({ ...prev, [field]: value }));
        setSuggestionResponses(prev => ({ ...prev, [field]: "countered" }));
    };

    // Get field style class
    const getFieldClass = (field: string, baseClass: string = "p-3 border") => {
        const state = getFieldState(field);
        if (state === "editable") {
            return `${baseClass} border-orange-300 bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent`;
        }
        return `${baseClass} border-gray-300 bg-gray-100`;
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!isComplete && pendingInputFields.length > 0) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const filledFields: Record<string, string> = {};
            for (const field of pendingInputFields) {
                filledFields[field] = formValues[field] as string;
            }

            const suggestedChanges: Record<string, string> = {};
            for (const [field, value] of Object.entries(mySuggestions)) {
                if (value?.trim()) {
                    suggestedChanges[field] = value;
                }
            }

            const responses: Record<string, { action: string; counterValue?: string }> = {};
            for (const [field, action] of Object.entries(suggestionResponses)) {
                responses[field] = { action };
                if (action === "countered") {
                    responses[field].counterValue = counterValues[field];
                }
            }

            const response = await fetch("/api/ndas/submit-input", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signerId,
                    draftId,
                    filledFields,
                    suggestedChanges: Object.keys(suggestedChanges).length > 0 ? suggestedChanges : undefined,
                    suggestionResponses: Object.keys(responses).length > 0 ? responses : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit");
            }

            if (data.redirectUrl) {
                // Redirect to signing page (or reload if same URL but different state)
                window.location.href = data.redirectUrl;
                return;
            }

            setSubmitSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle send back with changes (works for both Party A and Party B)
    const handleSendBackWithChanges = async () => {
        // Collect outgoing suggestions (fields the current user wants to change)
        const suggestedChanges: Record<string, string> = {};
        for (const [field, value] of Object.entries(mySuggestions)) {
            if (value?.trim()) {
                suggestedChanges[field] = value;
            }
        }

        // Collect responses to incoming suggestions (rejected / countered)
        const responses: Record<string, { action: string; counterValue?: string }> = {};
        for (const [field, action] of Object.entries(suggestionResponses)) {
            responses[field] = { action };
            if (action === "countered") {
                responses[field].counterValue = counterValues[field];
            }
        }

        // Must have at least one outgoing suggestion or a rejection/counter
        const hasRejectionsOrCounters = Object.values(suggestionResponses).some(
            r => r === 'rejected' || r === 'countered'
        );
        if (Object.keys(suggestedChanges).length === 0 && !hasRejectionsOrCounters) {
            setError("Please suggest at least one change before sending back. Use the '✏️ Suggest Change' button next to any field you want to modify.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // For Party B: also send filled required fields alongside suggestions
            const filledFields: Record<string, string> = {};
            if (!isPartyA) {
                for (const field of pendingInputFields) {
                    const value = formValues[field] as string;
                    if (value?.trim()) {
                        filledFields[field] = value;
                    }
                }
            }

            const response = await fetch("/api/ndas/submit-input", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signerId,
                    draftId,
                    filledFields: Object.keys(filledFields).length > 0 ? filledFields : undefined,
                    suggestedChanges: Object.keys(suggestedChanges).length > 0 ? suggestedChanges : undefined,
                    suggestionResponses: Object.keys(responses).length > 0 ? responses : undefined,
                    sendBackForReview: true,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send back changes");
            }

            setSubmitSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Count pending suggestions
    const getPendingSuggestionsCount = () => {
        return Object.values(mySuggestions).filter(v => v?.trim()).length;
    };

    // Render a single field based on its state
    const renderField = (field: string, isTextarea: boolean = false) => {
        const state = getFieldState(field);
        const value = formValues[field] as string || "";
        const label = FIELD_LABELS[field] || field;
        const incoming = incomingSuggestions[field];
        const isEditable = state === "editable";

        // Auto-detect textarea for address fields
        const useTextarea = isTextarea || field.includes("address") || field.includes("ownership") || field.includes("solicit") || field.includes("exclusivity") || field.includes("additional_terms");

        return (
            <div key={field} className="mb-4">
                {/* Field label - always show */}
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label}
                    {state === "pending_suggestion" && <span className="ml-2 text-amber-500 text-xs font-normal">💬 Suggestion pending</span>}
                    {isEditable && <span className="ml-2 text-orange-500 text-xs font-normal">⏳ Required</span>}
                </label>

                {/* Pending suggestion - compact inline design */}
                {incoming && state === "pending_suggestion" && !suggestionResponses[field] && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden mb-2">
                        {/* Original value - strikethrough */}
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Current:</span>
                                <span className="text-sm text-gray-500 line-through">{incoming.oldValue || "(empty)"}</span>
                            </div>
                        </div>
                        {/* Suggested value with actions */}
                        <div className="bg-amber-50/50 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-xs text-amber-600 uppercase tracking-wide">Suggested:</span>
                                    <span className="text-sm font-medium text-gray-800 truncate">{incoming.newValue}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => acceptSuggestion(field)}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                                        title="Accept"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => rejectSuggestion(field)}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                        title="Reject"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowingSuggestionFor(prev => new Set([...prev, field]))}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                        title="Counter-suggest"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            {/* Counter-suggest input */}
                            {showingSuggestionFor.has(field) && (
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={counterValues[field] || ""}
                                        onChange={(e) => setCounterValues(prev => ({ ...prev, [field]: e.target.value }))}
                                        placeholder="Your counter-proposal..."
                                        className="flex-1 px-2 py-1.5 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={() => counterSuggestion(field, counterValues[field])}
                                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Response shown - compact badge */}
                {suggestionResponses[field] && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${suggestionResponses[field] === "accepted" ? "bg-emerald-100 text-emerald-700" :
                        suggestionResponses[field] === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                        }`}>
                        {suggestionResponses[field] === "accepted" && (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Accepted
                            </>
                        )}
                        {suggestionResponses[field] === "rejected" && (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Rejected
                            </>
                        )}
                        {suggestionResponses[field] === "countered" && (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Counter sent
                            </>
                        )}
                    </div>
                )}

                {/* Suggest Change button — only shown when no active suggestion and input is closed */}
                {state === "readonly" && !suggestionResponses[field] && !showingSuggestionFor.has(field) && !mySuggestions[field] && (
                    <div className="mb-2">
                        <button onClick={() => toggleSuggestion(field)} className="px-3 py-1 rounded-lg font-medium text-xs whitespace-nowrap bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200" suppressHydrationWarning>
                            ✏️ Suggest Change
                        </button>
                    </div>
                )}

                {/* Input field — strikethrough when a suggestion is active */}
                {(state !== "pending_suggestion" || suggestionResponses[field]) && (
                    useTextarea ? (
                        <textarea
                            value={value}
                            onChange={(e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }))}
                            className={`${getFieldClass(field)} w-full rounded-lg shadow-sm transition-all ${suggestionResponses[field] === 'accepted' ? 'bg-emerald-50 border-emerald-300' : ''} ${state === "readonly" && (showingSuggestionFor.has(field) || !!mySuggestions[field]) ? 'line-through text-gray-400' : ''}`}
                            rows={3}
                            placeholder={isEditable ? `Please enter ${label.toLowerCase()}` : ""}
                            disabled={!isEditable}
                            suppressHydrationWarning
                        />
                    ) : (
                        <input
                            type={field.includes("email") ? "email" : field.includes("phone") ? "tel" : field.includes("date") ? "date" : field.includes("month") ? "number" : "text"}
                            value={value}
                            onChange={(e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }))}
                            className={`${getFieldClass(field)} w-full rounded-lg shadow-sm transition-all ${suggestionResponses[field] === 'accepted' ? 'bg-emerald-50 border-emerald-300' : ''} ${state === "readonly" && (showingSuggestionFor.has(field) || !!mySuggestions[field]) ? 'line-through text-gray-400' : ''}`}
                            placeholder={isEditable ? `Please enter ${label.toLowerCase()}` : ""}
                            disabled={!isEditable}
                            suppressHydrationWarning
                        />
                    )
                )}

                {/* State B: suggestion input open */}
                {state === "readonly" && showingSuggestionFor.has(field) && (
                    <div className="mt-1 flex items-center gap-2">
                        {useTextarea ? (
                            <textarea
                                value={mySuggestions[field] || ""}
                                onChange={(e) => setMySuggestions(prev => ({ ...prev, [field]: e.target.value }))}
                                className="flex-1 px-2 py-1.5 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                rows={2}
                                placeholder={`Suggest a new value for ${label.toLowerCase()}`}
                                suppressHydrationWarning
                            />
                        ) : (
                            <input
                                type={field.includes("email") ? "email" : field.includes("phone") ? "tel" : field.includes("date") ? "date" : field.includes("month") ? "number" : "text"}
                                value={mySuggestions[field] || ""}
                                onChange={(e) => setMySuggestions(prev => ({ ...prev, [field]: e.target.value }))}
                                className="flex-1 px-2 py-1.5 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                placeholder={`Suggest a new value for ${label.toLowerCase()}`}
                                suppressHydrationWarning
                            />
                        )}
                        {/* ✓ keep value, close input */}
                        <button
                            onClick={() => setShowingSuggestionFor(prev => { const s = new Set(prev); s.delete(field); return s; })}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors shrink-0"
                            title="Confirm suggestion"
                            suppressHydrationWarning
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        {/* ✗ clear value + close */}
                        <button
                            onClick={() => toggleSuggestion(field)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors shrink-0"
                            title="Cancel suggestion"
                            suppressHydrationWarning
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* State C: suggestion confirmed — show suggestion row below the struck-through field */}
                {state === "readonly" && !showingSuggestionFor.has(field) && mySuggestions[field] && !suggestionResponses[field] && (
                    <div className="mt-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-amber-600 shrink-0">→</span>
                            <span className="text-sm font-medium text-gray-800 truncate">{mySuggestions[field]}</span>
                        </div>
                        {/* Re-open to edit */}
                        <button
                            onClick={() => setShowingSuggestionFor(prev => new Set([...prev, field]))}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors shrink-0"
                            title="Edit suggestion"
                            suppressHydrationWarning
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        {/* Remove suggestion */}
                        <button
                            onClick={() => setMySuggestions(prev => ({ ...prev, [field]: "" }))}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors shrink-0"
                            title="Remove suggestion"
                            suppressHydrationWarning
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                    </div>
                )}
            </div>
        );
    };

    // Success actions component - shows different buttons based on auth status
    const SuccessActions = () => {
        const { isSignedIn } = useAuth();

        if (isSignedIn) {
            return (
                <Link
                    href="/mynda"
                    className="inline-flex items-center justify-center px-6 py-3 bg-teal-800 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all shadow-md"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Go to Dashboard
                </Link>
            );
        }

        return (
            <div className="space-y-3">
                <Link
                    href="/"
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-teal-800 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all shadow-md"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Homepage
                </Link>
                <Link
                    href="/about"
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-teal-700 border-2 border-teal-200 rounded-lg font-medium hover:bg-teal-50 transition-all"
                >
                    Learn more about Formalize It
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>
        );
    };

    // Success screen
    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Submitted Successfully!</h1>
                    <p className="text-gray-600 mb-6">Your information has been submitted. The other party will review and you&apos;ll be notified of next steps.</p>

                    <SuccessActions />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Container with Fixed Layout */}
            <div className="flex h-[calc(100vh-64px)]">
                {/* LEFT SIDE: Form Content (Scrollable) */}
                <div className={`transition-all duration-300 ${showLivePreview ? "w-full lg:w-[45%]" : "w-full"} overflow-y-auto`}>
                    <div className="max-w-4xl mx-auto p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-base font-bold text-gray-900">{ndaTitle}</h1>
                                    <p className="text-xs text-gray-500 mt-0.5">Complete your information to proceed</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLivePreview(!showLivePreview)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5" suppressHydrationWarning>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {showLivePreview ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    )}
                                </svg>
                                {showLivePreview ? "Hide Preview" : "Show Preview"}
                            </button>
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div className="flex items-center gap-3 text-sm text-red-700 mb-4 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Form Card */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 pt-5 pb-2">
                                {/* Compact Step Stepper */}
                                <div className="flex items-center">
                                    {steps.map((s, i) => (
                                        <React.Fragment key={s}>
                                            <button onClick={() => goToStep(i)} className="flex items-center gap-1.5 shrink-0" suppressHydrationWarning>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i === step ? 'bg-teal-800 text-white' : i < step ? 'bg-teal-800 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    {i < step ? (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <span>{i + 1}</span>
                                                    )}
                                                </div>
                                                <span className={`text-xs font-medium whitespace-nowrap ${i === step ? 'text-gray-900 font-semibold' : i < step ? 'text-gray-600' : 'text-gray-400'}`}>{s}</span>
                                            </button>
                                            {i < steps.length - 1 && (
                                                <div className="flex-1 mx-2 h-px bg-gray-200 min-w-2 relative overflow-hidden">
                                                    <div className={`absolute inset-y-0 left-0 bg-teal-800 transition-all duration-500 ${i < step ? 'right-0' : 'right-full'}`} />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* Form Content */}
                            <div className="p-6 pt-4">
                                {/* Step 0: Document Details */}
                                {step === 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">Document Details</h2>
                                                <p className="text-sm text-gray-600">Basic information about this NDA</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">{renderField("docName")}</div>
                                            {renderField("effective_date")}
                                            {renderField("term_months")}
                                            <div className="md:col-span-2">{renderField("confidentiality_period_months")}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 1: Party A Information */}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">Party A Information</h2>
                                                <p className="text-sm text-gray-600">Details of the first party — use ✏️ Suggest Change to propose edits
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {["party_a_name", "party_a_address", "party_a_phone", "party_a_signatory_name", "party_a_title", "party_a_email"].map(f => renderField(f))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Party B Information */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-xl font-bold text-gray-800">Party B Information (You)</h2>
                                                <p className="text-sm text-gray-600">Please fill in your details below</p>
                                            </div>
                                        </div>
                                        {pendingInputFields.some(f => f.startsWith("party_b")) && (
                                            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200 mb-4">
                                                <div className="flex gap-3">
                                                    <svg className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-sm text-teal-800"><strong>Action required!</strong> Fields marked with ⏳ need your input.</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-4">
                                            {["party_b_name", "party_b_address", "party_b_phone", "party_b_signatory_name", "party_b_title", "party_b_email"].map(f => renderField(f))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Clauses */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">Additional Clauses</h2>
                                                <p className="text-sm text-gray-600">Agreement terms and conditions</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {renderField("governing_law")}
                                            {renderField("ip_ownership", true)}
                                            {renderField("non_solicit", true)}
                                            {renderField("exclusivity", true)}
                                            {renderField("additional_terms", true)}
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Review */}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">Review & Submit</h2>
                                                <p className="text-sm text-gray-600">Review your information before submitting</p>
                                            </div>
                                        </div>

                                        {/* Summary Table */}
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Field</th>
                                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Party A</th>
                                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Party B (You)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    <tr><td className="px-4 py-3 text-sm font-medium text-gray-700">Company Name</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_a_name as string) || "—"}</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_b_name as string) || "—"}</td></tr>
                                                    <tr><td className="px-4 py-3 text-sm font-medium text-gray-700">Address</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_a_address as string) || "—"}</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_b_address as string) || "—"}</td></tr>
                                                    <tr><td className="px-4 py-3 text-sm font-medium text-gray-700">Phone</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_a_phone as string) || "—"}</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_b_phone as string) || "—"}</td></tr>
                                                    <tr><td className="px-4 py-3 text-sm font-medium text-gray-700">Signatory</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_a_signatory_name as string) || "—"}</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_b_signatory_name as string) || "—"}</td></tr>
                                                    <tr><td className="px-4 py-3 text-sm font-medium text-gray-700">Title</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_a_title as string) || "—"}</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_b_title as string) || "—"}</td></tr>
                                                    <tr><td className="px-4 py-3 text-sm font-medium text-gray-700">Email</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_a_email as string) || "—"}</td><td className="px-4 py-3 text-sm text-gray-600">{(formValues.party_b_email as string) || "—"}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Document & Clauses Summary */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                                            <div className="flex justify-between"><span className="text-sm font-medium text-gray-700">Document Title</span><span className="text-sm text-gray-600">{(formValues.docName as string) || "—"}</span></div>
                                            <div className="flex justify-between"><span className="text-sm font-medium text-gray-700">Effective Date</span><span className="text-sm text-gray-600">{(formValues.effective_date as string) || "—"}</span></div>
                                            <div className="flex justify-between"><span className="text-sm font-medium text-gray-700">Term</span><span className="text-sm text-gray-600">{(formValues.term_months as string) ? `${formValues.term_months} months` : "—"}</span></div>
                                            <div className="flex justify-between"><span className="text-sm font-medium text-gray-700">Governing Law</span><span className="text-sm text-gray-600">{(formValues.governing_law as string) || "—"}</span></div>
                                        </div>

                                        {/* Pending Suggestions Summary */}
                                        {getPendingSuggestionsCount() > 0 && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-800">
                                                            You have {getPendingSuggestionsCount()} suggested change{getPendingSuggestionsCount() !== 1 ? 's' : ''} pending
                                                        </p>
                                                        <p className="text-sm text-amber-700 mt-1">
                                                            Use "Send Back with Changes" to notify the other party about your proposed changes.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Validation Errors */}
                                        {validationErrors.length > 0 && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-red-800">Please fill in all required fields:</p>
                                                        <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                                                            {validationErrors.slice(0, 5).map((field, i) => (
                                                                <li key={i}>{field}</li>
                                                            ))}
                                                            {validationErrors.length > 5 && (
                                                                <li>...and {validationErrors.length - 5} more</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            {(() => {
                                                // Check for unresolved (not responded to) or non-accepted (rejected/countered) incoming suggestions
                                                const hasUnresolvedIncoming = Object.keys(incomingSuggestions || {}).some(
                                                    key => !suggestionResponses[key]
                                                );
                                                const hasRejectionsOrCounters = Object.values(suggestionResponses).some(
                                                    r => r === 'rejected' || r === 'countered'
                                                );
                                                const hasOutgoingSuggestions = Object.values(mySuggestions).some(v => v?.trim());

                                                // Check if Party B made any changes (suggestions or filled requested fields)
                                                const partyBMadeChanges = !isPartyA && hasPartyBMadeChanges();

                                                const requiresSuggestionResolution = true; // always resolve suggestions before signing

                                                const canProceedToSign =
                                                    !partyBMadeChanges &&
                                                    !hasOutgoingSuggestions &&
                                                    (!requiresSuggestionResolution || (!hasUnresolvedIncoming && !hasRejectionsOrCounters));

                                                return (
                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={handleProceedToSign}
                                                            disabled={!canProceedToSign}
                                                            className={`w-full px-6 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${canProceedToSign
                                                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg"
                                                                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                                                                }`}
                                                            suppressHydrationWarning
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                            Proceed to Sign
                                                        </button>
                                                        {!canProceedToSign && (
                                                            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 text-center">
                                                                {hasOutgoingSuggestions ? (
                                                                    "You have suggested edits. Send back for review before signing."
                                                                ) : partyBMadeChanges ? (
                                                                    "You have made changes (suggestions or filled fields). Please send back for Party A to review."
                                                                ) : hasUnresolvedIncoming ? (
                                                                    "Please accept or reject all suggestions before signing."
                                                                ) : hasRejectionsOrCounters ? (
                                                                    "You rejected or countered suggestions. You must send back for review."
                                                                ) : ""}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Divider */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-px bg-gray-300"></div>
                                                <span className="text-sm text-gray-500">or</span>
                                                <div className="flex-1 h-px bg-gray-300"></div>
                                            </div>

                                            {/* Send Back with Changes Button */}
                                            {(() => {
                                                // Check if Party B has changes (suggestions, filled fields, or rejected/countered)
                                                const hasOutgoingSuggestions = Object.values(mySuggestions).some(v => v?.trim());
                                                const partyBChanges = !isPartyA && hasPartyBMadeChanges();
                                                const hasRejectionsOrCounters = Object.values(suggestionResponses).some(
                                                    r => r === 'rejected' || r === 'countered'
                                                );
                                                const canSendBack = partyBChanges || hasRejectionsOrCounters || hasOutgoingSuggestions;

                                                return (
                                                    <button
                                                        onClick={handleSendBackWithChanges}
                                                        disabled={isSubmitting || !canSendBack}
                                                        className={`w-full px-6 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${isSubmitting || !canSendBack
                                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                            : "bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg"
                                                            }`}
                                                        suppressHydrationWarning
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                </svg>
                                                                Send Back with Changes
                                                                {(getPendingSuggestionsCount() > 0) && (
                                                                    <span className="ml-1 px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-xs">
                                                                        {getPendingSuggestionsCount()}
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </button>
                                                );
                                            })()}
                                        </div>

                                        <p className="text-xs text-gray-500 text-center">
                                            <strong>Proceed to Sign:</strong> All fields required. All changes must be accepted.<br />
                                            <strong>Send Back with Changes:</strong> Only available if you suggest changes or reject/counter proposals.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="mt-6 mb-2 flex items-center justify-between gap-3 pt-4 border-t border-gray-200 px-6">
                                <div className="flex gap-2">
                                    <button
                                        onClick={goBack}
                                        disabled={step === 0}
                                        className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${step === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                                        suppressHydrationWarning
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back
                                    </button>
                                    {step < steps.length - 1 && (
                                        <button
                                            onClick={goNext}
                                            className="px-5 py-2.5 bg-teal-800 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition-all duration-200 flex items-center gap-2"
                                            suppressHydrationWarning
                                        >
                                            Next Step: {steps[step + 1]}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Live Preview Panel */}
                {showLivePreview && (
                    <div className="hidden lg:block w-[55%] bg-white border-l border-gray-200 overflow-y-auto">
                        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Live Preview</h3>
                                    <p className="text-xs text-gray-600">
                                        {previewLoading ? (
                                            <span className="flex items-center gap-1">
                                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Updating...
                                            </span>
                                        ) : "Updates as you type"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <iframe
                                srcDoc={previewHtml}
                                title="NDA Preview"
                                className="w-full border-0"
                                style={{ minHeight: '1200px', height: 'auto' }}
                                sandbox="allow-same-origin allow-scripts"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
