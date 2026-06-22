import { type LucideIcon } from "lucide-react";

interface PageHeroProps {
	icon: LucideIcon;
	title: string;
	subtitle: string;
	eyebrow?: string;
}

export default function PageHero({ icon: Icon, title, subtitle, eyebrow }: PageHeroProps) {
	return (
		<div className="bg-white border-b border-gray-100 pt-16 pb-12">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-6">
					<Icon className="w-6 h-6 text-teal-700" />
				</div>
				{eyebrow && (
					<p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">
						{eyebrow}
					</p>
				)}
				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-ink">
					{title}
				</h1>
				<p className="text-lg text-gray-500 leading-relaxed max-w-2xl">{subtitle}</p>
			</div>
		</div>
	);
}
