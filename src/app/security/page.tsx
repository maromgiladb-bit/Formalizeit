"use client";

import { Lock, Server, Key, FileCheck } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function SecurityPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Lock}
				title="Security"
				subtitle="How we protect your documents"
			/>

			{/* Security Features */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid md:grid-cols-2 gap-8 mb-16">
					<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
						<div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
							<Key className="w-6 h-6 text-teal-700" />
						</div>
						<h3 className="text-xl font-bold text-ink mb-4">
							Encryption
						</h3>
						<p className="text-gray-600">
							All data travels over HTTPS (TLS encryption in transit), and signed documents are
							encrypted at rest in private storage.
						</p>
					</div>

					<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
						<div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
							<Server className="w-6 h-6 text-teal-700" />
						</div>
						<h3 className="text-xl font-bold text-ink mb-4">
							EU-Based Infrastructure
						</h3>
						<p className="text-gray-600">
							Our application servers, database, and document storage run in the European Union
							(Frankfurt, Germany) on established cloud providers.
						</p>
					</div>

					<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
						<div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
							<FileCheck className="w-6 h-6 text-teal-700" />
						</div>
						<h3 className="text-xl font-bold text-ink mb-4">
							Document Integrity
						</h3>
						<p className="text-gray-600">
							Each executed NDA is fingerprinted with a SHA-256 hash and stored with the signer&apos;s
							email, timestamp, IP address, and the exact NDA version signed, so any later change to
							the document is detectable.
						</p>
					</div>

					<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
						<div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
							<Lock className="w-6 h-6 text-teal-700" />
						</div>
						<h3 className="text-xl font-bold text-ink mb-4">
							Access Control
						</h3>
						<p className="text-gray-600">
							Secure sign-in and role-based access control ensure only authorized users
							can access your documents. Only designated signers can sign on behalf of a company.
						</p>
					</div>
				</div>

				{/* Security Practices */}
				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
					<h2 className="text-2xl font-bold text-ink mb-6">
						Our Security Practices
					</h2>
					<div className="space-y-4 text-gray-600">
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-700 text-sm">✓</span>
							</div>
							<p>Documents are kept in private storage and shared only through short-lived download links</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-700 text-sm">✓</span>
							</div>
							<p>Signing and review links are random and unguessable, and expire after two weeks of inactivity</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-700 text-sm">✓</span>
							</div>
							<p>Signing authority is checked on our servers, not just in the interface</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-teal-700 text-sm">✓</span>
							</div>
							<p>Error monitoring is configured not to store IP addresses or record your sessions</p>
						</div>
					</div>
				</div>

				{/* Contact */}
				<div className="mt-16 text-center bg-white rounded-2xl shadow-card border border-gray-100 p-8">
					<h2 className="text-2xl font-bold text-ink mb-4">
						Report a Security Issue
					</h2>
					<p className="text-gray-600 mb-6">
						If you discover a security vulnerability, please report it to us immediately.
					</p>
					<a
						href="mailto:support@formalizeit.com?subject=Security%20issue"
						className="inline-block px-6 py-3 bg-teal-800 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
					>
						Report Issue
					</a>
				</div>
			</div>
		</div>
	);
}
