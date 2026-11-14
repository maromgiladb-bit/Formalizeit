# FormalizeIt — Calm Precision Design System

Read this file at the start of any UI task. All pages must follow this design system.

---

## Overview

**Calm precision** — Linear/Notion-feel minimalism. Generous whitespace, soft shadows, rounded-2xl cards, subtle teal tints, restrained scroll reveals. The site must *feel* like its message: "NDA in minutes" — fast, simple, frictionless.

Reference implementations: `src/app/page.tsx` (marketing), `src/components/dashboard/DashboardClient.tsx` (app).

---

## Color discipline — every color has exactly one job

Tokens are defined in `src/app/globals.css` (`@theme`). Never invent new colors.

| Role | Token / class | Rule |
|---|---|---|
| Ink | `text-ink` (`#0d1f1e`) | Headings, nav links, primary text. NOT `text-gray-900`. |
| Body | `text-gray-500` | Descriptions, secondary text. |
| Surfaces | `bg-white` / `bg-gray-50` | Alternate section backgrounds. |
| Primary | `bg-teal-800 hover:bg-teal-700` | CTAs and links ONLY. Never as decoration, block hovers, or random borders. Never teal-600. |
| Soft tint | `bg-teal-50` + `text-teal-700` | Icon chips, active nav pills, info boxes. |
| Action | amber (`bg-amber-50 text-amber-700` / `bg-amber-500`) | EXCLUSIVELY "needs you" moments: sign now, review changes, pending approval, popular badge. Never decorative — amber must always mean something. |
| Borders | `border-gray-100` (cards), `border-gray-200` (inputs, dividers) | |
| Destructive | `text-red-600` etc. | Errors and delete confirmation only. |

**Banned:** blue, purple, orange, green, yellow utility colors. Green "success" → teal done-tone. Yellow "warning" → amber. Blue "info" → teal-50 tint.

---

## Elevation & shape

- Cards: `bg-white rounded-2xl border border-gray-100 shadow-card` (hover: `hover:shadow-float`)
- Overlays / nav pill / hero mockups: `shadow-float`
- Buttons & inputs: `rounded-xl` (small buttons `rounded-lg`, nav pills `rounded-full`)
- Never `shadow-md/lg/xl` — only the two tokens.

---

## Typography (Plus Jakarta Sans)

- **Display (home hero):** `text-5xl sm:text-6xl lg:text-7xl font-extrabold text-ink tracking-tight leading-[1.05]`
- **Page H1:** `text-4xl md:text-5xl font-extrabold text-ink tracking-tight`
- **Section H2 (marketing):** `text-4xl md:text-5xl font-extrabold text-ink tracking-tight` (about half the hero display, never a third)
- **Card H3:** `text-base font-semibold text-ink` (drop pervasive `font-bold` — use semibold/medium)
- **No eyebrows.** Never put a small label above a heading that only names what the heading says. Small type before a heading stays only when it carries a fact the heading lacks (a step number, "Error 404", a version), and then it is a plain label.
- **Labels** (form labels, table heads, panel titles, tags, nav): sentence case in the body face, a step smaller, untracked. Panel title: `text-sm font-semibold text-gray-700`. Form label / table head: `text-xs font-semibold text-gray-500`. **Never `uppercase`, never `tracking-wide/wider/widest`.**
- **Smallest text:** 12px (`text-xs`). Never `text-[10px]`.
- **Gray text on white:** `text-gray-500` or darker. `text-gray-400` fails contrast (about 2.6:1) and is for icons and placeholders only.
- **Body:** `text-base text-gray-500 leading-relaxed`

---

## Components — use the shared primitives, never hand-roll

- **Buttons:** `@/components/ui/button` (`Button` / `buttonVariants`). Default = teal-800. Variants: outline, secondary, ghost, link, destructive. Never hand-roll a teal button.
- **Inputs:** `@/components/ui/input` — `Input`, `Textarea`, or the `inputClasses` string for legacy forms. Focus = `focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700`.
- **Status:** `@/components/ui/status-pill` — `<StatusPill tone label />`. Tones:
  - `neutral` (gray) — DRAFT, FILLING, CANCELLED
  - `progress` (teal-50/teal-700 ring) — SENT, AWAITING_*  on the other side
  - `action` (amber, pulsing dot) — SIGN NOW, CHANGES TO REVIEW
  - `done` (solid teal-700 + check) — SIGNED, COMPLETE
