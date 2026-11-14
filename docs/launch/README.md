# Launch tracker — FormalizeIt MVP

Single source of truth for "what is left before we open public signups."
Started 2026-09-20, resuming a launch push that stalled 2026-07-12.

Plan of record: `C:\Users\marom\.claude\plans\i-havent-touched-my-smooth-church.md`

> Supersedes `docs/strategy-implementation-roadmap.md` as the live worklist. That document is a
> historical record of the 29 Jun 2026 strategy review and has been reconciled (Sept 2026) so it no
> longer misreports built features as open.

## Status legend

☐ not started · ◑ in progress · ☑ done · ⊘ deferred (not a launch blocker)

## Phases

| Phase | File | Owner | Status |
|---|---|---|---|
| 0 — External setup (Clerk/Stripe/Resend/DB) | [phase-0-external-setup.md](phase-0-external-setup.md) | **You** | ◑ Clerk, Resend setup, Gemini, S3, domain move, cron secret, `fra1` region, Sentry, Vercel Analytics, staging DB done; Stripe ⊘ deferred to after the free-beta launch (2026-10-23) |
| 1 — Finish the negotiation loop | [phase-1-negotiation.md](phase-1-negotiation.md) | Claude | ◑ code complete, browser verification pending |
| 2 — Essential hardening | [phase-2-hardening.md](phase-2-hardening.md) | Claude | ☑ code complete (Sentry DSN is a Phase 0 item) |
| 3 — Cleanup and doc reconciliation | [phase-3-cleanup.md](phase-3-cleanup.md) | Claude | ☑ done 2026-09-25 (3.6 deferred post-launch) |
| 4 — Verify and open signups | [phase-4-launch.md](phase-4-launch.md) | Both | ☐ not started |

### Resume here (updated 2026-11-14)

PR #18 merged to `main` 2026-11-14 (production migrations run first). Next: confirm the Clerk
Restricted sign-up mode, then Phase 4 on production with sign-up closed (Merge plan step 6). The beta plan with steps and estimates is in the
"FormalizeIt Beta Roadmap" artifact (2026-11-09).

Launch plan changed 2026-10-23: Stripe can't be activated yet, so the MVP launches as a **free
beta** (paid plans off, no 3-NDA limit) with **sign-up closed** until production has been tested.
Both are built (2026-10-24, branch `launch-fixes`) as switches — see "Launch switches" in
CLAUDE.md.

1. ☑ Both plans approved and built: free beta (`NEXT_PUBLIC_PAID_PLANS_ENABLED`, unset = free beta;
   FREE unlimited NDAs + 10 users; Pro/Team "Coming soon"; FAQ/Help/Terms §7/Formi updated) and a
   lightweight sign-up gate (`NEXT_PUBLIC_PRIVATE_BETA`, unset = closed in production; `/signup`
   and "Get started" go to a request-access form on `/coming-soon`). The full invite-list gate was
   dropped in favor of this. ☐ **You — Clerk still needs one setting** (found 2026-11-09): the gate
   only hides our sign-up pages; Clerk itself still creates accounts (e.g. "Continue with Google" on
   `/sign-in` for an unknown email, or a direct Clerk API call). In the **production** Clerk instance
   set Restrictions → Sign-up mode to **Restricted** (or Waitlist) while sign-up is closed, and back
   to Public when opening. Existing accounts keep signing in.
