import { type LucideIcon } from "lucide-react";

interface PageHeroProps {
	icon: LucideIcon;
	title: string;
	subtitle: string;
}

export default function PageHero({ icon: Icon, title, subtitle }: PageHeroProps) {
	return (
		<div className="bg-ground border-b border-line pt-16 pb-12">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="w-12 h-12 rounded-control bg-white border border-line flex items-center justify-center mb-6">
					<Icon className="w-6 h-6 text-teal-800" aria-hidden="true" />
				</div>
				<h1 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-4 text-ink">
					{title}
				</h1>
				<p className="text-lg text-muted-ink leading-relaxed max-w-2xl">{subtitle}</p>
			</div>
		</div>
	);
}
