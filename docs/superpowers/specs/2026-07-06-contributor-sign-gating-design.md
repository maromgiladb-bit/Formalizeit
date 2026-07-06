# Contributor sign-gating on the dashboard

**Date:** 2026-07-06
**Status:** Approved (design)

## Problem

A contributor (a member who cannot sign on behalf of the company — role `CONTRIBUTOR`,
or `ADMINISTRATOR`/`SIGNER` logic aside) was able to open the signing page for an NDA
awaiting the company's signature straight from the dashboard.

Two gaps cause this:

1. **Loading-state race (root cause).** In `DashboardClient.tsx`, `canSign` is initialised
   to `null` while `/api/user/role` is fetched. The action block only renders the
   contributor path when `canSign === false`; every other value (including `null` during
   load, or `false`-fetch-failure edge cases resolving late) falls through to the `else`
   branch that renders the **"Sign Now"** link. A contributor who clicks during that
   window reaches the public sign page.

2. **No server-side guard.** The sign page (`src/app/sign-nda-public/[token]/page.tsx`) is
   a public bearer-token page. It validates the token and workflow state only — it never
   checks whether the logged-in user is authorised to sign for the company. So a
   contributor who reaches it (via the race, or a directly pasted link) can sign as the
   company, violating the authority-to-sign rule (key product rule #7).

3. **No explanation.** Contributors see the amber "Ask a teammate to sign" button with no
   text explaining why they can't sign.

The "notify a signer" capability itself already exists and works
(`/api/ndas/notify-signer` + `handleNotifySigner` in `DashboardClient.tsx`).

## Goals

- A contributor never sees a clickable "Sign Now" on the dashboard for a company-signature NDA.
- The contributor sees a clear message: **"Only approved signers can sign this NDA."**
- The contributor keeps the "Ask a teammate to sign" action, but **chooses which authorized
  signer(s) to notify** from a checkbox list (one or more) rather than notifying all.
- A logged-in contributor is blocked from the sign page itself, even via a direct link.

Non-goals: changing roles/permissions model, changing the notify-signer email/flow,
blocking anonymous (not-logged-in) visitors to a Party A link.

## Design

### 1. Dashboard card — fix the race + add the message

In `src/components/dashboard/DashboardClient.tsx`, in the `AWAITING_PARTY_A_SIGNATURE`
action block (currently lines ~390–409):

- Change the branch condition so **"Sign Now" renders only when `canSign === true`**.
- When `canSign !== true` (i.e. `false` **or** still-loading `null`), render the
  contributor path: the "Ask a teammate to sign" button **plus** a muted helper line
  beneath it.
- While `canSign === null` (role not yet resolved), the notify button is shown in a
  disabled state so nothing is actionable-yet-wrong and no "Sign Now" flashes. Once the
  role resolves to a signer, it flips to "Sign Now".

Message styling per Calm Precision: `text-xs text-gray-500`, placed on its own line under
the button (no new utility colors). Copy: **"Only approved signers can sign this NDA."**

### 1a. Signer picker modal

Clicking "Ask a teammate to sign" no longer immediately notifies everyone. Instead it opens
a small modal (Calm Precision card: `bg-white border border-gray-100 rounded-2xl shadow-card`)
that lists the org's authorized signers with a checkbox per row (name + email). Behaviour:

- Multi-select: the user can check one or more signers. At least one must be checked to send.
- Default: all signers pre-checked (fast path for the common case), user can deselect.
- Primary action "Notify selected" (teal-800 button) posts the chosen signer user IDs;
  "Cancel" closes without sending. Loading + result use the existing `message` banner.
- Empty state: if the org has no eligible signer other than the requester, the modal shows
  the same guidance the API returns ("Ask an administrator to enable a signer.").

**Signer list source** — new `GET /api/organization/signers`: returns
`[{ id, name, email }]` for ACTIVE memberships in the active org with role `SIGNER`, or
`ADMINISTRATOR` with `isSigner: true`, excluding the current user (mirrors the existing
recipient query in `notify-signer`). Fetched when the modal opens.

**Selection wiring** — `/api/ndas/notify-signer` accepts an optional
`recipientUserIds: string[]`. When present, the server intersects it with the authoritative
signer set (never trusts the client list blindly) and notifies only that subset; when absent,
it keeps the current "all signers" behaviour (backward compatible). Rejects with a clear error
if the intersection is empty.

### 2. Sign page — server-side guard

In `src/app/sign-nda-public/[token]/page.tsx`, after the signer/workflow checks and only
for Party A (`signer.role === 'SENDER'`):

- Resolve the logged-in Clerk user (`auth()`), if any.
- If logged in, look up their **ACTIVE membership in the signer's organization**
  (`signer.signRequest.organizationId`).
- If a membership exists and `canSignNDA({ role, isSigner })` is `false`, render a
  "Only approved signers can sign this NDA" screen (same visual pattern as the existing
  "Not Ready for Signature" card) instead of the signing UI. The screen tells them to ask
  a teammate who can sign, and links back to the dashboard.
- Anonymous visitors and members who can sign are unaffected.

## Testing

- Manual: as a contributor, an NDA in `AWAITING_PARTY_A_SIGNATURE` shows the notify button
  + message, never "Sign Now"; clicking opens the picker listing signers, and notifying a
  chosen subset emails/notifies only those; direct-navigating to the sign token shows the
  blocked screen. As a signer, "Sign Now" works and the sign page renders normally.
- `notify-signer` ignores a client `recipientUserIds` containing non-signer or other-org
  user IDs (intersection with the authoritative set only).
- Confirm no regression for received (Party B) NDAs and for anonymous counterparty links.

## Files touched

- `src/components/dashboard/DashboardClient.tsx` — branch condition + helper line; open the
  signer picker modal instead of notifying directly.
- `src/components/dashboard/NotifySignerModal.tsx` *(new)* — checkbox multi-select modal.
- `src/app/api/organization/signers/route.ts` *(new)* — `GET` list of authorized signers.
- `src/app/api/ndas/notify-signer/route.ts` — accept optional `recipientUserIds` and filter.
- `src/app/sign-nda-public/[token]/page.tsx` — authenticated non-signer guard for Party A.
