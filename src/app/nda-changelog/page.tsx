"use client";

import { History } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function NdaChangelogPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={History}
				title="NDA Changelog"
				subtitle="A plain-language history of changes to the standard NDA"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 prose prose-gray max-w-none">
					<p className="text-teal-700 text-xs font-bold uppercase tracking-widest not-prose mb-3">
						Coming soon
					</p>
					<p>
						This page will list, in plain language, every change made to the standard NDA over
						time — so repeat users and legal reviewers can quickly see what, if anything, has
						changed since they last reviewed it. The full version history backs each entry.
					</p>
					<p>
						Entries will be published here as the standard NDA evolves. FormalizeIt is not a law
						firm and does not provide legal advice.
					</p>
				</div>
			</div>
		</div>
	);
}
