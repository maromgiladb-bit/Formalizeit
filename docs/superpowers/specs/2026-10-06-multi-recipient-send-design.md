# Multi-recipient send ("one NDA, many receivers") — design

**Status:** planned, **post-launch** (soon after MVP launch). Not in MVP scope.
**Date:** 2026-10-06

## Goal

Let a sender send the same standard NDA to up to 20 different counterparties at once, for example
investors, vendors, or event attendees, using **one shared link**. Each counterparty ends up with
their **own** two-party NDA with the sender's company.

Out of scope (not MVP, possibly later): several people at *one* counterparty company signing one
single NDA. That needs multiple Party B signers on one document and is a separate, larger change.

## Decisions (founder, 2026-10-06)

| # | Decision |
|---|----------|
| 1 | Use case: the same NDA to many *different* counterparties. Multi-signer-per-party later, not MVP. |
| 2 | Each copy counts as one NDA toward plan limits. Feature is **PRO and up only**. |
| 3 | Add a one-press "Receiver fills all their details" button on the fill page (sets every `party_b_*_ask_receiver` flag). It stays optional for normal single sends; manual filling still works. |
| 4 | Batch copies are **sign-only**: no negotiation (see Rationale). |
| 5 | **One shared link** for the whole batch, not one link per recipient. |
| 6 | Cap: **20** copies per batch. |
| 7 | Timing: post-launch. |

## Why it fits the current model

The data model is strictly two-party. An `NdaDraft` has one receiver, one `workflowState`, Party B
fields in `content`, one signed PDF and one agreement hash. So a batch does **not** put several
receivers on one draft. It **makes one copy of the draft per receiver** when that receiver claims
the link. After that, each copy is an ordinary draft, and all of the following work unchanged:
signing, signature evidence (the template snapshot is taken at signing, per draft), agreement
hash, 48h/5d reminders, retention, the counterparty claim/linking flow, and the dashboard rows.

## Rationale for sign-only

- The product's core idea is identical terms for everyone. Twenty parallel negotiations on one
  batch work against that.
- It keeps every copy's legal content identical, so "batch" means one set of terms.
- Escape hatch: the receiver can use **"Ask the sender for changes"**. This sends the sender a
  message (notification + email) and changes nothing on the copy. If they agree, the sender can
  send that party a normal individual NDA.

## Flow

