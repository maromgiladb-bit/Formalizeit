"use client";

import { Scale } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function NdaGovernancePage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Scale}
				title="NDA Governance Policy"
				subtitle="How the standard NDA is maintained and versioned"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 prose prose-gray max-w-none">
					<p className="text-teal-700 text-xs font-bold uppercase tracking-widest not-prose mb-3">
						Coming soon
					</p>
					<p>
						This page will describe how the standard NDA is governed — who may change it, how
						changes are reviewed and versioned, how existing executed agreements are unaffected
						by later versions, and how users are notified of updates.
					</p>
					<p>
						The policy is being finalized with our legal counsel. FormalizeIt is not a law firm
						and does not provide legal advice.
					</p>
				</div>
			</div>
		</div>
	);
}
