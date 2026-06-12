"use client";

import React, {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X } from "lucide-react";
import type { Finding, NdaContext } from "@/ai/types";

export interface NdaAgentHandle {
	/** Open the panel and append a one-off assistant message (used for the pre-send nudge). */
	openWithNudge: (text: string) => void;
}

interface NdaAgentAvatarProps {
	/** Current NDA field snapshot (fill page only). Omitted elsewhere → general helper mode. */
	nda?: NdaContext;
	/** Lifts the latest structured findings to the page (for the pre-send nudge). */
	onFindingsChange?: (findings: Finding[]) => void;
}

const GREETING =
	"Hi! I'm Formi — your FormalizeIt helper. Ask me about your NDAs, the dashboard, or plans!";

type TextLikePart = { type: string; text?: string };

function assistantMessage(text: string): UIMessage {
	return {
		id:
			typeof crypto !== "undefined" && "randomUUID" in crypto
				? crypto.randomUUID()
				: `formi-${Date.now()}-${Math.random()}`,
		role: "assistant",
		parts: [{ type: "text", text }],
	};
}

function getMessageText(parts: readonly unknown[]): string {
	return (parts as TextLikePart[])
		.filter((p) => p.type === "text" && typeof p.text === "string")
		.map((p) => p.text as string)
		.join("");
}

/* ----------------------------- markdown rendering ----------------------------- */
// Lightweight renderer for the subset Formi actually emits: bold, italic, inline
// code, bullet lists, and paragraphs. Keeps replies looking native (no raw **).

