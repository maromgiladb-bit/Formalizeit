"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import PublicToolbar from "@/components/PublicToolbar";
import { useDebouncedPreview } from "@/hooks/useDebouncedPreview";
import { sanitizeForHtml } from "@/lib/sanitize";

type FormValues = {
	docName: string;
	effective_date: string;
	term_months: string;
	confidentiality_period_months: string;
	party_a_name: string;
	party_a_address: string;
	party_a_phone: string;
	party_a_signatory_name: string;
	party_a_title: string;
	party_a_email: string;
	party_b_name: string;
	party_b_address: string;
	party_b_phone: string;
	party_b_signatory_name: string;
	party_b_title: string;
	party_b_email: string;
	purpose: string;
	governing_law: string;
	ip_ownership: string;
	non_solicit: string;
	exclusivity: string;
	additional_terms: string;
	party_a_ask_receiver_fill: boolean;
	party_b_name_ask_receiver: boolean;
	party_b_address_ask_receiver: boolean;
	party_b_phone_ask_receiver: boolean;
	party_b_signatory_name_ask_receiver: boolean;
	party_b_title_ask_receiver: boolean;
	party_b_email_ask_receiver: boolean;
};
const DEFAULTS: FormValues = {
	docName: "",
	effective_date: new Date().toISOString().slice(0, 10),
	term_months: "",
	confidentiality_period_months: "",
	party_a_name: "",
	party_a_address: "",
	party_a_phone: "",
	party_a_signatory_name: "",
	party_a_title: "",
	party_a_email: "",
	party_b_name: "",
	party_b_address: "",
	party_b_phone: "",
	party_b_signatory_name: "",
	party_b_title: "",
	party_b_email: "",
	purpose: "evaluating a potential business relationship",
	governing_law: "",
	ip_ownership: "",
	non_solicit: "",
	exclusivity: "",
	additional_terms: "",
	party_a_ask_receiver_fill: false,
	party_b_name_ask_receiver: false,
	party_b_address_ask_receiver: false,
	party_b_phone_ask_receiver: false,
	party_b_signatory_name_ask_receiver: false,
	party_b_title_ask_receiver: false,
	party_b_email_ask_receiver: false,
};

