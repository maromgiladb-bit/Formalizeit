"use client";

import { CheckCircle } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function CompliancePage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={CheckCircle}
				title="Compliance"
				subtitle="Meeting industry standards and regulations"
			/>

			{/* Content */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 prose prose-gray max-w-none">
					<h2>GDPR Compliance</h2>
					<p>
						We are fully compliant with the General Data Protection Regulation (GDPR). We ensure that your 
						personal data is processed lawfully, fairly, and transparently, and we respect your rights under GDPR.
					</p>

					<h2>Data Protection</h2>
					<p>
						We implement appropriate technical and organizational measures to ensure a level of security 
						appropriate to the risk, including encryption, access controls, and regular security assessments.
					</p>

					<h2>SOC 2 Compliance</h2>
					<p>
						We maintain SOC 2 Type II compliance, demonstrating our commitment to security, availability, 
						processing integrity, confidentiality, and privacy.
					</p>

					<h2>ISO Standards</h2>
					<p>
						Our processes follow ISO 27001 standards for information security management systems, ensuring 
						the highest level of data protection.
					</p>

					<h2>Data Residency</h2>
					<p>
						We offer data residency options to comply with local data protection laws. Your data can be 
						stored in your preferred geographic location.
					</p>

					<h2>Audit Trail</h2>
					<p>
						We maintain comprehensive audit trails of all system activities, providing full transparency 
						and accountability for compliance purposes.
					</p>

					<h2>Regular Assessments</h2>
					<p>
						We conduct regular compliance assessments and third-party audits to ensure we continue to meet 
						all regulatory requirements.
					</p>

					<h2>Contact</h2>
					<p>
						For compliance-related inquiries, please contact compliance@ndasaas.com
					</p>
				</div>
			</div>
		</div>
	);
}
