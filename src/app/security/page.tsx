"use client";

import { Lock, Server, Key, FileCheck } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function SecurityPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Lock}
				title="Security"
				subtitle="Your data security is our top priority"
			/>

			{/* Security Features */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid md:grid-cols-2 gap-8 mb-16">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
						<div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
							<Key className="w-6 h-6 text-teal-600" />
						</div>
						<h3 className="text-xl font-bold text-gray-900 mb-4">
							End-to-End Encryption
						</h3>
						<p className="text-gray-600">
							All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. 
							Your documents are protected at every step.
						</p>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
						<div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
							<Server className="w-6 h-6 text-teal-600" />
						</div>
						<h3 className="text-xl font-bold text-gray-900 mb-4">
							Secure Infrastructure
						</h3>
						<p className="text-gray-600">
							Our infrastructure is hosted on enterprise-grade cloud providers with 99.9% uptime SLA 
							and regular security audits.
						</p>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
						<div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
							<FileCheck className="w-6 h-6 text-teal-600" />
						</div>
						<h3 className="text-xl font-bold text-gray-900 mb-4">
							Regular Backups
						</h3>
						<p className="text-gray-600">
							Automated daily backups with point-in-time recovery ensure your data is never lost. 
							Backups are encrypted and stored in multiple locations.
						</p>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
						<div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
							<Lock className="w-6 h-6 text-teal-600" />
						</div>
						<h3 className="text-xl font-bold text-gray-900 mb-4">
							Access Control
						</h3>
						<p className="text-gray-600">
							Multi-factor authentication and role-based access control ensure only authorized users 
							can access your sensitive documents.
						</p>
					</div>
				</div>

				{/* Security Practices */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">
						Our Security Practices
					</h2>
					<div className="space-y-4 text-gray-600">
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-600 text-sm">✓</span>
							</div>
							<p>Regular security assessments and penetration testing by third-party experts</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-600 text-sm">✓</span>
							</div>
							<p>Continuous monitoring for security threats and suspicious activity</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-600 text-sm">✓</span>
							</div>
							<p>Regular software updates and security patches</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-600 text-sm">✓</span>
							</div>
							<p>Employee security training and background checks</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-600 text-sm">✓</span>
							</div>
							<p>Incident response plan with 24/7 monitoring</p>
						</div>
					</div>
				</div>

				{/* Contact */}
				<div className="mt-16 text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Report a Security Issue
					</h2>
					<p className="text-gray-600 mb-6">
						If you discover a security vulnerability, please report it to us immediately.
					</p>
					<a
						href="mailto:security@ndasaas.com"
						className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
					>
						Report Issue
					</a>
				</div>
			</div>
		</div>
	);
}
