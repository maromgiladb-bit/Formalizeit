# Pricing Plans & Limits — Implementation Reference

> Updated June 2026 to the company-based 4-tier model and the strategy pricing ($9 PRO / $50 TEAM).
> This supersedes the old per-user `user_plan` (FREE/PRO/ENTERPRISE) design described in earlier
> revisions of this file.

## Plans (company-level, `BillingPlan`)

Billing is per **company/organization**, not per user. The plan lives on the `Organization`
(`billingPlan`, `billingStatus`, Stripe fields) in `prisma/schema.prisma`.

| Plan | Monthly | Annual (15% off) | NDAs | Users |
|---|---|---|---|---|
| **FREE** | $0 | — | 3 total | 1 |
| **PRO** | $9 | $7.65/mo-equiv | unlimited | 1 |
| **TEAM** | $50 | $42.50/mo-equiv | unlimited | up to 10 |
| **ENTERPRISE** | contact sales | — | unlimited | custom |

- `DEV` is an internal unlimited plan.
- **ENTERPRISE is deferred** (not launched now); SSO / legal-approval workflow / private NDA
  standard / CRM integrations / custom API are future scope.
- **Receivers/guests are always free** and may sign without an account.

## Where limits and prices live

- **Limits:** `src/billing/planLimits.ts` (`PLAN_LIMITS`) — `maxUsers`, `maxActiveDrafts`.
- **Send gate:** `assertCanSendNda` in `src/organizations/limits.ts` enforces the NDA cap.
- **Stripe price → plan mapping:** `src/lib/stripe-price-ids.ts` (`priceIdFor` / `planFromPriceId`).
  Checkout takes a `plan` arg; the webhook maps the subscription's price → `BillingPlan`.
- **Price env vars:** `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`,
  `STRIPE_TEAM_MONTHLY_PRICE_ID`, `STRIPE_TEAM_ANNUAL_PRICE_ID`.
- **Pricing UI (display only):** `src/components/marketing/PricingSection.tsx`,
  `src/app/settings/billing/page.tsx` (`getPlanPrice()`), `src/components/billing/CheckoutModal.tsx`.

## Retention

Signed NDAs are kept **5 years from execution** (FREE included) with advance notice before any
deletion. Enforced by `src/app/api/cron/retention-cleanup` (notice at 5y−30d; delete at 5y, keeping
the draft row + a `RETENTION_DELETED` audit stub) using `NdaDraft.completedAt` /
`retentionNoticeSentAt`. PRO/TEAM/ENTERPRISE are retained while the subscription is active.

## Changing prices

1. Create the prices in the **Stripe dashboard** (monthly + annual, annual = 15% off monthly).
2. Set the price-ID env vars above.
3. Update the three display surfaces (PricingSection, billing page, CheckoutModal).
4. `PLAN_LIMITS` only changes if the NDA/user caps change — price changes alone don't touch it.
5. Verify with a Stripe **test-mode** checkout that the webhook maps the new price → correct plan.