2. ☑ **Merge** (2026-11-09): `launch-fixes` merged into `feat/todolistimpl-2` after testing; see
   [Merge plan](#merge-plan-2026-10-23).
3. ☐ **Both — Phase 1 browser matrix and Phase 4** on staging, then on production with sign-up
   closed.
4. ⊘ Stripe activation (Phase 0.3): deferred until after the free-beta launch.

### Go-live switches (in this order)

1. ☐ **Open sign-up:** after Phase 4 passes on production, set `NEXT_PUBLIC_PRIVATE_BETA=off` in
   Vercel Production and redeploy. Check: `/signup` loads and "Get started" opens sign-up. To close
   again: set `on`, redeploy.
2. ☐ **Turn paid plans on** (later, once Stripe is live): email users at least 30 days ahead (Terms
   §7 promises it); set `FREE_ALLOWANCE_COUNTS_FROM` in `src/billing/planLimits.ts` to the launch
   date (merge that); set `NEXT_PUBLIC_PAID_PLANS_ENABLED=true` in Production; redeploy. Check:
   prices and upgrade buttons are back, a live checkout reaches PRO, a Free company's 4th send
   (counted from launch day) shows the upgrade notice. Roll back: set it to `false`, redeploy.
3. ☐ **Remove the Beta label:** set `BETA_LABEL = false` in `src/lib/featureFlags.ts`, only after
   legal counsel has reviewed the legal pages.

Done since the last update: Clerk, Resend, Gemini, S3, Sentry, staging DB, domain move to the root
`formalizeit.com` · launch-readiness audit blockers fixed (2026-10-06) · security headers and an
automated smoke test (2026-10-08) · terms lock once an NDA is sent, and each party may only fill
the fields it is allowed to (`e7828d6`) · state changes are gated by workflow state and replaced
signing links are retired (`c5a8cf5`, `src/lib/ndaTransitions.ts`) · each signature is recorded
atomically under a row lock, with its evidence row in the same transaction (`7880e84`) · branch
`launch-fixes` (2026-10-23): Stripe webhook idempotency and ownership checks, schema drift,
last-administrator protection, signed-PDF regeneration, lazy Stripe client, claim/viewpdf rate
limits, Vercel Firewall runbook.

## Phase 0 — your part, and the critical path

**Context for a cold start:** the code for launch is essentially done (Phases 1 and 2 are code
complete, tested, and build green). What stands between here and real customers is that every
third-party service is still in **test mode**. Only the domain and the Vercel project exist for
production. Phase 0 is turning on the live accounts and wiring their keys into Vercel. Nothing in
it is code; Claude cannot do it for you.

Full step-by-step runbook with dashboard paths, exact env-var names, scopes and acceptance checks:
**[phase-0-external-setup.md](phase-0-external-setup.md)**. Summary, in the order to start them:

| # | What | Where | Lead time | Output |
|---|---|---|---|---|
| 0.3 | **Activate Stripe**, create 4 live prices, live webhook | stripe.com | **1–5 days** for activation | 7 env vars |
| 0.4 | **Verify sending domain** (SPF/DKIM/DMARC) | resend.com + DNS | up to 48h | `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_INBOX` |
| 0.2 | **Clerk production instance**, DNS CNAMEs, MFA on, `user.deleted` webhook | clerk.com + DNS | ~1h | 3 env vars |
| 0.1 | **Migrate the production DB** (`prisma migrate status` / `deploy`) + create a Neon `staging` branch | terminal + neon.tech | 15 min | confirms 25 migrations applied |
| 0.5 | Billed Gemini key; prod S3 bucket + least-privilege IAM user | Google AI Studio, AWS | 15 min | 5 env vars |
| 0.6 | Generate `CRON_SECRET` | terminal | 2 min | 1 env var |
| 0.7 | Set the three base-URL vars, **Production scope only** | Vercel | 2 min | 3 env vars |
| 0.8 | Sentry project + DSN; enable Vercel Analytics | sentry.io, Vercel | 10 min | 1–4 env vars |

Rules that avoid the two classic mistakes:
- **Live keys go in Vercel with the Production scope only.** Preview (staging) keeps test-mode
  keys and its own Neon branch, so testing never touches real billing, real inboxes or real data.
- **Redeploy after the last env var.** Vercel does not apply env changes to a running deployment.

Start 0.3 and 0.4 today even if you do nothing else — their waiting time is the launch date.

## Already built (do not rebuild)

Verified in code, Sept 2026. Both strategy docs previously showed most of this as open.

Signature evidence with IP, template snapshot and SHA-256 hash · authority-to-sign checkbox
enforced server-side · 48h/5d receiver reminders · 5-year retention notice and delete · "not legal
advice" disclaimer on fill/review/sign · all seven legal pages with founder-drafted text · plan
limits enforced on send and invite · $9/$50 pricing with 15% annual · ADMINISTRATOR/isSigner
rename · Stripe webhook signature verification · middleware default-protect with dev routes 404 in
production · counterparty claim-by-token linkage · About-page redesign.

2FA needs no code. It is a Clerk dashboard toggle; steps are in `docs/2fa-setup.md`.

## Launch-readiness audit follow-ups (2026-10-06)

A read-only review agent checked the code against the docs. All six blockers are fixed and
committed: unsupported claims removed from Compliance and Security (and the page rewritten to what
is true), placeholder contact details replaced, 48h/5d reminders now cover first-send NDAs (review
link and wording), signed-copy link and robots/sitemap reachable signed-out, and the FREE cap no
longer counts the draft being re-sent. Still open, roughly in priority order:

- ☑ Limit error now has an upgrade path (2026-10-08): `PlanLimitError` -> HTTP 403 `LIMIT_REACHED`
  from both send routes; the fill page shows an amber notice with a "See plans" button (top banner,
  send-for-input modal, review modal, which previously showed no send errors at all). Until Stripe is
  live, "See plans" leads to pricing that can't be bought yet.
- ☑ Signed-PDF failures are no longer swallowed (2026-10-06): render and S3 store are retried
  (`src/lib/signedPdf.ts`), a final failure is recorded as `pdfStatus` on the SIGNED audit event and
  sent to Sentry, the PDF is still emailed when only the store failed, and a PDF rebuilt on demand
  in `viewpdf` records its own hash (`PDF_EXPORTED` event). ☐ Not yet exercised end to end: needs
  the staging DB + a real signing on Preview.
- ☑ `sendEmail` is loud in production (2026-10-08): throws and reports to Sentry when
  `RESEND_API_KEY` is missing or Resend fails; fallback `MAIL_FROM` is the verified
  `mail.formalizeit.com` address; replies default to `support@formalizeit.com`; recipient addresses
  are no longer logged.
- ◑ Rate limiting is per-instance memory. ☑ Runbook written (2026-10-23): "Vercel Firewall
  rate-limit rules" in [phase-2-hardening.md](phase-2-hardening.md) (6 rules, log first then deny;
  Hobby plans get only 1 rate-limit rule). ☑ `/api/claim` and `/api/ndas/viewpdf` now have in-code
  limits too. ☐ **You:** create the rules in the Vercel dashboard (rate limits can't be set in
  `vercel.json`).
