import { Accessibility } from "lucide-react";
import PageHero from "@/components/ui/page-hero";

export default function AccessibilityPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={Accessibility}
				title="Accessibility Statement"
				subtitle="Last updated: October 23, 2026"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 prose prose-gray max-w-none">
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