- **Scroll reveals:** `@/components/ui/reveal` — `<Reveal>`, `<RevealGroup>` + `<RevealItem>`. The ONLY scroll-animation mechanism. Content is visible by default: it only hides once the `js` class (set in the root layout) is on `<html>`, so it shows with scripting off, in link previews and under `prefers-reduced-motion`. Never use framer `initial={{ opacity: 0 }}` / `initial="hidden"` on page content; it is server-rendered invisible. Page-load entrance animations are not used (one reveal per page at most).
- **Cards:** `@/components/ui/card` or the card classes above.

---

## Navigation

- Both toolbars wrap `src/components/nav/FloatingNavShell.tsx`: full-width white bar at top of page → centered floating pill (`bg-white/85 backdrop-blur-md shadow-float rounded-full`) past 32px scroll. Two discrete states with CSS transitions — never continuous scroll-linked animation.
- Shrunken pill keeps only core links + primary CTA.
- Nav links: `text-gray-600 hover:text-ink hover:bg-gray-100 rounded-full` — active = `bg-teal-50 text-teal-800 font-semibold`. No solid teal block hovers.
- Pages are spaced by the shell's built-in `h-16` spacer (the header is `fixed`). Anchor targets need `scroll-mt-28`.

## Footer

Light: `bg-gray-50 border-t border-gray-200`, brand blurb + 3 link columns, links `text-gray-500 hover:text-ink`.

---

## Layout

- Container: `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8` (home uses 6xl for every section except the FAQ's reading column, footer/nav 7xl)
- Marketing sections: `py-24 lg:py-32` with alternating white / gray-50 + `border-y border-gray-100`
- Home hero: one screen at desktop (`lg:min-h-[calc(100svh-4rem)]`), headline + one sentence (about 12 words) + actions; nothing else above the fold
- Long documents (legal pages, help): cap running text at 70ch (`[&_p]:max-w-[70ch]` on the content wrapper)
- App pages: `py-8`–`py-12`, compact headers with H1 + description

---

## Motion rules

- Reveals: once-only, fade-up 24px, 0.4–0.5s easeOut, stagger 0.08 — via `<Reveal>` only.
- Hovers: color/shadow transitions (`transition-colors` / `transition-shadow`), 200–300ms. No scale bounces, no translate lifts, no confetti.
- **Never `transition-all`.** Name the properties (`transition-colors`, `transition-shadow`, `transition-transform`, or Tailwind's `transition`). Never animate `width`, `height`, `top`, `left`, `right` or `max-width`: progress bars use `origin-left scale-x-*` + `transition-transform`; the nav's height change snaps and only its colours/shadow fade; accordions fade (opacity + transform), never animate height.
- **States:** `globals.css` gives every control a 2px teal focus ring on `:focus-visible` (instant), 1px press on `:active` and `not-allowed` on `:disabled`. Components may add their own `focus-visible:ring-*`; never `outline-none` without a replacement ring.
- **Icons:** decorative SVG and Lucide icons carry `aria-hidden="true"`; icon-only buttons and links carry an `aria-label`. Never an emoji as an icon; use Lucide.
- **Punctuation:** no arrows glued to link text ("Learn more →"), no middle-dot meta strings ("A · B · C"), no decorative status dots.
- `prefers-reduced-motion` is mandatory: framer components use `useReducedMotion()`, CSS uses `motion-reduce:` / `motion-safe:` variants.

---

## Page recipes

- **Marketing section:** H2 → description → `RevealGroup` of rounded-2xl cards.
- **App page header:** `text-2xl font-extrabold text-ink` H1 → `text-sm text-gray-500` description → primary action button on the right.
- **List rows (dashboard pattern):** `rounded-2xl border-gray-100 bg-white px-5 py-4 hover:shadow-card` — icon chip + semibold name + gray-500 counterparty | StatusPill | date + small actions. Stacks on mobile, no horizontal scroll.
- **Public token frame (external recipients):** gray-50 page, "Secure NDA link" lock badge (`bg-teal-50 text-teal-800 rounded-full`), white rounded-2xl card with shadow-float, single prominent CTA, trust line "Encrypted and audit-trailed. Powered by FormalizeIt."
- **Pricing:** lives on home at `/#pricing` (`/plans` redirects there). Popular card = white + `border-teal-700 ring-1` + amber badge.

---

## Site map notes

- Pricing is a home-page section: link to `/#pricing`, never `/plans`.
- About stays a standalone page (scroll timeline).
- One shared app shell for all roles — role differences are action-level, not page-level.

## Mobile

- Every surface works at 375px. Lists stack, never scroll horizontally.
- Settings sidebar becomes a horizontal pill bar on mobile.
- Mobile menus open as sheets inside the nav pill (rounded-2xl).
