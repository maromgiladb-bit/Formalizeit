import { Network } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

const TBC = "To be confirmed";

const rows = [
	{ name: "Vercel", purpose: "Application hosting", data: "All traffic to the app; temporary processing of documents", region: "Frankfurt, Germany (EU)" },
	{ name: "Neon", purpose: "Database (PostgreSQL)", data: "Account, company, NDA and signature-evidence records", region: "Frankfurt, Germany (EU)" },
	{ name: "Amazon Web Services (S3)", purpose: "Document storage", data: "Signed NDA PDFs and uploaded files", region: "Frankfurt, Germany (EU)" },
	{ name: "Clerk", purpose: "Authentication and user identity", data: "Name, email, sign-in details, profile photo if you use Google sign-in", region: TBC },
	{ name: "Stripe", purpose: "Payments and subscription billing", data: "Billing details and subscription status", region: TBC },
	{ name: "Resend", purpose: "Transactional email delivery", data: "Recipient email addresses and the content of notification emails", region: TBC },
	{ name: "ImprovMX", purpose: "Forwarding of emails sent to our support address", data: "Emails you send to support, and their contents", region: TBC },
	{ name: "Sentry", purpose: "Error monitoring", data: "Technical error details; configured not to store IP addresses or record sessions", region: "EU data region" },
	{ name: "Vercel Analytics", purpose: "Cookie-free page-view analytics", data: "Aggregated page-view data", region: TBC },
	{ name: "Google Gemini", purpose: "AI assistant (Formi)", data: "None. The AI assistant is switched off, so no data is sent", region: "Not currently active" },
];

export default function SubprocessorsPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Network}
				title="Sub-processors"
				subtitle="The providers that help us run FormalizeIt. Last updated: October 23, 2026"
			/>

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
				<div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm text-left">
							<thead className="bg-gray-50 text-ink">
								<tr>
									<th scope="col" className="px-5 py-3 font-semibold">Provider</th>
									<th scope="col" className="px-5 py-3 font-semibold">Purpose</th>
									<th scope="col" className="px-5 py-3 font-semibold">Data involved</th>
									<th scope="col" className="px-5 py-3 font-semibold">Region</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 text-gray-500">
								{rows.map((r) => (
									<tr key={r.name}>
										<th scope="row" className="px-5 py-3 font-semibold text-ink align-top">{r.name}</th>
										<td className="px-5 py-3 align-top">{r.purpose}</td>
										<td className="px-5 py-3 align-top">{r.data}</td>
										<td className="px-5 py-3 align-top">{r.region}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<p className="text-sm text-gray-500 leading-relaxed">
					Regions marked &ldquo;to be confirmed&rdquo; are being verified with each provider.
					Some of these providers may process data outside the EU, as described in our{" "}
					<a href="/privacy" className="text-teal-800 underline">Privacy Policy</a>. Questions?
					Email <a href="mailto:support@formalizeit.com" className="text-teal-800 underline">support@formalizeit.com</a>.
				</p>
			</div>
		</div>
	);
}
