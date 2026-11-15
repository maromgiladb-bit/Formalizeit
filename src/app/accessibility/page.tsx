import { Accessibility } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function AccessibilityPage() {
	return (
		<div className="min-h-screen bg-ground">
			<PageHero
				icon={Accessibility}
				title="Accessibility Statement"
				subtitle="Last updated: October 23, 2026"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 [&_p]:max-w-[70ch] [&_li]:max-w-[70ch]">
				<div className="bg-white rounded-sheet border border-line p-8 sm:p-12 prose prose-gray max-w-none [&_h2]:font-display [&_h2]:text-ink [&_h2]:tracking-tight [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h2:first-child]:mt-0 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1.5 [&_hr]:my-8 [&_p]:text-gray-700 [&_li]:text-gray-700 [&_p]:leading-relaxed [&_a]:text-teal-800 [&_a]:underline [&_hr]:border-line">
					<h2>Our commitment</h2>
					<p>
						FormalizeIt should work for everyone, on any device, without special setup. We aim
						to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA across the
						site and the app, including the pages receivers use to review and sign an NDA.
					</p>

					<h2>Where we are today</h2>
					<p>
						We are still improving. We have not yet completed a formal third-party accessibility
						audit, and some parts of the site may not fully meet WCAG 2.1 AA. We are working to
						find and fix these gaps, and we treat accessibility problems as bugs.
					</p>

					<h2>Report an accessibility problem</h2>
					<p>
						If you have trouble using any part of FormalizeIt, or need information in another
						format, email us at{" "}
						<a href="mailto:support@formalizeit.com?subject=Accessibility">support@formalizeit.com</a>.
						Tell us the page, what you were trying to do, and the assistive technology you use, if
						any. We will do our best to help you complete your task and to fix the underlying
						issue.
					</p>
				</div>
			</div>
		</div>
	);
}
