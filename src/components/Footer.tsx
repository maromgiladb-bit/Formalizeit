"use client";

import Link from "next/link";
import { FileText, HelpCircle, Info, Mail, Shield, BookOpen, Scale } from "lucide-react";

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-slate-900 text-gray-300 border-t border-slate-800">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* Learn Section */}
					<div>
						<h3 className="text-white font-semibold mb-4 flex items-center gap-2">
							<BookOpen className="w-4 h-4" />
							Learn
						</h3>
						<ul className="space-y-2">
							<li>
								<Link href="/about" className="hover:text-teal-400 transition-colors text-sm">
									What is an NDA?
								</Link>
							</li>
							<li>
								<Link href="/about#types" className="hover:text-teal-400 transition-colors text-sm">
									Types of NDAs
								</Link>
							</li>
							<li>
								<Link href="/about#best-practices" className="hover:text-teal-400 transition-colors text-sm">
									Best Practices
								</Link>
							</li>
							<li>
								<Link href="/templates" className="hover:text-teal-400 transition-colors text-sm">
									Browse Templates
								</Link>
							</li>
						</ul>
					</div>

					{/* Resources Section */}
					<div>
						<h3 className="text-white font-semibold mb-4 flex items-center gap-2">
							<FileText className="w-4 h-4" />
							Resources
						</h3>
						<ul className="space-y-2">
							<li>
								<Link href="/templates" className="hover:text-teal-400 transition-colors text-sm">
									Template Library
								</Link>
							</li>
							<li>
								<Link href="/plans" className="hover:text-teal-400 transition-colors text-sm">
									Pricing Plans
								</Link>
							</li>
							<li>
								<Link href="/dashboard" className="hover:text-teal-400 transition-colors text-sm">
									Dashboard
								</Link>
							</li>
							<li>
								<Link href="/mydrafts" className="hover:text-teal-400 transition-colors text-sm">
									My Drafts
								</Link>
							</li>
						</ul>
					</div>

					{/* Legal Section */}
					<div>
						<h3 className="text-white font-semibold mb-4 flex items-center gap-2">
							<Scale className="w-4 h-4" />
							Legal
						</h3>
						<ul className="space-y-2">
							<li>
								<Link href="/terms" className="hover:text-teal-400 transition-colors text-sm">
									Terms of Service
								</Link>
							</li>
							<li>
								<Link href="/privacy" className="hover:text-teal-400 transition-colors text-sm">
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link href="/security" className="hover:text-teal-400 transition-colors text-sm">
									Security
								</Link>
							</li>
							<li>
								<Link href="/compliance" className="hover:text-teal-400 transition-colors text-sm">
									Compliance
								</Link>
							</li>
						</ul>
					</div>

					{/* Help Section */}
					<div>
						<h3 className="text-white font-semibold mb-4 flex items-center gap-2">
							<HelpCircle className="w-4 h-4" />
							Help
						</h3>
						<ul className="space-y-2">
							<li>
								<Link href="/contact" className="hover:text-teal-400 transition-colors text-sm">
									Contact Us
								</Link>
							</li>
							<li>
								<Link href="/faq" className="hover:text-teal-400 transition-colors text-sm">
									FAQ
								</Link>
							</li>
							<li>
								<Link href="/help" className="hover:text-teal-400 transition-colors text-sm">
									Help Center
								</Link>
							</li>
							<li>
								<Link href="/support" className="hover:text-teal-400 transition-colors text-sm">
									Support Center
								</Link>
							</li>
							<li>
								<Link href="/about" className="hover:text-teal-400 transition-colors text-sm">
									About Us
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-12 pt-8 border-t border-slate-800">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<div className="flex items-center gap-2">
							<Shield className="w-5 h-5 text-teal-500" />
							<span className="text-sm font-semibold text-white">NDA SaaS</span>
							<span className="text-sm text-gray-500">© {currentYear} All rights reserved.</span>
						</div>
						
						<div className="flex items-center gap-6">
							<Link 
								href="/contact" 
								className="flex items-center gap-2 text-sm hover:text-teal-400 transition-colors"
							>
								<Mail className="w-4 h-4" />
								Contact
							</Link>
							<Link 
								href="/about" 
								className="flex items-center gap-2 text-sm hover:text-teal-400 transition-colors"
							>
								<Info className="w-4 h-4" />
								About
							</Link>
							<a 
								href="https://github.com" 
								target="_blank" 
								rel="noopener noreferrer"
								className="text-sm hover:text-teal-400 transition-colors"
							>
								GitHub
							</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
