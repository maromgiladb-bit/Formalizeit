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
| 0 — External setup (Clerk/Stripe/Resend/DB) | [phase-0-external-setup.md](phase-0-external-setup.md) | **You** | ◑ Clerk, Resend setup, Gemini, S3, domain move, cron secret, `fra1` region, Sentry done; Stripe, Analytics, staging DB left |
| 1 — Finish the negotiation loop | [phase-1-negotiation.md](phase-1-negotiation.md) | Claude | ◑ code complete, browser verification pending |
| 2 — Essential hardening | [phase-2-hardening.md](phase-2-hardening.md) | Claude | ☑ code complete (Sentry DSN is a Phase 0 item) |
| 3 — Cleanup and doc reconciliation | [phase-3-cleanup.md](phase-3-cleanup.md) | Claude | ☑ done 2026-09-25 (3.6 deferred post-launch) |
| 4 — Verify and open signups | [phase-4-launch.md](phase-4-launch.md) | Both | ☐ not started |

### Resume here (updated 2026-09-22)

1. ☑ `npm run build` passes with the TypeScript gate on (only the pre-existing Handlebars
   `require.extensions` warning).
2. ☑ Counter visibility hardened — see phase 1 §1.7. The newest counter is always what the other
   party sees; unanswered counters can no longer be dropped by sending back early.
3. ☑ `@vercel/analytics` mounted in the root layout.
4. ☑ Sentry installed and wired (no-op until `NEXT_PUBLIC_SENTRY_DSN` is set — see Phase 0).
5. ☑ All work is committed (`035c2e8`, branch `feat/todolistimpl-2`); working tree clean.
6. ☐ **Next: Phase 0.** Nothing in the codebase blocks launch — start 0.3 (Stripe activation) and
   0.4 (Resend DNS) today, since their lead time sets the launch date. Phase 3 cleanup and the
   Phase 1 verification matrix can run in parallel while you wait.
7. ☑ (2026-09-25) Clerk live; Phase 3 done; launch **draft PR #18** open
   (https://github.com/maromgiladb-bit/Formalizeit/pull/18) — `main` is 0 ahead, no schema changes.
   Merge only after Phase 0. Remaining Phase 0: Stripe (in progress), Resend SPF + vars,
   `CRON_SECRET`, base URLs, DB check, Gemini, S3, Sentry.

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

- ☐ Limit error has no upgrade path: it surfaces as a plain error (HTTP 500 from `send-for-review`),
  with no link to Plans. (~1h)
- ☑ Signed-PDF failures are no longer swallowed (2026-10-06): render and S3 store are retried
  (`src/lib/signedPdf.ts`), a final failure is recorded as `pdfStatus` on the SIGNED audit event and
  sent to Sentry, the PDF is still emailed when only the store failed, and a PDF rebuilt on demand
  in `viewpdf` records its own hash (`PDF_EXPORTED` event). ☐ Not yet exercised end to end: needs
  the staging DB + a real signing on Preview.
- ☐ `sendEmail` silently skips when `RESEND_API_KEY` is unset and falls back to
  `noreply@formalizeit.app`; make production fail loudly (or alert via Sentry). Also logs recipient
  addresses on every send.
- ☐ Rate limiting is per-instance memory: add a Vercel Firewall rule for the sign, contact and
  token endpoints.
- ☐ Missing Stripe env vars fail late (500 at checkout); a FREE-only launch would still show paid
  buttons that fail.
- ☐ No customer email on `invoice.payment_failed`; check whether PAST_DUE still allows sending.
- ☐ Nice to have: 83 `console.log` calls on sensitive paths; delete `generate-token.js` and
  `private.key` (old DocuSign key, untracked) from disk; orphaned `internal-approve` /
  `internal-reject` routes, `/mydrafts`, `/viewpdf`, the `DEV` plan in the billing UI.
- ☐ Unverified: full `npm run build`; whether the Stripe client throws at import without a key.

## Post-MVP tasks (decided during launch setup)

- `support@formalizeit.com` now exists (2026-10-06): ImprovMX free forwarding to the founder's
  Gmail via root MX + SPF records at GoDaddy, catch-all `*` alias, no mailbox. Replies still go out
  from Gmail; consider Google Workspace later for send-as. ☐ Switch `CONTACT_INBOX` (Vercel, all
  environments) from the founder's Gmail to `support@formalizeit.com`, and update Google OAuth
  Branding → user support email to the same address.
- Turn on 2FA after upgrading Clerk to Pro (dashboard toggle only, then restore the 2FA copy on
  the Security / Settings pages and in Formi).
- Legal counsel review of all seven legal pages before removing beta framing.

## Deferred, by decision

Link-open tracking for live opened/signed status · NDA term-expiry alerts · onboarding
"review the standard NDA" step · Enterprise tier · custom NDA upload with AI · audit-log export
UI · webhooks and Zapier · public API · advanced analytics · the trust/network-effects
repositioning.

## Health baseline (2026-09-20)

`npx tsc --noEmit` clean · `npx vitest run` 100/100 passing across 15 files · no pending migration
in the repo · 82 ESLint errors and ~2,860 warnings, which is why the ESLint build gate stays off.

Update 2026-09-22: 123/123 tests, `npm run build` green with `typescript.ignoreBuildErrors: false`.
