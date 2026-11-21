"use client";

import { Mail, MessageSquare, Book, HelpCircle } from "lucide-react";
import Link from "next/link";
import PageHero from "@/components/ui/page-hero";

export default function SupportPage() {
	return (
		<div className="min-h-screen bg-white">
			<PageHero
				icon={HelpCircle}
				title="Support Center"
				subtitle="We're here to help you succeed with your NDAs"
			/>

			{/* Support Options */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
					{/* Email Support */}
					<Link
						href="/contact"
						className="bg-white rounded-sheet border border-line p-8 hover:border-teal-700 transition-colors"
					>
						<div className="w-12 h-12 bg-ground border border-line rounded-control flex items-center justify-center mb-4">
							<Mail className="w-6 h-6 text-teal-800" aria-hidden="true" />
						</div>
						<h3 className="font-display text-xl font-semibold tracking-tight text-ink mb-2">
							Email Support
						</h3>
						<p className="text-muted-ink mb-4">
							Send us an email and we'll respond within 24 hours
						</p>
						<span className="text-teal-800 font-semibold hover:text-teal-700">
							Contact us
						</span>
					</Link>

					{/* FAQ */}
					<Link
						href="/faq"
						className="bg-white rounded-sheet border border-line p-8 hover:border-teal-700 transition-colors"
					>
						<div className="w-12 h-12 bg-ground border border-line rounded-control flex items-center justify-center mb-4">
							<MessageSquare className="w-6 h-6 text-teal-800" aria-hidden="true" />
						</div>
						<h3 className="font-display text-xl font-semibold tracking-tight text-ink mb-2">
							FAQ
						</h3>
						<p className="text-muted-ink mb-4">
							Find quick answers to common questions
						</p>
						<span className="text-teal-800 font-semibold hover:text-teal-700">
							Browse the FAQ
						</span>
					</Link>

					{/* Documentation */}
					<Link
						href="/help"
						className="bg-white rounded-sheet border border-line p-8 hover:border-teal-700 transition-colors"
					>
						<div className="w-12 h-12 bg-ground border border-line rounded-control flex items-center justify-center mb-4">
							<Book className="w-6 h-6 text-teal-800" aria-hidden="true" />
						</div>
						<h3 className="font-display text-xl font-semibold tracking-tight text-ink mb-2">
							Documentation
						</h3>
						<p className="text-muted-ink mb-4">
							Learn more about NDAs and best practices
						</p>
						<span className="text-teal-800 font-semibold hover:text-teal-700">
							Learn more
						</span>
					</Link>
				</div>

				{/* Additional Help */}
				<div className="mt-16 bg-white rounded-sheet border border-line shadow-sheet p-8">
					<h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-6">
						Getting Started
					</h2>
					<div className="space-y-4">
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-ground border border-line rounded-control flex items-center justify-center text-teal-800 font-doc-mono text-sm">
								1
							</div>
							<div>
								<h3 className="font-semibold text-ink mb-1">Create an Account</h3>
								<p className="text-muted-ink text-sm">
									Sign up for free — everything is included while we're in beta
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-ground border border-line rounded-control flex items-center justify-center text-teal-800 font-doc-mono text-sm">
								2
							</div>
							<div>
								<h3 className="font-semibold text-ink mb-1">Choose a Template</h3>
								<p className="text-muted-ink text-sm">
									Browse our library of professional NDA templates
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-ground border border-line rounded-control flex items-center justify-center text-teal-800 font-doc-mono text-sm">
								3
							</div>
							<div>
								<h3 className="font-semibold text-ink mb-1">Customize & Send</h3>
								<p className="text-muted-ink text-sm">
									Fill in the details, customize if needed, and send for signature
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
