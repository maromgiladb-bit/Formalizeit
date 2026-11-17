# FormalizeIt — Ink & Seal design system

Read this file at the start of any UI task. All pages follow it.

Ink & Seal replaced Calm Precision in November 2026 (T-058, PRs #23–#25). Full rationale, screen
specs and open decisions: `docs/superpowers/specs/2026-11-15-ink-and-seal-design-system.md`.
Living reference page (dev only): `/dev/design-system` (`src/app/dev/design-system/page.tsx`).

---

## Thesis

Precise and fast, grounded in the document. Every screen shows the real NDA beside the controls
that change it. Trust comes from showing evidence (template version, timestamp, hash), not from
saying "secure". Quiet by default; three signature motion moments (below).

---

## Color: every color has exactly one job

Tokens live in `src/app/globals.css` (`@theme`). Never invent colors.

| Role | Class | Rule |
|---|---|---|
| Ink | `text-ink` (`#0d1f1e`) | Headings, primary text. Not `text-gray-900`. |
| Muted text | `text-muted-ink` (`#5b6b69`) | Secondary text, descriptions, inactive nav. |
| Ground | `bg-ground` (`#f6f8f8`) | App and section backgrounds. |
| Sheet | `bg-white` | Paper sheets, panels, cards. |
| Line | `border-line` (`#e3e9e8`) | Every 1px rule and border. |
| Action | `bg-teal-800 hover:bg-teal-700` / `text-teal-800` (`--color-primary`) | CTAs, links, focus ring, active field, active nav underline. The only action color. Never teal-600. |
| Tint | `bg-tint` (`#d9efec`) or `bg-teal-50` | Highlighted variables, active pills, info boxes. |
| Needs you | amber (`bg-amber-50 text-amber-700`, `bg-amber-500`) | ONLY "needs you": sign now, review changes, link expired. Never decorative. |
| Done | solid teal (`bg-teal-700 text-white`) | Signed / complete pill, seal. |
| Destructive | `text-red-600`, `--color-destructive` | Errors and delete confirmation only. |

**Banned:** blue, purple, orange, green, yellow, crimson utility colors. Green success → teal done
tone. Yellow warning → amber. Blue info → tint. (Brand colors for the share buttons, e.g.
`--color-whatsapp`, are the one exception and live only in `share-sheet` / `brand-icons`.)

---

## Shape and elevation

- **Radius:** controls (buttons, inputs, nav items) `rounded-control` (6px); sheets, panels, menus,
  cards `rounded-sheet` (8px); pills `rounded` (4px) or `rounded-full`. No `rounded-2xl` / `rounded-xl`
  in new work.
- **Borders:** 1px `border-line`, not `border-gray-100/200`.
- **Shadows:** `shadow-sheet` (stacked paper) for document sheets, panels and menus;
  `shadow-card` / `shadow-float` remain for small raised elements. Never `shadow-md/lg/xl`.

---

## Type

| Role | Face | Class / where |
|---|---|---|
| UI + display | **Schibsted Grotesk** | Default `font-sans` (and `font-display`) site-wide, loaded in `src/app/layout.tsx` |
| Evidence / data | **Geist Mono** | `font-mono` / `font-doc-mono`: dates, counters, step numbers, hashes, template version, timers |
| Document | **Noto Serif** | Only inside the NDA (`templates/professional_mutual_nda_v1.hbs`), never in the app UI |
| Signature | **Great Vibes** | Typed signatures (baked into the signed PDF as an image) |

- **Scale:** display 56–72px · H1 32–40 · H2 24 · body 15–16 · small 13 · minimum 12 (`text-xs`).
  Never `text-[10px]`. Headings `font-display font-bold text-ink tracking-[-0.03em]`.
- **Meta lines** in Geist Mono, e.g. `v1.0 · 15 Nov 2026 · 9f2c4e…a41e` (evidence and document
  meta are the one place middle-dot strings belong).
- **No eyebrows.** Never a small label above a heading that only repeats it. Small type before a
  heading stays only when it carries a fact the heading lacks (a step number, a version).
- **Labels** (form labels, table heads, panel titles, tags, nav): sentence case, a step smaller,
  untracked. **Never `uppercase`, never `tracking-wide/wider/widest`.**
- **Gray text on white:** `text-muted-ink`, `text-gray-500` or darker. `text-gray-400` is for icons
  and placeholders only.
- Headings say what the user does ("Who are you sending it to?"), not what the section is.

---

## Components: use the shared primitives (`src/components/ui`), never hand-roll

- **Button** (`button.tsx`): always pass `shape="crisp"` in new work (6px radius, display face).
  Variants: default (teal-800), outline, secondary, ghost, link, destructive. The `default` shape
  is the legacy Calm Precision look, kept so unmigrated buttons don't change (T-075).
- **Inputs** (`input.tsx`): `inputClassesCrisp` for new forms (6px, `border-line`); `Input` /
  `Textarea` / `inputClasses` are legacy. Focus: `focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700`.
- **StatusPill** (`status-pill.tsx`): `<StatusPill tone label shape="crisp" />`. Labels come from
  `getWorkflowStatusInfo()` in `src/lib/workflowStatus.ts`. Tones:
  - `neutral` (gray): Draft, Cancelled
  - `progress` (tint + teal ring): Sent, Waiting on them, Awaiting signature
  - `action` (amber, pulsing dot): Your turn: sign / review, Review changes, Link expired
  - `done` (solid teal + check): Signed, Complete
- **Sheet** (`sheet.tsx`): white paper sheet, `rounded-sheet border-line shadow-sheet`, optional
  Geist Mono `meta` header line. Use for documents and main panels.
- **EvidenceLine / EvidenceBlock** (`evidence.tsx`): Geist Mono lines built only from recorded
  evidence fields (signer, timestamp, IP, template version, `agreementHash`). Never show a field we
  don't record.
- **Seal** (`seal.tsx`): teal circular seal for the executed state, worded "Signed" + date, never
  "certified" / "verified". **UI only**: nothing is printed on the PDF until T-070 is decided.
- **ShareSheet** (`share-sheet.tsx`): the send-success sheet (secure link + copy, Gmail / Outlook /
  WhatsApp / Copy link, pre-written message). Links-only send: never say "email sent".
- **LegalDisclaimer** (`legal-disclaimer.tsx`): `variant="compact"` (one line + "Learn more") on the
  fill, review and sign pages. It must stay visible on those pages (CLAUDE.md rule 6).
- **PageHero** (`page-hero.tsx`): icon chip + H1 + subtitle on `bg-ground`, for legal and info pages.
- **Reveal** (`reveal.tsx`): `<Reveal>`, `<RevealGroup>` + `<RevealItem>`, the ONLY scroll-reveal
  mechanism. Content is visible by default and hides only once the `js` class is on `<html>`. Never
  framer `initial={{ opacity: 0 }}` / `initial="hidden"` on page content.
- Also: `accordion`, `dropdown-menu`, `switch`, `field-tooltip`, `notification-icon`, `pricing`.

---

## App shell and navigation

- **Top app bar** on every page via `src/components/nav/FloatingNavShell.tsx`, wrapped by
  `PrivateToolbar` (signed in) and `PublicToolbar`. Full-width white bar with a `border-line` rule
  at the top; past 32px of scroll it becomes a floating `rounded-sheet` bar with `shadow-sheet`
  (two discrete states, never scroll-linked animation).
- Signed-in bar: logo + Beta pill, nav (Dashboard, My account, Pricing, More: About, Contact, FAQ,
  Help, Home), bell, **New NDA** (the only New NDA button on the page), account.
- Nav links: `text-muted-ink hover:text-ink` with a 2px bottom border; active = `text-ink
  border-teal-800`. No filled-pill or solid-teal hovers.
- The bar is `fixed`; the shell adds an `h-16` spacer. Anchor targets need `scroll-mt-28`.
- **Footer:** marketing and legal pages only. App pages (dashboard, fill, settings, templates,
  drafts, view) have none (`FooterWrapper`).
- Mobile: links fold behind the menu button; logo, New NDA and account stay.

---

## Screen patterns

- **Home:** "NDA in minutes." + one sentence + "Send your NDA now" / "Read the standard NDA"; a
  real NDA sheet whose blanks fill in with a mono counter. One screen at desktop.
- **Fill wizard** (`/fillndahtml`): stepper under the bar (Document, Party A, Party B, Clauses,
  Review) with a mono "Step n of 5"; form left, live preview sheet right; compact disclaimer;
  Back / Save draft / Continue.
- **Receiver sign:** document dominant, sign panel docked right (bottom panel on phones): deal
  summary, both consent checkboxes with the exact text from `src/lib/authorityConsentText.ts`,
  signature, Sign NDA, trust line. Executed state: seal + evidence block.
- **Dashboard:** compact list with filter tabs and counts (All, Needs you, Waiting, Received,
  Signed, Drafts, Archived). Rows: name + counterparty | StatusPill | mono date + row actions.
  Stacks on mobile, no horizontal scroll.
- **Settings, legal, other pages:** same tokens and shell. Legal page text never changes in a
  design pass.
- **Pricing** lives on home at `/#pricing` (`/plans` redirects there).

### Layout

- Container `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8` (home 6xl, nav 7xl).
- Marketing sections `py-24 lg:py-32`, alternating `bg-white` / `bg-ground` with `border-line` rules.
- Long documents cap running text at 70ch (`[&_p]:max-w-[70ch]`).
- App pages `py-8`–`py-12`, compact header: H1 + one muted line + primary action on the right.

---

## The document vs the UI

The fill preview, the sign page iframe and the PDF all render the same `.hbs` template. A design
pass **never** changes the template, its fonts, or the PDF. Preview-only aids (variable highlight,
T-073) are injected into the fill preview iframe only, never into the sign page or the PDF render.

---

## Motion

| Moment | Spec |
|---|---|
| Hero blanks fill | each variable resolves in turn, 60ms stagger, color/background only |
| Share sheet | translateY(40px)→0 + fade, 280ms `cubic-bezier(0.2,0.8,0.2,1)`; copy icon morphs to check |
| Executed seal | scale 1.15→1, opacity 0→1, rest at rotate(-6deg), 220ms; evidence lines follow |
| Everything else | hovers 150–200ms on color/shadow; `Reveal` for scroll reveals |

- **Never `transition-all`.** Name the properties. Never animate `width`, `height`, `top`, `left`,
  `right` or `max-width` (progress bars use `origin-left scale-x-*`).
- `prefers-reduced-motion` is mandatory: final state shown, framer uses `useReducedMotion()`, CSS
  uses `motion-reduce:` / `motion-safe:`. Readable content never starts at opacity 0 without JS.

---

## States, accessibility, punctuation

- `globals.css` gives every control a 2px teal focus ring on `:focus-visible`, 1px press on
  `:active`, `not-allowed` on `:disabled`. Never `outline-none` without a replacement ring.
- Decorative icons `aria-hidden="true"`; icon-only buttons and links `aria-label`. Lucide icons,
  never emoji.
- No arrows glued to link text ("Learn more →"), no decorative status dots.
- Every surface works at 375px; lists stack, never scroll horizontally.

---

## Checking

Hallmark (`/hallmark audit`) is the design checker; its stamp and waivers sit at the top of
`src/app/globals.css`, records in `.hallmark/` (git-ignored). The e2e smoke run
(`e2e/smoke.spec.ts`) takes a screenshot of every page into `e2e/.results/screens/`.
