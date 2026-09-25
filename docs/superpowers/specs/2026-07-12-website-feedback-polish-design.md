# Website Feedback Polish — Design Spec

**Date:** 2026-07-12
**Source:** Reviewer comments deck (`260711 Comments on website.pptx.pdf`) — ~40 items across sign-in, homepage, nav, dashboard, template picker, fill flow, generated email/WhatsApp, and the review/sign flow.
**Branch context:** `feat/todolistimpl-2`. Screenshots were taken against production (`app.formalizeit.com`), so a few items are already resolved on this branch — those are noted inline.

## Scope (agreed)

Phased. **This spec covers Phases A + B + C** plus the nav cleanup. Buckets marked **D (deferred)** get their own spec later.

Decisions locked with the user:
- **Logo target:** stays on `/dashboard` for signed-in users. *No change.*
- **Nav cleanup (in scope):** remove "Fill NDA" from the toolbar; surface **Dashboard, Settings, Plans** as top-level toolbar links; remove those three from the "More" dropdown (More keeps About/Contact/FAQ/Help/Homepage).
- **New pages deferred:** the recipient-link marketing/landing page (p18) and the "How it works" explanation page (p10) are **D — separate spec**.

## Non-goals / Deferred (D)

Not in this plan; tracked for a follow-up brainstorm:
- Recipient email link → explanation/marketing landing with sign-in-or-guest (p18).
- "How it works" explanation page after **New NDA** (p10).
- View/download the blank template before filling ("send to my lawyer") (p11).
- Email graphics / richer marketing layout (p18).
- Search by date; keyword/advanced search on the dashboard (p9).
- **Clerk sign-in branding "Clerk" → "Formalizeit" (p2)** — this is Clerk **dashboard configuration** (Application name + OAuth consent screen), not app code. Tracked as an **ops task**, not a code change.

---

## Phase A — Copy / label fixes (low risk, no behavior change)

Each item: exact target and new copy.

### A1. Dashboard subtitle casing (p6)
- File: `src/components/dashboard/DashboardClient.tsx` (~L537)
- `Manage and track your non-disclosure agreements` → `Manage and track your Non-Disclosure Agreements`

### A2. "Total NDAs" → "All my NDAs" (p7, p9)
- File: `DashboardClient.tsx` — `statCards` first entry `label` (~L320)
- `Total NDAs` → `All my NDAs`

### A3. Fill page heading is confusing (p12)
- File: `src/app/fillndahtml/page.tsx`
- Heading `Create New NDA` reads like the button just pressed. Remove the redundant title; keep the subtitle `Fill out the form to generate your agreement` as the primary line.

### A4. "Additional Clauses" → "Deal details" (p16)
- File: `src/app/fillndahtml/page.tsx` (Clauses step header)
- Title `Additional Clauses` → `Deal details`; subtitle `Customize your agreement terms` → `Deal-specific details for this NDA` (softer, less legal).

### A5. Field labels + tooltips: Term & Confidentiality Period (p12)
- File: `src/app/fillndahtml/page.tsx` (Document step)
- `Term (months)` — add ⓘ tooltip: *"The period during which confidential materials can be shared."*
- `Confidentiality Period (months)` — add ⓘ tooltip: *"How long confidentiality obligations must be kept. Can be longer than the agreement term."*
- (Implemented via the shared tooltip pattern introduced in C1.)

### A6. Template picker "STEP 1 OF 2" is misleading (p10)
- File: `src/app/templates/page.tsx`
- The next stage has many sub-steps, so "1 of 2" is wrong. Remove the `STEP 1 OF 2` eyebrow (or replace with a neutral `Get started` eyebrow). Keep the single standard template as *the* product.

### A7. Generated email copy (p18) — copy-only portion
- File: `src/app/api/ndas/send-for-review/route.ts` (`suggestedBody`, ~L197) and any matching Resend template in `src/lib/email.ts`.
- Use the **full sender name** (first + last), not first only.
- Ensure link-validity wording is consistent and correct: **"The link stays active while the NDA is in progress and expires after 14 days of inactivity. No account is needed."** (Branch already says "2 weeks"; standardize the number as "14 days".)
- Minor warmth pass on the opening line. (Graphics / marketing landing = **D**.)

