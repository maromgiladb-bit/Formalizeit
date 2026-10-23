# Strategy → Execution Checklist

> **RECONCILED 2026-09-20.** §3 was checked line by line against the code; seven items listed as
> missing are in fact built and are now ticked with evidence. What remains open is open by
> decision, not by neglect. **The live launch worklist is `docs/launch/README.md`** — drive work
> from there, not from this file.

Working list comparing the Standard NDA Platform strategy (22 Jun 2026) to the built product.
For each open item, fill in **Decision**: `keep current`, `apply`, or custom instructions.

## 29 Jun 2026 review (post-meeting decisions)

New strategy doc (`29_06Formalizeit_Strategy.pdf`). Decisions taken — see the approved plan and
`CLAUDE.md`:

- **Pricing → apply:** PRO **$9/mo**, TEAM **$50/mo**, annual = **15% off** ($7.65 / $42.50).
  **Supersedes** the $19/$75 shipped in commit `cf267af` and the §2 pricing note. PRO/TEAM stay
  unlimited NDAs; FREE stays 3 total. Update PricingSection, settings/billing, CheckoutModal,
  Stripe price IDs + env. (§1/§2)
- **No-legal-advice prominence → apply (MVP):** add the disclaimer to the fill/review/sign pages
  (not just Formi/Terms/FAQ). Overrides the earlier "Formi only" deferral in §2.