function renderInline(text: string, keyBase: string): React.ReactNode[] {
	const nodes: React.ReactNode[] = [];
	const regex = /\*\*([^*]+?)\*\*|__([^_]+?)__|\*([^*\n]+?)\*|`([^`]+?)`/g;
	let last = 0;
	let m: RegExpExecArray | null;
	let i = 0;
	while ((m = regex.exec(text)) !== null) {
		if (m.index > last) nodes.push(text.slice(last, m.index));
		const bold = m[1] ?? m[2];
		const italic = m[3];
		const code = m[4];
		if (bold != null) {
			nodes.push(
				<strong key={`${keyBase}-${i}`} className="font-semibold text-gray-900">
					{bold}
				</strong>
			);
		} else if (italic != null) {
			nodes.push(<em key={`${keyBase}-${i}`}>{italic}</em>);
		} else if (code != null) {
			nodes.push(
				<code
					key={`${keyBase}-${i}`}
					className="px-1 py-0.5 rounded bg-gray-100 text-[0.8em] font-mono text-gray-800"
				>
					{code}
				</code>
			);
		}
		last = m.index + m[0].length;
		i++;
	}
	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
}

function ChatMarkdown({ text }: { text: string }) {
	const lines = text.split(/\r?\n/);
	const blocks: React.ReactNode[] = [];
	let bullets: string[] | null = null;
	let key = 0;

	const flush = () => {
		if (bullets && bullets.length) {
			const items = bullets;
			blocks.push(
				<ul key={`ul-${key++}`} className="list-disc pl-4 space-y-1">
					{items.map((it, idx) => (
						<li key={idx}>{renderInline(it, `li-${key}-${idx}`)}</li>
					))}
				</ul>
			);
		}
		bullets = null;
	};

	for (const raw of lines) {
		const line = raw.trimEnd();
		const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
		if (bullet) {
			(bullets ??= []).push(bullet[1]);
			continue;
		}
		flush();
		if (line.trim() === "") continue;
		blocks.push(<p key={`p-${key++}`}>{renderInline(line, `p-${key}`)}</p>);
	}
	flush();
	return <div className="space-y-2">{blocks}</div>;
}

/* ------------------------------ typing indicator ------------------------------ */
function TypingDots() {
	return (
		<span className="flex items-center gap-1 py-1">
			{[0, 1, 2].map((i) => (
				<motion.span
					key={i}
					className="w-1.5 h-1.5 rounded-full bg-teal-600"
					animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
					transition={{
						duration: 0.9,
						repeat: Infinity,
						delay: i * 0.15,
						ease: "easeInOut",
					}}
				/>
			))}
		</span>
	);
}

/* --------------------------------- component ---------------------------------- */
const NdaAgentAvatar = forwardRef<NdaAgentHandle, NdaAgentAvatarProps>(
	function NdaAgentAvatar({ nda, onFindingsChange }, ref) {
		const [open, setOpen] = useState(false);
		const [input, setInput] = useState("");

		const ndaRef = useRef(nda);
		ndaRef.current = nda;

		// Page-awareness: send the current route so Formi can tailor app answers.
		const pathname = usePathname();
		const pathRef = useRef(pathname);
		pathRef.current = pathname;

		const [transport] = useState(
			() =>
				new DefaultChatTransport({
					api: "/api/ai/chat",
					// Live chat = tool-free fast streaming path on the server.
					prepareSendMessagesRequest: ({ messages }) => ({
						body: {
							messages,
							ndaContext: ndaRef.current ?? null,
							mode: "chat",
							path: pathRef.current,
						},
					}),
				})
		);

		const { messages, sendMessage, status, setMessages } = useChat({
			transport,
			messages: [assistantMessage(GREETING)],
		});
		const isLoading = status === "submitted" || status === "streaming";

		// Keep a stable ref so the scan fetch callback doesn't hold a stale closure.
		const onFindingsChangeRef = useRef(onFindingsChange);
		onFindingsChangeRef.current = onFindingsChange;

		// Background scan: fires 1.5 s after the NDA snapshot changes, returns
		// structured findings without polluting the visible chat history.
		const runScan = useCallback(async (snapshot: NdaContext, signal: AbortSignal) => {
			try {
				const res = await fetch("/api/ai/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						messages: [
							{
								id: crypto.randomUUID(),
								role: "user",
								parts: [{ type: "text", text: "analyze" }],
							},
						],
						ndaContext: snapshot,
						mode: "scan",
					}),
					signal,
				});
				if (!res.ok || signal.aborted) return;
				const { findings } = (await res.json()) as { findings: Finding[] };
				onFindingsChangeRef.current?.(findings ?? []);
			} catch {
				// AbortError on unmount/NDA-change is expected — ignore silently.
			}
		}, []);

		useEffect(() => {
			if (!nda) {
				onFindingsChangeRef.current?.([]);
				return;
			}
			const controller = new AbortController();
			const t = setTimeout(() => runScan(nda, controller.signal), 1500);
			return () => {
				clearTimeout(t);
				controller.abort();
			};
		}, [nda, runScan]);

		useImperativeHandle(
			ref,
			() => ({
				openWithNudge: (text: string) => {
					setOpen(true);
					setMessages((prev) => [...prev, assistantMessage(text)]);
				},
			}),
			[setMessages]
		);

		const scrollRef = useRef<HTMLDivElement>(null);
		useEffect(() => {
			if (open)
				scrollRef.current?.scrollTo({
					top: scrollRef.current.scrollHeight,
					behavior: "smooth",
				});
		}, [messages, open, isLoading]);

		function handleSubmit(e: React.FormEvent) {
			e.preventDefault();
			const text = input.trim();
			if (!text || isLoading) return;
			sendMessage({ text });
			setInput("");
		}

		// Show the typing indicator only while the latest assistant turn is empty.
		const lastMsg = messages[messages.length - 1];
		const waitingForReply =
			isLoading && (!lastMsg || lastMsg.role === "user" || !getMessageText(lastMsg.parts));

		return (
			<div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
				<AnimatePresence>
					{open && (
						<motion.div
							initial={{ opacity: 0, y: 20, scale: 0.96 }}
							animate={{
								opacity: 1,
								y: 0,
								scale: 1,
								transition: { type: "spring", stiffness: 380, damping: 30 },
							}}
							exit={{ opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.15 } }}
							className="w-[22rem] h-[32rem] max-h-[72vh] bg-white border border-gray-200 rounded-3xl shadow-2xl shadow-gray-900/10 flex flex-col overflow-hidden"
						>
							{/* Header */}
							<div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-teal-800 to-teal-700">
								<div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white shrink-0">
									<Bot className="w-5 h-5" />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-sm font-bold text-white leading-tight">Formi</h3>
									<p className="text-[11px] text-teal-100 flex items-center gap-1.5">
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
										NDA Copilot · online
									</p>
								</div>
								<button
									onClick={() => setOpen(false)}
									aria-label="Close Formi"
									className="text-teal-100 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors cursor-pointer"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{/* Messages */}
							<div
								ref={scrollRef}
								className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50/60"
							>
								{messages.map((m) => {
									const text = getMessageText(m.parts);
									if (!text) return null;
									const isUser = m.role === "user";
									const isFlag = !isUser && text.startsWith("Heads up —");
									return (
										<motion.div
											key={m.id}
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.2, ease: "easeOut" }}
											className={
												isUser ? "flex justify-end" : "flex items-end gap-2 justify-start"
											}
										>
											{!isUser && (
												<div className="w-6 h-6 rounded-full bg-teal-800 flex items-center justify-center text-white shrink-0 mb-0.5">
													<Bot className="w-3.5 h-3.5" />
												</div>
											)}
											<div
												className={[
													"max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed",
													isUser
														? "bg-teal-800 text-white rounded-2xl rounded-br-md"
														: isFlag
														? "bg-amber-50 border border-amber-200 text-gray-800 rounded-2xl rounded-bl-md"
														: "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md shadow-sm",
												].join(" ")}
											>
												{isUser ? (
													<span className="whitespace-pre-wrap">{text}</span>
												) : (
													<ChatMarkdown text={text} />
												)}
											</div>
										</motion.div>
									);
								})}
								{waitingForReply && (
									<div className="flex items-end gap-2 justify-start">
										<div className="w-6 h-6 rounded-full bg-teal-800 flex items-center justify-center text-white shrink-0">
											<Bot className="w-3.5 h-3.5" />
										</div>
										<div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-3.5 py-2.5">
											<TypingDots />
										</div>
									</div>
								)}
							</div>

							{/* Input */}
							<form
								onSubmit={handleSubmit}
								className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white"
							>
								<input
									value={input}
									onChange={(e) => setInput(e.target.value)}
									aria-label="Message Formi"
									placeholder="Ask Formi…"
									className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white transition-colors"
								/>
								<button
									type="submit"
									disabled={isLoading || !input.trim()}
									aria-label="Send message"
									className="bg-teal-800 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-800 text-white rounded-full p-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
								>
									<Send className="w-4 h-4" />
								</button>
							</form>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Floating avatar button */}
				<AnimatePresence>
					{!open && (
						<motion.button
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							whileHover={{ scale: 1.06 }}
							whileTap={{ scale: 0.94 }}
							onClick={() => setOpen(true)}
							aria-label="Open Formi, the NDA copilot"
							className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-full p-4 shadow-lg shadow-teal-900/25 flex items-center justify-center cursor-pointer"
						>
							<Bot className="w-6 h-6" />
						</motion.button>
					)}
				</AnimatePresence>
			</div>
		);
	}
);

export default NdaAgentAvatar;