### A8. WhatsApp share wording (p19)
- File: `src/app/fillndahtml/page.tsx` (WhatsApp share text + preview card copy)
- Match the email's base message wording for consistency.
- **Remove "legally binding"** from the preview card line (`Send a legally binding NDA in minutes` → `Send an NDA in minutes — pick a template, fill in the details, and send a secure link.`).

---

## Phase B — Bugs

### B1. Deleted draft reappears + "Draft not found" on click (p14)
- Root cause: the fill page's own **Delete Draft** button deletes then routes to `/dashboard`, but the dashboard's server-rendered list is stale, so the row shows and opening it 404s. The DELETE route (`src/app/api/ndas/drafts/[id]/route.ts`) is a correct hard-delete.
- Fix: **remove the Delete Draft button from the fill page** (see C6). Deletion then happens only from the dashboard, where `handleDelete` already removes the row from local state. Add a `router.refresh()` after dashboard delete to also drop it from the RSC cache.

### B2. Black background behind "No company information found" modal (p13)
- The modal that prompts to complete the company profile on the fill page renders on a solid black backdrop instead of a translucent scrim.
- File: locate the modal in `src/app/fillndahtml/page.tsx` / `src/components/dashboard/ProfilePrompt.tsx`.
- Fix: backdrop → design-system scrim (`bg-black/40` or `bg-ink/40` with `backdrop-blur-sm`), not opaque black.

### B3. Phone field accepts letters (p14)
- Party A and Party B phone inputs accept arbitrary text.
- File: `src/app/fillndahtml/page.tsx`
- Fix: `inputMode="tel"`, restrict to phone characters (`+`, digits, spaces, `-`, `()`), and validate format on blur/submit with an inline error. Not over-strict (international numbers allowed).

### B4. No email to counterparty after reject-and-send-back (p21)
- `request-changes` **does** email Party B. The failing case is rejecting a *suggested change* then sending back — a different path.
- Task: **verify** which route handles "reject suggestion + send back" (candidates: `approve-changes`, `submit-input`, the send-back action in the review UI) and confirm it emails the counterparty + writes an audit event. Fix if missing.

### B5. "Sign Now" offered after you rejected & sent back (p20, p21)
- After rejecting suggestions and sending back, the dashboard still surfaced "Sign now" for that NDA.
- Task: ensure the workflow state after send-back is `AWAITING_PARTY_B_REVIEW` (not a signature state), so `getWorkflowStatusInfo` renders "Waiting review" and no "Sign Now" action. Fix the state transition and/or the dashboard action gating in `DashboardClient.tsx` (`renderActions`).
- Related copy (p20): when "Proceed to Sign" is disabled because edits are pending, relabel/clarify the two paths — primary **"Send back with changes"**, secondary **"Discard changes and sign"** — so a disabled "Proceed to Sign" isn't the headline.

### B6. Alarming yellow section icon on Clauses step (p16)
- The "Deal details" (Additional Clauses) step icon renders amber/yellow while other step icons are teal; amber is reserved for "action needed".
- File: `src/app/fillndahtml/page.tsx` — change that section icon tint to teal (`text-teal-700 bg-teal-50`) for consistency.

### B7. (Note, likely no-op) Stepper color meaning (p17) & "Action Required 0 vs Waiting review" (p7/8)
- The stepper (teal = done/current, gray = upcoming, check = complete) and the "Action Required = 0 while a Waiting-review item exists" are **correct** behavior, not bugs — the reviewer wanted clarity. No functional change; optionally add a one-line tooltip on the "Action Required" stat explaining it counts only items needing *your* action. Low priority.

---

## Phase C — UX improvements

### C1. Per-field info tooltips (p11 #1)
- Add a small, reusable ⓘ tooltip component (or reuse an existing UI primitive) usable next to any field label. Powers A5 and future fields. Accessible: focusable, `aria-describedby`, dismissible, respects reduced motion.

### C2. Field ↔ preview highlight & scroll sync (p11 #2, #3)
- When a form field gains focus, scroll the live preview to the matching token and highlight it (distinct, non-amber color); clear on blur.
- Also improve preview→form discoverability: make preview tokens visibly interactive (hover affordance) so users learn they can click a token to jump to its field.
- Scope: moderate. Implement token↔field id mapping in `src/app/fillndahtml/page.tsx` + preview component; keep it behind the existing preview toggle.

