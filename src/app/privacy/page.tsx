"use client";

import { Shield } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Shield}
				title="Privacy Policy"
				subtitle="Last updated: June 11, 2026"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 prose prose-gray max-w-none">

					<h2>1. Who We Are</h2>
					<p>
						FormalizeIt is a NDA workflow platform that helps teams create, fill, and send
						Non-Disclosure Agreements. This Privacy Policy explains how we collect, use, store,
						and protect your personal information when you use our Service.
					</p>

					<h2>2. Information We Collect</h2>
					<h3>Information you provide directly</h3>
					<ul>
						<li><strong>Account data:</strong> Name, email address, and password (managed through Clerk authentication)</li>
						<li><strong>Company data:</strong> Company name and workspace settings you configure</li>
						<li><strong>Document content:</strong> The NDA text, filled-in variables, party names, addresses, and other fields you enter when creating documents</li>
						<li><strong>Signature data:</strong> Electronic signatures collected through the signing flow, including the signer's name and timestamp</li>
						<li><strong>Payment data:</strong> Billing information is collected and stored by Stripe — we do not store your full card number on our servers</li>
					</ul>
					<h3>Information collected automatically</h3>
					<ul>
						<li><strong>Usage data:</strong> Pages visited, actions taken (e.g. draft created, NDA sent), and session duration</li>
						<li><strong>Device and browser data:</strong> IP address, browser type, operating system</li>
						<li><strong>Cookies:</strong> Session cookies for authentication and preference cookies for your workspace. We use no advertising or cross-site tracking cookies.</li>
					</ul>

					<h2>3. How We Use Your Information</h2>
					<ul>
						<li>To provide, operate, and improve the Service</li>
						<li>To authenticate you and manage your account and company workspace</li>
						<li>To generate, store, and deliver NDA documents to the parties you designate</li>
						<li>To send transactional emails (e.g. NDA review requests, signature confirmations) via Resend</li>
						<li>To process billing and manage your subscription via Stripe</li>
						<li>To respond to support requests and improve the product based on usage patterns</li>
						<li>To comply with legal obligations</li>
					</ul>
					<p>We do not use your NDA content for marketing, training AI models, or any purpose other than delivering the Service.</p>

					<h2>4. Third-Party Service Providers</h2>
					<p>We use the following trusted third-party services to operate the platform. Each is bound by its own privacy and security obligations:</p>
					<ul>
						<li><strong>Clerk</strong> — user authentication and identity management</li>
						<li><strong>Stripe</strong> — payment processing and subscription billing</li>
						<li><strong>Amazon Web Services (S3)</strong> — storage of signed PDF documents and uploaded files</li>
						<li><strong>Resend</strong> — transactional email delivery (NDA invitations, signature requests)</li>
						<li><strong>PostgreSQL (hosted database)</strong> — storage of all application data</li>
					</ul>
					<p>We do not sell, rent, or trade your personal information to any third party for marketing purposes.</p>

					<h2>5. Data Security</h2>
					<p>
						We take reasonable measures to protect your information:
					</p>
					<ul>
						<li>All data is transmitted over HTTPS (TLS encryption in transit)</li>
						<li>Documents stored in S3 are encrypted at rest</li>
						<li>Authentication is handled by Clerk with industry-standard security practices</li>
						<li>Access to production data is restricted to authorized personnel only</li>
					</ul>
					<p>
						No system is 100% secure. If you believe your account has been compromised, contact us
						immediately at <a href="mailto:support@formalizeit.app">support@formalizeit.app</a>.
					</p>

					<h2>6. Data Retention</h2>
					<p>
						We retain your account and document data for as long as your account is active. If you delete
						your account, we will delete your personal data within 30 days, except where we are required
						to retain it for legal or financial record-keeping purposes (e.g. payment history for up to
						7 years as required by law).
					</p>
					<p>
						Signed NDA documents are retained for the duration of your subscription and for 90 days after
						account deletion, so you have time to download them before they are removed.
					</p>

					<h2>7. Your Rights</h2>
					<p>You have the right to:</p>
					<ul>
						<li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
						<li><strong>Correct</strong> — update inaccurate or incomplete information</li>
						<li><strong>Delete</strong> — request deletion of your account and associated data</li>
						<li><strong>Export</strong> — download your NDA documents at any time from your dashboard</li>
						<li><strong>Object</strong> — opt out of non-essential communications</li>
					</ul>
					<p>
						To exercise any of these rights, email us at{" "}
						<a href="mailto:support@formalizeit.app">support@formalizeit.app</a>. We will respond within
						30 days.
					</p>

					<h2>8. Cookies</h2>
					<p>
						We use essential cookies for authentication (managed by Clerk) and session continuity.
						We do not use third-party advertising or tracking cookies. You can disable cookies in
						your browser settings, but this will prevent you from logging in to the Service.
					</p>

					<h2>9. Children's Privacy</h2>
					<p>
						The Service is not directed to children under the age of 16. We do not knowingly collect
						personal information from children. If you believe a child has provided us with their data,
						contact us and we will delete it promptly.
					</p>

					<h2>10. International Transfers</h2>
					<p>
						Your data may be stored and processed in data centers operated by our providers (including
						AWS and Clerk) located in the United States and other countries. By using the Service, you
						consent to this transfer. We ensure that transfers comply with applicable data protection laws.
					</p>

					<h2>11. Changes to This Policy</h2>
					<p>
						We may update this Privacy Policy from time to time. We will notify you by email and by
						posting the updated policy on this page. Continued use of the Service after changes
						constitutes acceptance of the updated policy.
					</p>

					<h2>12. Contact Us</h2>
					<p>
						Questions or concerns about this Privacy Policy? Contact us at{" "}
						<a href="mailto:support@formalizeit.app">support@formalizeit.app</a>.
					</p>
				</div>
			</div>
		</div>
	);
}
