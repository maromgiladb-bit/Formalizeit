"use client";

import React, {
	createContext,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { SignedIn } from "@clerk/nextjs";
import NdaAgentAvatar, {
	type NdaAgentHandle,
} from "@/components/ai/NdaAgentAvatar";
import type { Finding, NdaContext } from "@/ai/types";

interface FormiContextValue {
	/** Publish the current page's NDA draft snapshot (pass null to clear). */
	setNda: (nda: NdaContext | null) => void;
	/** Latest structured findings from a scan turn (empty unless a scan ran). */
	findings: Finding[];
	/** Open Formi and drop in a one-off assistant message (e.g. the pre-send nudge). */
	openWithNudge: (text: string) => void;
}

const FormiContext = createContext<FormiContextValue | null>(null);

export function useFormi(): FormiContextValue {
	const ctx = useContext(FormiContext);
	if (!ctx) {
		throw new Error("useFormi must be used within <FormiProvider>");
	}
	return ctx;
}

/**
 * Renders a single, global Formi avatar (signed-in users only) and lets any page
 * feed it page-specific NDA context. Mounted once in the root layout.
 */
export function FormiProvider({ children }: { children: React.ReactNode }) {
	const [nda, setNda] = useState<NdaContext | null>(null);
	const [findings, setFindings] = useState<Finding[]>([]);
	const avatarRef = useRef<NdaAgentHandle>(null);

	const value = useMemo<FormiContextValue>(
		() => ({
			setNda,
			findings,
			openWithNudge: (text: string) => avatarRef.current?.openWithNudge(text),
		}),
		[findings]
	);

	return (
		<FormiContext.Provider value={value}>
			{children}
			<SignedIn>
				<NdaAgentAvatar
					ref={avatarRef}
					nda={nda ?? undefined}
					onFindingsChange={setFindings}
				/>
			</SignedIn>
		</FormiContext.Provider>
	);
}
