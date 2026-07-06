# Subscription Settings Polish — Design

**Date:** 2026-07-06
**Scope:** Three small UX changes to the settings billing/subscription area. No route changes, no new API routes.

## Goals

1. When a subscription is set to cancel at period end, the plan status should read **"Active until <date>"** instead of a plain "Active".
2. Rename the settings **Billing** section to **Subscription** (label only).
3. **Manage Subscription** should open the Stripe portal in a **new tab** instead of redirecting the current page.

## Part A — "Active until <date>" status

Condition: `cancelAtPeriodEnd === true && billingStatus !== 'CANCELLED' && stripeCurrentPeriodEnd` present.

- **Plan header badge** (`src/app/settings/billing/page.tsx`): render `Active until {Month D, YYYY}` in the **amber** tone (`bg-amber-50 text-amber-700`) — the design system's "action needed" color — instead of the teal "Active" badge.
- **Billing Details → Status row**: render the same `Active until {date}` text.
- The existing amber pending-cancellation banner stays (it carries the Manage / resubscribe affordance).
- All other states (`Active`, `Past Due`, `Cancelled`, `Trial`) are unchanged.

Date formatting reuses the existing `toLocaleDateString('en-US', { year, month, day })` style already used for "Renews On".

## Part B — Rename Billing → Subscription

- `src/app/settings/layout.tsx`: nav item `name: 'Billing'` → `'Subscription'` (icon and `href: '/settings/billing'` unchanged).
- **Route stays `/settings/billing`** — it is referenced by the Stripe portal/downgrade `return_url`, webhook emails, pricing CTAs, and dev email preview. Renaming only the visible label avoids all of that risk.
- Formi knowledge (`src/ai/prompts/formi_systemPrompt.ts`): update the "Settings → Billing" references to "Settings → Subscription" so Formi stays in sync (standing rule).

## Part C — Manage Subscription in a new tab

- `handleManageSubscription` in `src/app/settings/billing/page.tsx`:
  - Open a blank tab **synchronously on click** (`const win = window.open('', '_blank', 'noopener,noreferrer')`) to preserve the user-gesture context (calling `window.open` after the `await` gets blocked by popup blockers).
  - After the fetch resolves, set `win.location.href = data.url`.
  - On error (or `!win`), close the blank tab if opened and show the existing `portalError` message; fall back to `window.location.href` only if the browser blocked the popup (`win` is null).
- This handler is shared by the PAST_DUE "Update Payment" and pending-cancel "Manage" buttons — they get the same new-tab behavior, which is desirable.

## Out of scope

- No `/settings/billing` → `/settings/subscription` route rename.
- No custom in-app billing modal (Stripe's hosted portal cannot be iframed).
- No changes to the cancel/downgrade flows themselves — they already work.

## Verification

- `npx tsc --noEmit` (or project typecheck) passes.
- Manually drive `/settings/billing`: pending-cancel state shows "Active until <date>" in both places; nav reads "Subscription"; Manage opens a new tab without navigating away.
