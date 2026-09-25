# Strategy Implementation Roadmap (29 Jun 2026)

> **RECONCILED 2026-09-20 — this is now a historical record, not a worklist.**
> Every B1–B7 item below is complete. This document spent ten weeks reporting shipped features as
> open work. It was checked line by line against the code on 2026-09-20 and updated.
> **The live launch worklist is `docs/launch/README.md`.** Do not drive work from this file.

Implementation plan for the gaps identified in the 29 Jun 2026 strategy review. Decisions are
recorded in `docs/strategy-gap-checklist.md`; product rules in `CLAUDE.md`. MVP-critical items
first; non-MVP deferred at the bottom.

Status legend: ☐ not started · ◑ in progress · ☑ done

---

## B1 — Pricing → $9 / $50  ☑
- [x] Price-ID env vars set in `.env.local` (all four: PRO monthly/annual, TEAM monthly/annual).
      Add live-mode equivalents to Vercel Production env vars before next production deploy.
- [x] `src/components/marketing/PricingSection.tsx` — $9 / $50, annual $7.65 / $42.50.
- [x] `src/app/settings/billing/page.tsx` — `getPlanPrice()` updated.
- [x] `src/components/billing/CheckoutModal.tsx` — `PLAN_PRICING` updated.
- [x] `src/lib/stripe-price-ids.ts` (`priceIdFor` / `planFromPriceId`) maps all four IDs.
- [x] `src/billing/planLimits.ts` (`PLAN_LIMITS`) — no change needed (limits already matched).

## B2 — Signature evidence + authority-to-sign  ☑  (legal defensibility, MVP)

> Verified 2026-09-20. `src/lib/signatureEvidence.ts` exists and exports `AUTHORITY_CONSENT_TEXT`,
> `getClientIp`, `sha256Hex`, `templateSnapshot`, `partiesSnapshot`, `authorityConsent`. Both sign
> routes import and use all of them. The authority checkbox is in both sign clients and enforced
> server-side with a 400 (`sign/route.ts:29`, `sign-public/route.ts:26`). `/esignature-consent`
> ships the mirrored language. Two known nits, neither launch-blocking: both routes record
> `authorityConsent(true)` as a literal rather than echoing the received flag, and `agreementHash`
> is only computed on the COMPLETE branch, so a first partial signature has no hash.

**Goal:** when an NDA is signed, capture enough tamper-evident proof of *who* signed, *from
where*, *what exact document*, and *that they affirmed authority* — so an executed NDA holds up
later even if the Standard NDA template is changed.

The two routes that actually apply a binding signature are `src/app/api/ndas/sign/route.ts`
(company / Party A, guarded by `canSignNDA`) and `src/app/api/ndas/sign-public/route.ts`
(counterparty / Party B via secure link). `generate-and-save` and `send-for-signature` are
*send* paths (guarded by `canSendNDA`) and are out of scope. Evidence is stored in the existing
`AuditEvent` (`metadata Json?` + `ipAddress` columns already exist — **no migration needed**).

- [x] **New shared helper `src/lib/signatureEvidence.ts`** so UI and server agree on wording and
      logic isn't duplicated:
  - `getClientIp(request)` — `x-forwarded-for` (first hop) → `x-real-ip` fallback.
  - `sha256Hex(buffer)` — `crypto.createHash('sha256').update(buffer).digest('hex')`.
  - `templateSnapshot(templateId)` — `{ templateId, version, name }` via
    `getTemplateById` (`src/lib/templateManager.ts`). **Captured at signing time** and written
    verbatim into the audit record — never re-derived from the active template later.
  - `AUTHORITY_CONSENT_TEXT` — the exact checkbox sentence, imported by both the UI and the
    server so the recorded consent text always matches what the signer saw.
- [x] **`sign-public/route.ts`** — accept `authorityConfirmed` in the body; reject with 400 if not
      `true`. On every SIGNED audit event add `ipAddress`, `templateSnapshot`, and
      `authority: { confirmed, text, at }`. On the COMPLETE branch (final PDF already generated)
      add `agreementHash = sha256Hex(pdfBuffer)` to the audit metadata.
- [x] **`sign/route.ts`** — same as above for the authenticated Party A signature.
- [x] **`SignNDAPublicClient.tsx`** — add a required authority-to-sign checkbox above Submit
      (design-system styling per `.claude/skills/stitch-design.md`); block submit until checked;
      send `authorityConfirmed: true`. Use `AUTHORITY_CONSENT_TEXT` as the label.
- [x] **`SignNDASimpleClient.tsx`** — same checkbox near the sign/save actions; gate submit.
- [x] Mirror the authority + e-signature consent language — shipped as the dedicated
      `/esignature-consent` page rather than inside Terms.
- [x] Update Formi (`src/ai/prompts/formi_systemPrompt.ts`) so it can explain what evidence is
      recorded at signing and the authority-to-sign affirmation (per the Formi-sync rule).