### C3. Clear required vs optional marking + scroll to first missing field (p11 #5, #8; p14)
- Mark optional fields explicitly (`Optional` chip) and keep `*` only on truly required ones.
- On "Send" with missing required fields: instead of only a toast ("Please fill in N required fields"), **scroll to and focus the first missing required field** and mark all missing ones inline.

### C4. Document Title not required; derive a sensible default (p12/p14)
- Remove `required` from **Document Title**.
- If left blank, default the title to the counterparty (Party B) name; fall back to `NDA — {date}`. Users can still rename from the dashboard (future).
- Add a small unit test for the title-derivation helper.

### C5. Signatory "same as party name" instead of prefill (p14)
- Do **not** prefill Signatory Name from Party Name (the party may be a company).
- Add a `Same as party name` checkbox that, when checked, fills the signatory name from the party name and keeps it in sync until edited. Applies to Party A and Party B.

### C6. Move "Delete Draft" off the fill page (p14) — also fixes B1
- Remove the `Delete Draft` button from the Party A step. Deletion happens only from the dashboard (guards against accidental deletion mid-edit).

### C7. Confidentiality-period-below-term warning (p12)
- If Confidentiality Period (months) < Term (months), show an inline **non-blocking** warning near the field (does not prevent send).
- Small unit test on the comparison helper.

### C8. Party A step should fit the viewport like the Document step (p15)
- The Document step fits on screen; Party A does not.
- File: `src/app/fillndahtml/page.tsx` — tighten vertical rhythm / container sizing on the Party A step so it matches. CSS-only; verify at common laptop heights.

### C9. "Ask receiver to fill" — keep entered values, email still required (p11 #9)
- When toggling **Ask receiver to fill** for Party B, keep the email field required, and preserve (pre-fill) any values the sender already entered rather than blanking the section.

---

## Nav cleanup (from bucket D, pulled into scope)

File: `src/components/PrivateToolbar.tsx` (desktop nav + `More` dropdown + mobile mirror).

- **Remove** `Fill NDA` from `navigation`.
- **Top-level toolbar links become:** `Dashboard`, `Settings`, `Plans`.
- **Remove** Dashboard / Settings / Pricing from the `primaryLinks` ("More") group; `More` keeps only `About`, `Contact`, `FAQ`, `Help`, `Homepage`.
- Keep the primary **New NDA** CTA (right side).
- Mirror the same structure in the mobile menu.
- **Dashboard header "New NDA" button (p6):** remove the duplicate button in the dashboard header (`DashboardClient.tsx` ~L539) since the toolbar CTA covers it; keep the empty-state CTA.

---

## Cross-cutting: Formi knowledge sync (project standing rule)

Per `CLAUDE.md`, any change to routes/labels/workflow copy that a user could ask Formi about must be reflected in `src/ai/prompts/formi_systemPrompt.ts` (`PRODUCT_KNOWLEDGE`). Audit for references to "Fill NDA", the "More" menu structure, and the "Additional Clauses" naming; update to match. Re-read the prompt after edits.

## Design system compliance

All UI edits follow Calm Precision (`.claude/skills/stitch-design.md`): teal-800 CTAs, amber only for "action needed", `text-ink` headings, cards `bg-white border border-gray-100 rounded-2xl shadow-card`, StatusPill tones, Reveal for motion. The tooltip (C1), scrim fix (B2), and preview highlight color (C2) must use system tokens (highlight color ≠ amber).

## Testing & verification

- **Unit (Vitest):** title-derivation helper (C4), confidentiality-vs-term comparison (C7), phone-format validator (B3).
- **Manual/verify per surface:** run the app and drive each changed flow — nav, dashboard labels/delete, template picker eyebrow, full fill flow (tooltips, required/optional, preview sync, signatory checkbox, ask-receiver, layout fit), review/send-back (B4/B5), generated email + WhatsApp text.
- Use the project's `verify` / `run` skill to exercise the fill and review flows end-to-end before claiming completion.

## Suggested implementation order

1. Phase A copy (fast, independent).
2. Nav cleanup + dashboard header button + Formi sync.
3. Phase B bugs (B1/C6 together; B2; B3; B4/B5 together; B6).
4. Phase C UX (C1 first → A5; then C2, C3, C4, C5, C7, C8, C9).
