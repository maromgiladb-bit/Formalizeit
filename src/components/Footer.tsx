"use client";

import Link from "next/link";
import Image from "next/image";

const columns = [
	{
		heading: "Product",
		links: [
			{ name: "Browse Templates", href: "/templates" },
			{ name: "Pricing", href: "/#pricing" },
			{ name: "Dashboard", href: "/dashboard" },
			{ name: "My Drafts", href: "/mydrafts" },
		],
	},
	{
		heading: "Company",
		links: [
			{ name: "About", href: "/about" },
			{ name: "Contact", href: "/contact" },
			{ name: "FAQ", href: "/faq" },
			{ name: "Help Center", href: "/help" },
		],
	},
	{
		heading: "Legal",
		links: [
			{ name: "Terms of Service", href: "/terms" },
			{ name: "Privacy Policy", href: "/privacy" },
			{ name: "E-Signature Consent", href: "/esignature-consent" },
			{ name: "Security", href: "/security" },
			{ name: "Compliance", href: "/compliance" },
		],
	},
	{
		heading: "The Standard NDA",
		links: [
			{ name: "Standard NDA", href: "/standard-nda" },
			{ name: "Governance Policy", href: "/nda-governance" },
			{ name: "NDA Changelog", href: "/nda-changelog" },
		],
	},
];

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-gray-50 border-t border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
					<div className="col-span-2 md:col-span-1">
						<Link href="/" aria-label="FormalizeIt home" className="inline-block -my-6">
							<Image
								src="/formalizeIt-logo.png"
								alt="FormalizeIt"
								width={200}
								height={50}
								className="h-24 w-auto"
							/>
						</Link>
						<p className="text-sm text-gray-500 leading-relaxed max-w-xs">
							Pick a template, fill in what&apos;s different, send — in minutes. No lawyer required.
						</p>
					</div>

					{columns.map((column) => (
						<div key={column.heading}>
							<h3 className="text-sm font-semibold text-ink mb-4">{column.heading}</h3>
							<ul className="space-y-2.5">
								{column.links.map((link) => (
									<li key={link.name}>
										<Link
											href={link.href}
											className="text-sm text-gray-500 hover:text-ink transition-colors"
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="mt-12 pt-8 border-t border-gray-200">
					<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
						<span className="text-sm text-gray-500">
							© {currentYear} FormalizeIt. All rights reserved.
						</span>
						<div className="flex items-center gap-6">
							<Link href="/contact" className="text-sm text-gray-500 hover:text-ink transition-colors">
								Contact
							</Link>
							<Link href="/about" className="text-sm text-gray-500 hover:text-ink transition-colors">
								About
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