## B3 — "No legal advice" disclaimer in UI  ☑  (MVP)
- [x] Shipped as `src/components/ui/legal-disclaimer.tsx`, rendered on the sender fill page, the
      counterparty fill/review page, and both sign pages. (`/review-nda/[token]` named in the
      original plan was dead and has since been deleted; the counterparty review step reuses
      `fillndahtml-public`, which carries the disclaimer.)
      Not present on `/view-nda/[draftId]`, `/viewpdf/[id]` or `/mydrafts` — read-only surfaces,
      judged out of scope.

## B4 — Receiver reminders at 48h & 5 days  ☑  (MVP)
- [x] `src/app/api/cron/nda-reminders` scheduled daily at 05:00 UTC in `vercel.json`, fails closed
      without `CRON_SECRET`. Idempotent via `NdaDraft.reminder48hSentAt` / `reminder5dSentAt`
      (migration `20260629000000`). Known rough edge: the reminder targets the Party B signer even
      when the NDA is waiting on Party A, so your own company's delay can still nag the
      counterparty. Filed as post-launch polish.

## B5 — 2FA sign-in  ☑  (MVP — config only, no code)
- [x] No product code is required or possible: `/settings/account-security` renders Clerk's
      `<UserProfile />`, whose Security tab exposes 2FA as soon as MFA is enabled in the Clerk
      dashboard. Steps are documented in `docs/2fa-setup.md`. **The dashboard toggle itself is
      still pending on the production Clerk instance — tracked in
      `docs/launch/phase-0-external-setup.md` §0.2.**

## B6 — Legal/compliance pages  ☑  (founder-drafted text shipped; counsel review still pending)
- [x] Added placeholder routes (PageHero + "coming soon" card, design-system compliant):
      `src/app/esignature-consent`, `src/app/standard-nda`, `src/app/nda-governance`,
      `src/app/nda-changelog`. Footer-linked (Legal + new "The Standard NDA" column).
- [x] Replaced placeholder copy with founder-drafted text (commit `1d6809a`): `/standard-nda`
      renders all 16 clauses of `templates/professional_mutual_nda_v1.hbs` v1.0,
      `/esignature-consent` mirrors `src/lib/signatureEvidence.ts`, `/nda-governance` is complete,
      and `/nda-changelog` is driven by `src/lib/ndaChangelog.ts`. All seven legal routes exist and
      are nav-linked.
- [ ] **Standing obligation, not a launch blocker:** qualified legal counsel must still review all
      seven documents. Launching with founder-drafted text plus a prominent disclaimer was the
      explicit decision (2026-07-09). Do this in parallel with launch, and before scaling or
      removing any beta framing.

## B7 — Role rename: OWNER→ADMINISTRATOR, isApprover→isSigner  ☑
- [x] Schema: `MembershipRole.OWNER`→`ADMINISTRATOR`, `Membership.isApprover`→`isSigner`
      (`prisma/schema.prisma`) + migration `20260629000001_rename_owner_to_administrator_and_signer_flag`
      (`ALTER TYPE … RENAME VALUE`, `ALTER TABLE … RENAME COLUMN`).
- [x] Source: `organizationRoles.ts` (guards, descriptions, `updateMemberSigner`), `team.ts`,
      `settings/team/page.tsx`, `api/user/role`, `notifications.ts`, `company-profile`, `drafts`,
      `sign-nda/SignNDASimpleClient.tsx`, tests. Formi prompt roles + status flow updated; CLAUDE.md
      roles updated. Permission model unchanged. Role-guard vitest: 10/10 pass.
- [x] `npx prisma generate` has been run — `tsc --noEmit` passes clean against the new enum value
      and field names, which it could not do with a stale client. Local and Vercel Preview
      databases are migrated (all 25 migrations).
- [ ] **`prisma migrate deploy` against PRODUCTION is still unverified** and is the single highest
      -risk item in the launch. Tracked in `docs/launch/phase-0-external-setup.md` §0.1.

---

## Deferred (non-MVP — do not build now)
- Enterprise tier: SSO, legal-approval workflow, private NDA standard, CRM integrations, custom API.
- Distinct "Legal approver/filler" role (today covered by administrator + signer toggle).
- Custom NDA upload + AI-assisted management of externally drafted NDAs.
- Audit-log export UI; webhooks / Zapier; public API; advanced analytics.

## Verification
- **Pricing:** `/#pricing`, `/settings/billing`, checkout modal show $9 / $50 monthly + 15% annual;
  Stripe **test-mode** checkout (PRO + TEAM, monthly + annual) maps price → correct `BillingPlan`.
- **Signature evidence:** complete a public sign in test mode; inspect the `AuditEvent` for
  `ipAddress`, document hash, and snapshotted version; submit blocked until the checkbox is checked.
- **Disclaimer:** renders on fill/review/sign, respects reduced-motion / design tokens.
- **Reminders:** seed a stale NDA, run the cron, confirm a single email + `reminderSentAt` (idempotent).
- **Legal pages:** four new routes render and are footer-linked.
- Run `vitest` for touched billing/limits/util logic.
