"use client";

import { PenLine } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function ESignatureConsentPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={PenLine}
				title="Electronic Signature Consent"
				subtitle="How electronic signing works on FormalizeIt"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 prose prose-gray max-w-none">
					<p className="text-teal-700 text-xs font-bold uppercase tracking-widest not-prose mb-3">
						Coming soon
					</p>
					<p>
						The full Electronic Signature Consent is being finalized with our legal counsel
						and will appear here. It will explain your consent to use electronic records and
						signatures, what is recorded at signing (email, timestamp, IP address, document
						version, and an agreement hash), and how to request a paper copy or withdraw consent.
					</p>
					<p>
						FormalizeIt is not a law firm and does not provide legal advice. This page is a
						placeholder until the final text is published.
					</p>
				</div>
			</div>
		</div>
	);
}
