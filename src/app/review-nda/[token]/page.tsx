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
	const [templateId, setTemplateId] = useState<string>("professional_mutual_nda_v1");
	const [showPdfPreview, setShowPdfPreview] = useState(false);
	const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
	const [generatingPdf, setGeneratingPdf] = useState(false);
	
	// Suggestions system for grayed-out fields
	const [suggestions, setSuggestions] = useState<Record<string, FieldSuggestion>>({});
	const [showSuggestionModal, setShowSuggestionModal] = useState(false);
	const [currentSuggestionField, setCurrentSuggestionField] = useState<string | null>(null);
	
	// Step navigation
	const [step, setStep] = useState<number>(0);
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

	// Generate PDF preview
	const previewPDF = async () => {
		setGeneratingPdf(true);
		try {
			console.log("📄 Generating PDF preview with data:", values);
			console.log("📋 Using template:", templateId);
			
			const payload = { ...templateData };
			
			const res = await fetch("/api/ndas/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			
			const json = await res.json();
			
			if (!res.ok) {
				console.error("❌ PDF preview failed:", json);
				setWarning(json.error || json.details || "PDF preview failed");
				return;
			}
			
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
				setPdfPreviewUrl(json.fileUrl);
				setShowPdfPreview(true);
			}
			
			console.log("✅ PDF preview opened successfully");
			setWarning("");
		} catch (e) {
			console.error("PDF preview error:", e);
			setWarning(e instanceof Error ? e.message : "PDF preview failed");
		} finally {
			setGeneratingPdf(false);
		}
	};

	// Field logic helpers
	const isFieldEditable = (fieldName: string): boolean => {
		const askReceiverKey = `${fieldName}_ask_receiver`;
		const value = values[askReceiverKey as keyof FormValues];
		return value === true || value === 'true';
	};

	const openSuggestionModal = (fieldName: string) => {
		setCurrentSuggestionField(fieldName);
		setShowSuggestionModal(true);
	};

	const saveSuggestion = (value: string, comment: string) => {
		if (!currentSuggestionField) return;
		
		setSuggestions(prev => ({
			...prev,
			[currentSuggestionField]: {
				originalValue: originalValues[currentSuggestionField as keyof FormValues]?.toString() || '',
				suggestedValue: value,
				comment,
			}
		}));
		
		setShowSuggestionModal(false);
		setCurrentSuggestionField(null);
		console.log(`💡 Suggestion saved for ${currentSuggestionField}`);
	};

	// Save changes (Party B edits and suggestions)
	const saveChanges = async () => {
		setSaving(true);
		try {
			const response = await fetch(`/api/ndas/review/${token}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					formData: values,
					suggestions: Object.values(suggestions)
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				setWarning(data.error || "Failed to save changes");
				return;
			}
			
			setWarning("✅ Changes saved successfully!");
			setTimeout(() => setWarning(""), 3000);
		} catch (error) {
			console.error('Error saving:', error);
			setWarning("Failed to save changes");
		} finally {
			setSaving(false);
		}
	};

	// Submit for review - final submission back to sender
	const submitForReview = async () => {
		// Validate required Party B fields that need to be filled
		const requiredFields = ['party_b_name', 'party_b_email', 'party_b_signatory_name'];
		const missingFields = requiredFields.filter(field => 
			isFieldEditable(field) && !values[field as keyof FormValues]
		);
		
		if (missingFields.length > 0) {
			setWarning("Please fill in all required fields before submitting");
			return;
		}
		
		setSaving(true);
		try {
			const response = await fetch(`/api/ndas/review/${token}/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					formData: values,
					suggestions: Object.values(suggestions)
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				setWarning(data.error || "Failed to submit");
				return;
			}
			
			// Show success and redirect
			setWarning("✅ NDA submitted successfully! The sender will be notified.");
			setTimeout(() => router.push('/'), 3000);
		} catch (error) {
			console.error('Error submitting:', error);
			setWarning("Failed to submit NDA");
		} finally {
			setSaving(false);
		}
	};

	// Transform field names from party_a/party_b to party_1/party_2 for template compatibility
	const templateData = {
		...values,
		templateId,
		party_1_name: sanitizeForHtml(values.party_a_name),
		party_1_address: sanitizeForHtml(values.party_a_address),
		party_1_signatory_name: sanitizeForHtml(values.party_a_signatory_name),
		party_1_signatory_title: sanitizeForHtml(values.party_a_title),
		party_1_phone: sanitizeForHtml(values.party_a_phone),
		party_1_emails_joined: '',
		party_2_name: sanitizeForHtml(values.party_b_name),
		party_2_address: sanitizeForHtml(values.party_b_address),
		party_2_signatory_name: sanitizeForHtml(values.party_b_signatory_name),
		party_2_signatory_title: sanitizeForHtml(values.party_b_title),
		party_2_phone: sanitizeForHtml(values.party_b_phone),
		party_2_emails_joined: sanitizeForHtml(values.party_b_email),
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
		if (liveData?.html) {
			setLivePreviewHtml(liveData.html);
		}
	}, [liveData, values]);

	// Helper to update form fields
	const setField = (k: keyof FormValues, v: string | boolean) => {
		setValues((s) => ({ ...s, [k]: v } as unknown as FormValues));
	};

	// Handle token errors
	if (tokenExpired) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
					<p className="text-gray-600 mb-6">
						This review link has expired. Please contact the sender to request a new review link.
					</p>
					<button
						onClick={() => router.push('/')}
						className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all"
					>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	if (tokenInvalid) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
					<p className="text-gray-600 mb-6">
						This review link is invalid or no longer exists. Please check your email for the correct link or contact the sender.
					</p>
					<button
						onClick={() => router.push('/')}
						className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all"
					>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading NDA...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<PublicToolbar />
			
			{/* Warning Message */}
			{warning && (
				<div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
					warning.includes('✅') ? 'bg-green-500' : 'bg-orange-500'
				} text-white font-medium animate-fadeIn`}>
					{warning}
				</div>
			)}

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
											<h1 className="text-xl font-bold text-white">Review NDA</h1>
											<p className="text-teal-100 text-sm">Review and complete the agreement</p>
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
						</div>

						{/* Step Progress Bar */}
						<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
							<div className="flex items-center justify-between mb-2">
								{steps.map((s, i) => (
									<React.Fragment key={i}>
										<div className="flex flex-col items-center flex-1">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
													i < step
														? "bg-green-500 text-white"
														: i === step
														? "bg-teal-600 text-white ring-4 ring-teal-100"
														: "bg-gray-200 text-gray-500"
												}`}
											>
												{i < step ? (
													<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
													</svg>
												) : (
													i + 1
												)}
											</div>
											<span className={`text-xs mt-2 font-medium ${i === step ? "text-teal-600" : "text-gray-600"}`}>
												{s}
											</span>
										</div>
										{i < steps.length - 1 && (
											<div className={`h-1 flex-1 mx-2 rounded ${i < step ? "bg-green-500" : "bg-gray-200"}`} />
										)}
									</React.Fragment>
								))}
							</div>
						</div>

						{/* Step 0: Document Information */}
						{step === 0 && (
							<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
								<h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
									<div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
										<svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
									Document Information
								</h2>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											Document Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={values.docName}
											disabled
											className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										/>
										<p className="text-xs text-gray-500 mt-1">Set by sender</p>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-2">
												Effective Date
											</label>
											<input
												type="date"
												value={values.effective_date}
												disabled
												className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-2">
												Term (months)
											</label>
											<input
												type="number"
												value={values.term_months}
												disabled
												className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
											/>
										</div>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											Confidentiality Period (months)
										</label>
										<input
											type="number"
											value={values.confidentiality_period_months}
											disabled
											className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										/>
									</div>
								</div>
							</div>
						)}

						{/* Step 1: Party A Information */}
						{step === 1 && (
							<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
								<h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
									<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
										<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									</div>
									Party A Information (Sender)
								</h2>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
										<input
											type="text"
											value={values.party_a_name}
											disabled
											className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										/>
										<p className="text-xs text-gray-500 mt-1">Provided by sender</p>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
										<textarea
											value={values.party_a_address}
											disabled
											rows={3}
											className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
										<input
											type="text"
											value={values.party_a_phone}
											disabled
											className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										/>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-2">Signatory Name</label>
											<input
												type="text"
												value={values.party_a_signatory_name}
												disabled
												className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
											<input
												type="text"
												value={values.party_a_title}
												disabled
												className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
											/>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Step 2: Party B Information */}
						{step === 2 && (
							<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
								<h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
									<div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
										<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
									</div>
									Party B Information (You)
								</h2>
								<div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
									<p className="text-sm text-blue-800">
										<strong>Note:</strong> Fill in the fields below. Grayed-out fields were pre-filled by the sender - you can suggest changes to them.
									</p>
								</div>
								<div className="space-y-4">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Company Name <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={values.party_b_name}
										onChange={(e) => setField("party_b_name", e.target.value)}
										disabled={!isFieldEditable("party_b_name")}
										className={`p-3 border w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
											isFieldEditable("party_b_name") 
												? "border-gray-300 bg-white" 
												: "border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
										}`}
										placeholder="Enter company name"
									/>
									{!isFieldEditable("party_b_name") && values.party_b_name && (
										<button
											onClick={() => openSuggestionModal("party_b_name")}
											className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
											Suggest a change
										</button>
									)}
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Address <span className="text-red-500">*</span>
									</label>
									<textarea
										value={values.party_b_address}
										onChange={(e) => setField("party_b_address", e.target.value)}
										disabled={!isFieldEditable("party_b_address")}
										rows={3}
										className={`p-3 border w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
											isFieldEditable("party_b_address") 
												? "border-gray-300 bg-white" 
												: "border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
										}`}
										placeholder="Enter full address"
									/>
									{!isFieldEditable("party_b_address") && values.party_b_address && (
										<button
											onClick={() => openSuggestionModal("party_b_address")}
											className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
											Suggest a change
										</button>
									)}
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											Signatory Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={values.party_b_signatory_name}
											onChange={(e) => setField("party_b_signatory_name", e.target.value)}
											disabled={!isFieldEditable("party_b_signatory_name")}
											className={`p-3 border w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
												isFieldEditable("party_b_signatory_name") 
													? "border-gray-300 bg-white" 
													: "border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
											}`}
											placeholder="Enter signatory name"
										/>
										{!isFieldEditable("party_b_signatory_name") && values.party_b_signatory_name && (
											<button
												onClick={() => openSuggestionModal("party_b_signatory_name")}
												className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
												Suggest a change
											</button>
										)}
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											Title <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={values.party_b_title}
											onChange={(e) => setField("party_b_title", e.target.value)}
											disabled={!isFieldEditable("party_b_title")}
											className={`p-3 border w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
												isFieldEditable("party_b_title") 
													? "border-gray-300 bg-white" 
													: "border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
											}`}
											placeholder="Enter title"
										/>
										{!isFieldEditable("party_b_title") && values.party_b_title && (
											<button
												onClick={() => openSuggestionModal("party_b_title")}
												className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
												Suggest a change
											</button>
										)}
									</div>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Email <span className="text-red-500">*</span>
									</label>
									<input
										type="email"
										value={values.party_b_email}
										onChange={(e) => setField("party_b_email", e.target.value)}
										disabled={!isFieldEditable("party_b_email")}
										className={`p-3 border w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
											isFieldEditable("party_b_email") 
												? "border-gray-300 bg-white" 
												: "border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
										}`}
										placeholder="Enter email address"
									/>
									{!isFieldEditable("party_b_email") && values.party_b_email && (
										<button
											onClick={() => openSuggestionModal("party_b_email")}
											className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
											Suggest a change
										</button>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Clauses */}
					{step === 3 && (
						<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
							<h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
								<div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
									<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								Additional Clauses
							</h2>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Governing Law
									</label>
									<input
										type="text"
										value={values.governing_law}
										disabled
										className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										placeholder="e.g., State of California"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										IP Ownership
									</label>
									<textarea
										value={values.ip_ownership}
										disabled
										rows={3}
										className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										placeholder="Intellectual property ownership terms..."
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Non-Solicitation
									</label>
									<textarea
										value={values.non_solicit}
										disabled
										rows={3}
										className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										placeholder="Non-solicitation terms..."
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Exclusivity
									</label>
									<textarea
										value={values.exclusivity}
										disabled
										rows={3}
										className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										placeholder="Exclusivity terms..."
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Additional Terms
									</label>
									<textarea
										value={values.additional_terms}
										disabled
										rows={4}
										className="p-3 border border-gray-300 w-full rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
										placeholder="Any additional terms or conditions..."
									/>
								</div>
							</div>
						</div>
					)}

					{/* Step 4: Review */}
					{step === 4 && (
						<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
							<h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
								<div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
									<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								Review & Submit
							</h2>
							<div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
								<p className="text-sm text-blue-800">
									<strong>Review Summary:</strong> Please review all information before submitting. You can use the preview panel to see how the final document will look.
								</p>
							</div>
							<div className="space-y-6">
								{/* Summary of changes/suggestions */}
								{Object.keys(suggestions).length > 0 && (
									<div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
										<h3 className="font-semibold text-yellow-900 mb-2">Your Suggestions ({Object.keys(suggestions).length})</h3>
										<ul className="space-y-2">
											{Object.entries(suggestions).map(([field, suggestion]) => (
												<li key={field} className="text-sm text-yellow-800">
													<strong>{field}:</strong> {suggestion.suggestedValue}
													{suggestion.comment && <span className="italic"> - {suggestion.comment}</span>}
												</li>
											))}
										</ul>
									</div>
								)}
								<div className="bg-gray-50 rounded-lg p-4">
									<h3 className="font-semibold text-gray-900 mb-3">Document Summary</h3>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div><span className="text-gray-600">Document:</span> <strong>{values.docName}</strong></div>
										<div><span className="text-gray-600">Effective Date:</span> <strong>{values.effective_date}</strong></div>
										<div><span className="text-gray-600">Term:</span> <strong>{values.term_months} months</strong></div>
										<div><span className="text-gray-600">Party A:</span> <strong>{values.party_a_name}</strong></div>
										<div><span className="text-gray-600">Party B:</span> <strong>{values.party_b_name}</strong></div>
										<div><span className="text-gray-600">Your Email:</span> <strong>{values.party_b_email}</strong></div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Step Navigation Buttons */}
					<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
						<div className="flex gap-4 justify-between flex-wrap">
							<button
								type="button"
								onClick={() => step > 0 ? setStep(step - 1) : window.history.back()}
								className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all flex items-center gap-2"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
								{step === 0 ? "Back" : "Previous"}
							</button>
							<div className="flex gap-3 flex-wrap">
								{step < steps.length - 1 ? (
									<>
										<button
											type="button"
											onClick={saveChanges}
											disabled={saving}
											className="px-6 py-3 bg-teal-100 text-teal-700 rounded-xl font-bold hover:bg-teal-200 transition-all disabled:opacity-50 flex items-center gap-2"
										>
											{saving ? (
												<>
													<div className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
													<span>Saving...</span>
												</>
											) : (
												<>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
													</svg>
													<span>Save Draft</span>
												</>
											)}
										</button>
										<button
											type="button"
											onClick={() => setStep(step + 1)}
											className="px-8 py-3 bg-linear-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
										>
											<span>Next Step</span>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</button>
									</>
								) : (
									<>
										<button
											type="button"
											onClick={saveChanges}
											disabled={saving}
											className="px-6 py-3 bg-teal-100 text-teal-700 rounded-xl font-bold hover:bg-teal-200 transition-all disabled:opacity-50 flex items-center gap-2"
										>
											{saving ? (
												<>
													<div className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
													<span>Saving...</span>
												</>
											) : (
												<>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
													</svg>
													<span>Save Draft</span>
												</>
											)}
										</button>
										<button
											type="button"
											onClick={submitForReview}
											disabled={saving}
											className="px-8 py-3 bg-linear-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
										>
											{saving ? (
												<>
													<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
													<span>Submitting...</span>
												</>
											) : (
												<>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<span>Submit for Review</span>
												</>
											)}
										</button>
									</>
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
														Preview PDF
													</>
												)}
											</button>
										</>
									)}
								</div>
							</div>
						</div>
						<div className="p-6">
							{previewLoading && (
								<div className="flex items-center justify-center py-12">
									<div className="text-center">
										<div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
										<p className="text-gray-600">Generating preview...</p>
									</div>
								</div>
							)}
							{previewError && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
									<p className="font-semibold">Preview Error</p>
									<p className="text-sm">{previewError}</p>
								</div>
							)}
							{livePreviewHtml && !previewLoading && (
								<div 
									className="prose prose-sm max-w-none bg-white p-8 shadow-inner rounded-lg border border-gray-200"
									dangerouslySetInnerHTML={{ __html: livePreviewHtml }}
								/>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Suggestion Modal */}
			{showSuggestionModal && currentSuggestionField && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
					<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-hidden">
						<div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
									<svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 text-lg">Suggest a Change</h3>
									<p className="text-xs text-gray-600">Propose a modification to this field</p>
								</div>
							</div>
							<button 
								className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white hover:bg-opacity-50 rounded-lg" 
								onClick={() => {
									setShowSuggestionModal(false);
									setCurrentSuggestionField(null);
								}}
								aria-label="Close modal"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="p-6">
							<div className="mb-4">
								<label className="block text-sm font-semibold text-gray-700 mb-2">Current Value</label>
								<div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
									{originalValues[currentSuggestionField as keyof FormValues]?.toString() || '(empty)'}
								</div>
							</div>
							<div className="mb-4">
								<label className="block text-sm font-semibold text-gray-700 mb-2">Suggested Value</label>
								<input
									type="text"
									id="suggested-value"
									className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
									placeholder="Enter your suggested value"
								/>
							</div>
							<div className="mb-6">
								<label className="block text-sm font-semibold text-gray-700 mb-2">Comment (Optional)</label>
								<textarea
									id="suggestion-comment"
									rows={3}
									className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
									placeholder="Explain why you're suggesting this change..."
								/>
							</div>
							<div className="flex gap-3 justify-end">
								<button
									onClick={() => {
										setShowSuggestionModal(false);
										setCurrentSuggestionField(null);
									}}
									className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
								>
									Cancel
								</button>
								<button
									onClick={() => {
										const suggestedValue = (document.getElementById('suggested-value') as HTMLInputElement)?.value;
										const comment = (document.getElementById('suggestion-comment') as HTMLTextAreaElement)?.value;
										if (suggestedValue) {
											saveSuggestion(suggestedValue, comment);
										}
									}}
									className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200"
								>
									Save Suggestion
								</button>
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
	);
}
