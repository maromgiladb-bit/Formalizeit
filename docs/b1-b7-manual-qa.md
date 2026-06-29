# B1–B7 Manual QA Checklist (29 Jun 2026 strategy work)

Manual verification for the strategy-alignment work tracked in
`docs/strategy-implementation-roadmap.md`. Run through these in a browser with Stripe in
**test mode** locally. Audit-evidence checks read the `audit_events` table directly
(`npx prisma studio` or the Neon SQL console) — there is no audit-log UI yet.

Legend: `[ ]` to do · `[x]` verified

---

## B1 — Pricing ($9 / $50, 15% annual)
- [ ] `/#pricing` shows PRO **$9/mo** and TEAM **$50/mo**; annual toggle shows discounted figures
      (marketing cards round to ~$8 / ~$43 via NumberFlow — expected).
- [ ] Checkout modal shows exact annual figures: PRO **$7.65/mo billed annually**,
      TEAM **$42.50/mo billed annually**.
- [ ] `/settings/billing` shows the same prices for the current plan.
- [ ] Test-mode checkout completes for **PRO monthly, PRO annual, TEAM monthly, TEAM annual**;
      the webhook lands the account on the correct plan (`PRO` / `TEAM`).
- [ ] After checkout, plan limits apply (TEAM up to 10 users; PRO/FREE = 1).
- [ ] **Vercel production**: live-mode price IDs + live Stripe keys set and redeployed; a
      live(-test) checkout maps to the right plan.

## B2 — Signature evidence + authority-to-sign
- [ ] Public sign page: **Submit disabled** until the authority checkbox is ticked.
- [ ] Internal sign page: Generate & Save / Send NDA disabled until ticked.
- [ ] Complete a full sign (both parties). In `audit_events`, each `SIGNED` row has `ip_address`
      populated and `metadata` containing `templateSnapshot` (with `version`) and `authority`
      (`confirmed: true` + consent text); the COMPLETE event also has `agreementHash`.
- [ ] POST `/api/ndas/sign-public` without `authorityConfirmed` → **400**.
- [ ] **Version-snapshot test**: note `templateSnapshot.version` on an executed NDA, bump the
      template version, re-check the audit — snapshot still shows the **originally signed** version.
- [ ] `/terms` shows new §15 "Electronic Signatures and Authority to Sign".
- [ ] Ask Formi "what do you record when I sign?" → mentions IP, timestamp, version, hash, and
      the authority checkbox.

## B3 — "No legal advice" disclaimer
- [ ] Disclaimer renders on the **fill**, **review**, and **sign** pages (public + internal).
- [ ] Styling matches design system (white card, gray border, teal icon — not teal-50/teal-600).
- [ ] With OS "reduce motion" on, no animation jank.

## B4 — Reminders (48h & 5 days)
- [ ] Seed an NDA in `AWAITING_PARTY_B_SIGNATURE` with `sentAt` >48h ago and
      `reminder48hSentAt = null`.
- [ ] Hit `/api/cron/nda-reminders` with `Authorization: Bearer <CRON_SECRET>` → 48h email sent,
      `reminder48hSentAt` stamped.
- [ ] Run again → **no duplicate** email (idempotent).
- [ ] Repeat with `sentAt` >5 days for the 5-day reminder.
- [ ] Call without/with wrong bearer token → **401**.
- [ ] `vercel.json` has the daily schedule; `CRON_SECRET` set in Vercel production.

## B5 — 2FA
- [ ] Clerk dashboard: TOTP + backup codes enabled.
- [ ] `/settings/account-security` loads Clerk's Security tab; can enroll an authenticator app.
- [ ] Sign out and back in → 2FA challenge appears.

## B6 — Legal/compliance pages
- [ ] `/esignature-consent`, `/standard-nda`, `/nda-governance`, `/nda-changelog` all render
      (placeholder copy is fine until lawyer copy lands).
- [ ] Footer links to all four (plus existing Terms/Privacy/Compliance) and every link resolves.

## B7 — Role rename (Administrator / Signer)
- [ ] `/settings/team` shows roles as **Administrator / Signer / Contributor**; the toggle reads
      "signer" not "approver".
- [ ] Administrator **with** signer toggle can sign; **without** it → "Signing not permitted".
- [ ] A Signer can sign; a Contributor cannot (blocked screen).
- [ ] Contributor can still create, edit, and send for review/input/signature.
- [ ] DB: `membership_role` enum has `ADMINISTRATOR` (no `OWNER`); `memberships.is_signer` exists.
- [ ] `npx vitest run src/lib/__tests__/organizationRoles.test.ts` → all pass.
- [ ] Ask Formi about roles → describes Administrator/Signer/Contributor correctly.

## Cross-cutting
- [ ] `npm run build` succeeds (beyond the pre-existing `.next/types` route-param noise).
- [ ] `npx vitest run` green.
- [ ] No leftover "$19" / "$75" / "Save 20%" / "OWNER" / "isApprover" / "Owner" role copy in any
      user-facing surface.
