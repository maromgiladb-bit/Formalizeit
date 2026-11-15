"use client";

import { Scale } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

// Founder-drafted NDA Governance Policy. Describes how the single standard NDA
// is versioned and maintained. Ties to the changelog (src/lib/ndaChangelog.ts,
// surfaced at /nda-changelog) and the version-acknowledgement prompt shown on the
// dashboard after a version bump (signed-in users only).
export default function NdaGovernancePage() {
	return (
		<div className="min-h-screen bg-ground">
			<PageHero
				icon={Scale}
				title="NDA Governance Policy"
				subtitle="How the standard NDA is maintained and versioned"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 [&_p]:max-w-[70ch] [&_li]:max-w-[70ch] space-y-6">
				<div className="bg-white rounded-sheet border border-amber-200 p-6">
					<p className="text-amber-700 text-sm font-semibold mb-2">
						Please read
					</p>
					<p className="text-sm text-gray-700 leading-relaxed">
						FormalizeIt is not a law firm and does not provide legal advice. This
						policy explains how we maintain the standard NDA as a product — it is
						not a statement about the enforceability of any agreement.
					</p>
				</div>

				<div className="bg-white rounded-sheet border border-line p-8 sm:p-12 prose prose-gray max-w-none [&_h2]:font-display [&_h2]:text-ink [&_h2]:tracking-tight [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h2:first-child]:mt-0 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1.5 [&_hr]:my-8 [&_p]:text-gray-700 [&_li]:text-gray-700 [&_p]:leading-relaxed [&_a]:text-teal-800 [&_a]:underline [&_hr]:border-line">
					<h2>1. One Standard NDA</h2>
					<p>
						FormalizeIt is built around a single, fixed standard mutual NDA. The
						legal text is the same across every agreement — you review it once, then
						fill in only the deal-specific details (the parties, effective date,
						purpose, scope, term, governing law, and notice information), plus one
						optional open clause. This is deliberate: a stable, shared standard is
						what lets teams send an NDA in minutes without renegotiating boilerplate.
						The legal text of the standard NDA is not user-editable.
					</p>

					<h2>2. Versioning</h2>
					<p>
						The standard NDA carries a version number (currently{" "}
						<strong>version 1.0</strong>). Every change to the legal text produces a
						new version. Minor clarifications increment the minor version (for
						example, 1.0 &rarr; 1.1); substantive changes increment the major version
						(for example, 1.x &rarr; 2.0). Each executed agreement permanently records
						the exact version that was signed.
					</p>

					<h2>3. Executed Agreements Are Never Changed</h2>
					<p>
						Publishing a new version never alters agreements that were already
						signed. At signing, we store a verbatim snapshot of the exact version and
						the bound parties, and a cryptographic hash of the signed PDF. Later
						versions apply only to new agreements created after they take effect. An
						NDA you signed under version 1.0 remains a version 1.0 agreement forever.
					</p>

					<h2>4. Who May Change the Standard</h2>
					<p>
						Changes to the standard NDA are made only by FormalizeIt and are reviewed
						before release. Users and companies on the platform cannot alter the
						standard legal text. Our intent is to keep changes rare and to prioritize
						clarity, balance between the parties, and broad usability.
					</p>

					<h2>5. How Changes Are Published and Communicated</h2>
					<p>
						Every change is recorded in a human-readable{" "}
						<a href="/nda-changelog">NDA Changelog</a>, which lists each version, its
						date, and a plain-language summary of what was added, changed, or removed.
						When the standard NDA is updated, signed-in users see a summary of the
						change on their dashboard and are asked to acknowledge the current version.
						Receivers who sign through a secure link without an account do not see this
						prompt; they always see the full text of the version they are signing before
						they sign it.
					</p>

					<h2>6. Reviewing the Standard</h2>
					<p>
						The full current text is always available to read on the{" "}
						<a href="/standard-nda">Standard NDA</a> page, before you accept or sign
						anything. We encourage both senders and receivers to review it, and to
						consult a qualified attorney if an agreement is legally sensitive.
					</p>

					<h2>7. Questions</h2>
					<p>
						Questions about how the standard NDA is governed? Contact us at{" "}
						<a href="mailto:support@formalizeit.com">support@formalizeit.com</a>.
					</p>
				</div>
			</div>
		</div>
	);
}
