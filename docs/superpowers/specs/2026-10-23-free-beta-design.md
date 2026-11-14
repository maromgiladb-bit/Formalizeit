# Free beta launch (paid plans switched off) — plan for review

Status: **proposed, not built** (2026-10-23). Decided: launch without Stripe as a free beta, with
the FREE 3-NDA limit removed during the beta, and easy to switch back. Depends on the lazy Stripe
client (`getStripe()`, landed on branch `launch-fixes`). Independent of the site gate
([2026-10-23-site-gate-design.md](2026-10-23-site-gate-design.md)).

## The switch

`PAID_PLANS_ENABLED` in `src/lib/featureFlags.ts` (next to `FORMI_ENABLED`), read from
`NEXT_PUBLIC_PAID_PLANS_ENABLED`. Only the exact string `"true"` turns paid plans on, so
**unset = free beta**:

- If the variable is forgotten in production, nobody is sent to a Stripe checkout that can't work.
- An env var rather than a constant, so Preview can run with paid plans on (Stripe test mode)
  while Production runs the beta, and switching back needs no code change.
- `NEXT_PUBLIC_` values are baked in at build time, so every change needs a redeploy.

## What changes while the beta is on

**Limits** (`src/billing/planLimits.ts`, `src/organizations/limits.ts`)
- `PLAN_LIMITS` stays untouched. That is the switch-back guarantee.
- A beta override in `resolveLimits()` gives FREE unlimited NDAs and up to 10 users (the Team
  cap); see question 1.
- The duplicated count query in `src/app/api/user/check-limit/route.ts` moves into one shared
  helper. Today's copy ignores the monthly period, so it's out of step with the send gate.

**Stripe routes**
- `checkout`, `upgrade-session` and `downgrade` refuse with 403 `PAID_PLANS_DISABLED`.
- `portal`, `cancel`, `sync`, `invoices` and the webhook keep working, so if paid plans ever
  exist and the beta switch is turned back on, paying customers can still manage or cancel.

**UI**
- Pricing (`PricingSection.tsx`, `ui/pricing.tsx`): Free is the highlighted card with the beta
  feature list. Pro and Team show their prices with a neutral "Coming soon" pill and a disabled
  button. No amber, which is reserved for "action needed".
- Billing settings: "Free (beta)", "$0 during beta", a short note and a contact link. Upgrade and
  re-subscribe buttons are hidden; manage and cancel stay.
- Team settings: the upgrade banner is hidden, and invites simply work up to the cap.
- The limit notice (practically unreachable in the beta) shows "Contact us" instead of "See plans".
- A small "Beta" pill next to the logo in both toolbars.

**Content**
- FAQ: answers swap in place (no entries removed, because the home page teaser uses fixed
  positions). "What happens after I upgrade?" becomes "What happens when the beta ends?".
- Help and Support billing copy.
- Terms §7: a founder-drafted beta clause (free during beta, at least 30 days' notice before paid
  plans start or Free limits shrink), flagged for legal counsel.
- Formi: `planFacts()` reads the effective limits, so it says "unlimited during beta", not "3 NDAs".

**Proposed copy**
- Pricing headline: "Free while we're in beta".
- Pricing subline: "Every feature, unlimited NDAs, no credit card. Paid plans come later — we'll
  give you plenty of notice first."
- Free card CTA: "Get started free".

## Switching back (when Stripe is live)

1. At least 30 days before, email users. The Terms already promise notice before reducing free
   features.
2. Code PR: set `FREE_ALLOWANCE_COUNTS_FROM` to the launch date, so Free companies get a fresh 3
   NDAs counted from that day instead of being blocked immediately (question 2).
3. Vercel Production: `NEXT_PUBLIC_PAID_PLANS_ENABLED=true`, then redeploy.
4. Verify: prices and upgrade buttons are back, a live checkout reaches PRO, the 4th Free send
   shows the upgrade notice, and FAQ/Help/Formi show the paid copy.

Rollback: set the variable back to `false` and redeploy. Paying customers are unaffected.

Existing beta team members are kept at switch-back: the cap only blocks new invites.

## Tests

- Limits: beta FREE is unlimited with 10 users; PRO, TEAM and ENTERPRISE are unchanged; a
  per-company override still wins; `PLAN_LIMITS.FREE` is still 3 and 1 (switch-back guard).
- Existing limit tests set `paidPlansEnabled: true` explicitly, so they don't flip with the env.
- The 3 refusing routes return 403 without touching Stripe; portal still reaches its own checks.
- Formi `planFacts`, FAQ list length, and flag parsing (only `"true"` enables).
- CI runs the suite with the variable unset and with `true`.

## Effort

About 5–7 hours including tests.

## Questions for you

1. Free user cap during the beta: **10 (recommended**, so collaboration gets tested and the
   invite form isn't a dead end), 3, or keep 1?
2. Companies over 3 NDAs at switch-back: **a fresh 3 counted from launch day (recommended)**, a
   hard block, unlimited for "founding members", or a beta discount coupon (needs no code,
   promo codes are already enabled at checkout)?
3. Keep showing Pro/Team prices on the "Coming soon" cards (recommended), or hide them?
4. Notice before the beta ends: 30 days? Sent manually (Gmail BCC) or with a small broadcast
   script?
5. Should the "Beta" pill disappear with this switch, or stay until legal counsel has reviewed the
   legal pages (CLAUDE.md ties removing beta framing to that review)?
6. Add a "notify me when Pro launches" waitlist, or skip for now?
7. Does Vercel Preview have Stripe test keys? If so, set the switch to `true` there.
8. Before launch: confirm production has no PRO/TEAM companies
   (`select billing_plan, count(*) from organizations group by 1`).
