import { HelpCircle, MessageCircle } from "lucide-react";
import PageHero from "@/components/ui/page-hero";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

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
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={HelpCircle}
				title="Frequently Asked Questions"
				subtitle="Everything you need to know about FormalizeIt and how it helps you work with NDAs faster."
			/>

			{/* FAQ Section */}
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<Accordion type="single" collapsible className="bg-white rounded-xl shadow-sm border border-gray-200 px-6">
					{faqs.map((faq, index) => (
						<AccordionItem key={index} value={`item-${index}`}>
							<AccordionTrigger className="text-gray-900 text-base">
								{faq.question}
							</AccordionTrigger>
							<AccordionContent className="text-gray-600 leading-relaxed">
								{faq.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>

				{/* Contact Section */}
				<div className="mt-16 text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
					<MessageCircle className="w-10 h-10 mx-auto mb-4 text-teal-500" />
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Still have questions?
					</h2>
					<p className="text-gray-600 mb-6">
						Can't find the answer you're looking for? Our support team is here to help.
					</p>
					<a
						href="/contact"
						className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
					>
						Contact Support
					</a>
				</div>
			</div>
		</div>
	);
}
