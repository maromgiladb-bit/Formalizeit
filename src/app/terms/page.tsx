"use client";

import { Scale } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Scale}
				title="Terms of Service"
				subtitle="Last updated: June 11, 2026"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 prose prose-gray max-w-none">

					<h2>1. Acceptance of Terms</h2>
					<p>
						By accessing or using FormalizeIt ("the Service", "we", "us", or "our"), you agree to be bound
						by these Terms of Service ("Terms"). If you are using the Service on behalf of a company or
						other legal entity, you represent that you have authority to bind that entity to these Terms.
						If you do not agree, do not use the Service.
					</p>

					<h2>2. What FormalizeIt Does</h2>
					<p>
						FormalizeIt is a workflow tool that helps teams create, fill, review, and send Non-Disclosure
						Agreements using pre-built templates. The Service facilitates document preparation and
						electronic signature collection between parties.
					</p>
					<p>
						<strong>FormalizeIt does not provide legal advice.</strong> Nothing on this platform constitutes
						legal counsel. NDAs and other documents created using the Service should be reviewed by a
						qualified attorney before use in legally sensitive situations. We make no representation that
						any document created through the Service is enforceable in any jurisdiction.
					</p>

					<h2>3. Accounts and Companies</h2>
					<p>
						You must create an account to use the Service. You are responsible for keeping your login
						credentials secure and for all activity that occurs under your account.
					</p>
					<p>
						The Service is organized around company workspaces. Documents, billing, and team access are
						managed at the company level. The person who creates a company workspace becomes the Owner and
						is responsible for managing members and billing.
					</p>

					<h2>4. Acceptable Use</h2>
					<p>You agree not to use the Service to:</p>
					<ul>
						<li>Create documents intended to defraud, coerce, or harm any party</li>
						<li>Violate any applicable law or regulation</li>
						<li>Infringe on the intellectual property or privacy rights of others</li>
						<li>Transmit malware, spam, or any harmful content</li>
						<li>Attempt to gain unauthorized access to the Service or its infrastructure</li>
						<li>Reverse engineer, resell, or sublicense the Service without written permission</li>
					</ul>

					<h2>5. Your Content</h2>
					<p>
						You retain all ownership rights to the documents and data you create using the Service.
						By using the Service, you grant FormalizeIt a limited, non-exclusive license to store,
						process, and transmit your content solely to operate and deliver the Service to you and
						your designated recipients.
					</p>
					<p>
						We do not read, analyze, or use your NDA content for any purpose other than providing the Service.
					</p>

					<h2>6. Billing and Subscriptions</h2>
					<p>
						Paid plans are billed on a recurring basis (monthly or annual) through Stripe. By subscribing,
						you authorize FormalizeIt to charge your payment method on a recurring basis until you cancel.
					</p>
					<p>
						You may cancel your subscription at any time from your account settings. Cancellation takes
						effect at the end of the current billing period — you will not be charged again, and you retain
						access until the period ends. We do not offer refunds for partial billing periods.
					</p>
					<p>
						We reserve the right to change pricing with 30 days' advance notice to the email address
						associated with your account.
					</p>

					<h2>7. Free Plans and Limits</h2>
					<p>
						Free plan features and usage limits are subject to change at any time. We will provide
						reasonable notice before reducing the features available on a free plan.
					</p>

					<h2>8. Termination</h2>
					<p>
						You may delete your account at any time. We may suspend or terminate your account if you
						violate these Terms, fail to pay fees when due, or if we are required to do so by law.
						Upon termination, your right to use the Service ends immediately. We may retain your data
						for a limited period as required by law or our backup policies, after which it will be deleted.
					</p>

					<h2>9. Intellectual Property</h2>
					<p>
						The FormalizeIt name, logo, platform design, and software are owned by FormalizeIt and
						protected by applicable intellectual property laws. The NDA templates provided by FormalizeIt
						are licensed for use within the Service only.
					</p>

					<h2>10. Disclaimer of Warranties</h2>
					<p>
						The Service is provided "as is" and "as available" without warranties of any kind, either
						express or implied, including but not limited to warranties of merchantability, fitness for
						a particular purpose, or non-infringement. We do not warrant that the Service will be
						uninterrupted, error-free, or that documents produced will be legally enforceable.
					</p>

					<h2>11. Limitation of Liability</h2>
					<p>
						To the maximum extent permitted by law, FormalizeIt shall not be liable for any indirect,
						incidental, special, consequential, or punitive damages, including loss of profits, data,
						or business opportunities, arising from your use of or inability to use the Service — even
						if we have been advised of the possibility of such damages.
					</p>
					<p>
						Our total liability to you for any claim arising from these Terms or your use of the Service
						shall not exceed the amounts you paid to FormalizeIt in the 12 months preceding the claim.
					</p>

					<h2>12. Indemnification</h2>
					<p>
						You agree to indemnify and hold FormalizeIt harmless from any claims, damages, or expenses
						(including legal fees) arising from your use of the Service, your violation of these Terms,
						or any documents you create or send using the Service.
					</p>

					<h2>13. Governing Law</h2>
					<p>
						These Terms are governed by the laws of Israel. Any disputes arising from these Terms or
						the Service shall be subject to the exclusive jurisdiction of the courts of Tel Aviv, Israel.
					</p>

					<h2>14. Changes to These Terms</h2>
					<p>
						We may update these Terms from time to time. We will notify you by email and by posting the
						updated Terms on this page at least 14 days before changes take effect. Continued use of the
						Service after that date constitutes acceptance of the new Terms.
					</p>

					<h2>15. Contact</h2>
					<p>
						Questions about these Terms? Contact us at{" "}
						<a href="mailto:support@formalizeit.app">support@formalizeit.app</a>.
					</p>
				</div>
			</div>
		</div>
	);
}
