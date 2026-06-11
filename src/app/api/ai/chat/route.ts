import { auth, currentUser } from "@clerk/nextjs/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
	streamText,
	convertToModelMessages,
	stepCountIs,
	type UIMessage,
} from "ai";
import {
	buildFormiSystemPrompt,
	type FormiMode,
} from "@/ai/prompts/formi_systemPrompt";
import { formiTools } from "@/ai/tools/formiTools";
import { getActiveOrganization } from "@/lib/db-organization";
import type { NdaContext, FormiUserContext } from "@/ai/types";

// Formi chat endpoint. Streams Gemini responses for the floating NDA copilot.
// Role/company/name are resolved SERVER-SIDE (never trusted from the client).
export async function POST(req: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return new Response("Unauthorized", { status: 401 });
		}

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			return new Response("AI assistant is not configured", { status: 503 });
		}

		const { messages, ndaContext, mode, path } = (await req.json()) as {
			messages: UIMessage[];
			ndaContext?: NdaContext | null;
			mode?: FormiMode;
			path?: string;
		};
		const isScan = mode === "scan";

		// Resolve identity + workspace context on the server.
		const [clerkUser, membership] = await Promise.all([
			currentUser(),
			getActiveOrganization(),
		]);
		const userContext: FormiUserContext = {
			userName: clerkUser?.firstName ?? "there",
			role: membership?.role ?? "member",
			companyName: membership?.organization?.name ?? "your company",
		};

		const google = createGoogleGenerativeAI({ apiKey });
		const system = buildFormiSystemPrompt(
			ndaContext ?? null,
			userContext,
			isScan ? "scan" : "chat",
			path
		);

		const result = streamText({
			model: google("gemini-2.5-flash"),
			system,
			messages: await convertToModelMessages(messages),
			// Bound worst-case latency: fail fast on a transient overload instead of
			// silently retrying through long backoffs.
			maxRetries: 2,
			// Live chat: no tools, single streaming pass → instant tokens, fast TTFT.
			// Scan turns only: enable tools + allow round-trips for structured findings.
			...(isScan
				? { tools: formiTools, stopWhen: stepCountIs(3) }
				: {}),
		});

		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error("Formi chat error:", error);
		return new Response("AI request failed", { status: 500 });
	}
}
