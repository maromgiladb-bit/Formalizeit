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

import { faqs } from "./faq-data";

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
						<motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-ink leading-tight tracking-tight mb-4">
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
										className="bg-white rounded-2xl border border-gray-200 px-6 data-[state=open]:border-teal-600 transition-colors duration-200"
									>
										<AccordionTrigger className="text-ink text-sm font-semibold hover:no-underline py-5">
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
								<h2 className="text-lg font-bold text-ink">Still have questions?</h2>
								<p className="text-sm text-gray-500">Our support team is here to help.</p>
							</div>
						</div>
						<Link
							href="/contact"
							className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors duration-200 text-sm cursor-pointer"
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
