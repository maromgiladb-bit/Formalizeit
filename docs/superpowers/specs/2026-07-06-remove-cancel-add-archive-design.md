# Remove NDA cancellation → expire-and-delete + archive finalized

**Date:** 2026-07-06
**Status:** Approved (design)

## Problem / goal

Today an in-progress NDA can be **cancelled** (sets `NdaStatus.CANCELLED`). We are removing
cancellation entirely. In-progress NDAs are never cancelled — they simply run until their signing
link expires. Once expired, the sender may delete them (removed from dashboard **and** DB).
Finalized (signed) NDAs are never deleted; instead they can be **archived** into a separate
Archived list on the dashboard, and unarchived back.

## Behavior summary

| NDA state | Today | After this change |
|---|---|---|
| Draft (never sent) | Edit · Delete | Edit · Delete *(unchanged)* |
| In-progress (sent/awaiting, link live) | **Cancel** | *no destructive action* — runs until it expires |
| Expired (signing link lapsed) | Resend | **Resend · Delete** (hard-delete from dashboard + DB) |
| Finalized (signed / `COMPLETE`) | View PDF | View PDF · **Archive** |
| Archived finalized | — | shown in **Archived** filter; View PDF · **Unarchive** |
| Legacy `CANCELLED` (existing prod rows) | Cancelled badge | Cancelled badge · **Delete** |

## Definitions

- **Finalized** = `NdaDraft.status === 'SIGNED'` or `workflowState === 'COMPLETE'`.
- **Expired** = the NDA has a signer that is not `SIGNED`/`DECLINED` and is either status `EXPIRED`
  or past its `expiresAt`. This is the same predicate the dashboard already computes for the
  Resend button; it is extracted into a shared helper (see below).

## Data model

- Add `archivedAt DateTime?` (nullable, default null) to `NdaDraft`.
  New migration `20260706000000_add_nda_archived_at`.
- **Keep** `NdaStatus.CANCELLED` and `NdaEventType.CANCELLED` enum values. Existing production rows
  and audit events reference them; removing enum values would require a data migration and risks
  breaking legacy data. We stop *creating* new cancellations but continue to display and allow
  deletion of legacy cancelled rows.

## API changes

1. **Delete** `src/app/api/ndas/[draftId]/cancel/route.ts` and its folder.

2. **Harden** `DELETE /api/ndas/drafts/[id]`. Today it deletes any `NdaDraft` the caller has
   permission for (deletion is only UI-gated to draft rows). Make the guard authoritative:
   - Allow delete when the row is `DRAFT` status, **or** expired (per the shared predicate),
     **or** legacy `CANCELLED`.
   - Refuse with **409** for active in-flight NDAs (sent/awaiting, link live) and finalized NDAs.
   - Keep the existing permission check (`isOrganizationOwner || canSignNDA || created-by-self`).
   - Expiry is computed server-side by loading the draft's signers and applying the shared predicate.

3. **New** `POST /api/ndas/[draftId]/archive` accepting JSON `{ archived: boolean }`.
   - Sets `archivedAt = new Date()` when `archived: true`, clears to `null` when `false`.
   - Guard: only finalized NDAs (SIGNED / COMPLETE) may be archived/unarchived; otherwise 409.
   - Permission: `canSendNDA(activeMembership)` (the same members who could previously cancel).
   - Scoped to the active organization (`organizationId` match), like the other NDA routes.
   - No new `NdaEventType` — archive does not write an audit event (avoids enum churn; archiving is
     non-destructive and reversible).

4. **Shared helper** in `src/lib/signLink.ts`: `isSignerExpired(signer, now?)` returning whether a
   single signer represents a lapsed link (not SIGNED/DECLINED, and EXPIRED or past `expiresAt`).
   `dashboard/page.tsx` and the DELETE guard both use it so "expired" has one definition.

## Dashboard

`src/components/dashboard/DashboardClient.tsx`:

- **Remove** `handleCancel`, `isCancellable`, `cancellingId` state, the Cancel button block, and the
  `handleCancel` import of the cancel endpoint. Keep the legacy `'cancelled'` status badge in
  `getWorkflowStatusInfo`.
- **Delete** action: render the existing delete button (which already calls
  `DELETE /api/ndas/drafts/[id]`) on **expired** created rows and **legacy-cancelled** rows, in
  addition to drafts.
  - **Confirmation dialog for hard delete.** For expired / legacy-cancelled rows the confirm copy
    is explicit and distinct from the plain draft-delete confirm — it states that this permanently
    removes the NDA **and its audit trail** from the database and cannot be undone. (Draft delete
    keeps its existing lighter confirm.)
- **Archive** actions: add `handleArchive` / `handleUnarchive` and `archivingId` state calling
  `POST /api/ndas/[draftId]/archive`. Optimistically update `archivedAt` in `localNdas`.
  - Finalized created rows show **Archive**; archived rows show **Unarchive** (both alongside View PDF).
- Add `archivedAt?: Date | null` to the `NDA` interface.

`src/app/dashboard/page.tsx`:

- Select `archivedAt` for created NDAs and pass it through.
- Use the shared `isSignerExpired` helper when computing the `expired` flag.

**Archived view / filtering:**

- Add filter key `'archived'` and an **Archived** stat card. `filteredNdas` and every existing
  filter/stat exclude rows where `archivedAt != null`. The Archived filter shows only those rows.
- Archived rows render View PDF · Unarchive.
- Archive applies to created finalized NDAs only (see scope note).

## Scope: received NDAs excluded from archive

A "received" dashboard row references the **sender org's** `NdaDraft`. Setting `archivedAt` on it
would wrongly hide it from the sender. Per-user archiving of received NDAs would require a separate
per-user field/table and is **out of scope** here. Archive UI is shown only for `type === 'created'`
finalized rows.

## Formi

Formi already states there is no cancel ("There's no 'cancel' — the sender just resends to issue a
fresh link"). Add two facts to `PRODUCT_KNOWLEDGE` in `src/ai/prompts/formi_systemPrompt.ts`:

- An expired NDA (lapsed signing link) can be deleted from the dashboard, which removes it permanently.
- A finalized (signed) NDA is kept and can be archived into an Archived list on the dashboard, and
  unarchived back. Finalized NDAs cannot be deleted.

## Testing (Vitest)

- `src/lib/__tests__/signLink.test.ts`: `isSignerExpired` — signed/declined never expired; EXPIRED
  status expired; past `expiresAt` expired; future `expiresAt` not expired.
- DELETE guard: allows draft / expired / legacy-cancelled; refuses active in-flight and finalized (409).
- Archive route: rejects non-finalized (409); sets and clears `archivedAt`.

## Out of scope / non-goals

- Removing the `CANCELLED` enum values or migrating legacy cancelled rows.
- Archiving received NDAs.
- Soft-delete / recycle bin for expired NDAs — deletion is a true hard-delete by request.
