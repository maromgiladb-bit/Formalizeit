"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
	initial: { opacity: 0, y: 24 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
	initial: {},
	animate: { transition: { staggerChildren: 0.09 } },
};

const faqs = [
	{
		question: "What is FormalizeIt?",
		answer:
			"FormalizeIt is an NDA workflow tool that helps teams create, fill, send, and sign Non-Disclosure Agreements in minutes. Instead of starting from a blank document each time, you pick a trusted template, fill in the details that change, and send a secure link to the other party — all in one place.",
	},
	{
		question: "How does the recipient receive the NDA?",
		answer:
			"After you finalize the NDA, a secure review link is generated. You send it yourself via Gmail, Outlook, your email app, WhatsApp, or any channel you prefer. The recipient clicks the link, reviews the document, fills in their details if needed, and signs — no account required on their end.",
	},
	{
		question: "Does the recipient need to create an account?",
		answer:
			"No. The recipient gets a secure, unique link that lets them review, fill, and sign the NDA directly in their browser. Nothing to install, no account, no friction.",
	},
	{
		question: "How long is the review link valid?",
		answer:
			"Review and signature links are valid for 30 days from the time they are generated. If the link expires before the recipient signs, you can resend from your dashboard.",
	},
	{
		question: "What happens after both parties sign?",
		answer:
			"Once both parties have signed, a final PDF of the executed NDA is generated. Both parties receive a copy. The document is also stored securely in your dashboard for your records.",
	},
	{
		question: "Do I need to start from scratch every time?",
		answer:
			"No — that is the whole point. FormalizeIt keeps a consistent template so you only fill in what changes: company names, dates, the confidentiality period, and any deal-specific terms. The standard language stays untouched.",
	},
	{
		question: "What fields can I customize?",
		answer:
			"On the standard Mutual NDA template, you can customize: party names and addresses, signatory names and titles, the effective date, NDA duration, confidentiality period, governing law, IP ownership, non-solicitation, and exclusivity clauses. You can also add additional terms in a free-text field.",
	},
	{
		question: "Can multiple people review the same document?",
		answer:
			"Yes, if your plan includes team collaboration. You can add team members to your company workspace and assign them roles — they can draft, review, and comment on documents together.",
	},
	{
		question: "What are the team roles?",
		answer:
			"There are three roles: Owner (manages the workspace, billing, and members), Signer (can create, send, sign, and finalize NDAs), and Contributor (can create and send NDA drafts, but cannot sign). Owners can also be granted signing authority via a toggle in team settings.",
	},
	{
		question: "How do I invite team members?",
		answer:
			"Go to Settings → Team. Enter the person's email address and select their role. They will receive an invitation email with a link to join your workspace.",
	},
	{
		question: "Is my information secure?",
		answer:
			"Yes. Documents are stored encrypted on AWS S3. All data is transmitted over HTTPS. Authentication is handled by Clerk. We do not read or share your NDA content. See our Privacy Policy for full details.",
	},
	{
		question: "Is FormalizeIt a law firm?",
		answer:
			"No. FormalizeIt is a document workflow tool. It streamlines NDA creation and review but does not provide legal advice. For unusual, high-stakes, or highly negotiated situations, consult a qualified attorney.",
	},
	{
		question: "Can I use FormalizeIt for any legal document?",
		answer:
			"FormalizeIt is purpose-built for NDA workflows. It is not designed for general-purpose legal drafting. If you need to handle other contract types, contact us — we may be adding support for additional templates.",
	},
	{
		question: "What is included in the free plan?",
		answer:
			"The free plan lets you create up to 3 NDAs total, with 1 team member and access to basic templates. E-signature support and email delivery are included. Documents are stored for 7 days.",
	},
	{
		question: "What happens after I upgrade?",
		answer:
			"Your workspace immediately gets access to the features included in your new plan — more NDAs per quarter, more team members, all professional templates, advanced tracking, and longer document storage. Billing is handled by Stripe and you can cancel anytime from Settings → Billing.",
	},
	{
		question: "Can I cancel later?",
		answer:
			"Yes. Cancel anytime from Settings → Billing. Your plan stays active until the end of the current billing period and you won't be charged again.",
	},
	{
		question: "Who should use FormalizeIt?",
		answer:
			"FormalizeIt is built for founders, operators, legal ops teams, and anyone who sends NDAs repeatedly and wants a faster, cleaner process. If you send more than a handful of NDAs a year and are tired of copy-pasting Word documents, this is for you.",
	},
];

export default function FAQPage() {
	return (
		<div className="min-h-screen bg-white font-sans">

			{/* Hero */}
			<section className="border-b border-gray-100">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
					<motion.div
						className="text-center max-w-2xl mx-auto"
						initial="initial"
						animate="animate"
						variants={stagger}
					>
						<motion.p variants={fadeUp} className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
							Support
						</motion.p>
						<motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
							Frequently Asked Questions
						</motion.h1>
						<motion.p variants={fadeUp} className="text-base text-gray-500 leading-relaxed">
							Everything you need to know about FormalizeIt and how it helps you work with NDAs faster.
						</motion.p>
					</motion.div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="bg-white py-16">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial="initial"
						whileInView="animate"
						viewport={{ once: true, margin: "-60px" }}
						variants={stagger}
					>
						<Accordion type="single" collapsible className="space-y-3">
							{faqs.map((faq, index) => (
								<motion.div key={index} variants={fadeUp}>
									<AccordionItem
										value={`item-${index}`}
										className="bg-white rounded-xl border border-gray-200 px-6 hover:border-teal-300 transition-colors duration-200 data-[state=open]:border-teal-300"
									>
										<AccordionTrigger className="text-gray-900 text-sm font-bold hover:no-underline py-5">
											{faq.question}
										</AccordionTrigger>
										<AccordionContent className="text-sm text-gray-500 leading-relaxed pb-5">
											{faq.answer}
										</AccordionContent>
									</AccordionItem>
								</motion.div>
							))}
						</Accordion>
					</motion.div>
				</div>
			</section>

			{/* CTA Strip */}
			<section className="border-t border-gray-100 bg-gray-50 py-10">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
						initial="initial"
						whileInView="animate"
						viewport={{ once: true, margin: "-60px" }}
						variants={fadeUp}
					>
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
								<MessageCircle className="w-5 h-5 text-teal-700" />
							</div>
							<div>
								<h2 className="text-lg font-bold text-gray-900">Still have questions?</h2>
								<p className="text-sm text-gray-500">Our support team is here to help.</p>
							</div>
						</div>
						<Link
							href="/contact"
							className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer"
						>
							Contact Support
							<ArrowRight className="w-4 h-4" />
						</Link>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
