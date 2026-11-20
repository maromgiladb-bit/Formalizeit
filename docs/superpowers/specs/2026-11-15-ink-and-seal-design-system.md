# Ink & Seal (Calm colors): design system and rollout

**Ticket:** T-058 · **Decided:** 2026-11-15 by Gilad · **Status:** rolled out (PRs #24, #25), docs synced (T-069); leftovers in T-075
**Reference mockup:** [`docs/design/ink-and-seal/mockup.html`](../../design/ink-and-seal/mockup.html)
(open in a browser; Replay buttons rerun the motion). Shared brief: `docs/design/ink-and-seal/brief.md`.
Earlier option: `docs/design/ink-and-seal/reference-calm-precision-2.html`.

Replaces "Calm Precision" (`.claude/skills/stitch-design.md`) once T-069 lands. Until a page is
migrated it keeps the old look: the new tokens are **added** next to the old ones, never renamed.

## How we got here

Three directions were mocked up on the same five screens (home hero, fill wizard, share sheet,
receiver signing, dashboard): A Calm Precision 2.0, B Ink & Seal, C Velocity. The pick is a merge:

- **From B (Ink & Seal):** the document-first idea (the NDA page is the interface), the hero where the
  NDA's blanks fill in, the receiver page with the document dominant and the sign panel docked right,
  the executed moment (seal stamps on, evidence types out), evidence shown as content, crisp radii and
  1px rules, Schibsted Grotesk.
- **From A (Calm Precision 2.0):** the colors, Geist Mono, the fill wizard structure, the send
  share sheet.
- **Changed after review:** top app bar, not a sidebar. Dashboard = the compact list (split view and
  stages options parked as T-071).

## Thesis

Precise and fast, grounded in the document. Every screen shows the real NDA beside the controls that
change it. Trust comes from showing evidence (template version, timestamp, hash), not from saying
"secure". Quiet by default; three signature motion moments.

## Tokens

Add to `src/app/globals.css` `@theme` (keep existing tokens until the last page migrates).

| Role | Token | Value | Rule |
|---|---|---|---|
| Action | `--color-primary` (existing) | `#115e59`, hover `#0f766e` | CTAs, links, focus ring, active field. Only action color. |
| Ink | `--color-ink` (existing) | `#0d1f1e` | Headings, primary text |
| Ground | `--color-ground` | `#f6f8f8` | App and section background |
| Sheet | white | `#ffffff` | Paper sheets, panels |
| Line | `--color-line` | `#e3e9e8` | 1px rules, borders |
| Muted text | `--color-muted-ink` | `#5b6b69` | Secondary text (5.5:1 on white; check on ground) |
| Tint | teal-50 tint | as mockup | Highlighted variables, active pills |
| Needs you | amber tokens (existing amber-50 / amber-500 / amber-800 text) | | ONLY "needs you": Sign now, countersign |
| Done | solid teal | `#115e59` | Signed pill, seal |
| Destructive | existing red | | Errors, delete |

No blue, purple, green, yellow, crimson. Shadows: keep `shadow-card` / `shadow-float`; add a
`shadow-sheet` (subtle stacked paper) for document sheets.

**Radius:** controls 6px, sheets/panels 8px, pills 4px or full. Retire `rounded-2xl` cards as pages
migrate.

## Type

| Role | Face | Where |
|---|---|---|
| UI + display | **Schibsted Grotesk** (400-700) via `next/font/google` | Everything in the app shell and marketing; replaces Plus Jakarta Sans |
| Evidence / data | **Geist Mono** (already loaded) | Dates, counters, step numbers, hashes, template version, timers |
| Document | **Noto Serif** (what the `.hbs` already uses) | The NDA text only. The mockup shows Source Serif 4; we keep Noto Serif so preview, sign page and PDF stay identical with no template change |
| Signature | **Great Vibes** (already used) | Typed signature. The mockup shows Caveat; we keep Great Vibes because the typed name is baked into the signed PDF as an image |

Scale: display 56-72 / H1 32-40 / H2 24 / body 15-16 / small 13 / minimum 12. Labels sentence case,
never uppercase or tracked. Meta lines use Geist Mono, e.g. `v1.0 · 15 Nov 2026 · 9f2c4e…a41e`.

## Components (in `src/components/ui`)

Restyle existing: `button`, `input`, `status-pill`, `legal-disclaimer` (becomes one compact line +
"Learn more"), `dropdown-menu`, `switch`.

New:
- `Sheet`: white paper sheet, 8px radius, `shadow-sheet`, optional mono header line.
- `EvidenceLine` / `EvidenceBlock`: Geist Mono lines built only from recorded evidence fields (signer,
  timestamp, IP, template version, `agreementHash`), see `src/lib/signatureEvidence.ts` and the sign
  route's AuditEvent. Never show a field we do not record.
- `Seal`: teal circular seal for the executed state. **UI only** (see open decisions).
- `ShareSheet`: the send-success sheet (secure link + copy with check morph, Gmail / Outlook /
  WhatsApp / Copy link, pre-written message, reminders line).
- `AppBar`: top bar for signed-in pages (see below).

## App shell

- **Top app bar** on every signed-in page: logo + Beta pill, nav, bell, New NDA (the only New NDA
  button on the page), account. Same links and functionality as today (decided): Dashboard,
  My account, Pricing, More (About, Contact, FAQ, Help, Home). Keep `FloatingNavShell`'s behavior;
  restyle only.
- **No marketing footer on app pages** (dashboard, fill, settings). Marketing and legal pages keep it.
- Mobile: links fold behind a menu button; logo, New NDA (+ icon) and account stay.

## Screens

- **Home:** headline "NDA in minutes." + one sentence + "Send your NDA now" / "Read the standard NDA";
  right side a real NDA sheet whose underlined blanks fill one by one with a mono counter
  ("Variables 7/7 · legal text unchanged"). Marketing sections and pricing follow the same tokens.
- **Fill wizard:** stepper under the bar; form left, live preview right; compact disclaimer line;
  Back / Save draft / Continue. Headings say what the user does ("Who are you sending it to?").
- **Send success:** the share sheet over the wizard. Links-only send: never "email sent".
- **Receiver sign:** document dominant, sign panel docked right (bottom panel on phone): deal summary,
  both consent checkboxes with the exact text from `src/lib/authorityConsentText.ts`, signature
  (draw / type / upload as today), Sign NDA, trust line. Executed state: seal + evidence block.
- **Dashboard:** compact list (mockup option 1). Filter tabs with counts replace the seven tiles:
  All, Needs you, Waiting, Received, Signed, Drafts, Archived. Row 1 style for "needs you". All of
  today's row actions stay (Edit, Delete, Review, Sign now, Resend, View PDF, Archive).
- **Settings, legal, other pages:** same tokens and shell; legal page **text untouched**.

## Motion

| Moment | Spec |
|---|---|
| Hero blanks fill | each variable resolves in turn, 60ms stagger, color/background only; counter ticks in step |
| Wizard live highlight | focused field's variable gets the tint, preview scrolls to it, 120ms |
| Share sheet | translateY(40px)→0 + fade, 280ms `cubic-bezier(0.2,0.8,0.2,1)`; copy icon morphs to check |
| Executed seal | scale 1.15→1, opacity 0→1, rotate -6deg, 220ms; then evidence lines type out |
| Everything else | hovers 150-200ms color/shadow; `Reveal` for scroll reveals; no `transition: all` |

All motion off under `prefers-reduced-motion` (final state shown). Readable content never starts at
opacity 0 without JS.

## What is UI only vs what touches the signed PDF

The fill preview, the sign page iframe and the PDF all render the same
`templates/professional_mutual_nda_v1.hbs` (styles inline in the template). So:

- **This redesign does not change the template, its fonts, or the PDF.** The document keeps Noto Serif.
- **Variable highlighting** in the fill preview (and the hero) is a preview-only stylesheet injected
  into the preview iframe that adds a tint/underline to filled values. Text and fonts stay identical
  to the PDF. Never injected into the sign page or the PDF render.
- **Seal and evidence block** are shown in the app UI only (sign page executed state, dashboard
  signed rows). Nothing new is printed on the PDF.

## Open decisions

1. **Seal and evidence on the PDF?** (T-070, Nir) A seal can read as certification. Today it is UI
   only and worded "Signed" with the date, not "certified" or "verified".
2. **Variable highlight in the preview:** confirm a highlight that the PDF does not have is fine
   (recommended: yes, it is a reading aid; text is identical).
3. ~~Nav~~ **Decided 2026-11-15:** same nav links and same functionality as today (Dashboard,
   My account, Pricing, More menu, bell, New NDA, account, dev menu in dev). Restyle only; the
   mockup's two-link bar is not the spec.

## Rollout

Tickets T-060 to T-069 in `docs/TICKETS.md` under "Design refresh". Order: tokens and primitives
first (T-060), then shell (T-061), then screens. Each ticket: e2e smoke + screenshots before/after,
Hallmark audit on touched pages. Placeholders and button labels used by `e2e/nda-flow.spec.ts` change
only together with the spec.
