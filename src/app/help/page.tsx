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
				body: "FormalizeIt is an NDA workflow tool built around one standard mutual NDA. The legal text is fixed — you only fill in the details that change for each deal, then send a secure link to the other party. The whole process takes about 5 minutes.",
			},
			{
				heading: "Quick start",
				body: "Here is the fastest path to a sent NDA:",
				list: [
					"Go to Dashboard → New NDA",
					"Name the document, then fill in your company details (Party A) and the other party's details (Party B)",
					"Choose the deal terms in Clauses — purpose, duration, governing law, optional clauses",
					"Check the live preview in Review, then click Send NDA and enter the recipient's email",
					"Pick Gmail, Outlook, or your email app — the message is pre-written, you just hit send",
				],
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
				body: "From your dashboard, click New NDA. You will be taken to the NDA form. It has five steps:",
				list: [
					"Document: a name for this NDA and the effective date",
					"Party A: your company name, address, signatory name, title, and contact details",
					"Party B: the other party's details. Fill them in yourself or check 'Ask receiver to fill' to have them complete their own details",
					"Clauses: purpose of the NDA, term, governing law, and the optional IP ownership, non-solicitation, exclusivity, and additional-terms clauses",
					"Review: a live preview of the full NDA. Check everything, then click Send NDA",
				],
				listNote: "Your draft is saved automatically as you work. If you leave and come back, it will be under Drafts on your dashboard.",
			},
		],
	},
	{
		id: "standard-nda",
		icon: BookOpen,
		title: "About the standard NDA",
		content: [
			{
				heading: null,
				body: "Every NDA sent through FormalizeIt uses the same mutual NDA. It protects both parties equally — both sides agree to keep the other's information confidential — and its legal text is identical in every transaction, so the other party only needs to review the deal-specific details.",
			},
			{
				heading: "Read it once",
				body: "You can read the full text at any time on the Standard NDA page, see how it is maintained on the NDA Governance page, and track any wording changes in the NDA Changelog.",
			},
		],
	},
	{
		id: "sending",
		icon: FileText,
		title: "How to send the NDA",
		content: [
			{
				heading: null,
				body: "After completing the form, click Send NDA and enter the recipient's email. A unique, secure link is created and the email is pre-written for you. You send it from your own inbox — that way it arrives from someone the recipient knows, not from an unfamiliar address that could land in spam:",
				list: [
					"Gmail — opens a pre-filled compose window in Gmail",
					"Outlook — opens a pre-filled compose window in Outlook Web",
					"Email App — opens your default mail client via mailto",
					"WhatsApp or Telegram — sends the link as a message",
					"Copy Link — copies the link so you can paste it anywhere",
				],
				listNote: "The link stays active while the NDA is in progress and expires after 2 weeks of inactivity. The recipient does not need an account to open it. If it sits unsigned, FormalizeIt sends the recipient a reminder after 48 hours and again after 5 days.",
			},
		],
	},
	{
		id: "review",
		icon: Users,
		title: "How the recipient reviews the NDA",
		content: [
			{
				heading: null,
				body: "When the recipient opens the link, they see a read-only preview of the NDA along with any fields they need to fill in. They can:",
				list: [
					"Review all terms before filling anything in",
					"Complete their company details if you asked them to fill those in",
					"Suggest changes to any field (you will be notified and can accept or reject)",
					"Proceed to sign once they are satisfied with the terms",
				],
				listNote: "Once both parties have signed, both receive a copy of the executed PDF by email.",
			},
		],
	},
	{
		id: "team",
		icon: Users,
		title: "Team members and roles",
		content: [
			{
				heading: "Adding team members",
				body: "Go to My account → Team. Enter the person's email and assign a role. They will receive an invitation to join your workspace.",
			},
			{
				heading: "Roles explained",
				body: "There are three roles:",
				list: [
					"Administrator — manages the workspace, billing, and team members. Can be granted signing authority via a toggle in team settings",
					"Signer — can create, send, and sign NDAs on behalf of the company",
					"Contributor — can create, edit, and send NDAs, but cannot sign on behalf of the company",
				],
				listNote: "Only Signers (and Administrators with the signer toggle enabled) can sign NDAs on behalf of the company. Everything else is open to every role.",
			},
		],
	},
	{
		id: "what-changes",
		icon: FileText,
		title: "What fields are in the NDA",
		content: [
			{
				heading: null,
				body: "The standard NDA has fixed legal text. These are the only fields you fill in:",
				list: [
					"Party A and Party B: name, address, phone, signatory name, title, email",
					"Effective date and NDA duration (in months)",
					"Confidentiality period",
					"Purpose of the NDA",
					"Governing law",
					"IP ownership, non-solicitation, and exclusivity clauses",
					"Additional terms (free text)",
				],
				listNote: "Fields marked with an asterisk (*) are required before the NDA can be sent.",
			},
		],
	},
	{
		id: "export",
		icon: Download,
		title: "How to download or export a signed NDA",
		content: [
			{
				heading: null,
				body: "Once both parties have signed, a final PDF is generated automatically. You can download it from:",
				list: [
					"Your dashboard — click on the NDA, then Download PDF",
					"The confirmation email sent after signing — it contains a direct download link",
				],
				listNote: "Signed NDAs are kept for at least 5 years from execution on every plan, including Free. You will be notified in advance before anything is deleted.",
			},
		],
	},
	{
		id: "billing",
		icon: CreditCard,
		title: "Billing and plans",
		content: [
			{
				heading: null,
				body: "Billing is managed from My account → Subscription. You can see your current plan, usage, and upgrade or cancel from there.",
			},
			{
				heading: "Plans",
				body: "FormalizeIt offers three plans:",
				list: [
					"Free — up to 3 NDAs total, 1 user, 5-year document storage. Receiving and signing NDAs is always free.",
					"Pro ($9/month or $7.65/month billed annually) — unlimited NDAs for a single user, search, full audit trail",
					"Team ($50/month or $42.50/month billed annually) — everything in Pro for up to 10 users, shared workspace, centralized repository, role-based permissions",
					
				],
				listNote: "You can cancel a paid plan at any time. Your plan stays active until the end of the billing period.",
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
				body: "FormalizeIt is a workflow tool, not a law firm. The templates are designed to handle standard, recurring NDA use cases efficiently.",
			},
			{
				heading: "Consider involving a lawyer if",
				body: "Your situation involves any of the following:",
				list: [
					"High-value transactions or sensitive IP",
					"Cross-border agreements with complex jurisdiction requirements",
					"Heavily negotiated terms that differ significantly from the template",
					"NDAs that will be used as part of a larger legal framework (M&A, fundraising, etc.)",
				],
				listNote: "For typical business NDAs — partnerships, hiring, vendor agreements — FormalizeIt is designed to handle the process end-to-end.",
			},
		],
	},
];

