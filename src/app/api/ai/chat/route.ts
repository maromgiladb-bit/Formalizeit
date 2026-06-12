import { auth, currentUser } from "@clerk/nextjs/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
	streamText,
	generateText,
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
import type { NdaContext, FormiUserContext, Finding } from "@/ai/types";

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

		const body = (await req.json()) as {
			messages?: UIMessage[];
			ndaContext?: NdaContext | null;
			mode?: FormiMode;
			path?: string;
		};
		const { messages, ndaContext, mode, path } = body;
		if (!Array.isArray(messages)) {
			return new Response("Invalid request: messages must be an array", { status: 400 });
		}
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

		// Scan: non-streaming, returns JSON { findings } so the client can read
		// structured risk data without coupling to the UI message stream format.
		if (isScan) {
			const scanResult = await generateText({
				model: google("gemini-2.5-flash"),
				system,
				messages: await convertToModelMessages(messages),
				tools: formiTools,
				stopWhen: stepCountIs(3),
				maxRetries: 2,
			});
			const recordCall = scanResult.steps
				.flatMap((s) => s.toolCalls)
				.find((c) => c.toolName === "recordFindings");
			const findings: Finding[] =
				(recordCall?.input as { findings?: Finding[] })?.findings ?? [];
			return Response.json({ findings });
		}

		// Chat: streaming text, no tools — fast TTFT for conversational turns.
		const result = streamText({
			model: google("gemini-2.5-flash"),
			system,
			messages: await convertToModelMessages(messages),
			maxRetries: 2,
		});

		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error("Formi chat error:", error);
		return new Response("AI request failed", { status: 500 });
	}
}
