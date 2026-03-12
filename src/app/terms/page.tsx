"use client";

import { Scale } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Scale}
				title="Terms of Service"
				subtitle="Last updated: November 23, 2025"
			/>

			{/* Content */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 prose prose-gray max-w-none">
					<h2>1. Acceptance of Terms</h2>
					<p>
						By accessing and using NDA SaaS ("the Service"), you agree to be bound by these Terms of Service. 
						If you do not agree to these terms, please do not use the Service.
					</p>

					<h2>2. Use of Service</h2>
					<p>
						You may use the Service to create, manage, and share Non-Disclosure Agreements. You are responsible 
						for maintaining the confidentiality of your account and for all activities that occur under your account.
					</p>

					<h2>3. User Content</h2>
					<p>
						You retain all rights to the content you create using our Service. By using the Service, you grant us 
						the right to store and process your content solely for the purpose of providing the Service to you.
					</p>

					<h2>4. Prohibited Uses</h2>
					<p>
						You may not use the Service for any illegal purposes or in violation of any applicable laws. You may not 
						attempt to interfere with, compromise, or disrupt the Service or its servers.
					</p>

					<h2>5. Intellectual Property</h2>
					<p>
						The Service and its original content, features, and functionality are owned by NDA SaaS and are protected 
						by international copyright, trademark, and other intellectual property laws.
					</p>

					<h2>6. Limitation of Liability</h2>
					<p>
						The Service is provided "as is" without any warranties. We shall not be liable for any indirect, incidental, 
						special, consequential, or punitive damages resulting from your use of the Service.
					</p>

					<h2>7. Changes to Terms</h2>
					<p>
						We reserve the right to modify these terms at any time. We will notify you of any changes by posting 
						the new Terms of Service on this page.
					</p>

					<h2>8. Contact</h2>
					<p>
						If you have any questions about these Terms, please contact us at support@ndasaas.com
					</p>
				</div>
			</div>
		</div>
	);
}
