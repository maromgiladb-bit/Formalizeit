import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Shown when a send is refused because the plan's NDA cap is reached. */
export default function LimitReachedNotice({ message, className = "" }: { message?: string; className?: string }) {
	return (
		<div role="alert" className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 ${className}`}>
			<p className="text-sm font-semibold text-amber-900">You&apos;ve reached your plan&apos;s NDA limit</p>
			<p className="mt-1 text-sm text-amber-800">
				{message || "You've reached the maximum number of NDAs for this plan."} Upgrade to keep sending.
			</p>
			<Button asChild size="sm" className="mt-3">
				<Link href="/#pricing">See plans</Link>
			</Button>
		</div>
	);
}
