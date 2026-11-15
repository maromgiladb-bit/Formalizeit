# FormalizeIt redesign: shared brief for the three direction mockups

## Product (read this, it drives everything)
FormalizeIt is a SaaS that lets a company send a ready-to-sign **mutual NDA in minutes**. There is ONE
standard NDA whose legal text never changes; users only fill deal variables (party names, addresses,
signatory name/title/email, effective date, term in months, confidentiality period in months,
purpose, governing law, one optional "additional terms" clause). Workflow: draft -> sent -> signed.
The sender gets a secure link and shares it from their OWN inbox (Gmail / Outlook / WhatsApp / copy
link). The platform does NOT email the first invite. The receiver opens the link (no account),
reads, ticks two checkboxes, types/draws a signature, signs. Signature evidence recorded: email,
timestamp, IP, template version, SHA-256 hash of the PDF.

Tagline, verbatim: **NDA in minutes**. Core line: "Pick a template, fill in what's different, send,
in minutes." (We have one standard NDA, so prefer: "Start from the standard NDA, fill in what's
different, and send.") Tone: friendly, direct, fast. Lead with speed; trust second ("and it's safe").
User asked for: feel = **precise and fast** (Linear/Vercel-like confidence, the product UI is the
hero), motion = **quiet by default + 2-3 crafted signature moments**.

## Hard constraints (every direction)
- Brand name "FormalizeIt" with a small "Beta" pill next to the logo.
- "NDA in minutes" appears verbatim in the home hero.
- No template picker anywhere: one standard NDA.
- Not-legal-advice disclaimer visible on the fill screen and sign screen, but compact (one line +
  "Learn more" style), not a giant box. Text: "FormalizeIt is not a law firm and does not provide
  legal advice."
- Receiver sign screen must have both checkboxes, exact text:
  1. "I confirm that I am authorized to sign this agreement on behalf of, and in the name of, the
     company I represent, and that doing so legally binds that company."
  2. "I have read and agree to the Terms of Service and Privacy Policy, and I consent to sign
     electronically (E-Signature Consent)."
- Send success = a share sheet with the secure link + Gmail / Outlook / WhatsApp / Copy link.
  Never say "email sent".
- Never use the words "lawyer-vetted", "legally binding" (except inside checkbox 1), "pre-vetted",
  "guaranteed".
- No emoji. Icons = inline stroke SVG (Lucide style), decorative ones aria-hidden.
- AA contrast (body text >= 4.5:1). Smallest text 12px. No uppercase tracked eyebrow labels above
  headings. Visible focus states. Real <button>/<input>/<label>.
- `prefers-reduced-motion: reduce` -> all signature motion shows its final state instantly.
- Fonts from Google Fonts only (they must also work later with next/font).
- Never `transition: all`; animate only transform/opacity (and color/shadow for hovers).

## Real content to use (same in every direction, so they compare fairly)
- Sender company: "Northwind Robotics Ltd", signer "Dana Levi", Head of Partnerships,
  dana@northwind.io.
- Counterparty: "Brightline Labs Inc.", signer "Sam Okafor", CTO, sam@brightline.dev.
- Purpose: "Evaluating a joint warehouse-automation pilot". Term 12 months, confidentiality 24
  months, governing law "State of Delaware", effective date 15 Nov 2026.
- Wizard steps (5): Document, Party A, Party B, Clauses, Review. Mock the **Party B** step
  (fields: company name, address, signatory name, title, email) with a live NDA preview beside it
  where filled variables are highlighted in the document text. Show progress "Step 3 of 5".
- NDA preview text to show (abbreviated, real-feeling): title "Mutual Non-Disclosure Agreement";
  "This Mutual Non-Disclosure Agreement is entered into as of 15 November 2026 between Northwind
  Robotics Ltd and Brightline Labs Inc. (each a "Party")." Section "1. Purpose" -> "The Parties wish
  to exchange Confidential Information for the purpose of evaluating a joint warehouse-automation
  pilot." Section "2. Confidential Information" (2-3 lines of plausible standard language).
  Footer meta: "Standard Mutual NDA v1.0".
