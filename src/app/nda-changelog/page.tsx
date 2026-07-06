import { History } from "lucide-react";
import PageHero from "@/components/ui/page-hero";
import { NDA_CHANGELOG } from "@/lib/ndaChangelog";

export const metadata = {
	title: "NDA Changelog — FormalizeIt",
	description: "A plain-language history of changes to the standard NDA.",
};

function ChangeGroup({ label, items }: { label: string; items: string[] }) {
	return (
		<div className="mt-4">
			<p className="text-teal-700 text-xs font-bold uppercase tracking-widest">{label}</p>
			<ul className="mt-2 space-y-1.5">
				{items.map((item, i) => (
					<li key={i} className="text-sm text-gray-600 flex gap-2 leading-relaxed">
						<span className="text-gray-300 shrink-0">•</span>
						<span>{item}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function NdaChangelogPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PageHero
				icon={History}
				title="NDA Changelog"
				subtitle="A plain-language history of changes to the standard NDA"
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="space-y-6">
					{NDA_CHANGELOG.map((entry) => (
						<div
							key={entry.version}
							className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sm:p-8"
						>
							<div className="flex items-baseline justify-between flex-wrap gap-2">
								<h2 className="text-xl font-extrabold text-ink tracking-tight">v{entry.version}</h2>
								<span className="text-sm text-gray-400">{entry.date}</span>
							</div>
							<p className="text-base text-gray-500 leading-relaxed mt-2">{entry.summary}</p>
							{entry.added && entry.added.length > 0 && <ChangeGroup label="Added" items={entry.added} />}
							{entry.changed && entry.changed.length > 0 && <ChangeGroup label="Changed" items={entry.changed} />}
							{entry.removed && entry.removed.length > 0 && <ChangeGroup label="Removed" items={entry.removed} />}
						</div>
					))}
				</div>

				<p className="text-xs text-gray-400 mt-8 text-center">
					FormalizeIt is not a law firm and does not provide legal advice.
				</p>
			</div>
		</div>
	);
}
