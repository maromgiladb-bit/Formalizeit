"use client";

import { CheckCircle } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function CompliancePage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={CheckCircle}
				title="Compliance"
				subtitle="How we protect and store your data"
			/>

			{/* Content */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 prose prose-gray max-w-none">
					<h2>Data Protection (GDPR)</h2>
					<p>
						We design the Service around the principles of the General Data Protection Regulation (GDPR):
						personal data is used only to deliver the Service, kept for as long as needed, and you can ask
						us to access, correct, export, or delete it. See our <a href="/privacy">Privacy Policy</a> for
						the details and how to make a request.
					</p>

					<h2>Where Your Data Is Stored</h2>
					<p>
						Our core infrastructure runs in the European Union (Frankfurt, Germany): application servers,
						the database, signed-document storage, and error monitoring. Some of our providers process data
						in the United States, namely authentication (Clerk), payments (Stripe), and email delivery
						(Resend). The full list of providers is in our <a href="/privacy">Privacy Policy</a>.
					</p>

					<h2>Security</h2>
					<ul>
						<li>All data is transmitted over HTTPS (TLS encryption in transit)</li>
						<li>Signed documents are encrypted at rest in private storage</li>
						<li>Sign-in is handled by Clerk</li>
						<li>Access to production data is restricted to authorized personnel</li>
					</ul>
					<p>
						We do not currently hold third-party security certifications such as SOC 2 or ISO 27001.
					</p>

					<h2>Signature Audit Trail</h2>
					<p>
						Every executed NDA records the signer&apos;s email, the time of signing, the IP address, the exact
						version of the standard NDA that was signed, and a SHA-256 fingerprint of the signed PDF, so the
						document can later be shown to be unchanged. See{" "}
						<a href="/esignature-consent">Electronic Signature Consent</a>.
					</p>

					<h2>Retention</h2>
					<p>
						Signed NDAs are kept for at least five years from the date of execution, with advance notice
						before any deletion.
					</p>

					<h2>Not Legal Advice</h2>
					<p>
						FormalizeIt is not a law firm and does not provide legal advice. This page describes how the
						Service works and is not a compliance guarantee.
					</p>

					<h2>Contact</h2>
					<p>
						For compliance or data-protection questions, email{" "}
						<a href="mailto:support@formalizeit.com">support@formalizeit.com</a>.
					</p>
				</div>
			</div>
		</div>
	);
}
