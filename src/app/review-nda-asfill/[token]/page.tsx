"use client";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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
	party_b_name: string;
	party_b_address: string;
	party_b_phone: string;
	party_b_signatory_name: string;
	party_b_title: string;
	party_b_email: string;
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

type FieldSuggestion = {
	fieldName: string;
	originalValue: string;
	suggestedValue: string;
	comment: string;
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
	party_b_name: "",
	party_b_address: "",
	party_b_phone: "",
	party_b_signatory_name: "",
	party_b_title: "",
	party_b_email: "",
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

export default function ReviewNDA({ params }: { params: Promise<{ token: string }> }) {
	const { token } = use(params);
	const router = useRouter();
	const [values, setValues] = useState<FormValues>(DEFAULTS);
	const [originalValues, setOriginalValues] = useState<FormValues>(DEFAULTS);
	const [warning, setWarning] = useState("");
	const [saving, setSaving] = useState(false);
	const [showLivePreview, setShowLivePreview] = useState(true);
	const [livePreviewHtml, setLivePreviewHtml] = useState("");
	const [loading, setLoading] = useState(true);
	const [tokenExpired, setTokenExpired] = useState(false);
	const [tokenInvalid, setTokenInvalid] = useState(false);
	const [step, setStep] = useState<number>(0);
	const [templateId, setTemplateId] = useState<string>("professional_mutual_nda_v1");
	const [showPdfPreview, setShowPdfPreview] = useState(false);
	const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
	const [generatingPdf, setGeneratingPdf] = useState(false);

	// Suggestions system for grayed-out fields
	const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
	const [currentSuggestionField, setCurrentSuggestionField] = useState<string | null>(null);
	const [suggestionValue, setSuggestionValue] = useState("");
	const [suggestionComment, setSuggestionComment] = useState("");

	const steps = ["Document", "Party A", "Party B", "Clauses", "Review"];

	// Load NDA data from token on mount
	useEffect(() => {
		loadNDAFromToken();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	const loadNDAFromToken = async () => {
		setLoading(true);
		try {
			const response = await fetch(`/api/ndas/review/${token}`);
			const data = await response.json();

			if (!response.ok) {
				if (response.status === 410) {
					setTokenExpired(true);
				} else {
					setTokenInvalid(true);
				}
				setWarning(data.error || "Invalid or expired link");
				return;
			}

			// Set the form values and store originals
			setValues(data.formData);
			setOriginalValues(data.formData);
			setTemplateId(data.templateId || "professional_mutual_nda_v1");

			console.log('✅ Loaded NDA from token:', data);
		} catch (error) {
			console.error('Error loading NDA:', error);
			setWarning("Failed to load NDA");
			setTokenInvalid(true);
		} finally {
			setLoading(false);
		}
	};

	// Check if a field is editable by the receiver
	// Empty fields (not filled by sender) are editable and highlighted
	// Filled fields are grayed out with "Suggest a change" button
	const isFieldEditable = (fieldName: string): boolean => {
		const value = values[fieldName as keyof FormValues];
		// If the field is empty, it's editable (waiting for receiver input)
		// If it's filled, it's not editable (show suggest button instead)
		return !value || value === '';
	};

	// Check if field was filled by sender (has value)
	const isFieldFilled = (fieldName: string): boolean => {
		const value = values[fieldName as keyof FormValues];
		return !!value && value !== '';
	};

	// Render "Suggest a change" button for filled (non-editable) fields
	const renderSuggestButton = (fieldName: string) => {
		if (!isFieldFilled(fieldName)) return null;

		const hasSuggestion = suggestions.some(s => s.fieldName === fieldName);
		const isOpen = currentSuggestionField === fieldName;

		return (
			<button
				type="button"
				onClick={() => openSuggestionModal(fieldName)}
				className={`ml-2 text-xs px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1 ${isOpen
						? 'bg-teal-600 text-white'
						: hasSuggestion
							? 'bg-green-100 text-green-700 hover:bg-green-200'
							: 'bg-teal-100 text-teal-700 hover:bg-teal-200'
					}`}
			>
				<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
				{isOpen ? 'Close' : hasSuggestion ? '✓ Suggested' : 'Suggest a change'}
			</button>
		);
	};

	// Render inline suggestion form below the field
	const renderInlineSuggestion = (fieldName: string) => {
		if (currentSuggestionField !== fieldName) return null;

		return (
			<div className="mt-2 p-4 bg-teal-50 border-2 border-teal-200 rounded-lg shadow-sm animate-fadeIn">
				<div className="space-y-3">
					<div>
						<label className="block text-xs font-semibold text-teal-900 mb-1">
							Suggested Value *
						</label>
						<input
							type="text"
							value={suggestionValue}
							onChange={(e) => setSuggestionValue(e.target.value)}
							placeholder="Enter your suggested value..."
							className="w-full p-2 text-sm border border-teal-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
							autoFocus
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold text-teal-900 mb-1">
							Comment/Reason (optional)
						</label>
						<textarea
							value={suggestionComment}
							onChange={(e) => setSuggestionComment(e.target.value)}
							placeholder="Explain why this change is needed..."
							rows={2}
							className="w-full p-2 text-sm border border-teal-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
						/>
					</div>
					<div className="flex gap-2 justify-end">
						<button
							type="button"
							onClick={cancelSuggestion}
							className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={saveSuggestion}
							disabled={!suggestionValue}
							className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						>
							Save Suggestion
						</button>
					</div>
				</div>
			</div>
		);
	};

	// Open inline suggestion form for a grayed field
	const openSuggestionModal = (fieldName: string) => {
		// If clicking the same field, close it
		if (currentSuggestionField === fieldName) {
			setCurrentSuggestionField(null);
			setSuggestionValue("");
			setSuggestionComment("");
			return;
		}

		// Load existing suggestion if any
		const existing = suggestions.find(s => s.fieldName === fieldName);
		setCurrentSuggestionField(fieldName);
		setSuggestionValue(existing?.suggestedValue || "");
		setSuggestionComment(existing?.comment || "");
	};

	// Save suggestion from inline form
	const saveSuggestion = () => {
		if (!currentSuggestionField) return;

		// Require suggested value
		if (!suggestionValue) {
			setWarning("Please enter a suggested value");
			setTimeout(() => setWarning(""), 2000);
			return;
		}

		const newSuggestion: FieldSuggestion = {
			fieldName: currentSuggestionField,
			originalValue: originalValues[currentSuggestionField as keyof FormValues]?.toString() || '',
			suggestedValue: suggestionValue,
			comment: suggestionComment,
		};

		setSuggestions(prev => {
			const filtered = prev.filter(s => s.fieldName !== currentSuggestionField);
			return [...filtered, newSuggestion];
		});

		setCurrentSuggestionField(null);
		setSuggestionValue("");
		setSuggestionComment("");
		setWarning(`✅ Suggestion saved for ${currentSuggestionField}`);
		setTimeout(() => setWarning(""), 3000);
	};

	// Cancel inline suggestion
	const cancelSuggestion = () => {
		setCurrentSuggestionField(null);
		setSuggestionValue("");
		setSuggestionComment("");
	};

	// Send back with changes - final submission back to sender
	const sendBackWithChanges = async () => {
		// Check if there are any changes (empty fields filled or suggestions made)
		const hasFilledFields = Object.keys(values).some(key => {
			const fieldName = key as keyof FormValues;
			// Check if this field was empty (editable) and is now filled
			return originalValues[fieldName] === '' && values[fieldName] !== '';
		});

		if (!hasFilledFields && suggestions.length === 0) {
			setWarning("No changes made. Please fill in empty fields or suggest changes before sending back.");
			return;
		}

		setSaving(true);
		try {
			const response = await fetch(`/api/ndas/review/${token}/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					formData: values,
					suggestions
				})
			});

			const data = await response.json();

			if (!response.ok) {
				setWarning(data.error || "Failed to send back changes");
				return;
			}

			// Show success and redirect
			setWarning("✅ Changes sent back successfully! The sender will be notified.");
			setTimeout(() => router.push('/'), 3000);
		} catch (error) {
			console.error('Error sending back:', error);
			setWarning("Failed to send back changes");
		} finally {
			setSaving(false);
		}
	};

	// Render field with grayed-out styling and "Suggest a change" button if not editable
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const renderField = (
		fieldName: keyof FormValues,
		label: string,
		placeholder: string = "",
		type: "input" | "textarea" | "date" | "number" | "tel" = "input",
		required: boolean = false
	) => {
		const editable = isFieldEditable(fieldName);
		const value = values[fieldName]?.toString() || "";
		const hasSuggestion = suggestions.some(s => s.fieldName === fieldName);

		return (
			<div>
				<label className="block text-sm font-semibold text-gray-700 mb-2">
					{label} {required && <span className="text-red-500">*</span>}
				</label>

				{type === "textarea" ? (
					<textarea
						className={`w-full rounded-lg shadow-sm transition-all ${editable
								? "p-3 border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
								: "p-3 border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
							}`}
						rows={3}
						value={value}
						onChange={(e) => editable && setField(fieldName, e.target.value)}
						placeholder={editable ? placeholder : ""}
						disabled={!editable}
					/>
				) : (
					<input
						type={type}
						className={`w-full rounded-lg shadow-sm transition-all ${editable
								? "p-3 border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
								: "p-3 border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
							}`}
						value={value}
						onChange={(e) => editable && setField(fieldName, e.target.value)}
						placeholder={editable ? placeholder : ""}
						disabled={!editable}
					/>
				)}

				{!editable && (
					<button
						type="button"
						onClick={() => openSuggestionModal(fieldName)}
						className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${hasSuggestion
								? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
								: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
							}`}
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						{hasSuggestion ? "Suggestion saved" : "Suggest a change"}
					</button>
				)}
			</div>
		);
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
		party_1_emails_joined: '', // Not in form
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
		purpose: 'evaluating a potential business relationship',
		information_scope_text: 'All information and materials',
		// Sanitize other text fields that might have newlines
		ip_ownership: sanitizeForHtml(values.ip_ownership),
		additional_terms: sanitizeForHtml(values.additional_terms),
	};

	const { data: liveData, loading: previewLoading, error: previewError } = useDebouncedPreview(
		"/api/ndas/preview-html",
		templateData,
		400
	);

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
			console.log('🎨 Setting live preview HTML, length:', liveData.html.length);
			setLivePreviewHtml(liveData.html);
		}
	}, [liveData, values]);

	const setField = (k: keyof FormValues, v: string | boolean) => {
		setValues((s) => ({ ...s, [k]: v } as unknown as FormValues));
	};

	const getFieldClass = (fieldName: string, baseClass: string = "p-2 border") => {
		const filled = isFieldFilled(fieldName);
		const editable = isFieldEditable(fieldName);

		if (filled) {
			// Filled fields: gray background, not editable
			return `${baseClass} border-gray-300 bg-gray-100 cursor-not-allowed text-gray-600`;
		} else if (editable) {
			// Empty fields: highlighted with yellow/orange background for "waiting for input"
			return `${baseClass} border-orange-400 bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500`;
		}
		return `${baseClass} border-gray-300`;
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
		if (!values.party_b_email_ask_receiver) {
			mandatoryFields.push("party_b_email");
		}

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
		if (!values.party_b_email_ask_receiver && (!values.party_b_email || !values.party_b_email.includes("@"))) {
			errors.add("party_b_email");
		}

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
				if (!values.party_b_email_ask_receiver) {
					stepFields.push("party_b_email");
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
				if (!values.party_b_email_ask_receiver) {
					stepFields.push("party_b_email");
				}
				break;
			default:
				return false;
		}

		for (const field of stepFields) {
			const val = values[field as keyof FormValues];
			if (!val || (typeof val === "string" && !val.trim())) return false;
			if (field === "party_b_email" && !values.party_b_email_ask_receiver && !values.party_b_email.includes("@")) return false;
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
		if (!values.party_b_email_ask_receiver) {
			requiredFields.push("party_b_email");
		}

		const total = requiredFields.length;
		let filled = 0;

		for (const field of requiredFields) {
			const val = values[field as keyof FormValues];
			if (val && typeof val === "string" && val.trim()) {
				if (field === "party_b_email") {
					if (val.includes("@")) filled += 1;
				} else {
					filled += 1;
				}
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

	// Loading state
	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading NDA...</p>
				</div>
			</div>
		);
	}

	// Token expired or invalid
	if (tokenExpired || tokenInvalid) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{tokenExpired ? "Link Expired" : "Invalid Link"}
					</h2>
					<p className="text-gray-600 mb-6">
						{tokenExpired
							? "This review link has expired. Please contact the sender for a new link."
							: "This review link is invalid. Please check the link or contact the sender."
						}
					</p>
					<button
						onClick={() => router.push('/')}
						className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
					>
						Go Home
					</button>
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
				<div className={`transition-all duration-300 ${showLivePreview ? "w-[45%]" : "w-full"} overflow-y-auto`}>
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
											<h1 className="text-xl font-bold text-white">
												Review NDA
											</h1>
											<p className="text-teal-100 text-sm">
												Review the agreement and fill in or suggest changes to the fields
											</p>
										</div>
									</div>
									<button
										onClick={() => setShowLivePreview(!showLivePreview)}
										className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border border-white/30"
										title={showLivePreview ? "Hide Preview" : "Show Preview"}
									>
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
									<div
										className="h-2.5 bg-teal-600 transition-all duration-500 ease-out rounded-full"
										style={{ width: `${computeCompletionPercent()}%` }}
									/>
								</div>
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

						{/* Waiting for Your Input Banner */}
						<div className="flex items-center gap-3 text-sm text-orange-800 mb-4 bg-orange-50 px-4 py-3 rounded-xl border-2 border-orange-300 shadow-sm">
							<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div>
								<p className="font-semibold">⏳ Waiting for Your Input</p>
								<p className="text-xs text-orange-700 mt-0.5">
									Empty fields (highlighted in orange) need your input. Filled fields are view-only - use &quot;Suggest a change&quot; to propose edits.
								</p>
							</div>
						</div>

						{/* Form Card */}
						<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
							<div className="p-6">
								{/* Step Navigation */}
								<div className="flex items-center justify-between gap-2">
									{steps.map((s, i) => (
										<div key={s} className="flex-1 relative">
											<button
												onClick={() => goToStep(i)}
												className={`w-full transition-all duration-300 ${i === step ? 'transform scale-105' : ''}`}
											>
												<div className="flex flex-col items-center">
													<div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${i === step
															? 'bg-teal-600 text-white shadow-lg ring-4 ring-teal-100'
															: isStepComplete(i)
																? 'bg-teal-500 text-white shadow-md'
																: 'bg-gray-200 text-gray-500'
														}`}>
														{isStepComplete(i) ? (
															<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
																<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
															</svg>
														) : (
															<span className="font-bold">{i + 1}</span>
														)}
													</div>
													<span className={`text-xs font-medium text-center transition-all duration-300 ${i === step ? 'text-teal-600 font-semibold' : 'text-gray-500'
														}`}>
														{s}
													</span>
												</div>
											</button>
											{i < steps.length - 1 && (
												<div className="absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 bg-gray-200 -z-10">
													<div
														className={`h-full bg-teal-600 transition-all duration-500 ${isStepComplete(i) ? 'w-full' : 'w-0'
															}`}
													/>
												</div>
											)}
										</div>
									))}
								</div>
							</div>

							{/* Form Content */}
							<div className="bg-gray-50 rounded-xl p-6 min-h-[400px] border border-gray-200">
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
												<p className="text-sm text-gray-600">Basic information about your NDA</p>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="md:col-span-2">
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Document Title *</span>
													{renderSuggestButton("docName")}
												</label>
												<input
													className={`${getFieldClass("docName")} w-full rounded-lg shadow-sm transition-all`}
													value={values.docName}
													onChange={(e) => setField("docName", e.target.value)}
													placeholder="e.g., Partnership NDA 2025"
													disabled={isFieldFilled("docName")}
												/>
												{renderInlineSuggestion("docName")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Effective Date <span className="text-gray-700">*</span></span>
													{renderSuggestButton("effective_date")}
												</label>
												<input
													type="date"
													className={`${getFieldClass("effective_date", "p-3 border w-full rounded-lg shadow-sm transition-all")}`}
													value={values.effective_date}
													onChange={(e) => setField("effective_date", e.target.value)}
													disabled={isFieldFilled("effective_date")}
													required
												/>
												<div className="text-xs text-gray-500 mt-1">DD/MM/YYYY</div>
												{renderInlineSuggestion("effective_date")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Term (months) *</span>
													{renderSuggestButton("term_months")}
												</label>
												<input
													type="number"
													className={`${getFieldClass("term_months")} w-full rounded-lg shadow-sm transition-all`}
													value={values.term_months}
													onChange={(e) => setField("term_months", e.target.value)}
													placeholder="e.g., 12"
													disabled={isFieldFilled("term_months")}
												/>
												{renderInlineSuggestion("term_months")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Confidentiality Period (months) *</span>
													{renderSuggestButton("confidentiality_period_months")}
												</label>
												<input
													type="number"
													className={`${getFieldClass("confidentiality_period_months")} w-full rounded-lg shadow-sm transition-all`}
													value={values.confidentiality_period_months}
													onChange={(e) => setField("confidentiality_period_months", e.target.value)}
													placeholder="e.g., 24"
													disabled={isFieldFilled("confidentiality_period_months")}
												/>
												{renderInlineSuggestion("confidentiality_period_months")}
											</div>
										</div>
									</div>
								)}

								{step === 1 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
												</svg>
											</div>
											<div className="flex-1">
												<h2 className="text-xl font-bold text-gray-800">Party A Information</h2>
												<p className="text-sm text-gray-600">Details of the first party (sender)</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Party Name *</span>
													{renderSuggestButton("party_a_name")}
												</label>
												<input
													className={`${getFieldClass("party_a_name", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													value={values.party_a_name}
													onChange={(e) => setField("party_a_name", e.target.value)}
													placeholder="Enter party name"
													disabled={isFieldFilled("party_a_name")}
												/>
												{renderInlineSuggestion("party_a_name")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Address</span>
													{renderSuggestButton("party_a_address")}
												</label>
												<textarea
													className={`${getFieldClass("party_a_address", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													rows={3}
													value={values.party_a_address}
													onChange={(e) => setField("party_a_address", e.target.value)}
													placeholder="Enter full address"
													disabled={isFieldFilled("party_a_address")}
												/>
												{renderInlineSuggestion("party_a_address")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Phone Number</span>
													{renderSuggestButton("party_a_phone")}
												</label>
												<input
													type="tel"
													className={`${getFieldClass("party_a_phone", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													value={values.party_a_phone}
													onChange={(e) => setField("party_a_phone", e.target.value)}
													placeholder="e.g., +1 (555) 123-4567"
													disabled={isFieldFilled("party_a_phone")}
												/>
												{renderInlineSuggestion("party_a_phone")}
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
														<span>Signatory Name</span>
														{renderSuggestButton("party_a_signatory_name")}
													</label>
													<input
														className={`${getFieldClass("party_a_signatory_name", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
														value={values.party_a_signatory_name}
														onChange={(e) => setField("party_a_signatory_name", e.target.value)}
														placeholder="Full name"
														disabled={isFieldFilled("party_a_signatory_name")}
													/>
													{renderInlineSuggestion("party_a_signatory_name")}
												</div>
												<div>
													<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
														<span>Title</span>
														{renderSuggestButton("party_a_title")}
													</label>
													<input
														className={`${getFieldClass("party_a_title", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
														value={values.party_a_title}
														onChange={(e) => setField("party_a_title", e.target.value)}
														placeholder="e.g., CEO, Director"
														disabled={isFieldFilled("party_a_title")}
													/>
													{renderInlineSuggestion("party_a_title")}
												</div>
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
												<p className="text-sm text-gray-600">Your information as the receiving party</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Party Name *</span>
													{renderSuggestButton("party_b_name")}
												</label>
												<input
													className={`${getFieldClass("party_b_name", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													value={values.party_b_name}
													onChange={(e) => setField("party_b_name", e.target.value)}
													placeholder="Enter party name"
													disabled={isFieldFilled("party_b_name")}
												/>
												{renderInlineSuggestion("party_b_name")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Address</span>
													{renderSuggestButton("party_b_address")}
												</label>
												<textarea
													className={`${getFieldClass("party_b_address", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													rows={3}
													value={values.party_b_address}
													onChange={(e) => setField("party_b_address", e.target.value)}
													placeholder="Enter full address"
													disabled={isFieldFilled("party_b_address")}
												/>
												{renderInlineSuggestion("party_b_address")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Phone Number</span>
													{renderSuggestButton("party_b_phone")}
												</label>
												<input
													type="tel"
													className={`${getFieldClass("party_b_phone", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													value={values.party_b_phone}
													onChange={(e) => setField("party_b_phone", e.target.value)}
													placeholder="e.g., +1 (555) 123-4567"
													disabled={isFieldFilled("party_b_phone")}
												/>
												{renderInlineSuggestion("party_b_phone")}
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
														<span>Signatory Name</span>
														{renderSuggestButton("party_b_signatory_name")}
													</label>
													<input
														className={`${getFieldClass("party_b_signatory_name", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
														value={values.party_b_signatory_name}
														onChange={(e) => setField("party_b_signatory_name", e.target.value)}
														placeholder="Full name"
														disabled={isFieldFilled("party_b_signatory_name")}
													/>
													{renderInlineSuggestion("party_b_signatory_name")}
												</div>
												<div>
													<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
														<span>Title</span>
														{renderSuggestButton("party_b_title")}
													</label>
													<input
														className={`${getFieldClass("party_b_title", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
														value={values.party_b_title}
														onChange={(e) => setField("party_b_title", e.target.value)}
														placeholder="e.g., CEO, Director"
														disabled={isFieldFilled("party_b_title")}
													/>
													{renderInlineSuggestion("party_b_title")}
												</div>
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Email Address *</span>
													{renderSuggestButton("party_b_email")}
												</label>
												<input
													type="email"
													className={`${getFieldClass("party_b_email", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													value={values.party_b_email}
													onChange={(e) => setField("party_b_email", e.target.value)}
													placeholder="email@example.com"
													disabled={isFieldFilled("party_b_email")}
												/>
												{renderInlineSuggestion("party_b_email")}
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
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Governing Law</span>
													{renderSuggestButton("governing_law")}
												</label>
												<input
													className={`${getFieldClass("governing_law", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													value={values.governing_law}
													onChange={(e) => setField("governing_law", e.target.value)}
													placeholder="e.g., State of California"
													disabled={isFieldFilled("governing_law")}
												/>
												{renderInlineSuggestion("governing_law")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>IP Ownership Clause</span>
													{renderSuggestButton("ip_ownership")}
												</label>
												<textarea
													className={`${getFieldClass("ip_ownership", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													rows={3}
													value={values.ip_ownership}
													onChange={(e) => setField("ip_ownership", e.target.value)}
													placeholder="Specify intellectual property ownership terms..."
													disabled={isFieldFilled("ip_ownership")}
												/>
												{renderInlineSuggestion("ip_ownership")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Non-Solicitation Clause</span>
													{renderSuggestButton("non_solicit")}
												</label>
												<textarea
													className={`${getFieldClass("non_solicit", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													rows={3}
													value={values.non_solicit}
													onChange={(e) => setField("non_solicit", e.target.value)}
													placeholder="Define non-solicitation terms..."
													disabled={isFieldFilled("non_solicit")}
												/>
												{renderInlineSuggestion("non_solicit")}
											</div>
											<div>
												<label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
													<span>Exclusivity Clause</span>
													{renderSuggestButton("exclusivity")}
												</label>
												<textarea
													className={`${getFieldClass("exclusivity", "p-3 border")} w-full rounded-lg shadow-sm transition-all`}
													rows={3}
													value={values.exclusivity}
													onChange={(e) => setField("exclusivity", e.target.value)}
													placeholder="Specify exclusivity arrangements..."
													disabled={isFieldFilled("exclusivity")}
												/>
												{renderInlineSuggestion("exclusivity")}
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
													<button onClick={() => goToStep(0)} className="text-teal-600 hover:text-teal-700 text-sm font-medium">Edit</button>
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
													<button onClick={() => goToStep(0)} className="text-teal-600 hover:text-teal-700 text-sm font-medium ml-4">Edit</button>
												</div>
											</div>
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Party A</div>
														<div className="text-base font-medium text-gray-900">
															{values.party_a_name || <span className="text-gray-400 italic">Not provided</span>}
														</div>
													</div>
													<button onClick={() => goToStep(1)} className="text-teal-600 hover:text-teal-700 text-sm font-medium">Edit</button>
												</div>
											</div>
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Party B</div>
														<div className="text-base font-medium text-gray-900">
															{values.party_b_name || <span className="text-gray-400 italic">Not provided</span>}
														</div>
														<div className="text-sm text-gray-600 mt-1">{values.party_b_email || <span className="text-gray-400 italic">No email</span>}</div>
													</div>
													<button onClick={() => goToStep(2)} className="text-teal-600 hover:text-teal-700 text-sm font-medium">Edit</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Navigation Buttons */}
							<div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-gray-200">
								<div className="flex gap-3">
									<button
										onClick={goBack}
										disabled={step === 0}
										className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${step === 0
												? 'bg-gray-100 text-gray-400 cursor-not-allowed'
												: 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
											}`}
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
										</svg>
										Back
									</button>
									{step < steps.length - 1 && (
										<button
											onClick={goNext}
											className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all duration-200 shadow-sm flex items-center gap-2"
										>
											Next
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</button>
									)}
									{step === steps.length - 1 && (
										<button
											onClick={sendBackWithChanges}
											disabled={saving}
											className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm flex items-center gap-2 ${saving
													? 'bg-gray-400 text-white cursor-not-allowed'
													: 'bg-teal-600 text-white hover:bg-teal-700'
												}`}
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
											</svg>
											{saving ? "Sending..." : "Send Back with Changes"}
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* RIGHT SIDE: Live Preview (Fixed) */}
				{showLivePreview && (
					<div className="w-[55%] bg-white border-l border-gray-200 overflow-y-auto">
						<div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 z-10">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-semibold text-gray-900">Live Preview</h3>
									<p className="text-xs text-gray-600">Updates as you type</p>
								</div>
								<div className="flex gap-2">
									{livePreviewHtml && (
										<>
											<button
												onClick={() => {
													const newWindow = window.open('', '_blank');
													if (newWindow) {
														newWindow.document.write(livePreviewHtml);
														newWindow.document.close();
													}
												}}
												className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
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
									<svg className="animate-spin h-12 w-12 mx-auto mb-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
									srcDoc={livePreviewHtml}
									className="w-full border-0"
									style={{ minHeight: '1200px', height: 'auto' }}
									title="NDA Preview"
									sandbox="allow-same-origin allow-scripts"
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
			</div>

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
	);
}

