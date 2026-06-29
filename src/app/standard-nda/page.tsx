"use client";

import { FileText } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function StandardNdaPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={FileText}
				title="The Standard NDA"
				subtitle="Review the standard mutual NDA before you accept or sign"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 prose prose-gray max-w-none">
					<p className="text-teal-700 text-xs font-bold uppercase tracking-widest not-prose mb-3">
						Coming soon
					</p>
					<p>
						A read-only view of the full standard mutual NDA will be published here so anyone
						can review the legal language before accepting. The legal text is fixed — when you
						create an NDA you only fill in deal-specific details (parties, dates, term, governing
						law, purpose) plus one optional clause.
					</p>
					<p>
						The final text is being finalized with our legal counsel. FormalizeIt is not a law
						firm and does not provide legal advice.
					</p>
				</div>
			</div>
		</div>
	);
}
