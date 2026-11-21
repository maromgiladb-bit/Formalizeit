# Landing page redesign: team brief (T-098)

Lead: Claude (main session). Worktree: `.claude/worktrees/T-078` (branch `feat/T-098-landing-redesign`).
Do not touch the main repo folder `C:/Users/marom/Projects/nda-saas` itself; work only in this worktree.

## Goal

Merge the logged-out homepage (`src/app/page.tsx`) and `/about` (`src/app/about/*`) into one landing
page. Signed-in users live in the dashboard, so the landing page is for visitors without an account.
The founder wants it completely redesigned: **powerful but simple, draws the eye, great animation,
still easy and professional.** We ship three options side by side as dev-only routes, the founder
picks one, then it replaces `/` and `/about` redirects to `/`.

- Option routes (dev only, 404 in production via middleware): `/dev/landing/a`, `/dev/landing/b`,
  `/dev/landing/c`.
- Dev server for this worktree: `npx next dev -p 3001` (port 3000 belongs to the main folder).

## Non-negotiables

- Ink & Seal design system. Read `C:/Users/marom/Projects/nda-saas/.claude/skills/stitch-design.md`
  (the up-to-date copy; this worktree's copy is stale). Tokens: `bg-ground`, white sheets,
  `border-line`, `text-ink`, `text-muted-ink`, `bg-tint`, teal-800 for actions only, amber only for
  "needs you", solid teal for done. Schibsted Grotesk UI, Geist Mono (`font-doc-mono`) for evidence
  and data, Noto Serif only inside the NDA document itself. `rounded-control` 6px / `rounded-sheet`
  8px. Primitives in `@/components/ui` (Button `shape="crisp"`, StatusPill `shape="crisp"`, Sheet,
  EvidenceBlock, Seal, ShareSheet, LegalDisclaimer).
- Hallmark floor: no `transition-all`; animate only `transform`, `opacity`, `color`,
  `background-color`, `clip-path`, `filter` sparingly; never width/height/top/left. Every animation has
  a `prefers-reduced-motion` fallback that shows the final state. **Content is visible with
  scripting off**: server HTML is the final state; things hide only under `html.js` (the root layout
  adds that class) or after mount. No eyebrows, no uppercase/tracked labels, no emoji, no glued
  arrows, no middle-dot strings outside evidence/meta lines, no invented metrics, logos or
  testimonials, no hand-drawn browser/OS/phone chrome, no card inside a card, no purple/blue.
  Decorative icons `aria-hidden`.
- Facts: see `2026-11-21-landing-copy.md` (copywriter) for wording; never "legally binding". The
  compact not-legal-advice disclaimer appears on the page.
- Wiring to keep: `SignupButton` for signed-out CTAs (it routes to the request-access form while
  sign-up is closed), `#pricing` anchor with `<PricingSection />`, FAQ teaser from
  `src/app/faq/faq-data.ts`, link to `/standard-nda`, `useAuth` branch (signed-in sees "Go to
  dashboard"/"New NDA" via `NEW_NDA_HREF`).
- Framer Motion 12 is installed (import from `framer-motion`). Ask the lead before adding any
  dependency.

## Three directions (working titles; final copy from the copy deck)

**A. Living document** (product-led). The hero is the real NDA sheet, large, and the page is one
continuous scroll story in which that same sheet travels: blanks fill, it folds into a secure link
in the share sheet, the counterparty signs, the seal stamps and the evidence lines print. Pinned
(sticky) scrollytelling on desktop, stacked steps on mobile. Signature moment: the seal stamp.

**B. The standard** (editorial, type-led). Big confident typography and lots of air. Signature
moment: the whole standard NDA set as a dim wall of text where only the handful of variable blanks
light up teal: "thousands of words, fixed. These few are yours." (use the real counts from the
template). Then a quiet, numbered how-it-works, evidence set like a document, roles as a simple
table. Motion is restrained and precise: masked line reveals on headings, the wall dimming.

**C. Deal clock** (story/time-led). A deal told against a running mono clock: 09:00 the call is
booked, 09:02 the NDA is filled, 09:03 the link goes out from your own inbox, the counterparty
signs before the meeting. Hero shows the clock and a compact live product moment (status pill
moving Draft → Waiting on them → Signed). Horizontal-feeling timeline, dashboard rows changing
status, "Done before the meeting ends." The times are labelled as an example, never as a stat.

All three share one narrative order (hook, problem, idea, how it works, trust/evidence, teams,
pricing, FAQ, final CTA) unless the copy deck improves it; they differ in composition and motion.

## File ownership (so agents never edit the same file)

| Owner | Files |
|---|---|
| Illustrator | `src/components/landing/scenes/*` (product scenes), `src/lib/landing/*` (data helpers), `public/landing/*` (screenshots/images) |
| Motion | `src/components/landing/motion/*` (primitives and hooks); later a motion pass on the pages by request of the lead |
| Lead | `src/app/dev/landing/**`, `src/components/landing/sections/**`, `globals.css`, middleware, final integration |
| Copywriter | `docs/superpowers/specs/2026-11-21-landing-copy.md` |
| Researcher | `docs/superpowers/specs/2026-11-21-landing-research.md` |

Scene contract: every scene is a client component whose **default render is its final, complete
state** (so no-JS and reduced motion look right) and which takes a controlled prop (`step`,
`progress` 0..1, or `filled`) so the motion layer and the pages can drive it. Scenes contain no
scroll logic and no timers of their own unless an `autoplay` prop is passed.
