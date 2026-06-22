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
- **Section H2:** `text-3xl md:text-4xl font-extrabold text-ink tracking-tight`
- **Card H3:** `text-sm font-semibold text-ink` (drop pervasive `font-bold` — use semibold/medium)
- **Eyebrow label:** `text-teal-700 text-xs font-bold uppercase tracking-widest mb-2`
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
- **Scroll reveals:** `@/components/ui/reveal` — `<Reveal>`, `<RevealGroup>` + `<RevealItem>`. The ONLY scroll-animation mechanism. Honors `prefers-reduced-motion` automatically.
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

- Container: `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8` (home uses 6xl, footer/nav 7xl)
- Marketing sections: `py-20` with alternating white / gray-50 + `border-y border-gray-100`
- App pages: `py-8`–`py-12`, compact headers with eyebrow + H1 + description

---

## Motion rules

- Reveals: once-only, fade-up 24px, 0.4–0.5s easeOut, stagger 0.08 — via `<Reveal>` only.
- Hovers: color/shadow transitions (`transition-colors` / `transition-shadow`), 200–300ms. No scale bounces, no translate lifts, no confetti.
- `prefers-reduced-motion` is mandatory: framer components use `useReducedMotion()`, CSS uses `motion-reduce:` / `motion-safe:` variants.

---

## Page recipes

- **Marketing section:** eyebrow label → H2 → description → `RevealGroup` of rounded-2xl cards.
- **App page header:** eyebrow → `text-2xl font-extrabold text-ink` H1 → `text-sm text-gray-500` description → primary action button on the right.
- **List rows (dashboard pattern):** `rounded-2xl border-gray-100 bg-white px-5 py-4 hover:shadow-card` — icon chip + semibold name + gray-500 counterparty | StatusPill | date + small actions. Stacks on mobile, no horizontal scroll.
- **Public token frame (external recipients):** gray-50 page, "Secure NDA link" lock badge (`bg-teal-50 text-teal-800 rounded-full`), white rounded-2xl card with shadow-float, single prominent CTA, trust line "Encrypted · Audit-trailed · Powered by FormalizeIt".
- **Pricing:** lives on home at `/#pricing` (`/plans` redirects there). Popular card = white + `border-teal-600 ring-1` + amber badge.

---

## Site map notes

- Pricing is a home-page section: link to `/#pricing`, never `/plans`.
- About stays a standalone page (scroll timeline).
- One shared app shell for all roles — role differences are action-level, not page-level.

## Mobile

- Every surface works at 375px. Lists stack, never scroll horizontally.
- Settings sidebar becomes a horizontal pill bar on mobile.
- Mobile menus open as sheets inside the nav pill (rounded-2xl).
