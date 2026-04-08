"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
	BookOpen,
	FileText,
	Users,
	Download,
	CreditCard,
	Scale,
	MessageCircle,
	ChevronRight,
	ArrowRight,
} from "lucide-react";

const fadeUp = {
	initial: { opacity: 0, y: 24 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
	initial: {},
	animate: { transition: { staggerChildren: 0.09 } },
};

interface ContentBlock {
	heading: string | null;
	body: string;
	list?: string[];
	listNote?: string;
}

interface Section {
	id: string;
	icon: typeof BookOpen;
	title: string;
	content: ContentBlock[];
}

const sections: Section[] = [
	{
		id: "getting-started",
		icon: BookOpen,
		title: "Getting started",
		content: [
			{
				heading: null,
				body: "FormalizeIt is built to make NDA creation and review more efficient. Instead of rewriting the same agreement over and over, you begin with a structured template and update only the practical details that are specific to the deal.",
			},
		],
	},
	{
		id: "create-document",
		icon: FileText,
		title: "How to create a document",
		content: [
			{
				heading: null,
				body: "Start by creating a new document and selecting the relevant NDA template. Once the template is loaded, fill in the required fields such as the party names, effective date, and any business-specific terms that need to be updated.",
			},
		],
	},
	{
		id: "choose-template",
		icon: BookOpen,
		title: "How to choose the right template",
		content: [
			{
				heading: null,
				body: "Choose the template that best matches your use case. In most cases, the goal is to begin with a familiar format so the review stays focused on the few terms that actually change.",
			},
		],
	},
	{
		id: "editing",
		icon: FileText,
		title: "How editing works",
		content: [
			{
				heading: null,
				body: "FormalizeIt is designed so you do not need to rebuild the document each time. You review the existing structure and update only the key information. This saves time and reduces repetitive review work.",
			},
		],
	},
	{
		id: "review",
		icon: Users,
		title: "How review works",
		content: [
			{
				heading: null,
				body: "When you and your partners review a document in FormalizeIt, the main benefit is consistency. Because the underlying template is already known, reviewers can focus on meaningful changes instead of reading a completely reformatted NDA from beginning to end.",
			},
		],
	},
	{
		id: "what-changes",
		icon: FileText,
		title: "What kinds of details usually change",
		content: [
			{
				heading: null,
				body: "In many NDA workflows, only a small number of practical terms change from one document to another.",
				list: [
					"Party names",
					"Dates",
					"Confidentiality period",
					"Signature details",
					"Other specific business terms",
				],
				listNote: "Everything else often stays close to the same standard structure.",
			},
		],
	},
	{
		id: "saves-time",
		icon: BookOpen,
		title: "Why this saves time",
		content: [
			{
				heading: null,
				body: "Most NDA negotiations do not require a totally new agreement. FormalizeIt saves time by reducing repetition. Instead of rechecking standard language every time, you and your collaborators can review only the parts that truly matter.",
			},
		],
	},
	{
		id: "export",
		icon: Download,
		title: "How to export or share a document",
		content: [
			{
				heading: null,
				body: "If your workspace supports export or sharing features, you can use them after completing your review. Available export and collaboration options may depend on your plan.",
			},
		],
	},
	{
		id: "billing",
		icon: CreditCard,
		title: "Billing and access",
		content: [
			{
				heading: null,
				body: "If you upgrade your plan, your workspace gains access to the paid features included with that plan. Billing details, plan changes, and subscription information can be managed through your billing settings once payments are enabled.",
			},
		],
	},
	{
		id: "legal",
		icon: Scale,
		title: "When to get legal advice",
		content: [
			{
				heading: null,
				body: "FormalizeIt is useful for streamlining standard NDA workflows, but it is not a substitute for legal advice. If your deal is unusual, highly negotiated, cross-border, or high-stakes, it may still make sense to involve legal counsel.",
			},
		],
	},
];

const tableOfContents = [
	{ id: "getting-started", label: "Getting started" },
	{ id: "create-document", label: "How to create a document" },
	{ id: "choose-template", label: "How to choose the right template" },
	{ id: "editing", label: "How editing works" },
	{ id: "review", label: "How review works" },
	{ id: "what-changes", label: "What kinds of details usually change" },
	{ id: "saves-time", label: "Why this saves time" },
	{ id: "export", label: "How to export or share a document" },
	{ id: "billing", label: "Billing and access" },
	{ id: "legal", label: "When to get legal advice" },
];

export default function HelpPage() {
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
							Help Center
						</motion.p>
						<motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
							Need help using FormalizeIt?
						</motion.h1>
						<motion.p variants={fadeUp} className="text-base text-gray-500 leading-relaxed">
							Learn how to create documents, update key terms, review changes efficiently, and get the most out of your workflow.
						</motion.p>
					</motion.div>
				</div>
			</section>

			{/* Main Content */}
			<section className="bg-white py-12">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col lg:flex-row gap-10">

						{/* Sidebar Table of Contents */}
						<aside className="lg:w-56 shrink-0">
							<div className="sticky top-24">
								<p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-4 px-3">
									Topics
								</p>
								<nav className="space-y-0.5">
									{tableOfContents.map((item) => (
										<a
											key={item.id}
											href={`#${item.id}`}
											className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-teal-800 hover:bg-teal-50 transition-colors duration-150 group"
										>
											<ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-teal-500 transition-colors" />
											{item.label}
										</a>
									))}
								</nav>
							</div>
						</aside>

						{/* Article Content */}
						<main className="flex-1 min-w-0">
							<motion.div
								className="space-y-6"
								initial="initial"
								whileInView="animate"
								viewport={{ once: true, margin: "-60px" }}
								variants={stagger}
							>
								{sections.map((section) => {
									const Icon = section.icon;
									return (
										<motion.article
											key={section.id}
											id={section.id}
											variants={fadeUp}
											className="group bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 p-6 sm:p-8 scroll-mt-24"
										>
											<div className="flex items-center gap-3 mb-4">
												<div className="w-9 h-9 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200">
													<Icon className="w-5 h-5 text-teal-700" />
												</div>
												<h2 className="text-sm font-bold text-gray-900">
													{section.title}
												</h2>
											</div>
											{section.content.map((block, i) => (
												<div key={i}>
													{block.heading && (
														<h3 className="text-sm font-semibold text-gray-900 mb-2">
															{block.heading}
														</h3>
													)}
													<p className="text-sm text-gray-500 leading-relaxed">{block.body}</p>
													{block.list && (
														<ul className="mt-3 space-y-1.5">
															{block.list.map((item) => (
																<li key={item} className="flex items-start gap-2 text-sm text-gray-500">
																	<span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
																	{item}
																</li>
															))}
														</ul>
													)}
													{block.listNote && (
														<p className="mt-3 text-sm text-gray-500 leading-relaxed">{block.listNote}</p>
													)}
												</div>
											))}
										</motion.article>
									);
								})}

								{/* Need More Help */}
								<motion.article
									variants={fadeUp}
									className="group bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 p-6 sm:p-8"
								>
									<div className="flex items-center gap-3 mb-4">
										<div className="w-9 h-9 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200">
											<MessageCircle className="w-5 h-5 text-teal-700" />
										</div>
										<h2 className="text-sm font-bold text-gray-900">Need more help?</h2>
									</div>
									<p className="text-sm text-gray-500 leading-relaxed mb-4">
										If you cannot find the answer you need, contact support and include:
									</p>
									<ul className="space-y-1.5 mb-5">
										{[
											"What you were trying to do",
											"What happened",
											"Any error message you saw",
											"The document or page involved",
										].map((item) => (
											<li key={item} className="flex items-start gap-2 text-sm text-gray-500">
												<span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
												{item}
											</li>
										))}
									</ul>
									<p className="text-xs text-gray-400 mb-5">
										This helps us resolve issues faster.
									</p>
									<div className="flex flex-col sm:flex-row gap-3">
										<Link
											href="/contact"
											className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer"
										>
											Contact Support
											<ArrowRight className="w-4 h-4" />
										</Link>
										<Link
											href="/faq"
											className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm cursor-pointer"
										>
											Browse FAQ
										</Link>
									</div>
								</motion.article>
							</motion.div>
						</main>
					</div>
				</div>
			</section>
		</div>
	);
}