- Dashboard list rows (status in brackets):
  1. "Brightline pilot NDA", Brightline Labs Inc. [Sign now: action needed, they signed, you must countersign]
  2. "Kestrel Logistics NDA", Kestrel Logistics [Waiting on them]
  3. "Harbor & Finch NDA", Harbor & Finch LLP [Signed, 12 Nov 2026]
  4. "Untitled draft", (no counterparty yet) [Draft]
  5. "Orbital Foods NDA", Orbital Foods GmbH [Waiting on them]
  Dashboard needs: page title, primary "New NDA" button, a compact filter (All / Needs you / Waiting /
  Signed / Drafts with counts) instead of today's seven big stat tiles, and a "Needs you" emphasis
  for row 1.
- Receiver sign screen (signed-out, opened from the secure link): "Dana Levi at Northwind Robotics
  Ltd sent you an NDA to sign." Show the NDA (scrollable excerpt), a summary of the deal variables,
  the 2 checkboxes, signature field (typed name rendered in a script-like font is fine), "Sign NDA"
  button, trust line "Encrypted and audit-trailed. Powered by FormalizeIt."

## What exists today (what we are improving on)
Light white UI, teal-800 (#115e59) CTAs, ink #0d1f1e headings, amber (#f59e0b) only for "needs you",
Plus Jakarta Sans, rounded-2xl white cards with soft shadows, top nav bar. Problems we see:
generic look, app pages carry the full marketing footer, the fill page's disclaimer is a huge box
pushing the wizard down, the dashboard has 7 equal stat tiles (noise), headings are generic
("Fill out the form to generate your agreement"), nothing in the UI *feels* fast.

## Deliverable per direction
ONE self-contained HTML file (written by you to the path given in your task). Artifact page
contract:
- No <!doctype>, <html>, <head>, <body> tags; start with `<title>`, the Google Fonts <link>, then
  `<style>`, then content, then an inline <script> if needed. No external JS. No images from the
  web (inline SVG only).
- Body gutter: `padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right:
  max(16px, env(safe-area-inset-right, 0px));`. Never horizontal page scroll.
- Single deliberate theme is OK (set body background and every color explicitly), unless your
  direction says it ships both themes, then do light+dark tokens with
  `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){...}}` AND
  `:root[data-theme="dark"]{...}`.
- Put all design tokens in `:root` at the top of the style with a one-line comment naming the layout
  concept.

Page structure (in this order):
1. Header: direction name, one-sentence thesis, then a compact "System" strip: palette swatches with
   hex + role, type specimens (display, body, mono if any), radius/elevation sample, button set
   (primary, secondary, ghost), status pills (Draft, Waiting on them, Needs you / Sign now, Signed).
2. Frame 1: Home hero (desktop composition, ~1200px wide, scales down responsively). Includes the
   nav. Above the fold only: headline, one ~12-word sentence, CTA "Send your NDA now" + secondary,
   and the product-UI-as-hero visual. Include signature moment #1 here.
3. Frame 2: Fill wizard, Party B step, with live preview.
4. Frame 3: Send success share sheet (can be a modal over the wizard).
5. Frame 4: Receiver sign screen, desktop, and beside it a 375px-wide phone version of the same.
   Include the signed / executed signature moment.
6. Frame 5: Dashboard.
7. "Motion notes": a short list of every animation with duration + easing.
Each frame sits in a labelled container (label is a plain sentence-case caption below or above,
e.g. "Home hero"). Signature-motion moments need a small "Replay" button. Motion must run once on
load/when scrolled into view (IntersectionObserver), start from a VISIBLE resting state for the
static content (never leave readable content at opacity 0 waiting for JS).

Quality bar: this is a pitch to a founder choosing the future look of their production product. It
must look like a real, finished, shippable product, not a wireframe. Pixel care: alignment, consistent
spacing scale, real hierarchy, no clipped text, works down to ~400px width (frames may stack; the
desktop frames may scale or stack their columns).
Avoid AI-design tropes: purple/blue gradient heroes, cream+serif+terracotta, near-black with a lone
acid-green accent, emoji, left-border accent cards, everything centered, glassmorphism blobs.
