# Landing page research and three directions (2026-11-21)

Method note. Structure (hero, section order, copy) below was verified by fetching each live page on 2026-11-21. The fetch tool returns text only, so **motion techniques are marked "seen in markup" (inferred from asset names, duplicated nodes, state labels) or "known" (from prior knowledge of the site, not re-verified today)**. Before building, open each reference in a browser and screen-record the motion. Search engines returned only generic trend articles, no design teardowns of the legal-tech sites.

General trends from the roundups (saasframe, vezadigital, designrush): scroll-triggered storytelling, purposeful (not decorative) motion, stagger 100-200ms with the most important element first, proof directly under the hero CTA.

## References (12)

### 1. Linear - https://linear.app
- Works because: one confident sentence plus a pixel-true product screenshot; everything else is quiet.
- Hero: announcement pill, headline "The product development system for teams and agents", subhead, a real issue screen (activity feed, properties sidebar).
- Scroll story: logo strip, "A new species of product tool" with numbered figure cards (Fig 0.1-0.3), then one block per job (intake board, planning, agents, code diff), changelog, quotes, closing CTA.
- Motion (known): UI mockups are live-looking states with relative timestamps and "Working..." badges; subtle fade/translate on enter; panels that appear to be operated. Fig-numbering gives an editorial, instrument-manual feel.
- Avoid: dark-mode glow aesthetic does not fit Ink & Seal; copy only the restraint and "Fig" captions.

### 2. Stripe - https://stripe.com
- Works because: a bento grid where each tile is a small working demo; stats are earned.
- Hero: "Financial infrastructure to grow your revenue", two CTAs, animated wave (with static fallback), logo strip.
- Scroll story: bento of products, interactive "tell us your business" input, stats (135+ currencies, 99.999% uptime), case studies, dev section, news carousel, CTA.
- Motion (seen in markup): sequential status lines inside a payment-analysis card ("Card testing...", "Transaction fraud..." with risk scores), count-up stats and meters, infinite logo marquee.
- Avoid: the gradient mesh hero; it is the opposite of Ink & Seal.

### 3. Attio - https://attio.com
- Works because: the hero is a staged agent console and meeting transcript, so the product explains itself.
- Hero: "Welcome to agentic revenue", demo panel with transcript timestamps, Slack thread, tool-call log.
- Scroll story: numbered tab list of jobs, then one UI mockup per job (table, workflow diagram trigger-enrich-score-route-sequence, board, health), stats, changelog.
- Motion (seen in markup): sequential tool-call log reads as a scripted typing/step playback; numbered tabs drive the story.
- Avoid: too many mockups; it gets long.

### 4. Mercury - https://mercury.com
- Works because: calm, warm, finance-serious tone with a single email-capture CTA in the hero.
- Hero: "Radically different banking", email field + "Open account", "Launch demo" link; full-width media built from start/end frames.
- Scroll story: four pillars, social proof, feature showcase, 10-minute signup, metrics (450K+, $20B+), security, press, split CTA.
- Motion (seen in markup): start/end-frame hero suggests a scroll-linked frame transition; virtual cards rotate and stack; ripple graphics for yield.
- Takeaway: a time-to-complete claim ("10 minutes") in the hero, like our "NDA in minutes".

### 5. Ramp - https://ramp.com
- Works because: it argues the problem ("Systems that never spoke": five tools to reimburse one flight) before the solution.
- Hero: "Time is money. Save both.", inline email field, logo strip, a very precise live-looking figure (0.9979682%).
- Scroll story: platform tiles, problem framing, three video-led feature blocks, enterprise cards, 18-quote testimonial wall, repeated CTA.
- Motion (seen in markup): looping clips, marquee testimonials, possible live counter.
- Takeaway: before/after "old way vs ours" section and precise-number credibility.

### 6. Raycast - https://www.raycast.com
- Works because: a physical object (keyboard with fn/ctrl/opt/cmd keys) is the hero.
- Hero: "Your shortcut to everything.", Download CTA, keyboard graphic.
- Scroll story: four traits, extension grid with tabs, AI chat mockup, social proof wall, automation, community, dev, closing CTA "Take the short way."
- Motion (seen in markup): key-press highlights tied to pillars; staged AI chat status lines; hover previews on extension cards.
- Takeaway: key-press/click micro-interactions give tactility; ours would be the "seal press".
- Avoid: glass-effect blue backdrop, ribbons.

### 7. Granola - https://www.granola.ai
- Works because: warm, friendly, bot-free; the demo toggles "My notes / Enhanced" so the value is felt in one click.
- Hero: "The AI notepad for back-to-back meetings", Download CTA, floating decorative note images.
- Scroll story: value props with live toggle demo, logo wall, Before/In/After tabs, chat typing demo, quotes with rating, feature grid, MCP row, closing CTA.
- Motion (seen in markup): status sequence "Transcribing -> Enhancing notes -> Generate notes"; typewriter question; slow drifting hero images; marquee.
- Takeaway: the closest tonal match to ours (approachable, not hype). Before/after toggle maps directly to "blank NDA -> filled NDA".

