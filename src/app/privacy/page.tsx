"use client";

import { Shield } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Shield}
				title="Privacy Policy"
				subtitle="Last updated: November 23, 2025"
			/>

			{/* Content */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 prose prose-gray max-w-none">
					<h2>1. Information We Collect</h2>
					<p>
						We collect information you provide directly to us, including your name, email address, company information, 
						and the content of NDAs you create. We also collect information about how you use our Service.
					</p>

					<h2>2. How We Use Your Information</h2>
					<p>
						We use the information we collect to:
					</p>
					<ul>
						<li>Provide, maintain, and improve our Service</li>
						<li>Send you technical notices and support messages</li>
						<li>Respond to your comments and questions</li>
						<li>Monitor and analyze trends and usage</li>
					</ul>

					<h2>3. Information Sharing</h2>
					<p>
						We do not sell or rent your personal information to third parties. We may share your information with 
						service providers who assist us in operating our Service, subject to confidentiality agreements.
					</p>

					<h2>4. Data Security</h2>
					<p>
						We use industry-standard security measures to protect your information. All data is encrypted in transit 
						and at rest. However, no method of transmission over the Internet is 100% secure.
					</p>

					<h2>5. Data Retention</h2>
					<p>
						We retain your information for as long as your account is active or as needed to provide you services. 
						You may request deletion of your account and data at any time.
					</p>

					<h2>6. Your Rights</h2>
					<p>
						You have the right to access, correct, or delete your personal information. You may also object to 
						or restrict certain processing of your data.
					</p>

					<h2>7. Cookies</h2>
					<p>
						We use cookies and similar technologies to collect information about your browsing activities and to 
						provide you with a personalized experience.
					</p>

					<h2>8. Changes to Privacy Policy</h2>
					<p>
						We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
						the new Privacy Policy on this page.
					</p>

					<h2>9. Contact Us</h2>
					<p>
						If you have questions about this Privacy Policy, please contact us at privacy@ndasaas.com
					</p>
				</div>
			</div>
		</div>
	);
}
