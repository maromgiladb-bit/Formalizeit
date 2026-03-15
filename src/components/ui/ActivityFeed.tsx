"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ActivityItem {
    id: string;
    createdAt: string;
    eventType: string;
    icon: string;
    label: string;
    actorName?: string | null;
    actorEmail?: string | null;
    actorRole?: string | null;
}

interface ActivityFeedProps {
    /** Pass draftId for authenticated Party A usage */
    draftId?: string;
    /** Pass signerId for unauthenticated Party B usage */
    signerId?: string;
    className?: string;
    /** Start collapsed (default: false) */
    defaultCollapsed?: boolean;
    /** Poll interval in ms. 0 = no polling. Default: 30000 */
    pollInterval?: number;
}

const ICON_MAP: Record<string, { emoji: string; bg: string; text: string }> = {
    create:  { emoji: "🟢", bg: "bg-emerald-100", text: "text-emerald-600" },
    edit:    { emoji: "✏️",  bg: "bg-amber-100",   text: "text-amber-600" },
    send:    { emoji: "📤", bg: "bg-blue-100",    text: "text-blue-600" },
    view:    { emoji: "👁️",  bg: "bg-gray-100",    text: "text-gray-500" },
    sign:    { emoji: "🖊️",  bg: "bg-purple-100",  text: "text-purple-600" },
    cancel:  { emoji: "❌", bg: "bg-red-100",     text: "text-red-500" },
    accept:  { emoji: "✅", bg: "bg-emerald-100", text: "text-emerald-600" },
    request: { emoji: "🔄", bg: "bg-orange-100",  text: "text-orange-600" },
    pdf:     { emoji: "📄", bg: "bg-red-100",     text: "text-red-600" },
    info:    { emoji: "ℹ️",  bg: "bg-gray-100",    text: "text-gray-500" },
};

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (diffMins < 1) return `Just now, ${timeStr}`;
    if (diffMins < 60) return `${diffMins}m ago, ${timeStr}`;
    if (diffHours < 24) {
        return `${diffHours}h ago, ${timeStr}`;
    }
    if (diffDays === 1) return `Yesterday, ${timeStr}`;
    if (diffDays < 7) return `${diffDays} days ago, ${timeStr}`;

    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + `, ${timeStr}`;
}

export function ActivityFeed({
    draftId,
    signerId,
    className = "",
    defaultCollapsed = false,
    pollInterval = 30_000,
}: ActivityFeedProps) {
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mountedRef = useRef(true);

    const fetchActivity = useCallback(async () => {
        if (!draftId && !signerId) return;

        try {
            const url = draftId
                ? `/api/ndas/${draftId}/activity`
                : `/api/ndas/activity-public?signerId=${signerId}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load activity");

            const data = await res.json();
            if (mountedRef.current) {
                setItems(data.activity ?? []);
                setError(null);
            }
        } catch {
            if (mountedRef.current) {
                setError("Could not load activity");
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [draftId, signerId]);

    // Initial load
    useEffect(() => {
        mountedRef.current = true;
        setLoading(true);
        fetchActivity();

        if (pollInterval > 0) {
            pollRef.current = setInterval(fetchActivity, pollInterval);
        }

        return () => {
            mountedRef.current = false;
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchActivity, pollInterval]);

    const iconMeta = (icon: string) => ICON_MAP[icon] ?? ICON_MAP.info;

    // Collapsed: show a compact badge row
    if (collapsed) {
        return (
            <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
                <button
                    onClick={() => setCollapsed(false)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-base">🕐</span>
                        <span className="text-sm font-semibold text-gray-700">Recent Activity</span>
                        {items.length > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-600 text-white text-xs font-bold">
                                {items.length}
                            </span>
                        )}
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                    <span className="text-base">🕐</span>
                    <span className="text-sm font-semibold text-gray-700">Recent Activity</span>
                    {items.length > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
                            {items.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setLoading(true); fetchActivity(); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-gray-100 transition-colors"
                        title="Refresh"
                    >
                        <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCollapsed(true)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Collapse"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="max-h-72 overflow-y-auto">
                {loading && items.length === 0 && (
                    <div className="flex flex-col gap-2 p-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                                    <div className="h-2 bg-gray-100 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="px-4 py-3 text-xs text-red-500 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {!loading && !error && items.length === 0 && (
                    <div className="px-4 py-6 text-center text-gray-400 text-xs">
                        <div className="text-2xl mb-2">📋</div>
                        No activity yet
                    </div>
                )}

                {items.length > 0 && (
                    <ol className="relative px-4 py-3 space-y-0">
                        {items.map((item, idx) => {
                            const meta = iconMeta(item.icon);
                            const isLast = idx === items.length - 1;
                            return (
                                <li key={item.id} className="flex gap-3 pb-3 relative">
                                    {/* Vertical line */}
                                    {!isLast && (
                                        <div className="absolute left-3.25 top-7 bottom-0 w-px bg-gray-100" />
                                    )}
                                    {/* Icon */}
                                    <div className={`w-7 h-7 rounded-full ${meta.bg} flex items-center justify-center shrink-0 text-sm z-10`}>
                                        {meta.emoji}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-sm text-gray-800 leading-snug">{item.label}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </div>
    );
}
