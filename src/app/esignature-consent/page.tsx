"use client";

import { PenLine } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

// Founder-drafted E-Signature Consent. The recorded-evidence list and the
// authority affirmation below MUST mirror src/lib/signatureEvidence.ts
// (AUTHORITY_CONSENT_TEXT + the AuditEvent fields) so what we describe here
// matches what is actually captured at signing.
export default function ESignatureConsentPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={PenLine}
				title="Electronic Signature Consent"
				subtitle="How electronic signing works on FormalizeIt"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
				<div className="bg-white rounded-2xl shadow-card border border-amber-200 p-6">
					<p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-2">
						Please read
					</p>
					<p className="text-sm text-gray-600 leading-relaxed">
						FormalizeIt is not a law firm and does not provide legal advice.
						FormalizeIt is not a party to the agreements you create or sign. This
						page explains your consent to sign electronically and what we record
						when you do.
					</p>
				</div>

				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 prose prose-gray max-w-none">
					<h2>1. Consent to Do Business Electronically</h2>
					<p>
						By signing an agreement through FormalizeIt, you consent to use
						electronic records and electronic signatures in connection with that
						agreement. Electronic signatures applied through the Service are intended
						to have the same legal effect as a handwritten signature under applicable
						electronic signature laws.
					</p>

					<h2>2. What We Record at Signing</h2>
					<p>
						To create a reliable record of each executed NDA, we capture and store
						the following evidence at the moment you sign:
					</p>
					<ul>
						<li>
							<strong>Signer email</strong> — the email address associated with the
							signer.
						</li>
						<li>
							<strong>Timestamp</strong> — the date and time the signature was
							applied.
						</li>
						<li>
							<strong>IP address</strong> — the network address you signed from.
						</li>
						<li>
							<strong>Document version</strong> — a verbatim snapshot of the exact
							standard NDA version and the bound parties as they existed at signing.
							This snapshot is stored as-is and is never re-derived later, so changes
							to the standard template afterwards never alter your executed record.
						</li>
						<li>
							<strong>Agreement hash</strong> — a SHA-256 cryptographic fingerprint
							of the final signed PDF, so the document can be checked for tampering.
						</li>
						<li>
							<strong>Authority affirmation</strong> — your confirmation (below) that
							you are authorized to sign, stored with its exact wording and time.
						</li>
					</ul>

					<h2>3. Authority to Sign</h2>
					<p>
						Before signing on behalf of a company, you must confirm the following
						affirmation, which is recorded with your signature:
					</p>
					<blockquote>
						&ldquo;I confirm that I am authorized to sign this agreement on behalf
						of, and in the name of, the company I represent, and that doing so
						legally binds that company.&rdquo;
					</blockquote>
					<p>
						Ensuring you actually hold this authority is your and your
						company&apos;s responsibility. FormalizeIt does not verify signing
						authority.
					</p>

					<h2>4. Hardware and Software Requirements</h2>
					<p>
						To sign electronically and retain your records, you need a device with a
						current web browser, internet access, and the ability to view and save
						PDF files. A copy of the signed PDF is delivered by email when the
						agreement is executed.
					</p>

					<h2>5. Retaining a Copy</h2>
					<p>
						You will receive the fully executed NDA as a PDF by email. You may save
						or print it for your records. If you create an account, you can also
						access your executed agreements within the Service. Signed NDAs are
						retained in accordance with our retention policy described in the{" "}
						<a href="/terms">Terms of Service</a>.
					</p>

					<h2>6. Withdrawing Consent or Requesting a Paper Copy</h2>
					<p>
						You are not required to sign electronically. If you prefer not to, simply
						do not complete the electronic signature, and arrange signing by other
						means directly with the other party. To request a paper copy of a
						document or to ask a question about electronic signing, contact us at{" "}
						<a href="mailto:support@formalizeit.app">support@formalizeit.app</a>.
						Withdrawing consent does not affect the validity of any agreement you
						have already signed electronically.
					</p>

					<h2>7. Contact</h2>
					<p>
						Questions about electronic signatures? Contact us at{" "}
						<a href="mailto:support@formalizeit.app">support@formalizeit.app</a>.
					</p>
				</div>
			</div>
		</div>
	);
}