### 8. Juro - https://juro.com  (legal-tech)
- Works because: "Try it below, no signup needed" puts the product in the page.
- Hero: "Intelligent contracting is here.", G2 4.8 badge, Get a demo; then an inline chat demo.
- Scroll story: demo, "3 million contracts" proof, founder message, three pillars (templates, intake, repository), metric case studies (86% faster to sign), trust (SOC 2), CTA.
- Motion (seen in markup): logo marquee, testimonial slider with video modals, chat typing.
- Weakness: demo-gated, "AI-native" language; template placeholder text leaks in markup (QA lesson).
- Takeaway: metric-led customer cards; inline no-signup demo.

### 9. Ironclad - https://ironcladapp.com  (legal-tech)
- Works because: authority signals (Gartner/Forrester) and role-based cards for legal, sales, procurement.
- Hero: eyebrow, "Keep Contracts Moving, and Business Growing" with italic emphasis, Request Demo, Watch Overview video, 30-logo strip.
- Scroll story: metrics, circular workflow diagram, analyst proof, agentic AI, role cards, CRM signing, quotes, integrations, resources, CTA.
- Motion (seen in markup): autoplay video, logo carousel, possible count-up stats.
- Avoid: enterprise density, an eyebrow above the headline (banned by our system), demo-request-only funnel.

### 10. Vercel - https://vercel.com
- Works because: three-bullet hero and strict feature quartets under claim-led headings; each section has one customer proof line.
- Hero: "Agentic Infrastructure", 3 bullets, "Deploy now" + "Talk to sales".
- Scroll story: three claims x four features, recently shipped, agent onboarding, no-login deploy.
- Motion (known): geometric line/triangle, grid-line reveals, monochrome. Not verifiable from text.
- Takeaway: a no-account first action (our counterpart signs with no account) as an explicit hero promise.

### 11. Clerk - https://clerk.com
- Works because: copy-ready snippet in the hero and an honest FAQ near the end.
- Hero: "Everything you need for authentication", subhead, copyable prompt, "Start building for free".
- Scroll story: products, trust list, feature lists per product, frameworks, integrations, 8 quotes, 6-question FAQ, "no strings attached" CTA.
- Motion: not determinable from text. Copy-to-clipboard micro-interaction is the pattern.
- Takeaway: a FAQ and plain-language reassurance close; fits the legal-trust job.

### 12. Resend - https://resend.com
- Fetch returned only an agent-oriented text index, so everything here is "known": near-black, one headline, a code block with tabbed languages and an animated send, razor-thin borders, small mono labels, and deliberate dark restraint. Takeaway: a tabbed code/real-output panel as the hero visual and mono microtype for data, which maps to Geist Mono evidence lines.
- Unverified candidates not fetched: Cal.com, Family (family.co), Arc/Browser Company, Superhuman, Pitch, DocuSign/PandaDoc (likely counter-examples: dense, enterprise, stock imagery). Check these by eye if time allows.

## Patterns that recur (use these)
1. Hero visual is the product in a believable state, not an abstract illustration (Linear, Attio, Granola).
2. Scripted sequences with named status states (Stripe, Attio, Granola): an honest "step 1, step 2, step 3" is storytelling.
3. Numbers are precise and sourced; count up once on view.
4. One CTA, repeated at hero and close; inline email capture (Mercury, Ramp) lowers friction.
5. Problem framing before solution (Ramp), then a quiet metric/proof band.
6. Logo marquees are universal and low value for us (pre-launch, closed beta); replace with evidence-style proof.

## Anti-patterns (avoid)
Gradient mesh and glow (Stripe, Raycast), glass cards, eyebrow above headline, demo-gated only CTAs, dense enterprise logo walls, motion with no meaning, scroll-jacking that hijacks native scroll on mobile, autoplay video, carousels, placeholder text leaking.

## Brand constraints recap
Ground off-white, white sheets, 1px rules, teal-800 only for actions, amber only for "needs you", seal = solid teal done state. Never `transition-all`; animate transform/opacity only; `Reveal` primitive (visible by default); honour prefers-reduced-motion; no framer opacity-0 initial on content. Closed beta: CTA goes to `/coming-soon` while `PRIVATE_BETA` is on. Not-legal-advice disclaimer must be visible. Keep Formi knowledge and the legal pages consistent with any copy claims (do not claim SOC 2 or customer counts).

---

# Three directions