export default function FillNDAHTML() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isLoaded, user } = useUser();
	const [values, setValues] = useState<FormValues>(DEFAULTS);
	const [lastSavedValues, setLastSavedValues] = useState<FormValues>(DEFAULTS);
	const [warning, setWarning] = useState("");
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [showLivePreview, setShowLivePreview] = useState(false);
	const [livePreviewHtml, setLivePreviewHtml] = useState("");
	const [draftId, setDraftId] = useState<string | null>(null);
	const [workflowState, setWorkflowState] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Suggestion state for bidirectional editing
	type Suggestion = { oldValue: string; newValue: string; suggestedBy: 'party_a' | 'party_b' };
	const [incomingSuggestions, setIncomingSuggestions] = useState<Record<string, Suggestion>>({});
	const [suggestionResponses, setSuggestionResponses] = useState<Record<string, 'accepted' | 'rejected' | 'countered'>>({});
	const [counterValues, setCounterValues] = useState<Record<string, string>>({});
	const [showingSuggestionFor, setShowingSuggestionFor] = useState<Set<string>>(new Set());

	const [signersEmail, setSignersEmail] = useState("");
	const [sendingForSignature, setSendingForSignature] = useState(false);
	const [shareableLink, setShareableLink] = useState("");
	const [showShareLinkModal, setShowShareLinkModal] = useState(false);
	const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
	const [step, setStep] = useState<number>(0);
	// Send for input modal state
	const [showSendForInputModal, setShowSendForInputModal] = useState(false);
	const [inputRecipientEmail, setInputRecipientEmail] = useState("");
	const [sendingForInput, setSendingForInput] = useState(false);
	// No company profile modal state
	const [showNoProfileModal, setShowNoProfileModal] = useState(false);
	// Verify email modal state
	const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
	const [verifyRecipientEmail, setVerifyRecipientEmail] = useState("");
	const [pendingDraftId, setPendingDraftId] = useState<string | null>(null);
	const [generatedShareLink, setGeneratedShareLink] = useState("");
	const [suggestedEmailSubject, setSuggestedEmailSubject] = useState("");
	const [suggestedEmailBody, setSuggestedEmailBody] = useState("");
	const [emailSent, setEmailSent] = useState(false);
	const [showMoreShareOptions, setShowMoreShareOptions] = useState(false);

	// const [showExitWarningModal, setShowExitWarningModal] = useState(false); // Removed in favor of native warning
	const [templateId, setTemplateId] = useState<string>("mutual_nda_v1"); // HTML template by default

	// Email suggestions state
	const [emailSuggestions, setEmailSuggestions] = useState<Array<{
		email: string;
		count: number;
		lastUsed: string;
		recentNda: string;
		hasSignedBefore: boolean;
	}>>([]);
	const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);
	const [loadingCompanyProfile, setLoadingCompanyProfile] = useState(false);

	// Warn on tab close if unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			// Check if form is dirty (compare against last saved values)
			const isDirty = JSON.stringify(values) !== JSON.stringify(lastSavedValues);

			if (isDirty) {
				e.preventDefault();
				const msg = "any unsaved changes may be deleted";
				e.returnValue = msg;
				return msg;
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [values, lastSavedValues]);
	const [showPdfPreview, setShowPdfPreview] = useState(false);
	const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
	const [generatingPdf, setGeneratingPdf] = useState(false);

	// Party A review workflow
	const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
	const [requestChangesMessage, setRequestChangesMessage] = useState('');
	const [processingChanges, setProcessingChanges] = useState(false);

	const steps = ["Document", "Party A", "Party B", "Clauses", "Review"];

	const isDev = process.env.NODE_ENV === 'development';

	// Dev helper: Auto-fill with mock data
	const autoFillMockData = () => {
		const mockData: FormValues = {
			docName: "Mock NDA Agreement",
			effective_date: new Date().toISOString().slice(0, 10),
			term_months: "24",
			confidentiality_period_months: "36",
			party_a_name: "Acme Corporation",
			party_a_address: "123 Tech Street, San Francisco, CA 94105, USA",
			party_a_phone: "+1-555-123-4567",
			party_a_signatory_name: "John Smith",
			party_a_title: "Chief Executive Officer",
			party_a_email: "maromgiladb@gmail.com",
			party_b_name: "TechStart Inc.",
			party_b_address: "456 Innovation Ave, Palo Alto, CA 94301, USA",
			party_b_phone: "+1-555-987-6543",
			party_b_signatory_name: "Jane Doe",
			party_b_title: "Chief Technology Officer",
			party_b_email: "maromgilad9@gmail.com",
			purpose: "evaluating a potential business relationship between the parties",
			governing_law: "California",
			ip_ownership: "Each party retains ownership of their respective intellectual property",
			non_solicit: "Neither party shall solicit the other's employees during the term and for 12 months after",
			exclusivity: "Non-exclusive agreement",
			additional_terms: "This agreement may be terminated with 30 days written notice by either party.",
			party_a_ask_receiver_fill: false,
			party_b_name_ask_receiver: false,
			party_b_address_ask_receiver: false,
			party_b_phone_ask_receiver: false,
			party_b_signatory_name_ask_receiver: false,
			party_b_title_ask_receiver: false,
			party_b_email_ask_receiver: false,
		};
		setValues(mockData);
		setWarning("✨ Form auto-filled with mock data");
		setTimeout(() => setWarning(""), 3000);
	};

	// Load company profile and auto-fill Party A fields
	const loadCompanyProfile = async () => {
		setLoadingCompanyProfile(true);
		try {
			const response = await fetch('/api/company-profile');
			const data = await response.json();

			if (data.profile) {
				const profile = data.profile;

				// Build address only if we have address components
				let address = '';
				if (profile.address || profile.addressLine2 || profile.city || profile.state || profile.zipCode || profile.country) {
					const addressParts = [
						profile.address,
						profile.addressLine2,
						[profile.city, profile.state].filter(Boolean).join(', '),
						profile.zipCode,
						profile.country
					].filter(Boolean);
					address = addressParts.join(', ');
				}

				// Check if there's any useful data to fill
				const hasData = profile.companyName || address || profile.phone || profile.signatoryName || profile.signatoryTitle || profile.email;
				if (!hasData) {
					setShowNoProfileModal(true);
					return;
				}

				setValues(prev => ({
					...prev,
					// Only update fields if profile has a non-null/non-empty value
					...(profile.companyName && { party_a_name: profile.companyName }),
					...(address && { party_a_address: address }),
					...(profile.phone && { party_a_phone: profile.phone }),
					...(profile.signatoryName && { party_a_signatory_name: profile.signatoryName }),
					...(profile.signatoryTitle && { party_a_title: profile.signatoryTitle }),
					...(profile.email && { party_a_email: profile.email })
				}));
				console.log('✅ Auto-filled Party A from company profile');
			} else {
				setShowNoProfileModal(true);
			}
		} catch (error) {
			console.error('Error loading company profile:', error);
		} finally {
			setLoadingCompanyProfile(false);
		}
	};

	// Generate PDF preview
	const previewPDF = async () => {
		setGeneratingPdf(true);
		try {
			console.log("📄 Generating PDF preview with data:", values);
			console.log("📋 Using template:", templateId);

			// Always use current form data for preview (not draft from DB)
			// This ensures the preview matches what you see in the HTML preview
			const payload = { ...templateData };  // templateData already includes templateId

			console.log("📦 Sending payload to PDF API:", {
				hasTemplateId: !!payload.templateId,
				templateId: payload.templateId,
				hasDraftId: false
			});			// Use PDF preview endpoint (supports both draftId and direct data)
			const res = await fetch("/api/ndas/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const json = await res.json();
			console.log("PDF Preview response:", json);

			if (!res.ok) {
				console.error("❌ PDF preview failed:", json);
				console.error("❌ Error details:", json.details);
				setWarning(json.error || json.details || "PDF preview failed");
				return;
			}

			// fileUrl contains the data:application/pdf;base64,... string
			if (!json.fileUrl || !json.fileUrl.startsWith("data:application/pdf;base64,")) {
				throw new Error("Invalid PDF data received");
			}

			// Open PDF in new tab
			const newWindow = window.open();
			if (newWindow) {
				newWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>NDA PDF Preview</title>
						<style>
							body { margin: 0; padding: 0; }
							iframe { width: 100%; height: 100vh; border: none; }
						</style>
					</head>
					<body>
						<iframe src="${json.fileUrl}"></iframe>
					</body>
					</html>
				`);
				newWindow.document.close();
			} else {
				// Fallback if popup blocked - use modal
				setPdfPreviewUrl(json.fileUrl);
				setShowPdfPreview(true);
			}

			console.log("✅ PDF preview opened successfully");
			setWarning(""); // Clear any previous warnings
		} catch (e) {
			console.error("PDF preview error:", e);
			setWarning(e instanceof Error ? e.message : "PDF preview failed");
		} finally {
			setGeneratingPdf(false);
		}
	};

	// B) Use debounced preview hook - prevents stale/racing responses
	// Transform field names from party_a/party_b to party_1/party_2 for template compatibility
	const templateData = {
		...values,
		templateId,
		// Map party_a fields to party_1 with sanitization
		party_1_name: sanitizeForHtml(values.party_a_name),
		party_1_address: sanitizeForHtml(values.party_a_address),
		party_1_signatory_name: sanitizeForHtml(values.party_a_signatory_name),
		party_1_signatory_title: sanitizeForHtml(values.party_a_title),
		party_1_phone: sanitizeForHtml(values.party_a_phone),
		party_1_emails_joined: sanitizeForHtml(values.party_a_email),
		// Map party_b fields to party_2 with sanitization
		party_2_name: sanitizeForHtml(values.party_b_name),
		party_2_address: sanitizeForHtml(values.party_b_address),
		party_2_signatory_name: sanitizeForHtml(values.party_b_signatory_name),
		party_2_signatory_title: sanitizeForHtml(values.party_b_title),
		party_2_phone: sanitizeForHtml(values.party_b_phone),
		party_2_emails_joined: sanitizeForHtml(values.party_b_email),
		// Map other fields with sanitization
		effective_date_long: values.effective_date ? new Date(values.effective_date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}) : '',
		governing_law_full: sanitizeForHtml(values.governing_law),
		term_years_number: values.term_months ? Math.floor(parseInt(values.term_months) / 12) : '',
		term_years_words: values.term_months ? (Math.floor(parseInt(values.term_months) / 12) === 1 ? 'one' : 'two') : '',
		purpose: sanitizeForHtml(values.purpose),
		information_scope_text: 'All information, materials, documents, data, and other content',
		// Sanitize other text fields that might have newlines
		ip_ownership: sanitizeForHtml(values.ip_ownership),
		additional_terms: sanitizeForHtml(values.additional_terms),
	};

	const { data: liveData, loading: previewLoading, error: previewError } = useDebouncedPreview(
		"/api/ndas/preview-html",
		templateData,
		400
	);

	// Refs for iframe scroll preservation
	const iframeRef = React.useRef<HTMLIFrameElement>(null);
	const scrollPosRef = React.useRef<number>(0);

	// Update live preview HTML when data arrives
	useEffect(() => {
		console.log('🎨 Live data received:', {
			hasData: !!liveData,
			hasHtml: !!liveData?.html,
			htmlLength: liveData?.html?.length || 0,
			htmlPreview: liveData?.html?.substring(0, 100),
			values: values
		});
		if (liveData?.html) {
			// Save current scroll position before update
			if (iframeRef.current && iframeRef.current.contentWindow) {
				try {
					scrollPosRef.current = iframeRef.current.contentWindow.scrollY;
				} catch (e) {
					console.warn("Could not save scroll position", e);
				}
			}
			console.log('🎨 Setting live preview HTML, length:', liveData.html.length);
			setLivePreviewHtml(liveData.html);
		}
	}, [liveData, values]);

	// Fetch email suggestions
	const fetchEmailSuggestions = useCallback(async (query: string) => {
		if (!query || query.length < 2) {
			setEmailSuggestions([]);
			setShowEmailSuggestions(false);
			return;
		}

		try {
			setLoadingSuggestions(true);
			const res = await fetch(`/api/ndas/email-suggestions?q=${encodeURIComponent(query)}`);
			const data = await res.json();

			if (res.ok && data.suggestions) {
				setEmailSuggestions(data.suggestions);
				setShowEmailSuggestions(data.suggestions.length > 0);
			}
		} catch (error) {
			console.error("Failed to fetch email suggestions:", error);
		} finally {
			setLoadingSuggestions(false);
		}
	}, []);

	// C) Fix email suggestions debounce - clean timeout on unmount
	useEffect(() => {
		if (signersEmail.length < 2) {
			setEmailSuggestions([]);
			setShowEmailSuggestions(false);
			return;
		}
		const id = setTimeout(() => {
			fetchEmailSuggestions(signersEmail);
		}, 300);
		return () => clearTimeout(id);
	}, [signersEmail, fetchEmailSuggestions]);

	const loadDraft = useCallback(async (id: string) => {
		console.log('=== Loading draft ===')
		console.log('Draft ID:', id)
		setLoading(true);
		try {
			const res = await fetch(`/api/ndas/drafts/${id}`);
			console.log('Response status:', res.status)

			const json = await res.json();
			console.log('Response data:', json)

			if (!res.ok) throw new Error(json.error || "Failed to load draft");

			if (json.draft?.content) {
				console.log('Setting form values from draft content:', json.draft.content)
				// Compute next values in one pass, then set once
				const next = { ...DEFAULTS, ...json.draft.content };
				if (json.draft.title) next.docName = json.draft.title;
				setValues(next);
				setLastSavedValues(next);
				setDraftId(json.draft.id);
				setWorkflowState(json.draft.workflowState || null);

				// Parse revisions to extract incoming suggestions from Party B
				if (json.draft.revisions && json.draft.revisions.length > 0) {
					const latestRevision = json.draft.revisions[0];
					const revContent = latestRevision.content as Record<string, unknown>;
					const revSuggestions = revContent?.suggestedChanges as Record<string, string> | undefined;
					const submittedBy = revContent?.submittedBy as string | undefined;
					const lastEditedBy = json.draft.lastEditedBy;

					// If last edit was by party_b and there are suggestions, show them
					if (lastEditedBy === 'party_b' && revSuggestions) {
						const suggestions: Record<string, Suggestion> = {};
						for (const [field, newValue] of Object.entries(revSuggestions)) {
							if (newValue?.trim()) {
								suggestions[field] = {
									oldValue: (json.draft.content[field] as string) || '',
									newValue,
									suggestedBy: 'party_b'
								};
							}
						}
						setIncomingSuggestions(suggestions);
						console.log('Loaded incoming suggestions from Party B:', suggestions);
					}
				}
			} else {
				console.log('No draft data found, using defaults')
				setValues(DEFAULTS);
			}
		} catch (e) {
			console.error('Load draft error:', e)
			setWarning(e instanceof Error ? e.message : "Failed to load draft");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!user) return;

		const urlDraftId = searchParams.get("draftId");
		const urlTemplateId = searchParams.get("templateId");
		const isNewNda = searchParams.get("new") === "true";

		// Always use HTML template for this page, but allow override from URL
		if (urlTemplateId) {
			console.log("📋 Using template:", urlTemplateId);
			setTemplateId(urlTemplateId);
		} else {
			console.log("📋 Using default HTML template: professional_mutual_nda_v1");
			setTemplateId("professional_mutual_nda_v1");
		}

		if (isNewNda) {
			// Starting a new NDA - clear everything and use defaults
			console.log("🆕 Starting new NDA - clearing all data");
			setValues(DEFAULTS);
			setLastSavedValues(DEFAULTS);
			setDraftId(null);
			localStorage.removeItem("fillndahtmlDraft");
		} else if (urlDraftId) {
			// Loading specific draft from URL
			loadDraft(urlDraftId);
		} else {
			// Try to load from localStorage (auto-save)
			const d = localStorage.getItem("fillndahtmlDraft");
			if (d) {
				try {
					const parsed = JSON.parse(d);
					setValues({ ...DEFAULTS, ...(parsed.values || {}) });
					setDraftId(parsed.draftId || null);
					console.log("📂 Restored from localStorage");
				} catch (e) {
					console.error(e);
				}
			}
		}
	}, [user, searchParams, loadDraft]);

	// Listen for click-to-field messages from the preview iframe
	// Maps template field names to their form step numbers
	const FIELD_STEP_MAP: Record<string, number> = {
		effective_date: 0, term_months: 0, confidentiality_period_months: 0, docName: 0,
		party_a_name: 1, party_a_address: 1, party_a_phone: 1, party_a_signatory_name: 1, party_a_title: 1, party_a_email: 1,
		party_b_name: 2, party_b_address: 2, party_b_phone: 2, party_b_signatory_name: 2, party_b_title: 2, party_b_email: 2,
		purpose: 3, governing_law: 3, ip_ownership: 3, non_solicit: 3, exclusivity: 3, additional_terms: 3,
		information_scope_text: 3,
	};

	useEffect(() => {
		const handleFieldClick = (e: MessageEvent) => {
			if (e.data?.type === 'field-click' && e.data.field) {
				const fieldName = e.data.field;

				// Navigate to the correct step first
				const targetStep = FIELD_STEP_MAP[fieldName];
				if (targetStep !== undefined && step !== targetStep) {
					setStep(targetStep);
				}

				// Find the input after a short delay (to allow step change to render)
				setTimeout(() => {
					// Search for the input by walking all inputs/textareas/selects
					const allInputs = document.querySelectorAll('input, textarea, select');
					for (const el of allInputs) {
						const htmlEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
						// Match by checking if the element's value matches values[fieldName]
						// or if a parent node contains the field name label
						const parentDiv = htmlEl.closest('div');
						if (parentDiv) {
							const label = parentDiv.querySelector('label');
							if (label) {
								const labelText = label.textContent?.toLowerCase() || '';
								const fieldLabels: Record<string, string[]> = {
									effective_date: ['effective date'],
									term_months: ['term'],
									party_a_name: ['party name'],
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
									additional_terms: ['additional'],
									information_scope_text: ['scope', 'information'],
								};
								const matchLabels = fieldLabels[fieldName];
								if (matchLabels && matchLabels.some(ml => labelText.includes(ml))) {
									htmlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
									setTimeout(() => htmlEl.focus(), 300);
									// Add a brief highlight animation
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

	const setField = (k: keyof FormValues, v: string | boolean) => {
		setValues((s) => ({ ...s, [k]: v } as unknown as FormValues));
		const keyStr = k as unknown as string;
		if (validationErrors.has(keyStr)) {
			const newErrors = new Set(validationErrors);
			newErrors.delete(keyStr);
			setValidationErrors(newErrors);
		}
	};

	const getFieldClass = (fieldName: string, baseClass: string = "p-2 border") => {
		const hasError = validationErrors.has(fieldName);
		const hasSuggestion = incomingSuggestions[fieldName] && !suggestionResponses[fieldName];
		if (hasSuggestion) {
			return `${baseClass} border-yellow-400 bg-yellow-50`;
		}
		return `${baseClass} ${hasError ? "border-red-500 bg-red-50" : "border-gray-300"}`;
	};

	// Suggestion handlers
	const acceptSuggestion = (field: string) => {
		const suggestion = incomingSuggestions[field];
		if (suggestion) {
			setValues(prev => ({ ...prev, [field]: suggestion.newValue } as FormValues));
			setSuggestionResponses(prev => ({ ...prev, [field]: 'accepted' }));
		}
	};

	const rejectSuggestion = (field: string) => {
		setSuggestionResponses(prev => ({ ...prev, [field]: 'rejected' }));
	};

	const counterSuggestion = (field: string, value: string) => {
		setCounterValues(prev => ({ ...prev, [field]: value }));
		setSuggestionResponses(prev => ({ ...prev, [field]: 'countered' }));
		setShowingSuggestionFor(prev => {
			const next = new Set(prev);
			next.delete(field);
			return next;
		});
	};

	const toggleSuggestionInput = (field: string) => {
		setShowingSuggestionFor(prev => {
			const next = new Set(prev);
			if (next.has(field)) {
				next.delete(field);
			} else {
				next.add(field);
			}
			return next;
		});
	};

	const hasPendingSuggestion = (field: string) => {
		return incomingSuggestions[field] && !suggestionResponses[field];
	};

	const getPendingSuggestionsCount = () => {
		return Object.keys(incomingSuggestions).filter(field => !suggestionResponses[field]).length;
	};

	// Render suggestion box for a field
	const renderSuggestionBox = (field: string, label: string) => {
		const suggestion = incomingSuggestions[field];
		const response = suggestionResponses[field];

		// No suggestion for this field
		if (!suggestion) return null;

		// Already responded - compact badge
		if (response) {
			return (
				<div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${response === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
					response === 'rejected' ? 'bg-red-100 text-red-700' :
						'bg-amber-100 text-amber-700'
					}`}>
					{response === 'accepted' && (
						<>
							<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
							</svg>
							Accepted
						</>
					)}
					{response === 'rejected' && (
						<>
							<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
							</svg>
							Rejected
						</>
					)}
					{response === 'countered' && (
						<>
							<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
							Counter sent
						</>
					)}
				</div>
			);
		}

		// Show pending suggestion - compact inline design
		return (
			<div className="rounded-lg border border-gray-200 overflow-hidden mb-2">
				{/* Original value - strikethrough */}
				<div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
					<div className="flex items-center gap-2">
						<span className="text-xs text-gray-500 uppercase tracking-wide">Current:</span>
						<span className="text-sm text-gray-500 line-through">{suggestion.oldValue || '(empty)'}</span>
					</div>
				</div>
				{/* Suggested value with actions */}
				<div className="bg-amber-50/50 px-3 py-2">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 flex-1 min-w-0">
							<span className="text-xs text-amber-600 uppercase tracking-wide">Suggested:</span>
							<span className="text-sm font-medium text-gray-800 truncate">{suggestion.newValue}</span>
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
								onClick={() => toggleSuggestionInput(field)}
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
								value={counterValues[field] || ''}
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
		);
	};

	const validate = (): { isValid: boolean; errors: Set<string>; message: string | null } => {
		const errors = new Set<string>();
		const mandatoryFields = [
			"docName",
			"effective_date",
			"term_months",
			"confidentiality_period_months",
			"governing_law",
			"ip_ownership",
			"non_solicit",
			"exclusivity",
		];

		// Add Party A fields only if not asking receiver to fill
		if (!values.party_a_ask_receiver_fill) {
			mandatoryFields.push("party_a_name", "party_a_address", "party_a_signatory_name", "party_a_title");
		}

		// Add Party B fields only if not asking receiver to fill for that specific field
		if (!values.party_b_name_ask_receiver) {
			mandatoryFields.push("party_b_name");
		}
		if (!values.party_b_address_ask_receiver) {
			mandatoryFields.push("party_b_address");
		}
		if (!values.party_b_signatory_name_ask_receiver) {
			mandatoryFields.push("party_b_signatory_name");
		}
		if (!values.party_b_title_ask_receiver) {
			mandatoryFields.push("party_b_title");
		}
		if (!values.party_b_title_ask_receiver) {
			mandatoryFields.push("party_b_title");
		}
		// party_b_email is no longer mandatory here, can be added in sign-nda


		mandatoryFields.forEach((field) => {
			const value = values[field as keyof FormValues];
			if (value === undefined || value === null) {
				errors.add(field);
				return;
			}
			if (typeof value === "string" && !value.trim()) {
				errors.add(field);
			}
		});

		// Still validate email format if Party B email is provided and not asking receiver to fill
		// Removed strict check to allow skipping email in this step


		let message = null;
		if (errors.size > 0) {
			message = `Please fill in ${errors.size} required field(s)`;
		}

		return { isValid: errors.size === 0, errors, message };
	};

	const isStepComplete = (s: number) => {
		const stepFields: string[] = [];
		switch (s) {
			case 0:
				stepFields.push("docName", "term_months", "confidentiality_period_months");
				break;
			case 1:
				// Party A fields only required if not asking receiver to fill
				if (!values.party_a_ask_receiver_fill) {
					stepFields.push("party_a_name", "party_a_address", "party_a_signatory_name", "party_a_title");
				} else {
					// If asking receiver to fill, step is complete
					return true;
				}
				break;
			case 2:
				// Party B fields only required if not asking receiver to fill for that specific field
				if (!values.party_b_name_ask_receiver) {
					stepFields.push("party_b_name");
				}
				if (!values.party_b_address_ask_receiver) {
					stepFields.push("party_b_address");
				}
				if (!values.party_b_signatory_name_ask_receiver) {
					stepFields.push("party_b_signatory_name");
				}
				if (!values.party_b_title_ask_receiver) {
					stepFields.push("party_b_title");
				}
				// If all Party B fields are set to "ask receiver", step is complete
				if (stepFields.length === 0) {
					return true;
				}
				break;
			case 3:
				// Clauses considered complete if present (but mandatory globally)
				stepFields.push("governing_law", "ip_ownership", "non_solicit", "exclusivity");
				break;
			case 4:
				// review - all mandatory fields based on ask_receiver_fill flags
				stepFields.push(
					"docName",
					"effective_date",
					"term_months",
					"confidentiality_period_months",
				);
				// Add party fields only if not asking receiver to fill
				if (!values.party_a_ask_receiver_fill) {
					stepFields.push("party_a_name");
				}
				if (!values.party_b_name_ask_receiver) {
					stepFields.push("party_b_name");
				}
				break;
			default:
				return false;
		}

		for (const field of stepFields) {
			const val = values[field as keyof FormValues];
			if (!val || (typeof val === "string" && !val.trim())) return false;
		}
		return true;
	};

	// D) Fix computeCompletionPercent - respect "ask receiver to fill" like validate() does
	const computeCompletionPercent = () => {
		const requiredFields = [
			"docName",
			"effective_date",
			"term_months",
			"confidentiality_period_months",
			"governing_law",
			"ip_ownership",
			"non_solicit",
			"exclusivity",
		];

		// Add Party A fields only if not asking receiver to fill
		if (!values.party_a_ask_receiver_fill) {
			requiredFields.push("party_a_name", "party_a_address", "party_a_signatory_name", "party_a_title");
		}

		// Add Party B fields only if not asking receiver to fill for that specific field
		if (!values.party_b_name_ask_receiver) {
			requiredFields.push("party_b_name");
		}
		if (!values.party_b_address_ask_receiver) {
			requiredFields.push("party_b_address");
		}
		if (!values.party_b_signatory_name_ask_receiver) {
			requiredFields.push("party_b_signatory_name");
		}
		if (!values.party_b_title_ask_receiver) {
			requiredFields.push("party_b_title");
		}
		if (!values.party_b_title_ask_receiver) {
			requiredFields.push("party_b_title");
		}

		const total = requiredFields.length;
		let filled = 0;

		for (const field of requiredFields) {
			const val = values[field as keyof FormValues];
			if (val && typeof val === "string" && val.trim()) {
				filled += 1;
			}
		}

		return total === 0 ? 100 : Math.round((filled / total) * 100);
	};

	const goNext = () => {
		if (step < steps.length - 1) setStep(step + 1);
	};

	const goBack = () => {
		if (step > 0) setStep(step - 1);
	};

	const goToStep = (target: number) => {
		if (target === step) return;
		setWarning("");
		setStep(target);
	};

	const saveDraft = async () => {
		// Save directly without confirmation modal
		await performSave();
	};

	const deleteDraft = async () => {
		if (!draftId) return;
		if (!window.confirm('Delete this draft? This cannot be undone.')) return;
		setDeleting(true);
		try {
			const res = await fetch(`/api/ndas/drafts/${draftId}`, { method: 'DELETE' });
			if (!res.ok) {
				const data = await res.json();
				setWarning(data.error || 'Failed to delete draft');
				return;
			}
			router.push('/mynda');
		} catch {
			setWarning('Failed to delete draft');
		} finally {
			setDeleting(false);
		}
	};

	const performSave = async () => {
		setSaving(true);
		setWarning("");
		try {
			const payload = { draftId, title: values.docName, data: { ...values, templateId } };
			const res = await fetch("/api/ndas/drafts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Failed to save draft");
			setDraftId(json.draftId || json.id || draftId);
			setLastSavedValues(values);
			localStorage.setItem("fillndahtmlDraft", JSON.stringify({ values, draftId: json.draftId || json.id || draftId }));
			setWarning("Draft saved successfully.");
		} catch (e) {
			setWarning(e instanceof Error ? e.message : "Failed to save draft");
		} finally {
			setSaving(false);
		}
	};

	// Handle email input change with debounce
	// C) Clean email change handler - debounce moved to useEffect
	const handleEmailChange = (email: string) => {
		setSignersEmail(email);
		// Debounce logic now in useEffect above - prevents leaked timers
	};

	const selectEmailSuggestion = (email: string) => {
		setSignersEmail(email);
		setShowEmailSuggestions(false);
		setEmailSuggestions([]);
	};

	// Check if there are empty Party B fields that need to be filled
	const hasEmptyPartyBFields = () => {
		const partyBFields = [
			{ value: values.party_b_name, askReceiver: values.party_b_name_ask_receiver },
			{ value: values.party_b_address, askReceiver: values.party_b_address_ask_receiver },
			{ value: values.party_b_phone, askReceiver: values.party_b_phone_ask_receiver },
			{ value: values.party_b_signatory_name, askReceiver: values.party_b_signatory_name_ask_receiver },
			{ value: values.party_b_title, askReceiver: values.party_b_title_ask_receiver },
			{ value: values.party_b_email, askReceiver: values.party_b_email_ask_receiver },
		];

		return partyBFields.some(field => !field.value.trim() && field.askReceiver);
	};

	const sendForReview = async () => {
		const validation = validate();
		if (!validation.isValid) {
			setValidationErrors(validation.errors);
			setWarning(validation.message || "Please fill in all required fields");
			return;
		}

		// Auto-save draft if not already saved
		let currentDraftId = draftId;
		if (!currentDraftId) {
			try {
				const payload = { draftId: draftId, title: values.docName, data: { ...values, templateId } };
				const res = await fetch("/api/ndas/drafts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const json = await res.json();
				if (!res.ok) throw new Error(json.error || "Failed to save draft");
				currentDraftId = json.draftId || json.id;
				setDraftId(currentDraftId);
				setLastSavedValues(values);
			} catch (e) {
				setWarning(e instanceof Error ? e.message : "Failed to save draft automatically");
				return;
			}
		}

		// Store draft ID and show verification modal
		// Only reset the share link if this is a different draft — reuse the existing link if reopening for the same one
		const isReopeningForSameDraft = pendingDraftId === currentDraftId && !!generatedShareLink;
		setPendingDraftId(currentDraftId);
		if (!isReopeningForSameDraft) {
			setGeneratedShareLink("");
			setSuggestedEmailSubject("");
			setSuggestedEmailBody("");
			setEmailSent(false);
		}
		setShowMoreShareOptions(false);
		setVerifyRecipientEmail(values.party_b_email?.trim() || "");
		setShowVerifyEmailModal(true);
	};

	const approveChanges = async () => {
		if (!draftId) return;
		setProcessingChanges(true);
		try {
			const res = await fetch('/api/ndas/approve-changes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ draftId }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to approve changes');
			setWorkflowState('AWAITING_PARTY_A_SIGNATURE');
		} catch (e) {
			setWarning(e instanceof Error ? e.message : 'Failed to approve changes');
		} finally {
			setProcessingChanges(false);
		}
	};

	const requestChanges = async () => {
		if (!draftId || !requestChangesMessage.trim()) return;
		setProcessingChanges(true);
		try {
			const res = await fetch('/api/ndas/request-changes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ draftId, message: requestChangesMessage.trim() }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to request changes');
			setWorkflowState('AWAITING_PARTY_B_REVIEW');
			setShowRequestChangesModal(false);
			setRequestChangesMessage('');
		} catch (e) {
			setWarning(e instanceof Error ? e.message : 'Failed to request changes');
		} finally {
			setProcessingChanges(false);
		}
	};
	// Actually send after email verification
	const confirmAndSend = async () => {
		if (!verifyRecipientEmail?.trim()) {
			setWarning("Please enter a recipient email address.");
			return;
		}

		if (!pendingDraftId) {
			setWarning("No draft to send. Please try again.");
			return;
		}

		setSendingForSignature(true);
		setWarning("");

		try {
			const response = await fetch('/api/ndas/send-for-review', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					draftId: pendingDraftId,
					recipientEmail: verifyRecipientEmail.trim(),
					recipientName: values.party_b_name || undefined,
					message: `Please review this NDA: ${values.docName || 'Untitled NDA'}`
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to send for review');
			}

			// Cache the link and suggested email content for the client-side send options
			const link: string = result.reviewLink || '';
			if (link) setGeneratedShareLink(link);
			if (result.suggestedSubject) setSuggestedEmailSubject(result.suggestedSubject);
			if (result.suggestedBody) setSuggestedEmailBody(result.suggestedBody);
			setEmailSent(true);

		} catch (e) {
			setWarning(e instanceof Error ? e.message : "Failed to send");
		} finally {
			setSendingForSignature(false);
		}
	};

	// Share NDA via external platform (WhatsApp, LinkedIn, etc.)
	// Only available after the email has been sent — uses the cached review link
	const handleShare = (platform: string) => {
		if (!generatedShareLink) {
			setWarning("Please send by email first to generate the review link.");
			return;
		}
		openSharePlatform(platform, generatedShareLink);
	};

	const openSharePlatform = async (platform: string, link: string) => {
		const ndaTitle = values.docName || 'NDA';
		const msg = `Please review and sign our NDA — ${ndaTitle}`;
		const subject = suggestedEmailSubject || `Please review and sign our NDA — ${ndaTitle}`;
		const body = suggestedEmailBody || `Hi,\n\nPlease review and sign our Non-Disclosure Agreement:\n${link}\n\nThank you!`;
		const recipientEmail = verifyRecipientEmail.trim();
		const urls: Record<string, string> = {
			gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
			outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(recipientEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
			whatsapp: `https://wa.me/?text=${encodeURIComponent(`${msg}: ${link}`)}`,
			linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
			telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`,
			email: `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
			sms: `sms:?body=${encodeURIComponent(`${msg}: ${link}`)}`,
		};
		if (platform === 'copy') {
			try {
				await navigator.clipboard.writeText(link);
				setWarning("Link copied to clipboard!");
				setTimeout(() => setWarning(""), 2500);
			} catch {
				setWarning("Could not copy — please copy the link manually.");
				setTimeout(() => setWarning(""), 3000);
			}
		} else {
			window.open(urls[platform], '_blank', 'noopener,noreferrer');
		}
	};

	// Handle send for input from modal
	const handleSendForInput = async () => {
		if (!inputRecipientEmail?.trim()) {
			setWarning("Please enter Party B's email address.");
			return;
		}

		setSendingForInput(true);
		try {
			const response = await fetch('/api/ndas/send-for-input', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					draftId,
					recipientEmail: inputRecipientEmail.trim(),
					recipientName: values.party_b_name || undefined,
					message: `Please complete your information for this NDA: ${values.docName || 'Untitled NDA'}`
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to send for input');
			}

			// Success
			setShowSendForInputModal(false);
			router.push('/dashboard?message=sent-for-input');
		} catch (e) {
			setWarning(e instanceof Error ? e.message : "Failed to send");
		} finally {
			setSendingForInput(false);
		}
	};

	if (!isLoaded) return <div className="min-h-screen">Loading...</div>;
	if (!user) return <RedirectToSignIn />;

	const handleToolbarLinkClick = (e: React.MouseEvent) => {
		const isDirty = JSON.stringify(values) !== JSON.stringify(lastSavedValues);
		if (isDirty) {
			if (!window.confirm("any unsaved changes may be deleted")) {
				e.preventDefault();
			}
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<PublicToolbar onLinkClick={handleToolbarLinkClick} />

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
									<h1 className="text-base font-bold text-gray-900">{draftId ? "Edit NDA Draft" : "Create New NDA"}</h1>
									<p className="text-xs text-gray-500 mt-0.5">{draftId ? "Continue editing your agreement" : "Fill out the form to generate your agreement"}</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={() => setShowLivePreview(!showLivePreview)}
									className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
									Toggle Preview
								</button>
								{isDev && (
									<button
										onClick={autoFillMockData}
										className="px-3 py-1.5 text-sm text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1.5"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
										</svg>
										Mock Data
									</button>
								)}
							</div>
						</div>

						{/* Alerts */}
						{loading && (
							<div className="flex items-center gap-3 text-sm text-teal-700 mb-4 bg-teal-50 px-4 py-3 rounded-xl border border-teal-200">
								<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Loading draft...
							</div>
						)}
						{warning && (
							warning === "Draft saved successfully." ? (
								<div className="flex items-center gap-3 text-sm text-green-700 mb-4 bg-green-50 px-4 py-3 rounded-xl border border-green-200">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									{warning}
								</div>
							) : (
								<div className="flex items-center gap-3 text-sm text-red-700 mb-4 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
									</svg>
									{warning}
								</div>
							)
						)}

						{/* Pending Suggestions Banner */}
						{getPendingSuggestionsCount() > 0 && (
							<div className="flex items-center gap-3 text-sm text-yellow-800 mb-4 bg-yellow-50 px-4 py-3 rounded-xl border border-yellow-300">
								<span className="text-xl">💬</span>
								<div className="flex-1">
									<strong>Party B suggested {getPendingSuggestionsCount()} change{getPendingSuggestionsCount() > 1 ? 's' : ''}</strong>
									<span className="ml-2 text-yellow-700">Review and accept/reject each suggestion below.</span>
								</div>
							</div>
						)}

						{/* Form Card */}
						<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
							<div className="px-6 pt-5 pb-2">
								{/* Compact Step Stepper */}
								<div className="flex items-center">
									{steps.map((s, i) => (
										<React.Fragment key={s}>
											<button onClick={() => goToStep(i)} className="flex items-center gap-1.5 shrink-0">
												<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
													i === step
														? 'bg-teal-800 text-white'
													: isStepComplete(i)
														? 'bg-teal-800 text-white'
														: 'bg-gray-100 text-gray-400'
												}`}>
													{isStepComplete(i) && i !== step ? (
														<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
														</svg>
													) : (
														<span>{i + 1}</span>
													)}
												</div>
												<span className={`hidden sm:inline text-xs font-medium whitespace-nowrap ${i === step ? 'text-gray-900 font-semibold' : isStepComplete(i) ? 'text-gray-600' : 'text-gray-400'}`}>{s}</span>
											</button>
											{i < steps.length - 1 && (
												<div className="flex-1 mx-2 h-px bg-gray-200 min-w-2 relative overflow-hidden">
													<div className={`absolute inset-y-0 left-0 bg-teal-800 transition-all duration-500 ${isStepComplete(i) ? 'right-0' : 'right-full'}`} />
												</div>
											)}
										</React.Fragment>
									))}
								</div>
							</div>

							{/* Form Content */}
							<div className="p-6 pt-4">
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
												<p className="text-sm text-gray-600">Basic information about your NDA</p>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="md:col-span-2">
												<label className="block text-sm font-semibold text-gray-700 mb-2">Document Title *</label>
												<input
													className={`${getFieldClass("docName")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all`}
													value={values.docName}
													onChange={(e) => setField("docName", e.target.value)}
													placeholder="e.g., Partnership NDA 2025"
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Effective Date <span className="text-gray-700">*</span></label>
												<input
													type="date"
													className={`${getFieldClass("effective_date", "p-3 border w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all")}`}
													value={values.effective_date}
													onChange={(e) => setField("effective_date", e.target.value)}
													required
												/>
												<div className="text-xs text-gray-500 mt-1">DD/MM/YYYY</div>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Term (months) *</label>
												<input
													type="number"
													className={`${getFieldClass("term_months")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all`}
													value={values.term_months}
													onChange={(e) => setField("term_months", e.target.value)}
													placeholder="e.g., 12"
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Confidentiality Period (months) *</label>
												<input
													type="number"
													className={`${getFieldClass("confidentiality_period_months")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all`}
													value={values.confidentiality_period_months}
													onChange={(e) => setField("confidentiality_period_months", e.target.value)}
													placeholder="e.g., 24"
												/>
											</div>
										</div>
									</div>
								)}

								{step === 1 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
												</svg>
											</div>
											<div className="flex-1">
												<h2 className="text-xl font-bold text-gray-800">Party A Information</h2>
												<p className="text-sm text-gray-600">Details of the first party</p>
											</div>
											<button
												type="button"
												onClick={loadCompanyProfile}
												disabled={loadingCompanyProfile}
												className="px-4 py-2 bg-teal-800 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
											>
												{loadingCompanyProfile ? (
													<>
														<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
														Loading...
													</>
												) : (
													<>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
														</svg>
														Auto-fill from Profile
													</>
												)}
											</button>
										</div>

										{/* Info box about company profile */}
										<div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
											<div className="flex gap-3">
												<svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<div>
													<p className="text-sm text-green-800">
														<strong>Tip:</strong> Click &quot;Auto-fill from Profile&quot; to quickly fill Party A with your saved company details.
														You can manage your company profile in <a href="/settings/company-profile" className="underline hover:text-green-900">Company Details</a>.
													</p>
												</div>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Party Name *</label>
												<input
													className={`${getFieldClass("party_a_name", "p-3 border")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all`}
													value={values.party_a_name}
													onChange={(e) => setField("party_a_name", e.target.value)}
													placeholder="Enter party name"
												/>
												{renderSuggestionBox('party_a_name', 'Party A Name')}
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
												<textarea
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													rows={3}
													value={values.party_a_address}
													onChange={(e) => setField("party_a_address", e.target.value)}
													placeholder="Enter full address"
												/>
												{renderSuggestionBox('party_a_address', 'Party A Address')}
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
												<input
													type="tel"
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													value={values.party_a_phone}
													onChange={(e) => setField("party_a_phone", e.target.value)}
													placeholder="e.g., +1 (555) 123-4567"
												/>
												{renderSuggestionBox('party_a_phone', 'Party A Phone')}
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-semibold text-gray-700 mb-2">Signatory Name</label>
													<input
														className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
														value={values.party_a_signatory_name}
														onChange={(e) => setField("party_a_signatory_name", e.target.value)}
														placeholder="Full name"
													/>
													{renderSuggestionBox('party_a_signatory_name', 'Signatory Name')}
												</div>
												<div>
													<label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
													<input
														className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
														value={values.party_a_title}
														onChange={(e) => setField("party_a_title", e.target.value)}
														placeholder="e.g., CEO, Director"
														disabled={values.party_a_ask_receiver_fill}
													/>
													{renderSuggestionBox('party_a_title', 'Party A Title')}
												</div>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
												<input
													type="email"
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													value={values.party_a_email || ""}
													onChange={(e) => setField("party_a_email", e.target.value)}
													placeholder="email@example.com"
												/>
												{renderSuggestionBox('party_a_email', 'Party A Email')}
											</div>
										</div>
									</div>
								)}

								{step === 2 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
												</svg>
											</div>
											<div className="flex-1">
												<h2 className="text-xl font-bold text-gray-800">Party B Information</h2>
												<p className="text-sm text-gray-600">Details of the second party (check boxes to let receiver fill specific fields)</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<div className="flex items-center justify-between mb-2">
													<label className="block text-sm font-semibold text-gray-700">Party Name *</label>
													<label className="flex items-center gap-2 text-xs bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50 transition-colors">
														<input
															type="checkbox"
															checked={values.party_b_name_ask_receiver}
															onChange={(e) => setField("party_b_name_ask_receiver", e.target.checked)}
															className="form-checkbox h-3 w-3 text-teal-700 rounded focus:ring-2 focus:ring-teal-500"
														/>
														<span className="font-medium text-teal-700">Ask receiver to fill</span>
													</label>
												</div>
												<input
													className={`${getFieldClass("party_b_name", "p-3 border")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
													value={values.party_b_name}
													onChange={(e) => setField("party_b_name", e.target.value)}
													placeholder="Enter party name"
													disabled={values.party_b_name_ask_receiver}
												/>
												{renderSuggestionBox('party_b_name', 'Party B Name')}
											</div>
											<div>
												<div className="flex items-center justify-between mb-2">
													<label className="block text-sm font-semibold text-gray-700">Address</label>
													<label className="flex items-center gap-2 text-xs bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50 transition-colors">
														<input
															type="checkbox"
															checked={values.party_b_address_ask_receiver}
															onChange={(e) => setField("party_b_address_ask_receiver", e.target.checked)}
															className="form-checkbox h-3 w-3 text-teal-700 rounded focus:ring-2 focus:ring-teal-500"
														/>
														<span className="font-medium text-teal-700">Ask receiver to fill</span>
													</label>
												</div>
												<textarea
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
													rows={3}
													value={values.party_b_address}
													onChange={(e) => setField("party_b_address", e.target.value)}
													placeholder="Enter full address"
													disabled={values.party_b_address_ask_receiver}
												/>
												{renderSuggestionBox('party_b_address', 'Party B Address')}
											</div>
											<div>
												<div className="flex items-center justify-between mb-2">
													<label className="block text-sm font-semibold text-gray-700">Phone Number</label>
													<label className="flex items-center gap-2 text-xs bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50 transition-colors">
														<input
															type="checkbox"
															checked={values.party_b_phone_ask_receiver}
															onChange={(e) => setField("party_b_phone_ask_receiver", e.target.checked)}
															className="form-checkbox h-3 w-3 text-teal-700 rounded focus:ring-2 focus:ring-teal-500"
														/>
														<span className="font-medium text-teal-700">Ask receiver to fill</span>
													</label>
												</div>
												<input
													type="tel"
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
													value={values.party_b_phone}
													onChange={(e) => setField("party_b_phone", e.target.value)}
													placeholder="e.g., +1 (555) 123-4567"
													disabled={values.party_b_phone_ask_receiver}
												/>
												{renderSuggestionBox('party_b_phone', 'Party B Phone')}
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<div className="flex items-center justify-between mb-2">
														<label className="block text-sm font-semibold text-gray-700">Signatory Name</label>
														<label className="flex items-center gap-2 text-xs bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50 transition-colors">
															<input
																type="checkbox"
																checked={values.party_b_signatory_name_ask_receiver}
																onChange={(e) => setField("party_b_signatory_name_ask_receiver", e.target.checked)}
																className="form-checkbox h-3 w-3 text-teal-700 rounded focus:ring-2 focus:ring-teal-500"
															/>
															<span className="font-medium text-teal-700">Ask receiver</span>
														</label>
													</div>
													<input
														className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
														value={values.party_b_signatory_name}
														onChange={(e) => setField("party_b_signatory_name", e.target.value)}
														placeholder="Full name"
														disabled={values.party_b_signatory_name_ask_receiver}
													/>
													{renderSuggestionBox('party_b_signatory_name', 'Party B Signatory')}
												</div>
												<div>
													<div className="flex items-center justify-between mb-2">
														<label className="block text-sm font-semibold text-gray-700">Title</label>
														<label className="flex items-center gap-2 text-xs bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50 transition-colors">
															<input
																type="checkbox"
																checked={values.party_b_title_ask_receiver}
																onChange={(e) => setField("party_b_title_ask_receiver", e.target.checked)}
																className="form-checkbox h-3 w-3 text-teal-700 rounded focus:ring-2 focus:ring-teal-500"
															/>
															<span className="font-medium text-teal-700">Ask receiver</span>
														</label>
													</div>
													<input
														className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
														value={values.party_b_title}
														onChange={(e) => setField("party_b_title", e.target.value)}
														placeholder="e.g., CEO, Director"
														disabled={values.party_b_title_ask_receiver}
													/>
													{renderSuggestionBox('party_b_title', 'Party B Title')}
												</div>
											</div>
											<div>
												<div className="flex items-center justify-between mb-2">
													<label className="block text-sm font-semibold text-gray-700">Email Address *</label>
													<label className="flex items-center gap-2 text-xs bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50 transition-colors">
														<input
															type="checkbox"
															checked={values.party_b_email_ask_receiver}
															onChange={(e) => setField("party_b_email_ask_receiver", e.target.checked)}
															className="form-checkbox h-3 w-3 text-teal-700 rounded focus:ring-2 focus:ring-teal-500"
														/>
														<span className="font-medium text-teal-700">Ask receiver to fill</span>
													</label>
												</div>
												<input
													type="email"
													className={`${getFieldClass("party_b_email", "p-3 border")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
													value={values.party_b_email}
													onChange={(e) => setField("party_b_email", e.target.value)}
													placeholder="email@example.com"
													disabled={values.party_b_email_ask_receiver}
												/>
												{renderSuggestionBox('party_b_email', 'Party B Email')}
											</div>
										</div>
									</div>
								)}

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
												<p className="text-sm text-gray-600">Customize your agreement terms</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Purpose of Confidential Information Swap</label>
												<textarea
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													rows={2}
													value={values.purpose}
													onChange={(e) => setField("purpose", e.target.value)}
													placeholder="e.g., evaluating a potential business relationship"
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Governing Law</label>
												<input
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													value={values.governing_law}
													onChange={(e) => setField("governing_law", e.target.value)}
													placeholder="e.g., State of California"
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">IP Ownership Clause</label>
												<textarea
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													rows={3}
													value={values.ip_ownership}
													onChange={(e) => setField("ip_ownership", e.target.value)}
													placeholder="Specify intellectual property ownership terms..."
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Non-Solicitation Clause</label>
												<textarea
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													rows={3}
													value={values.non_solicit}
													onChange={(e) => setField("non_solicit", e.target.value)}
													placeholder="Define non-solicitation terms..."
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Exclusivity Clause</label>
												<textarea
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													rows={3}
													value={values.exclusivity}
													onChange={(e) => setField("exclusivity", e.target.value)}
													placeholder="Specify exclusivity arrangements..."
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Additional Terms</label>
												<textarea
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
													rows={3}
													value={values.additional_terms}
													onChange={(e) => setField("additional_terms", e.target.value)}
													placeholder="Enter any additional terms or clauses..."
												/>
											</div>
										</div>
									</div>
								)}

								{step === 4 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											</div>
											<div>
												<h2 className="text-xl font-bold text-gray-800">Review Your NDA</h2>
												<p className="text-sm text-gray-600">Check all details before proceeding</p>
											</div>
										</div>

										<div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Document Name</div>
														<div className="text-base font-medium text-gray-900">{values.docName || <span className="text-gray-400 italic">Not provided</span>}</div>
													</div>
													<button onClick={() => goToStep(0)} className="text-teal-700 hover:text-teal-700 text-sm font-medium">Edit</button>
												</div>
											</div>
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1 grid grid-cols-3 gap-4">
														<div>
															<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Effective Date</div>
															<div className="text-base font-medium text-gray-900">{values.effective_date || <span className="text-gray-400 italic">Not set</span>}</div>
														</div>
														<div>
															<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Term</div>
															<div className="text-base font-medium text-gray-900">{values.term_months ? `${values.term_months} months` : <span className="text-gray-400 italic">Not set</span>}</div>
														</div>
														<div>
															<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Confidentiality Period</div>
															<div className="text-base font-medium text-gray-900">{values.confidentiality_period_months ? `${values.confidentiality_period_months} months` : <span className="text-gray-400 italic">Not set</span>}</div>
														</div>
													</div>
													<button onClick={() => goToStep(0)} className="text-teal-700 hover:text-teal-700 text-sm font-medium ml-4">Edit</button>
												</div>
											</div>
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Party A</div>
														<div className="text-base font-medium text-gray-900">
															{values.party_a_name || <span className="text-gray-400 italic">Not provided</span>}
															{values.party_a_ask_receiver_fill && <span className="ml-2 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Receiver will fill</span>}
														</div>
													</div>
													<button onClick={() => goToStep(1)} className="text-teal-700 hover:text-teal-700 text-sm font-medium">Edit</button>
												</div>
											</div>
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Party B</div>
														<div className="text-base font-medium text-gray-900">
															{values.party_b_name || <span className="text-gray-400 italic">Not provided</span>}
															{(() => {
																const fieldsToFill = [];
																if (values.party_b_name_ask_receiver) fieldsToFill.push("Name");
																if (values.party_b_address_ask_receiver) fieldsToFill.push("Address");
																if (values.party_b_phone_ask_receiver) fieldsToFill.push("Phone");
																if (values.party_b_signatory_name_ask_receiver) fieldsToFill.push("Signatory");
																if (values.party_b_title_ask_receiver) fieldsToFill.push("Title");
																if (values.party_b_email_ask_receiver) fieldsToFill.push("Email");
																if (fieldsToFill.length > 0) {
																	return <span className="ml-2 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Receiver will fill: {fieldsToFill.join(", ")}</span>;
																}
																return null;
															})()}
														</div>
														<div className="text-sm text-gray-600 mt-1">{values.party_b_email || <span className="text-gray-400 italic">No email</span>}</div>
													</div>
													<button onClick={() => goToStep(2)} className="text-teal-700 hover:text-teal-700 text-sm font-medium">Edit</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Navigation Buttons */}
							<div className="mt-6 mb-2 flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
								<div className="flex gap-2">
									<button
										onClick={goBack}
										disabled={step === 0}
										className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${step === 0
											? 'bg-gray-100 text-gray-400 cursor-not-allowed'
											: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
											}`}
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
										>
											Next Step: {steps[step + 1]}
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</button>
									)}
								</div>
								<div className="flex gap-2">
									{/* Awaiting Party B badge — shown while the NDA is with Party B */}
									{(workflowState === 'AWAITING_PARTY_B_REVIEW' || workflowState === 'AWAITING_PARTY_B_SIGNATURE') && (
										<span className="px-5 py-2.5 rounded-lg font-medium text-sm bg-blue-100 text-blue-800 border border-blue-300">
											Awaiting Party B
										</span>
									)}

									{/* Party A Review Buttons — shown when Party B has submitted changes */}
									{workflowState === 'AWAITING_PARTY_A_REVIEW' && (
										<>
											<button
												onClick={approveChanges}
												disabled={processingChanges}
												className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${processingChanges ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'}`}
											>
												{processingChanges ? 'Processing...' : 'Accept Changes'}
											</button>
											<button
												onClick={() => setShowRequestChangesModal(true)}
												disabled={processingChanges}
												className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
											>
												Request Changes
											</button>
										</>
									)}

									{/* Delete button — shown only for saved DRAFT state */}
									{workflowState === 'DRAFT' && draftId && (
										<button
											onClick={deleteDraft}
											disabled={deleting}
											className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 border border-red-200 text-red-600 bg-white hover:border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{deleting ? 'Deleting...' : 'Delete Draft'}
										</button>
									)}

									{/* Send Button — shown in DRAFT state or new (null) drafts */}
									{(workflowState === 'DRAFT' || workflowState === null) && (
										<button
											onClick={sendForReview}
											disabled={sendingForSignature}
											className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${sendingForSignature
												? 'bg-gray-400 text-white cursor-not-allowed'
												: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
												}`}
										>
											{sendingForSignature ? (
												<>
													<svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													Sending...
												</>
											) : (
												<>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
													</svg>
													Send for Review
												</>
											)}
										</button>
									)}
									<button
										onClick={saveDraft}
										disabled={saving}
										className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${saving
											? 'bg-gray-400 text-white cursor-not-allowed'
											: 'bg-teal-800 text-white hover:bg-teal-700'
											}`}
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
										</svg>
										{saving ? "Saving..." : "Save"}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* RIGHT SIDE: Live Preview (Fixed) */}
				{showLivePreview && (
					<div className="hidden lg:block w-[55%] bg-white border-l border-gray-200 overflow-y-auto">
						<div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 z-10">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-semibold text-gray-900">Live Preview</h3>
									<p className="text-xs text-gray-600">Updates as you type</p>
								</div>
								<div className="flex gap-2">
									{isDev && livePreviewHtml && (
										<>
											<button
												onClick={() => {
													const newWindow = window.open('', '_blank');
													if (newWindow) {
														newWindow.document.write(livePreviewHtml);
														newWindow.document.close();
													}
												}}
												className="px-4 py-2 bg-teal-800 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
												title="Open HTML preview in new tab"
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
												Open HTML
											</button>
											<button
												onClick={previewPDF}
												disabled={generatingPdf}
												className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
												title="Generate and preview as PDF"
											>
												{generatingPdf ? (
													<>
														<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
														<span>Generating...</span>
													</>
												) : (
													<>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
														</svg>
														Open PDF
													</>
												)}
											</button>
										</>
									)}
								</div>
							</div>
						</div>
						<div className="p-6">
							{previewLoading && !livePreviewHtml && (
								<div className="text-center py-20">
									<svg className="animate-spin h-12 w-12 mx-auto mb-4 text-teal-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									<p className="text-sm text-gray-600">Loading preview...</p>
								</div>
							)}
							{previewError && (
								<div className="text-center py-20 text-red-500">
									<svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<p className="text-sm font-semibold">Preview Error</p>
									<p className="text-xs mt-2">{previewError}</p>
								</div>
							)}
							{livePreviewHtml && !previewError ? (
								<iframe
									ref={iframeRef}
									srcDoc={livePreviewHtml}
									className="w-full border-0"
									style={{ minHeight: '1200px', height: 'auto' }}
									title="NDA Preview"
									sandbox="allow-same-origin allow-scripts"
									onLoad={() => {
										// Restore scroll position after reload
										if (iframeRef.current && iframeRef.current.contentWindow) {
											try {
												const savedScroll = scrollPosRef.current;
												if (savedScroll > 0) {
													iframeRef.current.contentWindow.scrollTo(0, savedScroll);
												}
											} catch (e) {
												console.warn("Could not restore scroll position", e);
											}
										}
									}}
								/>
							) : !previewLoading && !previewError ? (
								<div className="text-center py-20 text-gray-400">
									<svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<p className="text-sm">Start filling the fields to see the preview</p>
								</div>
							) : null}
						</div>
					</div>
				)}

				{/* Send for Input Modal - Prompt for recipient email */}
				{showSendForInputModal && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn"
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								setShowSendForInputModal(false);
							}
						}}
					>
						<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
							<div className="bg-linear-to-r from-orange-500 to-amber-500 p-6">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
										<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									</div>
									<div>
										<h2 className="text-xl font-bold text-white">Verify Receiving Party's Email</h2>
										<p className="text-sm text-white/80">Party B will fill in the missing fields</p>
									</div>
								</div>
							</div>
							<div className="p-6">
								<p className="text-gray-600 mb-4">
									Confirm or enter the email address of the person who will fill in the remaining fields:
								</p>
								<input
									type="email"
									value={inputRecipientEmail}
									onChange={(e) => setInputRecipientEmail(e.target.value)}
									placeholder="party-b@example.com"
									className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
									autoFocus
								/>
								{warning && (
									<p className="text-red-500 text-sm mt-2">{warning}</p>
								)}
								<div className="flex gap-3 mt-6">
									<button
										onClick={() => setShowSendForInputModal(false)}
										className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
									>
										Cancel
									</button>
									<button
										onClick={handleSendForInput}
										disabled={sendingForInput || !inputRecipientEmail.trim()}
										className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50"
									>
										{sendingForInput ? "Sending..." : "Send Now"}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Shareable Link Modal */}
				{showShareLinkModal && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn"
						onClick={(e) => {
							// Close modal when clicking on backdrop
							if (e.target === e.currentTarget) {
								setShowShareLinkModal(false);
								router.push("/mydrafts");
							}
						}}
					>
						<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden relative">
							{/* Close X Button - Top Right - HIGHLY VISIBLE */}
							<button
								className="absolute top-3 right-3 z-50 bg-red-500 text-white hover:bg-red-600 transition-all p-2.5 rounded-full shadow-xl border-2 border-white hover:scale-110"
								onClick={() => {
									setShowShareLinkModal(false);
									router.push("/mydrafts");
								}}
								aria-label="Close modal"
								title="Close"
							>
								<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>

							<div className="bg-gray-50 p-6 border-b border-gray-200">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
										<svg className="w-7 h-7 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div className="flex-1">
										<h2 className="text-xl font-bold text-gray-800">NDA Ready to Share!</h2>
										<p className="text-sm text-gray-600">Share this link with the recipient</p>
									</div>
								</div>
							</div>
							<div className="p-6">
								{/* Email Sent Success Message */}
								<div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
									<svg className="w-6 h-6 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<div>
										<p className="font-semibold text-green-800 mb-1">✅ NDA Ready to Share!</p>
										<p className="text-sm text-green-700">Share the link below with <strong>{signersEmail}</strong> to review and sign.</p>
									</div>
								</div>

								<div className="mb-6">
									<p className="text-gray-700 mb-4">
										The recipient can use this link to review, fill their details, make changes if needed, and sign the NDA.
									</p>

									{/* Shareable Link */}
									<div className="bg-gray-50 rounded-lg p-4 border-2 border-teal-200">
										<label className="block text-sm font-semibold text-gray-700 mb-2">Shareable Link</label>
										<div className="flex gap-2">
											<input
												type="text"
												value={shareableLink}
												readOnly
												className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm text-gray-700"
												onClick={(e) => e.currentTarget.select()}
											/>
											<button
												onClick={async () => {
													try {
														await navigator.clipboard.writeText(shareableLink);
														setWarning("Link copied to clipboard!");
													} catch {
														setWarning("Could not copy — please copy the link manually.");
													}
													setTimeout(() => setWarning(""), 2000);
												}}
												className="px-4 py-3 bg-teal-800 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
											>
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
												Copy
											</button>
										</div>
									</div>

									{/* Share Options */}
									<div className="mt-6">
										<p className="text-sm font-semibold text-gray-700 mb-3">Or share via:</p>
										<div className="grid grid-cols-2 gap-3">
											<a
												href={`mailto:${signersEmail}?subject=Please review and sign our NDA&body=Hi,%0D%0A%0D%0APlease review and sign our Non-Disclosure Agreement using this link:%0D%0A${encodeURIComponent(shareableLink)}%0D%0A%0D%0AYou can review all details, make changes if needed, and sign electronically.%0D%0A%0D%0AThank you!`}
												className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
											>
												<svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
												</svg>
												<span className="font-medium text-gray-700">Email</span>
											</a>
											<a
												href={`https://wa.me/?text=${encodeURIComponent(`Please review and sign our NDA: ${shareableLink}`)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors border border-green-300"
											>
												<svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 24 24">
													<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
												</svg>
												<span className="font-medium text-green-700">WhatsApp</span>
											</a>
											<a
												href={`https://t.me/share/url?url=${encodeURIComponent(shareableLink)}&text=${encodeURIComponent('Please review and sign our NDA')}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 hover:bg-blue-200 rounded-lg transition-colors border border-blue-300"
											>
												<svg className="w-5 h-5 text-teal-700" fill="currentColor" viewBox="0 0 24 24">
													<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
												</svg>
												<span className="font-medium text-teal-700">Telegram</span>
											</a>
											<button
												onClick={async () => {
													const shareData = {
														title: 'NDA Signature Request',
														text: 'Please review and sign our NDA',
														url: shareableLink
													};
													if (navigator.share) {
														navigator.share(shareData).catch(() => { });
													} else {
														try {
															await navigator.clipboard.writeText(shareableLink);
															setWarning("Link copied!");
														} catch {
															setWarning("Could not copy — please copy the link manually.");
														}
														setTimeout(() => setWarning(""), 2000);
													}
												}}
												className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors border border-purple-300"
											>
												<svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
												</svg>
												<span className="font-medium text-teal-700">More</span>
											</button>
										</div>
									</div>

									<div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
										<div className="flex gap-3">
											<svg className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<div className="text-sm text-blue-800">
												<p className="font-semibold mb-1">What the recipient can do:</p>
												<ul className="list-disc list-inside space-y-1 text-teal-700">
													<li>Review all NDA terms and details</li>
													<li>Fill in their party information</li>
													<li>Make changes or suggestions to any fields</li>
													<li>Sign electronically when ready</li>
												</ul>
											</div>
										</div>
									</div>
								</div>

								<div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
									<button
										onClick={() => {
											setShowShareLinkModal(false);
											router.push("/mydrafts");
										}}
										className="px-8 py-3 bg-teal-800 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all shadow-sm flex items-center gap-2"
									>
										<span>Close & Go to My Drafts</span>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Verify Email Modal */}
				{showVerifyEmailModal && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								setShowVerifyEmailModal(false);
								setPendingDraftId(null);
								setGeneratedShareLink("");
								setSuggestedEmailSubject("");
								setSuggestedEmailBody("");
								setEmailSent(false);
								setShowMoreShareOptions(false);
								if (emailSent) router.push('/mynda');
							}
						}}
					>
						<div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden">

							{/* Header */}
							<div className="bg-[#0f2a4a] px-6 py-5 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
										<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
										</svg>
									</div>
									<div>
										<h3 className="text-white font-semibold text-base leading-tight">Send NDA to Recipient</h3>
										<p className="text-white/50 text-xs mt-0.5">Choose how to deliver the NDA</p>
									</div>
								</div>
								<button
									onClick={() => {
										setShowVerifyEmailModal(false);
										setPendingDraftId(null);
										setGeneratedShareLink("");
										setSuggestedEmailSubject("");
										setSuggestedEmailBody("");
										setEmailSent(false);
										if (emailSent) router.push('/mynda');
									}}
									className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
									aria-label="Close"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							{/* Email section */}
							<div className="px-6 pt-5 pb-4">
								<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recipient Email</label>
								<input
									type="email"
									className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-gray-400"
									value={verifyRecipientEmail}
									onChange={(e) => setVerifyRecipientEmail(e.target.value)}
									placeholder="recipient@example.com"
									autoFocus
								/>
								<p className="text-xs text-gray-400 mt-2 leading-relaxed">
									{emailSent
										? 'Secure link ready — choose Gmail, Outlook, or any option below to send it.'
										: "Enter the recipient's email, then generate a secure link to share."}
								</p>

								<button
									onClick={confirmAndSend}
									disabled={sendingForSignature || emailSent || !verifyRecipientEmail?.trim()}
									className={`w-full mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${emailSent ? 'bg-emerald-600 text-white cursor-default' : 'bg-teal-700 hover:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'}`}
								>
									{sendingForSignature ? (
										<>
											<div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
											Generating link…
										</>
									) : emailSent ? (
										<>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
											Link Ready — Choose How to Send
										</>
									) : (
										<>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
											</svg>
											Generate Secure Link
										</>
									)}
								</button>
							</div>

							{/* Divider */}
							<div className="px-6 py-1 flex items-center gap-3">
								<div className="flex-1 h-px bg-gray-100" />
								<span className="text-xs text-gray-400 font-medium shrink-0">send via</span>
								<div className="flex-1 h-px bg-gray-100" />
							</div>

							{/* Share options grid */}
							<div className="px-6 pt-3 pb-5 grid grid-cols-3 gap-2">
								{/* Gmail */}
								<button
									onClick={() => handleShare('gmail')}
									disabled={!generatedShareLink}
									className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
								>
									<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
										<path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.364l-6.545-4.636v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.273l6.545-4.636 1.528-1.147C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
									</svg>
									<span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">Gmail</span>
								</button>

								{/* Outlook */}
								<button
									onClick={() => handleShare('outlook')}
									disabled={!generatedShareLink}
									className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
								>
									<svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0078D4">
										<path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.24.14.29.38zM10.38 8H7.13q-.46 0-.8.33-.32.33-.32.8V16h4.37V8zm5.525 3.6q-.44-.06-.87.08-.43.16-.74.48L12.35 10v7.55h2.03l.01-4.35 3.09 2.28q.3.22.66.22.36 0 .65-.23l.01-.01q.28-.22.4-.55.13-.32.1-.65V6.45h-2.07V11.6q-.22.12-.26.4-.04.28.1.57zM24 12.8l-5-2.92v5.84l5-2.92z"/>
									</svg>
									<span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">Outlook</span>
								</button>

								{/* WhatsApp */}
								<button
									onClick={() => handleShare('whatsapp')}
									disabled={!generatedShareLink}
									className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-100 hover:border-[#25D366]/40 hover:bg-[#25D366]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
								>
									<svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
									</svg>
									<span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">WhatsApp</span>
								</button>

								{/* Email (native) */}
								<button
									onClick={() => handleShare('email')}
									disabled={!generatedShareLink}
									className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
								>
									<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">Email App</span>
								</button>

								{/* SMS */}
								<button
									onClick={() => handleShare('sms')}
									disabled={!generatedShareLink}
									className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
								>
									<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
									</svg>
									<span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">SMS</span>
								</button>

								{/* Copy link */}
								<button
									onClick={() => handleShare('copy')}
									disabled={!generatedShareLink}
									className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
								>
									<svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
									<span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">Copy Link</span>
								</button>
							</div>

							{/* More options */}
							<div className="px-6 pb-2">
								<button
									onClick={() => setShowMoreShareOptions(v => !v)}
									disabled={!generatedShareLink}
									className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
								>
									<svg
										className={`w-3 h-3 transition-transform duration-150 ${showMoreShareOptions ? 'rotate-180' : ''}`}
										fill="none" stroke="currentColor" viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
									More options
								</button>

								{showMoreShareOptions && (
									<div className="mt-2 grid grid-cols-3 gap-2">
										{/* Telegram */}
										<button
											onClick={() => handleShare('telegram')}
											disabled={!generatedShareLink}
											className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-100 hover:border-[#2AABEE]/40 hover:bg-[#2AABEE]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
										>
											<svg className="w-5 h-5 text-[#2AABEE]" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
											</svg>
											<span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">Telegram</span>
										</button>
										{/* LinkedIn */}
										<button
											onClick={() => handleShare('linkedin')}
											disabled={!generatedShareLink}
											className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-100 hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
										>
											<svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
												<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
											</svg>
											<span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-800">LinkedIn</span>
										</button>
									</div>
								)}
							</div>

							{/* Footer note */}
							<div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
								<p className="text-xs text-gray-400">{emailSent ? 'Link ready — send it your way. Recipient gets a secure review page.' : 'Generate the link first, then choose how to send it.'}</p>
								<button
									onClick={() => {
										setShowVerifyEmailModal(false);
										setPendingDraftId(null);
										setGeneratedShareLink("");
										setSuggestedEmailSubject("");
										setSuggestedEmailBody("");
										setEmailSent(false);
										if (emailSent) router.push('/mynda');
									}}
									className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
								>
									{emailSent ? 'Done' : 'Cancel'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Exit Warning Modal */}


				{/* Reject Internal Submission Modal */}
				{showRequestChangesModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
						<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
							<div className="p-6 border-b border-gray-200">
								<h3 className="text-lg font-semibold text-gray-900">Request Changes from Party B</h3>
								<p className="text-sm text-gray-500 mt-1">Describe what needs to be revised before proceeding.</p>
							</div>
							<div className="p-6">
								<label className="block text-sm font-medium text-gray-700 mb-2">Message to Party B</label>
								<textarea
									value={requestChangesMessage}
									onChange={e => setRequestChangesMessage(e.target.value)}
									rows={4}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
									placeholder="Explain what changes are needed..."
									autoFocus
								/>
							</div>
							<div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
								<button
									onClick={() => { setShowRequestChangesModal(false); setRequestChangesMessage(''); }}
									className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all"
								>
									Cancel
								</button>
								<button
									onClick={requestChanges}
									disabled={processingChanges || !requestChangesMessage.trim()}
									className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									{processingChanges ? (
										<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Sending...</>
									) : 'Send to Party B'}
								</button>
							</div>
						</div>
					</div>
				)}


				{/* No Company Profile Modal */}
				{showNoProfileModal && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn"
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								setShowNoProfileModal(false);
							}
						}}
					>
						<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
							<div className="p-6 border-b border-gray-100">
								<div className="flex items-start gap-4">
									<div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
										<svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									</div>
									<div>
										<h2 className="text-lg font-bold text-gray-900 mb-1">No company information found</h2>
										<p className="text-sm text-gray-500 leading-relaxed">
											Your company profile is empty. Fill in your company details once and auto-fill will populate Party A fields in all your NDAs.
										</p>
									</div>
								</div>
							</div>
							<div className="p-6 bg-gray-50">
								<p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3">What you&apos;ll add</p>
								<ul className="space-y-2 mb-6">
									{['Company name', 'Address', 'Signatory name & title', 'Email & phone'].map((item) => (
										<li key={item} className="flex items-center gap-2 text-sm text-gray-600">
											<svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
											{item}
										</li>
									))}
								</ul>
								<div className="flex gap-3">
									<button
										onClick={() => setShowNoProfileModal(false)}
										className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-sm text-gray-700 hover:bg-white transition-colors"
									>
										Cancel
									</button>
									<a
										href="/settings/company-profile"
										className="flex-1 px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm text-center transition-colors"
									>
										Go to Company Profile
									</a>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* PDF Preview Modal (fallback for blocked popups) */}
				{showPdfPreview && pdfPreviewUrl && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
						<div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full relative flex flex-col overflow-hidden" style={{ height: '90vh' }}>
							<div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
										<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
										</svg>
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 text-lg">PDF Preview</h3>
										<p className="text-xs text-gray-600">Generated NDA document</p>
									</div>
								</div>
								<button
									className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white hover:bg-opacity-50 rounded-lg"
									onClick={() => {
										setShowPdfPreview(false);
										setPdfPreviewUrl('');
									}}
									aria-label="Close preview"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							<div className="flex-1 overflow-hidden bg-gray-100">
								<iframe
									src={pdfPreviewUrl}
									className="w-full h-full border-0"
									title="PDF Preview"
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

