"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedPreview } from "@/hooks/useDebouncedPreview";
import { sanitizeForHtml } from "@/lib/sanitize";
import PublicToolbar from "@/components/PublicToolbar";

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

    // Prepare template data for preview
    const templateData = {
        ...formValues,
        templateId,
        // Map to template fields
        party_1_name: sanitizeForHtml(formValues.party_a_name as string || ""),
        party_1_address: sanitizeForHtml(formValues.party_a_address as string || ""),
        party_1_signatory_name: sanitizeForHtml(formValues.party_a_signatory_name as string || ""),
        party_1_signatory_title: sanitizeForHtml(formValues.party_a_title as string || ""),
        party_1_phone: sanitizeForHtml(formValues.party_a_phone as string || ""),
        party_1_emails_joined: sanitizeForHtml(formValues.party_a_email as string || ""),
        party_2_name: sanitizeForHtml(formValues.party_b_name as string || ""),
        party_2_address: sanitizeForHtml(formValues.party_b_address as string || ""),
        party_2_signatory_name: sanitizeForHtml(formValues.party_b_signatory_name as string || ""),
        party_2_signatory_title: sanitizeForHtml(formValues.party_b_title as string || ""),
        party_2_phone: sanitizeForHtml(formValues.party_b_phone as string || ""),
        party_2_emails_joined: sanitizeForHtml(formValues.party_b_email as string || ""),
        effective_date_long: formValues.effective_date ? new Date(formValues.effective_date as string).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '',
        governing_law_full: sanitizeForHtml(formValues.governing_law as string || ""),
        // Apply my suggestions for preview
        ...Object.fromEntries(
            Object.entries(mySuggestions).filter(([, v]) => v).map(([k, v]) => [k, sanitizeForHtml(v)])
        ),
    };

    // Debounced preview
    const { data: previewData, loading: previewLoading } = useDebouncedPreview(
        "/api/ndas/preview-html",
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

    // Get field state
    const getFieldState = (field: string): FieldState => {
        if (incomingSuggestions[field]) return "pending_suggestion";
        if (pendingInputFields.includes(field)) return "editable";
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

    // Handle proceed to sign
    const handleProceedToSign = () => {
        setError(null);
        setValidationErrors([]);

        const { isValid, missingFields } = validateAllFields();

        if (!isValid) {
            setValidationErrors(missingFields);
            setError(`Please fill in all required fields. Missing: ${missingFields.slice(0, 3).join(", ")}${missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : ""}`);
            return;
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

        // Redirect to public sign page
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

            setSubmitSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle send back with changes
    const handleSendBackWithChanges = async () => {
        // Collect all suggestions
        const suggestedChanges: Record<string, string> = {};
        for (const [field, value] of Object.entries(mySuggestions)) {
            if (value?.trim()) {
                suggestedChanges[field] = value;
            }
        }

        if (Object.keys(suggestedChanges).length === 0) {
            setError("Please suggest at least one change before sending back. Use the '✏️ Suggest Change' button next to any field you want to modify.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Fill any required pending fields first
            const filledFields: Record<string, string> = {};
            for (const field of pendingInputFields) {
                const value = formValues[field] as string;
                if (value?.trim()) {
                    filledFields[field] = value;
                }
            }

            const response = await fetch("/api/ndas/submit-input", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signerId,
                    draftId,
                    filledFields: Object.keys(filledFields).length > 0 ? filledFields : undefined,
                    suggestedChanges,
                    sendBackForReview: true, // Flag to notify Party A
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
                {/* Pending suggestion - yellow highlight with accept/reject */}
                {state === "pending_suggestion" && incoming && !suggestionResponses[field] && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-600 text-lg">💬</span>
                            <span className="font-medium text-yellow-800">Change Suggested for {label}</span>
                        </div>
                        <div className="mb-3">
                            <p className="text-sm text-gray-600">
                                <span className="line-through">{incoming.oldValue || "(empty)"}</span>
                                {" → "}
                                <span className="font-semibold text-yellow-700">{incoming.newValue}</span>
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => acceptSuggestion(field)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm">✓ Accept</button>
                            <button onClick={() => rejectSuggestion(field)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm">✗ Reject</button>
                            <button onClick={() => setShowingSuggestionFor(prev => new Set([...prev, field]))} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium text-sm">↩ Counter</button>
                        </div>
                        {showingSuggestionFor.has(field) && (
                            <div className="mt-3">
                                <input type="text" value={counterValues[field] || ""} onChange={(e) => setCounterValues(prev => ({ ...prev, [field]: e.target.value }))} placeholder="Your counter-proposal..." className="w-full p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                                <button onClick={() => counterSuggestion(field, counterValues[field])} className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm">Submit Counter</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Response shown */}
                {suggestionResponses[field] && (
                    <div className={`px-3 py-2 rounded-lg mb-2 text-sm ${suggestionResponses[field] === "accepted" ? "bg-green-100 text-green-700" : suggestionResponses[field] === "rejected" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {suggestionResponses[field] === "accepted" && `✓ Accepted change for ${label}`}
                        {suggestionResponses[field] === "rejected" && `✗ Rejected change for ${label}`}
                        {suggestionResponses[field] === "countered" && `↩ Counter for ${label}: ${counterValues[field]}`}
                    </div>
                )}

                {/* Regular field row */}
                {state !== "pending_suggestion" && (
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            {label}
                            {isEditable && <span className="ml-2 text-orange-500 text-xs font-normal">⏳ Required</span>}
                        </label>
                        {state === "readonly" && !suggestionResponses[field] && (
                            <button onClick={() => toggleSuggestion(field)} className={`px-3 py-1 rounded-lg font-medium text-xs whitespace-nowrap ${showingSuggestionFor.has(field) ? "bg-gray-500 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
                                {showingSuggestionFor.has(field) ? "Cancel" : "✏️ Suggest Change"}
                            </button>
                        )}
                    </div>
                )}

                {/* Input field */}
                {state !== "pending_suggestion" && (
                    useTextarea ? (
                        <textarea
                            value={value}
                            onChange={(e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }))}
                            className={`${getFieldClass(field)} w-full rounded-lg shadow-sm transition-all`}
                            rows={3}
                            placeholder={isEditable ? `Please enter ${label.toLowerCase()}` : ""}
                            disabled={!isEditable}
                        />
                    ) : (
                        <input
                            type={field.includes("email") ? "email" : field.includes("phone") ? "tel" : field.includes("date") ? "date" : field.includes("month") ? "number" : "text"}
                            value={value}
                            onChange={(e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }))}
                            className={`${getFieldClass(field)} w-full rounded-lg shadow-sm transition-all`}
                            placeholder={isEditable ? `Please enter ${label.toLowerCase()}` : ""}
                            disabled={!isEditable}
                        />
                    )
                )}

                {/* Inline suggestion input for readonly fields */}
                {state === "readonly" && showingSuggestionFor.has(field) && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="block text-sm text-blue-700 mb-1">Your suggested value:</label>
                        {useTextarea ? (
                            <textarea value={mySuggestions[field] || ""} onChange={(e) => setMySuggestions(prev => ({ ...prev, [field]: e.target.value }))} className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} placeholder={`Suggest a new value for ${label.toLowerCase()}`} />
                        ) : (
                            <input type="text" value={mySuggestions[field] || ""} onChange={(e) => setMySuggestions(prev => ({ ...prev, [field]: e.target.value }))} className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder={`Suggest a new value for ${label.toLowerCase()}`} />
                        )}
                    </div>
                )}
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
                    <p className="text-gray-600">Your information has been submitted. The other party will review and you&apos;ll be notified of next steps.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicToolbar />

            {/* Main Container with Fixed Layout */}
            <div className="flex h-[calc(100vh-64px)]">
                {/* LEFT SIDE: Form Content (Scrollable) */}
                <div className={`transition-all duration-300 ${showLivePreview ? "w-full lg:w-[45%]" : "w-full"} overflow-y-auto`}>
                    <div className="max-w-4xl mx-auto p-6">
                        {/* Header Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
                            <div className="bg-teal-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold text-white">{ndaTitle}</h1>
                                            <p className="text-blue-100 text-sm">Complete your information to proceed</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowLivePreview(!showLivePreview)} className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border border-white/30" title={showLivePreview ? "Hide Preview" : "Show Preview"}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {showLivePreview ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            )}
                                        </svg>
                                        {showLivePreview ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Completion Progress</span>
                                    <span className="text-sm font-bold text-teal-600">{computeCompletionPercent()}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div className="h-2.5 bg-teal-600 transition-all duration-500 ease-out rounded-full" style={{ width: `${computeCompletionPercent()}%` }} />
                                </div>
                            </div>
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
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-6">
                                {/* Step Navigation */}
                                <div className="flex items-center justify-between gap-1 mb-6">
                                    {steps.map((s, i) => (
                                        <div key={s} className="flex-1 relative">
                                            <button onClick={() => goToStep(i)} className={`w-full transition-all duration-300 ${i === step ? 'transform scale-105' : ''}`}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all duration-300 ${i === step ? 'bg-teal-600 text-white shadow-lg ring-4 ring-teal-100' : i < step ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                                                        {i < step ? (
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <span className="font-bold text-sm">{i + 1}</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-medium text-center transition-all duration-300 ${i === step ? 'text-teal-600 font-semibold' : 'text-gray-500'}`}>{s}</span>
                                                </div>
                                            </button>
                                            {i < steps.length - 1 && (
                                                <div className="absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5 bg-gray-200 -z-10">
                                                    <div className={`h-full bg-teal-600 transition-all duration-500 ${i < step ? 'w-full' : 'w-0'}`} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Form Content */}
                            <div className="bg-gray-50 rounded-xl p-6 mx-6 mb-6 min-h-[400px] border border-gray-200">
                                {/* Step 0: Document Details */}
                                {step === 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">Party A Information</h2>
                                                <p className="text-sm text-gray-600">Details of the first party (read-only)</p>
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
                                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 mb-4">
                                                <div className="flex gap-3">
                                                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-sm text-orange-800"><strong>Action required!</strong> Fields marked with ⏳ need your input.</p>
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
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-800">
                                                            You have {getPendingSuggestionsCount()} suggested change{getPendingSuggestionsCount() !== 1 ? 's' : ''} pending
                                                        </p>
                                                        <p className="text-sm text-blue-700 mt-1">
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
                                                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                                            {/* Proceed to Sign Button */}
                                            <button
                                                onClick={handleProceedToSign}
                                                className="w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                                Proceed to Sign
                                            </button>

                                            {/* Divider */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-px bg-gray-300"></div>
                                                <span className="text-sm text-gray-500">or</span>
                                                <div className="flex-1 h-px bg-gray-300"></div>
                                            </div>

                                            {/* Send Back with Changes Button */}
                                            <button
                                                onClick={handleSendBackWithChanges}
                                                disabled={isSubmitting}
                                                className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${isSubmitting
                                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        : "bg-orange-100 text-orange-700 border-2 border-orange-300 hover:bg-orange-200 hover:border-orange-400"
                                                    }`}
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
                                                        {getPendingSuggestionsCount() > 0 && (
                                                            <span className="ml-1 px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full text-sm">
                                                                {getPendingSuggestionsCount()}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <p className="text-xs text-gray-500 text-center">
                                            <strong>Proceed to Sign:</strong> All fields required (except Additional Terms).<br />
                                            <strong>Send Back with Changes:</strong> Suggest modifications for the other party to review.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between p-6 pt-0">
                                <button onClick={goBack} disabled={step === 0} className={`px-6 py-3 rounded-lg font-semibold transition-all ${step === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>← Back</button>
                                {step < steps.length - 1 && (
                                    <button onClick={goNext} className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all shadow-md">Next →</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Live Preview Panel */}
                {showLivePreview && (
                    <div className="hidden lg:block lg:w-[55%] bg-gray-100 border-l border-gray-200">
                        <div className="sticky top-0 h-full overflow-hidden flex flex-col">
                            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    <span className="font-medium text-gray-700">Live Preview</span>
                                    {previewLoading && <span className="text-xs text-gray-500 ml-2 flex items-center gap-1"><svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Updating...</span>}
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden p-4">
                                <div className="bg-white rounded-xl shadow-lg h-full overflow-hidden">
                                    <iframe srcDoc={previewHtml} title="NDA Preview" className="w-full h-full border-0" sandbox="allow-same-origin" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