- **Signature evidence → apply (MVP):** capture **IP**, a **snapshot of the exact template
  version actually signed**, and an **agreement hash** (SHA-256 of the PDF); add an
  **authority-to-sign checkbox** (company's responsibility) before signing. (§3)
- **Reminders 48h/5d → apply (MVP).** (§3)
- **2FA sign-in → apply (MVP).** (§3)
- **Legal pages → apply:** Electronic Signature Consent, viewable Standard NDA, NDA Governance
  Policy, NDA Changelog. (§3)
- **Role rename → apply:** `OWNER` → `ADMINISTRATOR`, `isApprover` → `isSigner` (strategy
  terminology; permission model unchanged). Distinct "Legal approver/filler" role deferred.
- **Deferred (non-MVP):** Enterprise tier, custom-NDA upload + AI, audit-log export UI,
  webhooks/Zapier, public API, advanced analytics.

## Already aligned (no action)
- [x] Single fixed standard mutual NDA, fill-only variables — `templates/template-config.json`
- [x] No-account receiver fill + sign — `src/app/fillndahtml-public/[token]`, `src/app/sign-nda-public/[token]`
- [x] Receivers free; send-only limits
- [x] Records email + timestamp — `AuditEvent` + `NdaRevision` (IP field exists but is **not
  populated**; document hash + signed-version snapshot **not yet captured** — see 29 Jun review)
- [x] Audit trail — `src/lib/writeActivity.ts`
- [x] S3 storage + presigned URLs — `src/lib/s3.ts`, `NdaPdf`
- [x] Dashboard status + search — `src/components/dashboard/DashboardClient.tsx`
- [x] ToS / Privacy / "not a law firm" — `src/app/terms`, `src/app/privacy`, `src/app/help`
- [x] Optional extra clauses supported (IP / non-solicit / exclusivity / additional)

## 1. Contradictions (decide the number/policy)
- [x] **Free send limit** — Decided: keep 3 total forever. Done (no code change; copy reconciled).
- [x] **Paid "unlimited"** — Decided: PRO = 10/month. Done: `planLimits.ts` (`maxActiveDrafts` 10, period `month`, `getCurrentMonthStart`), `assertCanSendNda`, tests, and all plan copy.
- [x] **Free retention** — Decided: 5 years (free included). Phase A done: copy + Privacy §6 updated; data kept indefinitely today. Phase B pending: auto-delete-with-notice cron (see Future tasks).
- [x] **Counterparty copy access** — Decided: PDF emailed on execution (already sent to both parties), 5-year retention, downloadable after signup. Phase A done. Phase B pending: robust claim-by-token linkage (different signup email).

### Phase B (done — June 2026)
- [x] **Retention auto-delete + notice cron** — added `NdaDraft.completedAt` + `retentionNoticeSentAt` (migration `20260622000000`); `RETENTION_DELETED` audit type (`20260622000001`). Cron `src/app/api/cron/retention-cleanup` notices at 5y−30d (email + in-app) and at 5y deletes S3 PDFs + content, keeping the draft row + audit stub. FREE orgs only. Scheduled in `vercel.json`.
- [x] **Robust counterparty linkage** — `claimPendingSigners` now case-insensitive + multi-email; `ensureDbUser` claims all verified Clerk emails and honours a `pending-claim-signer` cookie (claim-by-token via `/api/claim`, CTA on the public sign success page) so a different signup email still keeps access; `incoming` matches all verified emails. (Webhook backfill skipped — `ensureDbUser` covers it on first authed load.)

## 2. Partial (exists, short of strategy)
- [ ] **Opened/signed real-time status** — Now: dashboard status + `VIEWED`, no link-open tracking. Strategy: live pending/opened/signed.
  - Decision: **deferred to post-launch (2026-09-20).** The dashboard already distinguishes
    "Your turn: review" from "Waiting on them", which covers the user's real question. True
    link-open tracking needs a tracking pixel or a redirect hop and is not worth delaying launch.
- [x] **"No legal advice" prominence** — Decided: Formi only for now. Done: persistent disclaimer footer in `NdaAgentAvatar.tsx` + stronger system-prompt aside. Rest of UI deferred.
- [x] **Jurisdiction model** — Decided: leave `governing_law` free text. No change.
- [x] **Pricing architecture** — Decided: 4-tier model. Done: added `TEAM` plan (migration `20260622000002`); PRO reverted to unlimited/1-seat, TEAM unlimited/10-seats (`planLimits.ts`); Stripe `priceIdFor`/`planFromPriceId`, checkout `plan` arg, webhook price→plan; 4-tier copy across PricingSection, CheckoutModal, settings/billing, FAQ, help, Formi `planFacts`. **Supersedes the §1 Pro=10/month number.** New env: `STRIPE_TEAM_MONTHLY_PRICE_ID`, `STRIPE_TEAM_ANNUAL_PRICE_ID` (user creates prices in Stripe). Note: unbuilt features were **trimmed from the pricing/help/FAQ copy** (Jun 2026) to keep the page honest. Re-add to copy as each ships. Trimmed / to-build: **reminders**, **expiry tracking** (both §3), **counterparty directory**, **export history**, **audit-log export UI** (§3), **analytics**, **API access** (§3), **custom branding**. (search, role-based permissions, shared workspace, central repo, audit trail = already built, kept.)

## 3. Missing → mostly BUILT (reconciled 2026-09-20)

### Built and verified in code
- [x] **Automatic reminders (48h/5d)** — `src/app/api/cron/nda-reminders`, scheduled 05:00 UTC in
  `vercel.json`, fails closed without `CRON_SECRET`, idempotent via `NdaDraft.reminder48hSentAt` /
  `reminder5dSentAt` (migration `20260629000000`).
- [x] **Authority-to-bind checkbox** — present in both sign clients and enforced server-side with a
  400 in `sign/route.ts:29` and `sign-public/route.ts:26`. Label text comes from the shared
  `AUTHORITY_CONSENT_TEXT`, so UI and audit record cannot drift.
- [x] **Electronic Signature Consent** capture + page — `/esignature-consent`, founder-drafted,
  mirrors `src/lib/signatureEvidence.ts`.
- [x] **Agreement hash** on execution — `sha256Hex(pdfBuffer)` written into the SIGNED audit event.
  Computed on the COMPLETE branch only, so a first partial signature carries no hash; accepted.
- [x] **2FA** — no code needed. `/settings/account-security` renders Clerk's `<UserProfile />`,
  which exposes 2FA once MFA is enabled in the Clerk dashboard. See `docs/2fa-setup.md`. The
  production dashboard toggle is tracked in `docs/launch/phase-0-external-setup.md` §0.2.
- [x] **Public Standard-NDA text page** — `/standard-nda` renders all 16 clauses of
  `templates/professional_mutual_nda_v1.hbs` v1.0 read-only.
- [x] **Public NDA changelog page** — `/nda-changelog`, driven by `src/lib/ndaChangelog.ts`.
- [x] **Legal pages: E-Sign Consent + NDA Governance Policy** — both ship with founder-drafted
  text. All seven required legal routes exist and are nav-linked. Counsel review remains a standing
  obligation in parallel with launch.

### Still open, deferred by decision (not launch blockers)
- [ ] **NDA expiry tracking** — only the invite link expires; no term-expiry alerts.
  - Decision: **deferred.** Post-MVP. Trimmed from pricing/help/FAQ copy so the page stays honest;
    re-add to copy when it ships.
- [ ] **Onboarding: review NDA + accept platform terms** — onboarding still collects only a
  workspace name (`OnboardingForm.tsx`), then creates the org plus an ADMINISTRATOR membership.
  - Decision: **deferred.** Adding a gate to onboarding works against "NDA in minutes". The
    `NdaUpdatePrompt` on the dashboard covers version acknowledgement post-hoc; note it is inert
    for new users until a second changelog entry exists.
- [ ] **Public API access** — Enterprise feature.
  - Decision: **deferred** (non-MVP, per the 29 Jun review).
- [ ] **Webhooks / Zapier (CRM triggers)**.
  - Decision: **deferred** (non-MVP, per the 29 Jun review).
- [ ] **Audit-log export UI** — data exists via API, no export UI.
  - Decision: **deferred** (non-MVP, per the 29 Jun review).

## 4. Positioning
- [ ] **Trust / network-effects narrative** — Now: speed-led ("NDA in minutes"). Strategy: lead with trust infrastructure / network effects.
  - Decision: **deferred to post-launch.** `CLAUDE.md` and `docs/brand-messaging.md` both codify
    speed-first with trust as the secondary message, and the site is built that way throughout.
    Revisit with real acquisition data rather than re-messaging on theory before launch.
