# Phase 4 — Verify, then open signups

**Owner: both.** Nothing here starts until Phases 0–2 are done.

> **Decision 2026-10-08:** the manual click-through checks (4.1 here, plus the Phase 1 negotiation
> matrix) are deferred until **right before release**; the other launch work continues first.
>
> **Automated smoke test, run by Claude 2026-10-08** (production build + `next start`, staging DB):
> - `npm run build` passes (only the known Handlebars `require.extensions` warning, server-side).
> - 17 public pages return 200; `/dashboard`, `/settings`, `/fillndahtml`, `/templates` redirect to
>   sign-in; protected APIs return 401; dev-only routes (`/mydrafts`, `/api/debug`, `/api/test`,
>   `/api/dev/*`, `/fillndahtml-public/dev`) return 404 in production mode; fake sign/fill tokens
>   return 404 (never 500); all four crons return 401 without the secret; unsigned Stripe webhook 400.
> - Content checks: no fake contact details, no SOC 2 / ISO / AES-256 claims, no `formalizeit.app`;
>   Privacy mentions ImprovMX and Frankfurt.
> - Found and fixed: no security headers (now X-Frame-Options, nosniff, Referrer-Policy), and the
>   signing page shipped Handlebars to the browser (page code 159 kB -> 5.8 kB).
> - Not covered (needs a signed-in session, or secrets that exist only on Vercel): the actual
>   create -> send -> fill -> sign -> PDF flow, Clerk webhook (local env has no secret), contact form
>   (local env has no `CONTACT_INBOX`), Stripe checkout.
> - Minor, left as is: signed-out visitors who hit an unknown URL are sent to sign-in instead of a 404.

---

## 4.1 ☐ Full flow on staging

Run the manual matrix in `phase-1-negotiation.md` against the staging deployment, not locally.
Staging builds run with `NODE_ENV=production`, so dev-only routes 404 there exactly as they will in
production.

The regression to guard hardest is the path that already works: send → counterparty fills only the
requested fields → auto-advance to their signature → both parties sign → PDF generated, hashed,
stored in S3 and emailed to both.

## 4.2 ☐ Stripe live-mode checkout

- [ ] All four prices: PRO monthly, PRO annual, TEAM monthly, TEAM annual.
- [ ] Each writes the correct `billingPlan` on the organization.
- [ ] Cancel one and confirm `cancelAtPeriodEnd` and the ended-subscription email.
- [ ] Confirm the billing portal opens and returns to the right URL.

## 4.3 ☐ Email round trip on the verified domain

- [ ] Send to an external address. Confirm inbox placement, not spam.
- [ ] Confirm every link carries the production origin. **Re-test the July `${VERCEL_URL}` issue
      with a brand-new send** before declaring it stale.
- [ ] Check the completion email's PDF attachment opens.

## 4.4 ☐ Cron dry run

Trigger each with the production `CRON_SECRET` and confirm it runs and is idempotent on a second
call:

- [ ] `/api/cron/nda-reminders` — seed a stale NDA, confirm one email and a stamped marker.
- [ ] `/api/cron/retention-cleanup`
- [ ] `/api/cron/expire-sign-links`
- [ ] `/api/cron/cleanup-deleted-users` — and confirm it now refuses without the secret.

## 4.5 ☐ Production data hygiene

- [ ] Purge test organizations with `scripts/cleanup-test-data.mjs`. It is dry-run by default and
      only deletes organizations you name explicitly. Deleting an org cascades to its members,
      drafts, sign requests, audit events and `NdaPdf` rows; the script deletes the S3 objects
      separately from `NdaPdf.s3Key`.
- [ ] Verify the production database holds only real users afterwards.

## 4.6 ☐ Open signups

- [ ] Confirm `/` and the signup route are reachable signed-out and that signup completes into
      onboarding, which asks only for a workspace name and creates the org plus an ADMINISTRATOR
      membership.
- [ ] Confirm a brand-new FREE account can send its first NDA end to end.
- [ ] Confirm the FREE limit bites on the fourth send, with a comprehensible message. Note
      `src/components/LimitExceededModal.tsx` is currently dead code and the failure surfaces as a
      generic API error string — worth a look if the message reads badly to a real user.

---

## Post-launch, first week

Not blockers, but the things most likely to matter once real traffic arrives.

- Watch Sentry daily. The first week is when unknown-unknowns surface.
- Watch the Gemini and Resend bills for the abuse the new rate limits are meant to stop.
- A user can create unlimited organizations, each with its own FREE 3-NDA allowance
  (`createOrganization` bypasses `assertCanAddMember` for seat one, correctly, but nothing caps
  orgs per user). Harmless until someone notices; then it is a revenue leak.
- Revisit the deferred items in `docs/launch/README.md` once there is usage data to prioritize by.
