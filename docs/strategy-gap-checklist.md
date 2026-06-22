# Strategy → Execution Checklist

Working list comparing the Standard NDA Platform strategy (22 Jun 2026) to the built product.
For each open item, fill in **Decision**: `keep current`, `apply`, or custom instructions.

## Already aligned (no action)
- [x] Single fixed standard mutual NDA, fill-only variables — `templates/template-config.json`
- [x] No-account receiver fill + sign — `src/app/fillndahtml-public/[token]`, `src/app/sign-nda-public/[token]`
- [x] Receivers free; send-only limits
- [x] Records email + timestamp + IP + version — `AuditEvent` + `NdaRevision`
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
  - Decision: (deferred — no decision yet)
- [x] **"No legal advice" prominence** — Decided: Formi only for now. Done: persistent disclaimer footer in `NdaAgentAvatar.tsx` + stronger system-prompt aside. Rest of UI deferred.
- [x] **Jurisdiction model** — Decided: leave `governing_law` free text. No change.
- [x] **Pricing architecture** — Decided: 4-tier model. Done: added `TEAM` plan (migration `20260622000002`); PRO reverted to unlimited/1-seat, TEAM unlimited/10-seats (`planLimits.ts`); Stripe `priceIdFor`/`planFromPriceId`, checkout `plan` arg, webhook price→plan; 4-tier copy across PricingSection, CheckoutModal, settings/billing, FAQ, help, Formi `planFacts`. **Supersedes the §1 Pro=10/month number.** New env: `STRIPE_TEAM_MONTHLY_PRICE_ID`, `STRIPE_TEAM_ANNUAL_PRICE_ID` (user creates prices in Stripe). Note: unbuilt features were **trimmed from the pricing/help/FAQ copy** (Jun 2026) to keep the page honest. Re-add to copy as each ships. Trimmed / to-build: **reminders**, **expiry tracking** (both §3), **counterparty directory**, **export history**, **audit-log export UI** (§3), **analytics**, **API access** (§3), **custom branding**. (search, role-based permissions, shared workspace, central repo, audit trail = already built, kept.)

## 3. Missing
- [ ] **Automatic reminders (48h/5d)** — not built (only `cleanup-deleted-users` cron).
  - Decision:
- [ ] **NDA expiry tracking** — only invite link expires; no term-expiry alerts.
  - Decision:
- [ ] **Authority-to-bind checkbox** at signing — none in `src/app/sign-nda/SignNDASimpleClient.tsx`.
  - Decision:
- [ ] **Electronic Signature Consent** capture + page — missing.
  - Decision:
- [ ] **Agreement hash** on execution — not computed.
  - Decision:
- [ ] **2FA** — not enabled (Clerk supports).
  - Decision:
- [ ] **Public Standard-NDA text page** (review before accepting) — no public template view.
  - Decision:
- [ ] **Public NDA changelog page** — internal `templates/CHANGELOG.md` unshipped.
  - Decision:
- [ ] **Onboarding: review NDA + accept platform terms** — Now: only names workspace (`OnboardingForm.tsx`).
  - Decision:
- [ ] **Public API access** — Enterprise feature, not implemented.
  - Decision:
- [ ] **Webhooks / Zapier (CRM triggers)** — not built.
  - Decision:
- [ ] **Audit-log export UI** — data via API, no export UI.
  - Decision:
- [ ] **Legal pages: E-Sign Consent + NDA Governance Policy** — missing.
  - Decision:

## 4. Positioning
- [ ] **Trust / network-effects narrative** — Now: speed-led ("NDA in minutes"). Strategy: lead with trust infrastructure / network effects.
  - Decision:
