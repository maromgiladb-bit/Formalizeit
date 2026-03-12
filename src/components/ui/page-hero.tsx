import { type LucideIcon } from "lucide-react";

interface PageHeroProps {
	icon: LucideIcon;
	title: string;
	subtitle: string;
}

export default function PageHero({ icon: Icon, title, subtitle }: PageHeroProps) {
	return (
		<div className="bg-gray-50 border-b border-gray-200 py-16">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<Icon className="w-14 h-14 mx-auto mb-5 text-teal-600" />
				<h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
					{title}
				</h1>
				<p className="text-xl text-gray-500 max-w-2xl mx-auto">{subtitle}</p>
			</div>
		</div>
	);
}