- ☑ Missing Stripe env vars no longer crash (2026-10-23): `src/lib/stripe.ts` is a lazy
  `getStripe()` with `isStripeConfigured()`; billing routes and the webhook answer 503
  `BILLING_UNAVAILABLE` when Stripe isn't set up; the build passes with no Stripe vars. Hiding the
  paid buttons is part of the free-beta switch.
- ☑ First `invoice.payment_failed` now emails the administrator (once per failure streak, not on
  Stripe's retries). PAST_DUE keeps the plan's limits until Stripe ends the subscription.
- ☐ Nice to have: 83 `console.log` calls on sensitive paths; delete `generate-token.js` and
  `private.key` (old DocuSign key, untracked) from disk; orphaned `internal-approve` /
  `internal-reject` routes, `/mydrafts`, `/viewpdf`, the `DEV` plan in the billing UI.
- ☑ Full `npm run build` passes on branch `launch-fixes` (2026-10-23), also with no Stripe env vars set.

Still open from the database audit (2026-10-08; C1, C2, H1, H2, H3 fixed above), in priority order:

- ☑ H4 (2026-10-23): self-deletion is refused (409) while the user is the only administrator of a
  company with other members; the Clerk `user.deleted` webhook promotes the longest-standing member
  instead. A sole member with an active subscription is reported to Sentry for manual cancel
  (`src/lib/accountDeletion.ts`). Not exercised against a database.
- ☑ H5 (2026-10-23): `viewpdf` regeneration uses `content.templateId` and the same field mapping as
  signing (shared `src/lib/signedTemplateData.ts`).
- ☑ Schema drift (2026-10-23): index and `@db.Timestamptz` added to `schema.prisma`.
- ☐ M1: send limit is check-then-act (race) and deleting an expired NDA frees a FREE slot. Lower
  priority while the free beta removes the FREE limit.
- ☑ M2 (2026-10-23): Stripe webhook ignores repeated events (new `stripe_events` table, migration
  `20260709000000_add_stripe_events`) and skips subscription events for a subscription the company
  doesn't own; an unknown price no longer grants PRO. ☐ **The migration must run on production
  (`prisma migrate deploy`) before this code deploys**, or every webhook call fails.
- ☐ M3: retention cleanup can delete without the 30-day notice, leaves `NdaRevision` content behind,
  and skips completed NDAs with no `completedAt` (backfill on production).
- ☐ M4/M5/M6: lowercase emails on write + `lower(email)` unique index; set `isSigner` for every new
  administrator; `storeNdaPdf.ts` should use the shared Prisma client.
- ☐ Before deploy: on production, count in-flight NDAs with more than one SignRequest (the new
  "latest link only" check would refuse an active link on an older one).

## Legal and compliance readiness (2026-10-23)

Five-way research review; full plan, priorities and counsel tags in
[legal-readiness-plan.md](legal-readiness-plan.md). Tier 1 blockers, all ☐:

- ◑ Signing-step consent (Terms, Privacy, e-signature consent) recorded in the evidence and enforced
  by `sign-public`; disclaimer above Submit, on `view-nda`, stronger "not a party" wording (done
  2026-10-23, uncommitted). Account-level Terms acceptance built (2026-10-23, uncommitted):
  `users.terms_accepted_at/terms_version`, `/accept-terms` gate, Clerk `legalAcceptedAt` mirrored,
  migration `20260708000000` applied to dev. FAQ, E-Signature Consent page and Formi updated.
  ☐ **You:** turn on Clerk legal acceptance in the dashboard (see phase-0 doc); apply both new
  migrations (`20260707000000`, `20260708000000`) to **production**; set `REMINDER_LINK_SECRET` in
  Vercel. ☐ `LEGAL_VERSION` (`src/lib/legalVersions.ts`) must be bumped when the Terms/Privacy text
  changes, to re-ask users. ☐ The gate is client-side (brief flash before redirect); consider a
  server-side check.
- ☐ Terms rewrite (missing clauses, liability carve-outs, retention section, refunds, signature tier)
  and Privacy additions (roles, bases, transfers, Google, cookies) — after counsel comments.
- ☑ Email footer (entity/address from `COMPANY_LEGAL_NAME`/`COMPANY_ADDRESS`, blank until the entity
  is decided), "stop reminders" link (`reminders_stopped_at` migration `20260707000000`, must be
  applied in production), `sign-public` log cleanup, 30-day vs 5-year settings copy, overclaims
  softened, "Formalize It" spellings fixed (2026-10-23, uncommitted). Migration applied to the
  development/staging DB 2026-10-23. ☐ Apply `prisma migrate deploy` to **production** at launch.
- ☐ NDA template v1.1 (truly mutual, remedies, survival, compelled-disclosure fix) — counsel first.
- ◑ `/accessibility`, `/subprocessors`, `security.txt` added (2026-10-23, uncommitted). ☐ Skip link;
  confirm sub-processor regions marked "to be confirmed" (Clerk, Stripe, Resend, ImprovMX, Vercel
  Analytics). `.env.example` S3_REGION corrected to eu-central-1.
- ☐ **You:** legal entity details everywhere and on Stripe; Israeli VAT/invoicing; auto-renewal
  consent and refund policy; counsel review (add Israeli Bar Law and Standard Contracts Law to the
  brief); cyber/E&O insurance; breach-response runbook; verify S3/vendor settings and DPAs; upgrade
  Neon and run a restore drill.
- ☐ Tier 2 (first month): DPA template, 2FA status (Clerk Pro), CSP/HSTS, legal-hold flag, data
  export, Amendment 13 registration question.

## Open decisions (2026-10-08)

- ☐ **Where the business is based: Israel or US (raised 2026-10-23).** It decides governing law and
  venue in the Terms, tax setup (Israeli VAT vs US sales tax), Stripe activation and which privacy
  regulator applies. Decide before Stripe activation and before the Terms rewrite. If the company is
  US-registered but run from Israel, ask a cross-border accountant whether it is still Israeli tax
  resident (where it is managed and controlled). See [legal-readiness-plan.md](legal-readiness-plan.md).
  2026-11-09: founder is a US citizen living in the US; leaning to a single-member US LLC in the home
  state (Stripe supported, taxed on the personal return). Confirm with a CPA before Stripe activation.

- ☑ **Free-only launch — decided 2026-10-23: yes**, as a free beta with the FREE 3-NDA limit
  removed, behind a `NEXT_PUBLIC_PAID_PLANS_ENABLED` switch (unset = free beta). ☑ Built
  2026-10-24 ([design](../superpowers/specs/2026-10-23-free-beta-design.md); answers: 10 users,
  fresh 3 NDAs from the paid-launch day, Pro/Team prices shown, Beta label tied to legal review).
- ☑ **How to open the site — decided 2026-10-23: a lightweight sign-up gate**
  (`NEXT_PUBLIC_PRIVATE_BETA`, unset = closed in production builds). Only sign-up closes; existing
  accounts sign in and test production. ☑ Built 2026-10-24. The invite-list design in
  [2026-10-23-site-gate-design.md](../superpowers/specs/2026-10-23-site-gate-design.md) was
  superseded by this.

## Merge plan (2026-10-23)

PR #18 (`feat/todolistimpl-2` → `main`) hasn't been merged since the September lifecycle rework;
the branch is far ahead of `main`. Merge it now, not at launch: with sign-up closed by default,
merging opens nothing, and every week of drift makes the merge riskier. Order:

1. ☑ Merged `launch-fixes` into `feat/todolistimpl-2` (2026-11-09) after a tested trial merge in a
   separate worktree: typecheck, 239/239 tests, production build, route and rate-limit checks,
   and a browser click-through (gate redirect, request-access form, beta pricing, sign-in,
   accept-terms, dashboard, billing, team, five NDAs sent on FREE, receiver link opened signed-out).
   Two bugs found and fixed: a SIGNER promoted to administrator lost signing rights; the
   Subscription page listed "3 NDAs, 1 user" during the beta. The `stripe_events` migration was
   renamed to `20260709000000` (it shared the `20260707000000` prefix). ☑ Removed the
   `C:\Users\marom\Projects\nda-saas-wt\` worktrees and their merged branches (2026-11-14).
   Pre-merge re-check of PR #18 head `6f55697` (2026-11-14): typecheck clean, 239/239 tests,
   production build OK, CI and Vercel Preview green. Lint has 82 pre-existing errors in 17 files
   (CI does not run lint) — ☐ post-launch cleanup. Note: run `vitest` with
   `--exclude ".claude/**"` while an agent worktree exists, or it also tests that copy.
2. ☑ Sign-up gate and free-beta switch built (2026-10-24), both safe when unset.
3. ☑ (2026-11-14, confirmed by founder) Vercel Production env vars: `NEXT_PUBLIC_PRIVATE_BETA=on`, `NEXT_PUBLIC_PAID_PLANS_ENABLED=false`.
   Plus the Clerk Restricted sign-up mode above.
4. ☑ (2026-11-14, run by founder) `prisma migrate deploy` against the production database. Three migrations are new there:
   `20260707000000_add_nda_reminders_stopped_at`, `20260708000000_add_user_terms_acceptance`,
   `20260709000000_add_stripe_events`. Take a Neon snapshot first. Also run the two read-only
   checks: in-flight NDAs with more than one SignRequest, and
   `select billing_plan, count(*) from organizations group by 1`. ☑ **Also on the development
   (staging) branch:** `20260709000000_add_stripe_events` applied 2026-11-14 (`prisma migrate
   deploy` from the laptop; schema up to date).
   ☐ Purge test data on development before relying on it: Clerk dev user
   `claude-verify+clerk_test@example.com` and its company "Claude Verify" with 5 test NDAs
   (created 2026-11-09 during merge testing).
   ☐ Decide: the Beta pill also shows in the header of receiver pages (`/fillndahtml-public`,
   `/sign-nda-public`). The beta-scope review suggested keeping "beta" off pages the counterparty
   signs on, so the NDA itself doesn't look provisional.
5. ☑ (2026-11-14) Checked the Vercel Preview deployment of the PR, then merged PR #18. Production deploys with
   sign-up closed.
6. ☐ Test on production with your existing account (Phase 4: full flow, email round trip, cron run).
7. ☐ Open sign-up: see "Go-live switches" above.

## Post-MVP tasks (decided during launch setup)

- `support@formalizeit.com` now exists (2026-10-06): ImprovMX free forwarding to the founder's
  Gmail via root MX + SPF records at GoDaddy, catch-all `*` alias, no mailbox. Replies still go out
  from Gmail; consider Google Workspace later for send-as. ☐ Switch `CONTACT_INBOX` (Vercel, all
  environments) from the founder's Gmail to `support@formalizeit.com`, and update Google OAuth
  Branding → user support email to the same address.
- Turn on 2FA after upgrading Clerk to Pro (dashboard toggle only, then restore the 2FA copy on
  the Security / Settings pages and in Formi).
- Legal counsel review of all seven legal pages before removing beta framing.
- Multi-recipient send (first post-launch feature, PRO+): one shared link, up to 20 receivers,
  each gets their own sign-only copy. Design:
  [2026-10-06-multi-recipient-send-design.md](../superpowers/specs/2026-10-06-multi-recipient-send-design.md).

## Deferred, by decision

Link-open tracking for live opened/signed status · NDA term-expiry alerts · onboarding
"review the standard NDA" step · Enterprise tier · custom NDA upload with AI · audit-log export
UI · webhooks and Zapier · public API · advanced analytics · the trust/network-effects
repositioning.

## Health baseline (2026-09-20)

`npx tsc --noEmit` clean · `npx vitest run` 100/100 passing across 15 files · no pending migration
in the repo · 82 ESLint errors and ~2,860 warnings, which is why the ESLint build gate stays off.

Update 2026-09-22: 123/123 tests, `npm run build` green with `typescript.ignoreBuildErrors: false`.
