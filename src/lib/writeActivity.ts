import { prisma } from "@/lib/prisma";
import { NdaEventType } from "@prisma/client";

interface WriteActivityOptions {
    organizationId: string;
    draftId: string;
    eventType: NdaEventType;
    label: string; // Human-readable e.g. "Sent to john@example.com"
    actorName?: string;
    actorEmail?: string;
    actorRole?: string; // "party_a" | "party_b"
    userId?: string;
    signRequestId?: string;
    signerId?: string;
    ipAddress?: string;
}

/**
 * Writes an audit event and an NdaRevision snapshot (for content-changing events).
 * Call this from any API route when a meaningful state change happens.
 */
export async function writeActivity(opts: WriteActivityOptions): Promise<void> {
    try {
        await prisma.auditEvent.create({
            data: {
                organizationId: opts.organizationId,
                draftId: opts.draftId,
                eventType: opts.eventType,
                userId: opts.userId ?? null,
                signRequestId: opts.signRequestId ?? null,
                signerId: opts.signerId ?? null,
                ipAddress: opts.ipAddress ?? null,
                metadata: {
                    label: opts.label,
                    actorName: opts.actorName ?? null,
                    actorEmail: opts.actorEmail ?? null,
                    actorRole: opts.actorRole ?? null,
                },
            },
        });
    } catch (err) {
        // Non-fatal: activity logging should never break the main flow
        console.error("[writeActivity] Failed to log audit event:", err);
    }
}

/** Icon key used by the UI component */
export function iconForEvent(eventType: NdaEventType): string {
    switch (eventType) {
        case "CREATED": return "create";
        case "UPDATED": return "edit";
        case "SENT": return "send";
        case "VIEWED": return "view";
        case "SIGNED": return "sign";
        case "CANCELLED": return "cancel";
        case "CHANGES_SUGGESTED": return "edit";
        case "CHANGES_ACCEPTED": return "accept";
        case "CHANGES_REQUESTED": return "request";
        case "PDF_EXPORTED": return "pdf";
        default: return "info";
    }
}
