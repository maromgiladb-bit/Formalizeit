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
