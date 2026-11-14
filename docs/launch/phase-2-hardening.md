# Phase 2 — Essential hardening

**Owner: Claude.** The "essential" tier, chosen over bare-minimum and full passes. Protects against
invisible failures and cost abuse without turning into a multi-day detour.

> **CODE COMPLETE 2026-09-22.** All nine items implemented; `tsc` clean, 123/123 tests,
> `npm run build` green with the TypeScript gate on and the Sentry wrapper active.
>
> **Your part (Phase 0 §0.7):** create a Sentry project and set `NEXT_PUBLIC_SENTRY_DSN` in
> Vercel Production (plus `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` for readable stack
> traces). With no DSN, Sentry is a silent no-op, so nothing breaks until you do — but nothing is
> reported either. Vercel Analytics needs only the toggle in the Vercel project's Analytics tab.

---

## 2.1 ☑ Error surface

- [x] `src/app/error.tsx` and `src/app/global-error.tsx`. Neither exists today, so any uncaught
      render or server-component throw shows Next's raw default screen, unbranded and unreported.
- [x] Style per `.claude/skills/stitch-design.md`. `src/app/not-found.tsx` already exists and is
      the styling reference.

## 2.2 ☑ Error monitoring

- [x] Add Sentry. Approved 2026-09-22; `@sentry/nextjs@^10.75`.
- [x] Wired: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`
      (`register` + `onRequestError`), `src/instrumentation-client.ts`, `captureException` in
      both error boundaries, `withSentryConfig` in `next.config.ts`. Session replay is off by
      design — NDA contents and signer emails pass through these pages.
- [x] Gotcha recorded: `disableLogger: true` in the wrapper options broke the `/` prerender
      (`Cannot read properties of undefined (reading 'call')`). Leave it out.

Today logging is bare `console.*` into Vercel's runtime buffer: no alerting, no retention, no
structure. Combined with `typescript.ignoreBuildErrors`, a broken deploy is invisible until a user
complains.

## 2.3 ☑ Rate limiting

None exists anywhere in the codebase. Add `src/lib/rateLimit.ts`, a fixed-window limiter with no
new dependency, and apply it to:

- [x] `POST /api/contact` — honeypot only today. Omit the `company` field and you can send
      unlimited mail through the Resend account: direct cost plus domain-reputation burn.
- [x] `POST /api/ai/chat` — auth-gated, but any signed-in user can spend unbounded Gemini tokens.
      Free-plan users have the same access as paid. `stepCountIs` bounds tool loops, not requests.
- [x] The public signer-token routes: `sign-public`, `submit-input`, `preview-html-public`,
      `activity-public`. Their bearer tokens are currently brute-forceable at full speed.

In-memory is per-instance and therefore best-effort. Back the two spend endpoints with Vercel
Firewall rules as well. Upstash would be correct but adds a dependency and an account; revisit
after launch if abuse actually appears.

## 2.4 ☑ Fail-closed cron

- [x] `src/app/api/cron/cleanup-deleted-users/route.ts:16` reads
      `if (cronSecret && authHeader !== ...)`, so an unset `CRON_SECRET` **skips the check
      entirely** and anyone can trigger permanent user anonymization. Match the fail-closed form
      the other three crons already use (`retention-cleanup:26`, `nda-reminders:24`,
      `expire-sign-links:25`).

## 2.5 ☑ Stripe correctness

- [x] `src/app/api/webhooks/stripe/route.ts:90` — `planFromPriceId(priceId) ?? 'PRO'` silently
      provisions an unrecognized price as PRO. A mistyped TEAM price ID would give a $50 customer a
      PRO plan. Fail loudly and alert instead.
- [x] Add `event.id` dedupe. Stripe retries and redelivers; `handleSubscriptionDeleted` currently
      re-sends the "subscription has ended" email on every redelivery.
- [x] Note but do not fix: no `invoice.payment_succeeded` handler, so recovery from `PAST_DUE`
      depends entirely on `customer.subscription.updated` also firing. It usually does.

## 2.6 ☑ Contact inbox

- [x] `src/app/api/contact/route.ts:6` falls back to a hardcoded personal Gmail address. Remove the
      fallback and require `CONTACT_INBOX`.

## 2.7 ☑ Build gate

- [x] `next.config.ts` — set `typescript.ignoreBuildErrors` to false. `tsc --noEmit` passes clean,
      so this is free and stops type errors shipping silently.
- [x] **Leave `eslint.ignoreDuringBuilds` on.** There are 82 errors and ~2,860 warnings; clearing
      them is not launch work.

## 2.8 ☑ Analytics

- [x] `@vercel/analytics` mounted as `<Analytics />` in `src/app/layout.tsx`. Enable the
      Analytics tab on the Vercel project or it collects nothing.

---

## 2.9 ☑ Minimal SEO

Cheap, and it directly serves the goal of finding customers.

- [x] `src/app/robots.ts` and `src/app/sitemap.ts`. Neither exists, nor a static `robots.txt`.
- [x] Set `metadataBase` in the root layout. Without it, Next resolves the OG image relative to the
      deployment and social cards can break on the custom domain.
- [x] `noindex` the token routes: `/sign-nda-public/*`, `/fillndahtml-public/*`. Nothing currently
      tells crawlers to stay out of signing links.
- [x] Per-page metadata for the homepage at minimum. Eight pages inherit the generic root title:
      `/`, `/contact`, `/security`, `/support`, `/compliance`, `/standard-nda`, `/nda-governance`,
      `/esignature-consent`.

---

## Verification

- [ ] `npx tsc --noEmit` and `npx vitest run` stay green.
- [ ] Throw deliberately in a server component and confirm the branded error page renders and the
      event reaches Sentry.
- [ ] Hammer `/api/contact` past the limit and confirm a 429.
- [ ] Call `cleanup-deleted-users` with no auth header and confirm it refuses.
- [ ] Fetch `/robots.txt` and `/sitemap.xml` on a deployed build.

---

## Vercel Firewall rate-limit rules (runbook)

The in-code limiter (`src/lib/rateLimit.ts`) is per serverless instance and resets on cold start, so it
is best-effort. These WAF (web application firewall) rules are the hard layer in front of it. **Keep the
in-code limiter as a second layer** - do not remove it.

### Plan availability (checked 2026-10-23)

- WAF Rate Limiting is available on **all plans**; Hobby gets **1 rate-limit rule** (within 3 custom rules
  total), **Pro 40 rules**, Enterprise 250. Pro is usage-based billing, Hobby includes 1M allowed requests.
  Source: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- Window 10s to 10min (Hobby and Pro), fixed-window algorithm; keys on Hobby/Pro are IP and JA4 digest
  (JA4 = TLS client fingerprint). Actions: Default (429), Log, Deny, Challenge. Counters are tracked
  **per region**, so the effective global limit can exceed the configured value.
- Custom rules take effect on publish with no redeploy. Log mode never blocks:
  https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules
- **Dashboard only for rate limits.** `vercel.json` `routes[].mitigate` supports only `deny` and `challenge`
  (no log, no rate limit); it is a hard block, not a counted limit, so it is not suitable here. Code-driven
  limits exist via `@vercel/firewall` `checkRateLimit` (new dependency - not adopted; needs approval):
  https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk

### Endpoints and current in-code limits

| Endpoint | In-code limit (per IP) |
|---|---|
| POST `/api/ndas/sign-public` | 20/min |
| POST `/api/ndas/submit-input` | 30/min |
| GET `/api/ndas/activity-public` | 60/min |
| GET/POST `/api/ndas/preview-html-public` | 60/min |
| POST `/api/contact` | 5/hour |
| GET `/api/claim` | none |
| GET `/api/ndas/viewpdf` (signerId link) | none |
| Pages `/sign-nda-public/[token]`, `/fillndahtml-public/[token]` | none (page loads) |

### Rules to create (Firewall > Configure > + New Rule > Then: Rate Limit)

All: algorithm Fixed Window, key = **IP**, set action to **Log** first. Starting values are well above
what a real signer produces (reloads, a few retries) while still stopping scripts. Hobby can only hold
one of these; use the "all public API" rule (#1) in that case.

| # | Name | Condition | Limit / window | Final action |
|---|---|---|---|---|
| 1 | rl-contact | Path equals `/api/contact` AND Method POST | 5 / 10 min | Deny (429) |
| 2 | rl-sign-public | Path equals `/api/ndas/sign-public` AND Method POST | 30 / 60s | Deny (429) |
| 3 | rl-submit-input | Path equals `/api/ndas/submit-input` AND Method POST | 40 / 60s | Deny (429) |
| 4 | rl-public-reads | Path starts with `/api/ndas/activity-public` OR `/api/ndas/preview-html-public` OR `/api/ndas/viewpdf` | 120 / 60s | Deny (429) |
| 5 | rl-claim | Path starts with `/api/claim` | 20 / 60s | Deny (429) |
| 6 | rl-token-pages | Path starts with `/sign-nda-public/` OR `/fillndahtml-public/` | 60 / 60s | Challenge |

Notes: token pages use Challenge, not Deny, so a shared office/NAT IP with many signers gets a check
instead of a hard block. Window limits sit above the in-code ones so the app's own 429 (with Retry-After)
fires first for normal abuse and the WAF only catches multi-instance floods. Do not add persistent
actions (block-for-duration) until after a week of clean logs. Hobby fallback: only rule #1-style single
rule, e.g. Path starts with `/api/ndas/` AND Method POST, 60 / 60s.

### Rollout: log first, then deny

1. Create each rule with action **Log**; Review Changes, then **Publish**.
2. Watch Firewall > Overview, traffic grouping = the rule name, for at least 3-7 days of real traffic.
3. If no legitimate user/IP is near the limit (check the busiest IPs), switch the action to Deny
   (Challenge for #6), save, publish. Keep one rule at a time if on Hobby.
4. After switching, re-check weekly for the first month; raise limits if support reports "too many
   requests".

### How to test

- On a Preview or production URL, with the rule on **Log**: loop `curl -s -o /dev/null -w "%{http_code}\n"
  -X POST https://<domain>/api/contact -d '{}' ` 15 times (stays below in-code limit effects only after the
  5th); confirm the rule shows matches in Firewall Overview within ~10 minutes of live traffic.
- After switching to Deny: repeat and confirm 429 from the WAF (response comes from the edge, no app log
  line). To distinguish from the in-code limiter, check for the Retry-After header the app sets.
- Confirm a normal signing flow (open link, reload several times, sign) still works from the same IP.
- Add the result to the Verification list above (contact past the limit returns 429).

### If the plan does not include rate limiting

- Pro or Hobby already include it per above; if the dashboard lacks the option, upgrade the project plan
  or check the team role (needs Project administrator, Member, or Security role).
- Fallbacks, in order: (1) use the one Hobby rule on `/api/ndas/` POSTs; (2) a `vercel.json`
  `mitigate: challenge` route on token pages (no counting, challenges everyone - last resort);
  (3) Upstash/Redis-backed limiter in code or `@vercel/firewall` `checkRateLimit` (both need a
  dependency/account approval); (4) rely on the in-code limiter and the existing signing-token entropy.

### Gaps found (no in-code limiter) - app work, not done here

- `/api/claim` (GET, public, sets a cookie and redirects) - covered only by rule #5.
- `/api/ndas/viewpdf` signerId-bearer link (public, returns signed PDF) - covered only by rule #4.
- `/sign-nda-public/[token]` and `/fillndahtml-public/[token]` page loads - covered only by rule #6.
  Consider adding `rateLimitRequest` to claim and viewpdf as a second layer.
