import { prisma } from '@/lib/prisma';

/**
 * Signing / review link lifetime — treated as an INACTIVITY timeout.
 *
 * Signing tokens (the unguessable `Signer.id` used in `/sign-nda-public/{id}`,
 * `/fillndahtml-public/{id}` links) expire after this window of no activity.
 * The clock is reset whenever someone acts on the NDA — opening the link,
 * filling/submitting, requesting or approving changes, sending for signature,
 * signing. As long as a party is engaging, the link stays open; only genuinely
 * abandoned NDAs lapse. There is intentionally no "cancel" button — expiry is
 * the mechanism, and the sender can resend to issue a fresh link.
 */
export const SIGN_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

/** A fresh expiry timestamp, `SIGN_LINK_TTL_MS` from now. */
export function newSignLinkExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + SIGN_LINK_TTL_MS);
}

// Signer statuses that represent a still-open link whose clock we keep alive on
// activity. SIGNED / DECLINED / EXPIRED are terminal and never refreshed.
const OPEN_SIGNER_STATUSES = ['PENDING', 'SENT', 'VIEWED'] as const;

/**
 * Reset the inactivity clock for all open signers on a sign request. Call this
 * whenever someone acts on the NDA so the link stays alive while in use.
 * Best-effort by design — callers should not fail their flow if this throws.
 */
export async function refreshSignLinkExpiryForRequest(signRequestId: string): Promise<void> {
  await prisma.signer.updateMany({
    where: { signRequestId, status: { in: [...OPEN_SIGNER_STATUSES] } },
    data: { expiresAt: newSignLinkExpiry() },
  });
}

/** Same as {@link refreshSignLinkExpiryForRequest} but keyed by draft id. */
export async function refreshSignLinkExpiryForDraft(draftId: string): Promise<void> {
  await prisma.signer.updateMany({
    where: { signRequest: { draftId }, status: { in: [...OPEN_SIGNER_STATUSES] } },
    data: { expiresAt: newSignLinkExpiry() },
  });
}

/** Minimal shape needed to judge whether a signer's link has lapsed. */
export type SignerExpiryInput = { status: string; expiresAt: Date | null }

/**
 * Whether a single signer represents a lapsed signing link: not terminal
 * (SIGNED/DECLINED), and either explicitly EXPIRED or past its inactivity
 * `expiresAt`. This is the one definition of "expired" used by the dashboard
 * and the delete guard.
 */
export function isSignerExpired(signer: SignerExpiryInput, now: number = Date.now()): boolean {
  if (signer.status === 'SIGNED' || signer.status === 'DECLINED') return false
  if (signer.status === 'EXPIRED') return true
  return signer.expiresAt != null && signer.expiresAt.getTime() < now
}

/** Whether any signer on a draft has a lapsed link. */
export function isDraftExpired(
  signers: SignerExpiryInput[] | null | undefined,
  now: number = Date.now(),
): boolean {
  return !!signers?.some((s) => isSignerExpired(s, now))
}
