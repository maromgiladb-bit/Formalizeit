export interface Faq {
	question: string;
	answer: string;
}

export const faqs: Faq[] = [
	{
		question: "What is FormalizeIt?",
		answer:
			"FormalizeIt is an NDA workflow tool that helps teams create, fill, send, and sign Non-Disclosure Agreements in minutes. Instead of starting from a blank document each time, you use one standard mutual NDA with fixed legal text, fill in the details that change, and send a secure link to the other party — all in one place.",
	},
	{
		question: "How does the recipient receive the NDA?",
		answer:
			"After you finalize the NDA, a secure review link is generated and the email is pre-written for you. You send it from your own inbox — Gmail, Outlook, your email app, WhatsApp, or any channel you prefer — so it arrives from someone the recipient knows rather than an unfamiliar address. The recipient clicks the link, reviews the document, fills in their details if needed, and signs — no account required on their end. If it sits unsigned, FormalizeIt reminds them after 48 hours and again after 5 days.",
	},
	{
		question: "Does the recipient need to create an account?",
		answer:
			"No. The recipient gets a secure, unique link that lets them review, fill, and sign the NDA directly in their browser. Nothing to install, no account, no friction.",
	},
	{
		question: "How long is the review link valid?",
		answer:
			"Review and signature links stay active while the NDA is in progress and expire after 2 weeks of inactivity — any action (opening, filling, signing) resets the clock. If a link lapses before the recipient signs, you can resend from your dashboard.",
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
			"The legal text of the standard NDA is fixed. You fill in: party names and addresses, signatory names and titles, the effective date, NDA duration, confidentiality period, governing law, IP ownership, non-solicitation, and exclusivity clauses. You can also add additional terms in a free-text field.",
	},
	{
		question: "Can multiple people review the same document?",
		answer:
			"Yes, if your plan includes team collaboration. You can add team members to your company workspace and assign them roles — they can draft, review, and comment on documents together.",
	},
	{
		question: "What are the team roles?",
		answer:
			"There are three roles: Administrator (manages the workspace, billing, and members), Signer (can create, send, and sign NDAs on behalf of the company), and Contributor (can create, edit, and send NDAs — everything except signing for the company). Administrators can also be granted signing authority via a toggle in team settings.",
	},
	{
		question: "How do I invite team members?",
		answer:
			"Go to My account → Team. Enter the person's email address and select their role. They will receive an invitation email with a link to join your workspace.",
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
			"FormalizeIt is purpose-built for NDA workflows. It is not designed for general-purpose legal drafting. It centers on one standard mutual NDA so the other party always knows what they are signing. If you need other contract types, contact us and tell us what you would use.",
	},
	{
		question: "What is included in the free plan?",
		answer:
			"The free plan lets you create up to 3 NDAs total as a single user. You can send, review, and e-sign NDAs, and receiving and signing an NDA is always free with no account needed. Signed documents are stored for 5 years.",
	},
	{
		question: "What happens after I upgrade?",
		answer:
			"Your workspace immediately gets access to the features included in your new plan — Pro unlocks unlimited NDAs, search, and a full audit trail for a single user; Team adds up to 10 users, a shared workspace, a centralized repository, and role-based permissions. Billing is handled by Stripe and you can cancel anytime from My account → Subscription.",
	},
	{
		question: "Can I cancel later?",
		answer:
			"Yes. Cancel anytime from My account → Subscription. Your plan stays active until the end of the current billing period and you won't be charged again.",
	},
	{
		question: "Who should use FormalizeIt?",
		answer:
			"FormalizeIt is built for founders, operators, legal ops teams, and anyone who sends NDAs repeatedly and wants a faster, cleaner process. If you send more than a handful of NDAs a year and are tired of copy-pasting Word documents, this is for you.",
	},
];
