"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
		<div className="min-h-screen bg-white">

			{/* Hero */}
			<section className="border-b border-line bg-white">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
					<motion.div
						className="text-center max-w-2xl mx-auto"
						initial={false}
						animate="animate"
						variants={stagger}
					>
						<motion.h1 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight tracking-[-0.03em] mb-4">
							Frequently Asked Questions
						</motion.h1>
						<motion.p variants={fadeUp} className="text-base text-muted-ink leading-relaxed">
							Everything you need to know about FormalizeIt and how it helps you work with NDAs faster.
						</motion.p>
					</motion.div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="bg-ground py-16">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={false}
						whileInView="animate"
						viewport={{ once: true, margin: "-60px" }}
						variants={stagger}
					>
						<Accordion type="single" collapsible className="space-y-2">
							{faqs.map((faq, index) => (
								<motion.div key={index} variants={fadeUp}>
									<AccordionItem
										value={`item-${index}`}
										className="bg-white rounded-sheet border border-line px-5 data-[state=open]:border-teal-700 transition-colors duration-200"
									>
										<AccordionTrigger className="text-ink text-sm font-semibold hover:no-underline py-5">
											{faq.question}
										</AccordionTrigger>
										<AccordionContent className="text-sm text-muted-ink leading-relaxed pb-5">
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
			<section className="border-t border-line bg-white py-10">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
						initial={false}
						whileInView="animate"
						viewport={{ once: true, margin: "-60px" }}
						variants={fadeUp}
					>
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 bg-ground border border-line rounded-control flex items-center justify-center shrink-0">
								<MessageCircle className="w-5 h-5 text-teal-800" aria-hidden="true" />
							</div>
							<div>
								<h2 className="font-display text-lg font-semibold tracking-tight text-ink">Still have questions?</h2>
								<p className="text-sm text-muted-ink">Our support team is here to help.</p>
							</div>
						</div>
						<Button asChild shape="crisp" size="lg">
							<Link href="/contact">
								Contact Support
								<ArrowRight aria-hidden="true" />
							</Link>
						</Button>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
