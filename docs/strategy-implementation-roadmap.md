# Strategy Implementation Roadmap (29 Jun 2026)

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

## B2 — Signature evidence + authority-to-sign  ☐  (legal defensibility, MVP)

**Goal:** when an NDA is signed, capture enough tamper-evident proof of *who* signed, *from
where*, *what exact document*, and *that they affirmed authority* — so an executed NDA holds up
later even if the Standard NDA template is changed.

The two routes that actually apply a binding signature are `src/app/api/ndas/sign/route.ts`
(company / Party A, guarded by `canSignNDA`) and `src/app/api/ndas/sign-public/route.ts`
(counterparty / Party B via secure link). `generate-and-save` and `send-for-signature` are
*send* paths (guarded by `canSendNDA`) and are out of scope. Evidence is stored in the existing
`AuditEvent` (`metadata Json?` + `ipAddress` columns already exist — **no migration needed**).

- [ ] **New shared helper `src/lib/signatureEvidence.ts`** so UI and server agree on wording and
      logic isn't duplicated:
  - `getClientIp(request)` — `x-forwarded-for` (first hop) → `x-real-ip` fallback.
  - `sha256Hex(buffer)` — `crypto.createHash('sha256').update(buffer).digest('hex')`.
  - `templateSnapshot(templateId)` — `{ templateId, version, name }` via
    `getTemplateById` (`src/lib/templateManager.ts`). **Captured at signing time** and written
    verbatim into the audit record — never re-derived from the active template later.
  - `AUTHORITY_CONSENT_TEXT` — the exact checkbox sentence, imported by both the UI and the
    server so the recorded consent text always matches what the signer saw.
- [ ] **`sign-public/route.ts`** — accept `authorityConfirmed` in the body; reject with 400 if not
      `true`. On every SIGNED audit event add `ipAddress`, `templateSnapshot`, and
      `authority: { confirmed, text, at }`. On the COMPLETE branch (final PDF already generated)
      add `agreementHash = sha256Hex(pdfBuffer)` to the audit metadata.
- [ ] **`sign/route.ts`** — same as above for the authenticated Party A signature.
- [ ] **`SignNDAPublicClient.tsx`** — add a required authority-to-sign checkbox above Submit
      (design-system styling per `.claude/skills/stitch-design.md`); block submit until checked;
      send `authorityConfirmed: true`. Use `AUTHORITY_CONSENT_TEXT` as the label.
- [ ] **`SignNDASimpleClient.tsx`** — same checkbox near the sign/save actions; gate submit.
- [ ] Mirror the authority + e-signature consent language in `src/app/terms/page.tsx`.
- [ ] Update Formi (`src/ai/prompts/formi_systemPrompt.ts`) so it can explain what evidence is
      recorded at signing and the authority-to-sign affirmation (per the Formi-sync rule).

## B3 — "No legal advice" disclaimer in UI  ☐  (MVP)
- [ ] Add a compact, persistent disclaimer to fill / review / sign pages
      (`src/app/fillndahtml/*`, `src/app/review-nda/[token]/*`, `src/app/sign-nda-public/[token]/*`)
      using existing design-system components per `.claude/skills/stitch-design.md`.

## B4 — Receiver reminders at 48h & 5 days  ☐  (MVP)
- [ ] New cron mirroring `src/app/api/cron/retention-cleanup` + a `vercel.json` schedule: find
      unsigned NDAs in `sent`/awaiting-signature past 48h / 5d, send via existing Resend helpers,
      stamp a `reminderSentAt` marker on the draft (new schema field) to avoid duplicates.

## B5 — 2FA sign-in  ☐  (MVP)
- [ ] Enable 2FA/MFA in the **Clerk dashboard**; surface it in account settings. Mostly config.

## B6 — Legal/compliance pages  ☑  (placeholders; final text from legal counsel later)
- [x] Added placeholder routes (PageHero + "coming soon" card, design-system compliant):
      `src/app/esignature-consent`, `src/app/standard-nda`, `src/app/nda-governance`,
      `src/app/nda-changelog`. Footer-linked (Legal + new "The Standard NDA" column).
- [ ] Replace placeholder copy with the final legal text when provided.

## B7 — Role rename: OWNER→ADMINISTRATOR, isApprover→isSigner  ☑
- [x] Schema: `MembershipRole.OWNER`→`ADMINISTRATOR`, `Membership.isApprover`→`isSigner`
      (`prisma/schema.prisma`) + migration `20260629000001_rename_owner_to_administrator_and_signer_flag`
      (`ALTER TYPE … RENAME VALUE`, `ALTER TABLE … RENAME COLUMN`).
- [x] Source: `organizationRoles.ts` (guards, descriptions, `updateMemberSigner`), `team.ts`,
      `settings/team/page.tsx`, `api/user/role`, `notifications.ts`, `company-profile`, `drafts`,
      `sign-nda/SignNDASimpleClient.tsx`, tests. Formi prompt roles + status flow updated; CLAUDE.md
      roles updated. Permission model unchanged. Role-guard vitest: 10/10 pass.
- [ ] **User must run** `npx prisma generate` then `npx prisma migrate deploy` — until then, Prisma
      queries using the new enum value/field will type-error (generated client still has old names).

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
