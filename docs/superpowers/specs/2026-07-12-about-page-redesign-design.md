# About Page Redesign — Design Spec

**Date:** 2026-07-12
**Branch context:** `feat/todolistimpl-2`
**Copy source:** `docs/brand-messaging.md` (approved messaging library, 2026-06-19 PDF).

## Goal

Complete rewrite of `src/app/about/page.tsx` as a narrative scroll journey telling the **reuse
story** ("Review once, reuse forever") — the deeper "why it's fast" behind the homepage's
speed-first pitch. Rich, code-driven animated product demos (no video assets, no stock photos),
all inside Calm Precision (`.claude/skills/stitch-design.md`).

Decisions locked with the user:
- **Demos are animated in code** (framer-motion simulated UI), not real recordings.
- **Page story = reuse** (homepage keeps speed as #1; About explains why it's fast).
- **Shape = narrative scroll journey** (approach A), not a refresh-in-place or pinned
  scrollytelling tour.

## Problems with the current page (why rewrite)

- Copy predates `docs/brand-messaging.md`; hero repeats the homepage pitch.
- `TemplateMockup` shows fictional "One-way NDA" / "Employee NDA" options — contradicts the
  one-standard-NDA model (CLAUDE.md).
- `FeatureSteps` section uses Unsplash stock photos (off-system, external images).
- Claims "legally binding signature" and "pre-vetted templates" — violates the legal-claims
  caveat in `docs/brand-messaging.md` (founder-drafted pending counsel review).

## Page structure (7 beats)

### 1. Hero
- Eyebrow `About FormalizeIt` → H1 **"Review once, reuse forever."**
- Sub: *"Stop re-reading NDAs. Approve one fair NDA once, then reuse it safely for every deal —
  NDA in minutes."*
- **Hero demo:** document card where boilerplate lines are locked (gray + small lock chip) and
  only the variable fields glow teal and fill themselves in.

### 2. The problem
- Eyebrow `The problem` → H2 *"NDAs are repetitive, low-value to negotiate — and they still
  waste everyone's time."*
- Two cards side by side:
  - **The old way** (grays): animated email ping-pong — bubbles bouncing left/right labeled
    *redline v3*, *"small change"*, *legal review*, *11 days*.
  - **With FormalizeIt** (teal accents): one clean send arrow; line *"5 min per NDA. No legal
    fees, no back and forth."*

### 3. The idea
- Eyebrow `One standard` → H2 **"One NDA. One legal text. Infinite deals."**
- Body: fair by design — balanced for both sides, not "pro-discloser" or "pro-recipient".
- **Demo:** one NDA document fans out into several deal cards (different party names/dates),
  each stamped with the same "standard" mark.

### 4. How it works (scroll timeline — keep the mechanic, rewrite the steps)
Keep the existing scroll-linked progress line + alternating step layout. New steps + new
self-animating mockups:
1. **Read the standard once** — document mockup with a reading-progress bar filling, then a
   check: *"Reviewed — you won't need to do this again."* (Replaces the off-model 3-template
   picker.)
2. **Fill only what's different** — fill form types itself: party name, date, purpose appear
   character by character in teal fields.
3. **Collaborate & send** — teammate avatars drop in a comment; send fires; `StatusPill` flips
   `DRAFT → SENT`.
4. **Signed, sealed, tracked** — signature check draws in; `StatusPill` flips to `SIGNED`;
   audit-trail rows (email · timestamp · hash) tick into view.

### 5. Trust infrastructure
- Eyebrow `Trusted by both sides` → H2 *"When they recognize the standard, they sign faster."*
- Three cards: **Known standard** ("when someone sends you an NDA from this platform, you know
  exactly what you're signing") · **Evidence built in** (audit trail, e-signature, agreement
  hash) · **Secure by default** (encrypted storage, 5-year retention).
- Small-print "not legal advice" disclaimer under this section (reuse
  `@/components/ui/legal-disclaimer` if it fits).

### 6. Built for teams
- Replace `FeatureSteps` (Unsplash) with three on-system cards: one company/one template ·
  contributors do everything except sign · signers apply the company signature.

### 7. CTA band
- H2 *"Work on what's important, not on the standard legalities."*
- **Get Started Free** via `@/components/ui/button` + Clerk `SignUpButton` (modal), matching the
  current CTA pattern.

### Copy rules
- All lines from `docs/brand-messaging.md`, verbatim where approved.
- **No** "legally binding", "pre-vetted", or "lawyer-vetted" claims — say "signed with a full
  audit trail".

## Motion & demo system

- Scroll reveals **only** via `@/components/ui/reveal` (`Reveal` / `RevealGroup` /
  `RevealItem`).
- Self-animating demos live in a co-located client module `src/app/about/demos.tsx` (keeps the
  page readable). Each demo triggers on `useInView(once)`; framer-motion variants; no timers
  while off-screen.
- `useReducedMotion()`: reduced-motion users see the final state, static. Mandatory in every
  demo.
- The timeline's scroll-linked progress line stays — it's the one continuous scroll-linked
  element and an accepted pattern for this page (design system: "About stays a standalone page
  (scroll timeline)").
- Color discipline: teal = new way/done; amber only for genuine "needs action" (pending
  signature dot); grays = old way. No blue/green/purple/yellow.

## Files

- **Rewrite:** `src/app/about/page.tsx`
- **New:** `src/app/about/demos.tsx` (animated mockup components)
- **Edit:** `src/app/about/layout.tsx` — metadata description updated to the reuse story
- **Delete:** `src/components/ui/feature-section.tsx` — its only consumer is the About page
  (verified by grep); becomes dead code after the rewrite
- **Formi:** `src/ai/prompts/formi_systemPrompt.ts` has no `/about` route reference today
  (verified); audit after the rewrite and add/adjust only if the new page introduces something
  Formi should know (likely no change)

## Testing & verification

- `npm run lint` + typecheck pass.
- Run the dev server and drive `/about` top to bottom:
  - Desktop and 375 px — no horizontal scroll, demos legible at both.
  - OS reduced-motion enabled — page shows final states, no animation.
  - All copy matches `docs/brand-messaging.md`; no banned legal claims.
  - CTA opens the Clerk sign-up modal.
- Use the project `verify`/`run` flow before claiming completion.