const tableOfContents = [
	{ id: "getting-started", label: "Getting started" },
	{ id: "create-document", label: "How to create a document" },
	{ id: "choose-template", label: "Choosing a template" },
	{ id: "sending", label: "How to send the NDA" },
	{ id: "review", label: "How the recipient reviews" },
	{ id: "team", label: "Team members and roles" },
	{ id: "what-changes", label: "Fields in the NDA" },
	{ id: "export", label: "Downloading a signed NDA" },
	{ id: "billing", label: "Billing and plans" },
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
						<motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-ink leading-tight tracking-tight mb-4">
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
											className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-float transition-shadow duration-200 p-6 sm:p-8 scroll-mt-24"
										>
											<div className="flex items-center gap-3 mb-4">
												<div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200">
													<Icon className="w-5 h-5 text-teal-700" />
												</div>
												<h2 className="text-sm font-bold text-ink">
													{section.title}
												</h2>
											</div>
											{section.content.map((block, i) => (
												<div key={i}>
													{block.heading && (
														<h3 className="text-sm font-semibold text-ink mb-2">
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
									className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-float transition-shadow duration-200 p-6 sm:p-8"
								>
									<div className="flex items-center gap-3 mb-4">
										<div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200">
											<MessageCircle className="w-5 h-5 text-teal-700" />
										</div>
										<h2 className="text-sm font-bold text-ink">Need more help?</h2>
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
											className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors duration-200 text-sm cursor-pointer"
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