## A. "Living Document" (product-demo-led)
- Core idea: the hero is the standard NDA itself, filling itself in, so the visitor sees "NDA in minutes" instead of reading it.
- Hero: left, headline "NDA in minutes." + subhead + one teal CTA + "Not legal advice" line. Right, a white Noto Serif NDA sheet on the ground with 1px rule. In the first 3 seconds, deal fields type in one by one (Party A, Party B, effective date, purpose, term, governing law), each highlighted with a brief teal underline; a Geist Mono counter ticks "00:00 -> 01:47" in the corner. The legal body paragraphs stay perfectly still: only the variables move, which also teaches the "fixed text" idea.
- Sections (7): 1 Hero with self-filling NDA. 2 "Fixed text, your variables": sheet with legal text locked (small lock mark) and variable chips highlighted. 3 Send: secure link card plus the share menu (Gmail/Outlook/WhatsApp/copy), explaining links-only send. 4 Counterparty signs, no account: phone-width mockup. 5 Evidence block: EvidenceBlock showing signer email, timestamp, IP, template version, SHA-256 hash typing in monospace. 6 Roles and plans (administrator/signer/contributor, free beta) as a quiet 3-column table. 7 FAQ plus disclaimer plus closing CTA.
- Signature motion: the seal stamp. When the sheet is "signed", the Seal presses down (scale 1.15 -> 1, 200ms ease-out, tiny shadow settle) and the evidence lines print beneath. Repeats once, no loop.
- References: Granola (toggle/typing demo), Attio (scripted console), Linear (real UI as hero), Resend (mono data), Juro (inline demo).
- Risks: most engineering effort (a scripted state machine, needs reduced-motion static fallback showing the final filled state); mobile layout stacks sheet under copy and must stay legible; the typed values must look plausible without implying real customers.

## B. "The Standard" (editorial, typographic, statement-led)
- Core idea: a manifesto page: one fixed NDA is a trusted standard, so the type does the persuading.
- Hero: huge Schibsted Grotesk headline, "NDA in minutes." In 3 seconds, the words resolve in with a staggered line-mask reveal (translateY from clipped line, 80ms stagger), then a hairline rule draws across (scaleX) and a small mono line "v1.0 - identical in every deal" fades in. No imagery. Single CTA.
- Sections (7): 1 Statement hero. 2 "One NDA. Same words every time." a giant pull-quote in Noto Serif from the actual clause, with a line "Changed in 0 deals" (mono). 3 The problem: three short numbered lines of old way (email threads, edits, redlines) struck out as you scroll. 4 Three-step "Fill, send, sign" as oversized numerals with sentence-case captions. 5 Standard NDA preview: sheet that slides up, link to /standard-nda and changelog (shows governance as a feature). 6 Evidence, trust and plans: mono table of what is recorded. 7 Closing statement and CTA, disclaimer.
- Signature motion: scroll-linked strike-through and word-by-word highlight: as the old-way lines pass, strike lines draw (scaleX) with ink; the "one NDA" quote highlights its words in sequence so reading speed is paced by scrolling.
- References: Ramp (problem framing), Mercury (single claim, time-to-complete), Linear (Fig-numbered captions), Vercel (claim-led headings).
- Risks: lowest product visibility, so "what is it?" must be answered by section 4-5; typography-only pages can read as thin if copy is not sharp; scroll-linked highlight needs a no-JS fallback (all text visible by default); easier to build, easiest to keep performant and accessible.

## C. "One Deal, Start to Seal" (scrollytelling deal story)
- Core idea: follow one fictional deal (Acme and Northwind) through four stops in a sticky scene, and the NDA state changes at each stop.
- Hero: headline "NDA in minutes." with a compact timeline rail beneath (Draft / Sent / Signed) and a small sheet. In 3 seconds, the rail's first node fills teal and the sheet's variables fade in with stagger; a "scroll to follow the deal" cue animates a 6px nudge.
- Sections (8): 1 Hero with rail. 2 Sticky scene, stop 1 "Fill" (sheet populates, left captions swap). 3 Stop 2 "Send" (secure link, share menu; amber chip "Waiting for Northwind" appears, the single amber moment). 4 Stop 3 "They sign" (receiver view, no account, authority checkbox). 5 Stop 4 "Sealed" (amber turns to solid teal, Seal stamps, signed copy emailed, hash printed). 6 Reminders and roles: 48h/5d reminders and signer/contributor split as a quiet two-column. 7 Plans and free beta, FAQ. 8 Closing CTA.
- Signature motion: sticky scrollytelling with the state machine: the rail progress (scaleX, scroll-linked), the sheet content swaps via crossfade, and the amber-to-teal handover ending in the seal press. Scrub bound to scroll progress with CSS `animation-timeline: view()` or a small IntersectionObserver step trigger, with static stacked layout under reduced motion and on mobile.
- References: Stripe (sequential status lines), Mercury (scroll-linked start/end frames), Attio (numbered job tabs), Ramp (narrative), Raycast (tactile key-press).
- Risks: most complex; sticky scenes are fragile on mobile Safari and with short viewports; long page; must not hijack scroll; fictional parties must be clearly labelled "example"; the amber usage must remain restricted to the waiting step.

## Recommendation
Ship A's hero with C's lighter step structure if one has to be chosen: A has the fastest "get it" (matches the #1 message), C gives the best About-page storytelling. B is the cheapest and safest fallback and its typographic lines can be reused as section headers in A or C.

Five most useful references: Granola (tone, toggle/typing demo), Attio (scripted staged product), Stripe (sequential status-line cards, count-up stats), Ramp (problem-first narrative, precise figures), Mercury (time-to-complete hero claim, scroll-linked frames).
