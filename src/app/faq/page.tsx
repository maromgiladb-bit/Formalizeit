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
			"FormalizeIt helps you create and review NDAs faster by starting from a reliable template and focusing only on the practical details that usually change, like names, dates, parties, and confidentiality periods.",
	},
	{
		question: "Is FormalizeIt a law firm?",
		answer:
			"No. FormalizeIt is a document workflow tool. It helps streamline NDA drafting and review, but it does not provide legal advice.",
	},
	{
		question: "Does FormalizeIt replace a lawyer?",
		answer:
			"Not completely. It is designed to save time on standard NDA workflows, especially when most of the agreement stays the same. For unusual, high-risk, or highly negotiated situations, legal review may still be appropriate.",
	},
	{
		question: "Do I need to start from scratch every time?",
		answer:
			"No. That is one of the main benefits of FormalizeIt. Instead of recreating the whole document for each deal, you start from a known structure and update only the key terms that matter.",
	},
	{
		question: "What kinds of changes can I make?",
		answer:
			"You can update the practical parts of the NDA, such as party names, dates, confidentiality period, governing details, and other deal-specific terms depending on the template and workflow.",
	},
	{
		question: "Why is this faster than editing a document manually?",
		answer:
			"Because most NDAs do not need a completely different format every time. FormalizeIt keeps the template consistent so you and your partners only need to review the important changes, not the same repeated language again and again.",
	},
	{
		question: "Can multiple people review the same document?",
		answer:
			"If collaboration is enabled in your workspace, yes. FormalizeIt is designed to make review easier by keeping the structure familiar and making changes easier to spot.",
	},
	{
		question: "Can I see what changed?",
		answer:
			"Yes. FormalizeIt is built around a workflow where the important edits are easier to review, instead of forcing you to re-read an entire NDA each time.",
	},
	{
		question: "Can I export the document?",
		answer:
			"Depending on your plan and available features, you may be able to export your document in formats such as PDF or Word.",
	},
	{
		question: "Is my information secure?",
		answer:
			"FormalizeIt is designed to handle business documents responsibly and securely. For more detail, users should refer to the Privacy Policy and Terms.",
	},
	{
		question: "Can I use FormalizeIt for any legal document?",
		answer:
			"FormalizeIt is best used for the specific workflows and templates it supports. It is not meant to replace full legal drafting for every type of agreement.",
	},
	{
		question: "What happens after I pay?",
		answer:
			"After payment, your account or workspace features are upgraded according to your plan. This may include access to premium templates, exports, collaboration tools, or other paid functionality.",
	},
	{
		question: "Can I cancel later?",
		answer:
			"Billing and cancellation depend on your plan terms. You can find the exact rules on your billing page once payments are live.",
	},
	{
		question: "Who should use FormalizeIt?",
		answer:
			"FormalizeIt is useful for founders, operators, business teams, and anyone who deals with recurring NDA workflows and wants a faster, cleaner review process.",
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
