import Link from "next/link";
import PageHero from "@/components/ui/page-hero";
import { BookOpen, FileText, Users, Download, CreditCard, Scale, MessageCircle, ChevronRight } from "lucide-react";

const sections = [
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
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={BookOpen}
				title="Need help using FormalizeIt?"
				subtitle="Learn how to create documents, update key terms, review changes efficiently, and get the most out of your workflow."
			/>

			{/* Main Content */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="flex flex-col lg:flex-row gap-12">

					{/* Sidebar Table of Contents */}
					<aside className="lg:w-64 shrink-0">
						<div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
							<p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
								Help Center
							</p>
							<nav className="space-y-0.5">
								{tableOfContents.map((item) => (
									<a
										key={item.id}
										href={`#${item.id}`}
										className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition-colors group"
									>
										<ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-teal-400 transition-colors" />
										{item.label}
									</a>
								))}
							</nav>
						</div>
					</aside>

					{/* Article Content */}
					<main className="flex-1 min-w-0">
						<div className="space-y-10">
							{sections.map((section) => {
								const Icon = section.icon;
								return (
									<article
										key={section.id}
										id={section.id}
										className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 scroll-mt-24"
									>
										<div className="flex items-center gap-3 mb-5">
											<div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
												<Icon className="w-5 h-5 text-teal-600" />
											</div>
											<h2 className="text-xl font-bold text-gray-900">
												{section.title}
											</h2>
										</div>
										{section.content.map((block, i) => (
											<div key={i}>
												{block.heading && (
													<h3 className="text-base font-semibold text-gray-800 mb-2">
														{block.heading}
													</h3>
												)}
												<p className="text-gray-600 leading-relaxed">{block.body}</p>
												{block.list && (
													<ul className="mt-4 space-y-2">
														{block.list.map((item) => (
															<li key={item} className="flex items-start gap-2 text-gray-600">
																<span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
																{item}
															</li>
														))}
													</ul>
												)}
												{block.listNote && (
													<p className="mt-4 text-gray-600 leading-relaxed">{block.listNote}</p>
												)}
											</div>
										))}
									</article>
								);
							})}

							{/* Need More Help */}
							<article className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
								<div className="flex items-center gap-3 mb-5">
									<div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
										<MessageCircle className="w-5 h-5 text-teal-600" />
									</div>
									<h2 className="text-xl font-bold text-gray-900">Need more help?</h2>
								</div>
								<p className="text-gray-600 leading-relaxed mb-4">
									If you cannot find the answer you need, contact support and include:
								</p>
								<ul className="space-y-2 mb-6">
									{[
										"What you were trying to do",
										"What happened",
										"Any error message you saw",
										"The document or page involved",
									].map((item) => (
										<li key={item} className="flex items-start gap-2 text-gray-600">
											<span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
											{item}
										</li>
									))}
								</ul>
								<p className="text-sm text-gray-500 mb-6">
									This helps us resolve issues faster.
								</p>
								<div className="flex flex-col sm:flex-row gap-3">
									<Link
										href="/contact"
										className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
									>
										Contact Support
									</Link>
									<Link
										href="/faq"
										className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
									>
										Browse FAQ
									</Link>
								</div>
							</article>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