**Sender**
1. Fills the NDA as usual. In batch mode, all Party B fields are forced to "receiver fills"
   (a shared link can't carry per-person details).
2. In the send modal, chooses **"Send to several people (one link)"** (PRO+). Gets one link plus
   a pre-written subject and body, and shares them through the existing share menu. Initial
   delivery stays links-only.
3. The dashboard shows the batch as one group row, for example "Investor NDA · 7 of 20 claimed ·
   4 signed", which expands to the individual copies. The sender can **close the link** at any
   time, which stops new claims.
4. **Countersign all:** a signer or administrator signs every copy the receivers have already
   signed in one action. They tick the authority checkbox once, and each copy still gets its own
   evidence record and hash. This is guarded by `canSignNDA`.

**Receiver**
1. Opens the shared link and sees the NDA preview (Party A filled in, "not legal advice"
   disclaimer).
2. Enters their email. The platform emails a 6-digit code. This is a receiver-requested email, so
   it is consistent with the links-only rule.
3. After the code is verified, a copy is created for them (their own draft + `Signer`). They are
   taken to the existing public fill page in sign-only mode, fill in their Party B details, tick
   the authority checkbox, and sign.
4. Opening the link again with the same email takes them back to their existing copy. One email
   gets one copy per batch.

Party A's countersignature is the control point. Anyone who has the link can claim a copy, but
nothing is executed until the sender's company countersigns.

## Data model (one additive migration)

```prisma
model NdaBatch {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId  String    @map("organization_id") @db.Uuid
  createdByUserId String    @map("created_by_user_id") @db.Uuid
  sourceDraftId   String    @map("source_draft_id") @db.Uuid   // locked after the link is created
  title           String?
  content         Json                                         // snapshot copied into each claim
  token           String    @unique                            // shared-link secret
  maxClaims       Int       @default(20) @map("max_claims")
  closedAt        DateTime? @map("closed_at")
  expiresAt       DateTime? @map("expires_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  claims          NdaBatchClaim[]
  drafts          NdaDraft[]
  @@map("nda_batches")
}

model NdaBatchClaim {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  batchId       String    @map("batch_id") @db.Uuid
  email         String                                       // lower-cased
  codeHash      String?   @map("code_hash")
  codeExpiresAt DateTime? @map("code_expires_at")
  attempts      Int       @default(0)
  verifiedAt    DateTime? @map("verified_at")
  draftId       String?   @unique @map("draft_id") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")
  @@unique([batchId, email])
  @@map("nda_batch_claims")
}

// NdaDraft gains:
//   batchId String? @map("batch_id") @db.Uuid   (+ index, relation to NdaBatch)
// Sign-only mode = batchId != null (no extra flag).
```

The source draft is locked once its batch link exists. It is hidden from the dashboard (the batch
row represents it) and does not count as a sent NDA.

## Backend

- Add a `batchSend: boolean` field to `PLAN_LIMITS` (`src/billing/planLimits.ts`): FREE false,
  PRO/TEAM/ENTERPRISE true. Add an `assertCanBatchSend(orgId)` check in `src/organizations/limits.ts`.
- `assertCanSendNda` keeps counting claimed copies as normal SENT/SIGNED drafts. It is checked at
  each claim, so if a batch link stays open after a downgrade it stops accepting claims.
- Move the per-recipient body of `send-for-review/route.ts` into a shared
  `sendDraftForReview(...)` helper. The existing route and batch claims both use it, so the
  single-send behavior stays the same.
- Routes:
  - `POST /api/ndas/batches`: `{ draftId }` → `canSendNDA`, `assertCanBatchSend`, validate
    Party A fields, create `NdaBatch`, return the link + suggested subject/body.
  - `POST /api/ndas/batches/[id]/close`
  - `POST /api/ndas/batches/[id]/countersign`: `canSignNDA`, authority checkbox; runs the existing
    per-draft signing logic for each copy where Party B has signed.
  - Public (allow signed-out in middleware): `GET /api/public/batch/[token]` (preview),
    `POST .../claim` `{ email }` (send code; rate-limited per IP and per email),
    `POST .../verify` `{ email, code }` (create the copy in a transaction that enforces
    `maxClaims`, return the public fill URL).
- Sign-only enforcement on the server: when `draft.batchId` is set, the public input/change
  routes (`submit-input`, `request-changes`, etc.) accept only Party B identity fields and reject
  everything else. The UI hiding the controls is not enough on its own.
- Evidence: record `emailVerifiedAt` (from the claim) in the signer evidence. This is a stronger
  identity signal than the current "possession of a personal link".
- Reminders: unchanged per copy. They apply only after a claim, because no email is known before.

## UI (Calm Precision)

- Fill page: "Receiver fills all their details" one-press toggle (also useful for single sends).
- Send modal: a choice between "One person" (current flow) and "Several people (one link)",
  shown as a PRO+ upsell on FREE. The result screen shows the single link + share menu + claim
  cap note.
- Public batch landing: preview, email field, code step. Reuse the existing public-fill styling.
- Public fill page in sign-only mode: deal fields read-only, the "suggest changes" UI replaced by
  "Ask the sender for changes".
- Dashboard: a batch group row with claimed/signed counts, expand to copies, "Close link",
  "Countersign all (n)". Use `StatusPill` tones.

## Docs and knowledge to update (same PR as the code)

- `CLAUDE.md`: product rules (batch send, sign-only copies, PRO+), rule 9 (receiver-requested
  verification code is an allowed platform email), plan limits section.
- Formi: `PRODUCT_KNOWLEDGE` in `src/ai/prompts/formi_systemPrompt.ts`, plus `planFacts()`
  derived from `PLAN_LIMITS.batchSend` (no hardcoding).
- Help/FAQ entries; plans/pricing feature list (PRO+ feature).
- E-Signature Consent page: email-code verification step for batch receivers.
- Privacy page: self-identified receiver emails and verification codes.
- Terms: the sender is responsible for who they share a batch link with.
- Standard NDA, Governance Policy, Changelog: no change (the legal text is the same).
- Legal counsel review list: add the batch-link responsibility wording.

## Tests (Vitest)

Claim → verify → copy created; same email resumes its copy; 21st claim rejected; closed or
expired link rejected; wrong code / too many attempts; FREE org blocked; sign-only routes reject
non-Party-B fields; countersign-all requires `canSignNDA` and skips copies Party B hasn't signed;
single-send path unchanged after the helper extraction.

## Build order

1. Schema + `batchSend` limit + helper extraction (no behavior change).
2. Batch creation, public claim/verify, sign-only enforcement.
3. Countersign all + dashboard grouping + close link.
4. Docs, legal pages, Formi.

## Open questions

- A. Shared link only (planned), or also an optional "individual links" mode later, which is
  the only way to pre-fill each receiver's details by hand?
- B. Who can claim: anyone with the link (planned; countersign is the gate), or an optional
  allowlist of emails or an email domain?
- C. Countersign: "Countersign all" (planned), or let a signer pre-authorize automatic
  countersigning when each receiver signs? Pre-authorizing is faster but weaker evidence. Get
  counsel's view.
