# Tickets — FormalizeIt

The one list of work: launch and everything after. How tickets, branches, commits and merges work:
CLAUDE.md → "Work rules (this repo)". Long detail stays in `docs/launch/` phase files and
`docs/superpowers/specs/`, linked from each line.

Legend: ☐ open · ◑ in progress · ☑ done · ⊘ deferred · Tiers: [low] [normal] [high] ·
Owner: [Claude] [You] [Both]

**Next ID: T-098**

## Resume here (updated 2026-11-21)

OneNote notes imported and compared with the product (T-079): 11 gaps are now T-080–T-090
(legal ones T-080–T-083 belong before sign-up opens), plus T-095 (term months vs years, must
be fixed before T-010; years-or-months decided when picked up). Nir reviews the NDA fields
2026-11-22 (T-091, T-092). T-093 waits: ask Gilad first. Source:
[docs/import/onenote-2026-06-formalizeit.md](import/onenote-2026-06-formalizeit.md).

Work rules adopted (T-001, PR #19, 2026-11-15): one branch per ticket from here on. PR #19 also
landed the e2e suite (T-002) and the design audit (T-003).

T-048 (open redirect) fixed in PR #20, waiting for your "merge". Smoke e2e found hydration errors on
`main` (T-059).

T-077 (Next.js security patch, PR #28) is live in production since 2026-11-21 and checked.

Next: **T-004** (You, Clerk Restricted sign-up), **T-059** (hydration errors), then triage
the code-review bugs **T-049–T-054** (negotiation flow), then production testing with sign-up closed:
**T-044** full flow, **T-007** email, **T-008** crons, **T-009** data hygiene. Then **T-010**
opens sign-up. Design refresh (T-058): spec PR #23, foundations PR #24 and the page rollout PR #25 (T-061–T-068)
merge in that order; then **T-069** (docs sync) right after. T-070 waits on Nir. The beta plan with estimates is in the "FormalizeIt Beta Roadmap" artifact
(2026-11-09).

## Now (in progress)

- ◑ **T-058** [high] [Both] Design refresh: direction picked 2026-11-15 (Ink & Seal in Calm colors,
  top app bar, same nav links, compact-list dashboard). Spec + rollout tickets T-060–T-070 below.
  [Spec](superpowers/specs/2026-11-15-ink-and-seal-design-system.md) ·
  [Mockup](design/ink-and-seal/mockup.html)

## Next (launch path, in order)

- ☐ **T-059** [normal] [Claude] React hydration error #418 (server/client HTML mismatch) on `/faq`,
  `/help`, `/privacy`, `/settings/billing`, on `main` and live. Found by the smoke e2e run on
  the T-048 branch (2026-11-15). Possibly from the design audit (PR #19, which merged without its
  high-tier e2e run), not yet confirmed. First step: `E2E_DEV=1` on those pages for the full
  message naming the mismatched element.
- ☐ **T-004** [high] [You] Production Clerk: Restrictions → Sign-up mode **Restricted** while
  sign-up is closed (our gate only hides our pages). [README](launch/README.md#launch-status-2026-11-14)
- ☐ **T-044** [high] [Both] Full flow on production with your existing account: send → fill →
  both sign → PDF in `formalizeit-prod` S3 and downloadable. [Merge plan step 6](launch/README.md#merge-plan-2026-10-23)
- ☐ **T-007** [high] [Both] Email round trip on the verified domain: inbox placement, production
  links, PDF attachment, contact form. [4.3](launch/phase-4-launch.md)
- ☐ **T-008** [high] [Both] Cron dry run on production (4 crons, idempotent, refuse without
  secret). [4.4](launch/phase-4-launch.md)
- ☐ **T-009** [high] [You] Production data hygiene: purge test orgs with
  `scripts/cleanup-test-data.mjs`. [4.5](launch/phase-4-launch.md)
- ☐ **T-005** [high] [Both] Phase 1 browser matrix on staging. [4.1](launch/phase-4-launch.md),
  [phase-1](launch/phase-1-negotiation.md)
- ☐ **T-046** [low] [Both] Monitoring acceptance: one test error shows in Sentry with readable
  file/line; page views appear in Vercel Analytics. [0.8](launch/phase-0-external-setup.md)
- ☐ **T-095** [high] [Both] **Must be fixed before T-010 (going public).** The NDA term is entered
  in months but the NDA prints whole years (`Math.floor(term_months / 12)`): 18 months signs as
  "1 (one) years", 6 months as 0 or a blank. Fix by using one unit end to end: **years only**
  (form asks years, NDA text unchanged) or **months only** (NDA wording changes to months, so a
  new template version + changelog entry, Nir checks). Choose years or months when the ticket is
  picked up; ask Gilad (and Nir) then. Found 2026-11-21 while checking fields for T-091.
- ☐ **T-010** [high] [Both] Open sign-up: `NEXT_PUBLIC_PRIVATE_BETA=off`, redeploy, Clerk sign-up
  mode back to Public, run 4.6 checks. [Go-live switches](launch/README.md#go-live-switches-in-this-order)

### From the OneNote review (T-079, 2026-11-21; source: [OneNote import](import/onenote-2026-06-formalizeit.md))

Legal ones first (T-080–T-083, before T-010 opens sign-up); the rest can follow launch.

- ☐ **T-080** [high] [Both] Website Disclaimer page (`/disclaimer`) from the OneNote draft (page 5),
  linked in the footer and nav with the other legal pages. Also add what no legal page says today:
  no attorney-client relationship; no liability for data breaches and third-party service failures;
  users are responsible for their chosen governing law (incl. mandatory local law); "legal
  validity" in the no-warranty list. The 12-month liability cap is already in Terms. Counsel review
  via T-025; update Formi's knowledge.
- ☐ **T-081** [high] [Both] Show the "not a law firm / not legal advice" line in the site footer and
  on sign-up (today only on the fill, receiver-fill and receiver-sign pages).
- ☐ **T-082** [high] [Both] Click-to-accept: "I understand FormalizeIt does not provide legal advice
  and I am responsible for deciding whether the NDA suits my use", at sign-up and before the
  first NDA is sent; save timestamp + document version per acceptance. Accept-terms today covers
  only Terms + Privacy. Waits on Nir's "Accept terms: where and what".
- ☐ **T-083** [high] [Claude] Save the signer's browser (user agent) in the signature evidence, next
  to email, IP, timestamp, version and hash (`sign` + `sign-public` routes); show it on the
  e-signature consent page if listed there.
- ☐ **T-084** [normal] [Both] Receiver "Decline" button on the public review/sign pages: ends the
  NDA, notifies the sender, stops reminders. Today the receiver can only suggest changes or let
  the link expire. Decide wording first.
- ☐ **T-085** [normal] [Both] Hard expiry: an unsigned NDA closes 30 days after it was first sent,
  even though each round renews the 2-week link (`SIGN_LINK_TTL_MS`). Resend/renew must still
  work after expiry. Confirm the 30 days.
- ☐ **T-086** [normal] [Claude] "Send the standard NDA to my legal advisor" share action from the
  dashboard (and onboarding), linking to the public `/standard-nda` page.
- ☐ **T-087** [low] [Claude] FAQ: add "Do I need legal advice?", "Why only mutual?" and "What if I
  need changes?" (OneNote page 3); update Formi's knowledge.
- ☐ **T-088** [low] [Claude] Hint on the open clause (`additional_terms`): for real exceptions only,
  most NDAs leave it empty.
- ☐ **T-089** [normal] [Claude] Email users when the standard NDA gets a new version (today only
  the in-app prompt + changelog page); check the Governance Policy promises the same.
- ☐ **T-090** [normal] [Claude] Database review: every table and column against what the audit
  trail, evidence and retention need; list unused columns and missing indexes. Report first, any
  migration is its own high ticket.

### Bugs to triage (from `/code-review` of the branch, 2026-11-15)

All in code already on `main` (PR #18), not in the T-001 PR. T-048 (confirmed) is fixed (PR #20); the rest are
reviewer findings still to verify before fixing. Most touch the negotiation flow T-044 tests, so
triage them before or alongside T-044.

- ☐ **T-049** [high] [Claude] `send-for-input` imports `transitionBlockedReason` but never calls
  it: a SIGNED/COMPLETE draft can be reopened. Also: its error text points to the deleted
  `send-for-signature` route, and it creates no Party A (SENDER) signer.
- ☐ **T-050** [high] [Claude] Party B signer lookups (`approve-changes`, `submit-input`,
  `request-changes`) are unordered with no status filter, so they can pick the DECLINED signer left
  behind after a recipient change and reopen the wrong person's link.
- ☐ **T-051** [high] [Claude] `approve-changes` / `submit-input` reset an EXPIRED signer to PENDING
  without a new `expiresAt`, so the emailed link is dead on arrival (410).
- ☐ **T-052** [high] [Claude] `nda-reminders` cron emails Party B "please sign" during
  AWAITING_PARTY_A_SIGNATURE; reminder stamps aren't reset when a new round starts.
- ☐ **T-053** [high] [Claude] `isFullyAccepted` (`src/lib/negotiation.ts`) treats unanswered
  incoming suggestions as accepted, so an open counter-proposal can be silently dropped.
- ☐ **T-054** [high] [Claude] `persistNegotiationRound` does 4 dependent writes with no
  transaction or row lock (double-click → last writer wins, orphan revisions).
- ☐ **T-055** [high] [Claude] Stripe webhook claims the event id before handling and only releases
  it in `catch`, so a timeout loses the event forever. Fix before T-043.
- ☐ **T-056** [normal] [Claude] `ensureDbUser` calls Clerk `currentUser()` on every render for
  users without terms acceptance; mirrored Clerk acceptance stamps the current `LEGAL_VERSION`.
  Related: T-021.
- ☐ **T-057** [low] [Claude] Mojibake (`â†’`) in comments in `billing/checkout` and
  `billing/upgrade-session` routes.

### Design refresh (T-058, in order; spec: [Ink & Seal](superpowers/specs/2026-11-15-ink-and-seal-design-system.md))

- ☐ **T-069** [low] [Claude] Docs sync: rewrite `.claude/skills/stitch-design.md`, CLAUDE.md
  design section, Hallmark stamp in `globals.css`, Formi knowledge if routes/labels changed, memory;
  remove old tokens once nothing uses them; publish the system in Claude's Design System type.
- ☐ **T-070** [high] [Both] Decide whether the seal / evidence summary is printed on the signed PDF
  (Nir: a seal can read as certification). UI-only until decided.
- ☐ **T-073** [normal] [Claude] Fill preview: highlight the filled-in variables in the preview iframe
  only (PDF unchanged). Split out of T-063, which shipped the restyle without it.
- ☐ **T-074** [low] [Claude] Seal: ring text is cramped at 96px and below; tune letter spacing / size
  so "Executed · FormalizeIt · v1.0" reads cleanly. Also show the seal + evidence block on the
  executed-NDA view once the client receives recorded evidence (T-065 shipped without it).

## Waiting on you

- ☐ **T-019** [high] [You] Turn on Clerk legal acceptance (Terms/Privacy URLs, require at sign-up).
  [phase-0](launch/phase-0-external-setup.md#clerk-require-terms--privacy-acceptance-at-sign-up-added-2026-10-23)
- ☐ **T-020** [normal] [You] Set `REMINDER_LINK_SECRET` in Vercel Production + Preview.
- ☐ **T-014** [normal] [You] Create the Vercel Firewall rate-limit rules (runbook in
  [phase-2](launch/phase-2-hardening.md)).
- ☐ **T-047** [low] [You] Tick the Vercel Production env-var checklist.
  [phase-0](launch/phase-0-external-setup.md#final-checklist--vercel-production-env-vars)
- ☐ **T-041** [low] [You] 0.1 acceptance: confirm a Preview deployment connects to its database.
- ☐ **T-042** [low] [You] Google OAuth Branding → "I have fixed the issues" (24h+ after the home
  page is public). [0.2](launch/phase-0-external-setup.md)
- ☐ **T-045** [low] [You] Confirm auto-renew and Domain Lock on every domain. [0.7](launch/phase-0-external-setup.md)
- ☐ **T-038** [low] [You] Switch `CONTACT_INBOX` to `support@formalizeit.com` and the Google OAuth
  support email to match.
- ☐ **T-025** [high] [You] Legal/business setup: entity details, VAT/invoicing, auto-renewal and
  refund policy, counsel review of the seven legal pages, insurance, breach runbook, vendor DPAs,
  Neon upgrade + restore drill. [Legal readiness](launch/README.md#legal-and-compliance-readiness-2026-10-23)

## Later (post-launch / post-MVP)

- ☐ **T-097** [low] [Claude] Self-host the fonts (`next/font/local`) so builds don't depend on Google
  Fonts. On 2026-11-20 the production build of PR #28 crashed in `next/font/google`'s loader
  (`Cannot read properties of null (reading '1')`, a font URL with no file extension in Google's
  CSS); an identical rebuild passed. Fonts: Geist, Geist Mono, Plus Jakarta Sans, Schibsted
  Grotesk (`src/app/layout.tsx`), Great Vibes (`SignNDAPublicClient.tsx`).
- ☐ **T-078** [normal] [Claude] Upgrade Next.js 15 → 16 after sign-up opens (T-010), so 15.x end of
  life doesn't force a rushed migration. Assessed 2026-11-17, about half a day to a day: move the
  `webpack` alias in `next.config.ts` (keeps Puppeteer/Chromium out of the client bundle) to
  `turbopack.resolveAlias` or build with `--webpack`; rename `middleware.ts` → `proxy.ts` (Clerk);
  drop `.eslintrc.json` for flat config + `eslint-config-next@16`; `@clerk/nextjs` → ≥6.39 (allows
  Next 16; no Clerk 7 needed); check image defaults. Async `params`/`cookies()` already done.
  Test signed-PDF generation and the full sign flow end to end (Turbopack bundling of chromium).
  Guide: nextjs.org/docs/app/guides/upgrading/version-16.
- ☐ **T-072** [low] [Claude] Stop parallel sessions from taking the same ticket ID (happened
  2026-11-15: two sessions both took T-058, and the design refresh's ticket block overlapped
  T-059 until it renumbered to T-058 and T-060–T-071). Cause: each session reads Next ID from its own
  worktree copy of TICKETS.md. Fix: (1) rule in CLAUDE.md and `~/.claude/CLAUDE.md`: `git fetch`
  and read Next ID from `origin/main` right before taking an ID; write only IDs you actually use
  (no reserving a block ahead); put the ticket into TICKETS.md in a tiny docs PR and merge it
  before branching on it. (2) SessionStart hook: read Next ID from `origin/main`, and list IDs
  found on other unmerged branches' TICKETS.md so a session sees the real highest ID. (3) If two
  branches still collide, the one not yet merged renumbers.
- ☐ **T-013** [high] [Claude] Exercise the signed-PDF failure path end to end on Preview.
- ☐ **T-032** [high] [Claude] Extend e2e: suggest → accept → both sign → PDF + evidence; contributor
  can't sign; expired link; reminder stop link. [README](launch/README.md#browser-e2e-suite-2026-11-15)
- ☐ **T-034** [normal] [Claude] Bug: not-found render calls Clerk `auth()` on paths the middleware
  skips → 500 locally. Fix if it shows in production logs.
- ☐ **T-017** [high] [Claude] M3 retention cleanup: no delete without the 30-day notice, remove
  `NdaRevision` content, backfill `completedAt`.
- ☐ **T-018** [high] [Claude] M4/M5/M6: lowercase emails + `lower(email)` unique index; `isSigner`
  for every new administrator; `storeNdaPdf.ts` uses the shared Prisma client.
- ☐ **T-016** [high] [Claude] M1: send limit check-then-act race; deleting an expired NDA frees a
  FREE slot (matters once paid plans are on).
- ☐ **T-021** [normal] [Claude] Accept-terms gate server-side (today client-side, brief flash).
- ☐ **T-022** [high] [Both] Terms rewrite + Privacy additions — after counsel comments.
- ☐ **T-023** [high] [Both] NDA template v1.1 (truly mutual, remedies, survival, compelled
  disclosure) — counsel first.
- ☐ **T-024** [low] [Claude] Skip link; confirm sub-processor regions marked "to be confirmed".
- ☐ **T-026** [normal] [Both] Legal tier 2 (first month): DPA template, 2FA status, CSP/HSTS,
  legal-hold flag, data export, Amendment 13 question.
- ☐ **T-039** [low] [Both] 2FA after upgrading Clerk to Pro; restore the 2FA copy (Security,
  Settings, Formi).
- ☐ **T-040** [high] [Claude] Multi-recipient send (first post-launch feature, PRO+).
  [Design](superpowers/specs/2026-10-06-multi-recipient-send-design.md)
- ☐ **T-012** [low] [Claude] Remove the Beta label (`BETA_LABEL = false`) — only after T-025's
  counsel review.
- ☐ **T-027** [low] [Claude] Copy pass: remove ~100 dashes (— / –) from UI copy (legal pages
  excluded).
- ⊘ **T-029** [low] [Claude] Design follow-ups: form labels to sentence case; cut 5 font weights
  to 3. Superseded by T-060 (new type system).
- ☐ **T-071** [low] [Claude] Dashboard alternatives parked 2026-11-15: split view (list + document)
  and stages (needs-you first). Mockups in the T-058 design artifact; revisit after launch.
- ☐ **T-031** [normal] [Claude] Lint cleanup: 82 pre-existing errors in 17 files (incl. 19
  `no-unescaped-entities` in legal pages), then add lint to CI.
- ☐ **T-030** [low] [Claude] `scripts/generate-bundled-templates.mjs` writes a "Generated at"
  timestamp, so every build dirties `src/lib/bundledTemplates.generated.ts`. Drop the timestamp
  (or only rewrite on content change). Found 2026-11-15.
- ☐ **T-015** [low] [Claude] Cleanup: `console.log` on sensitive paths; delete `generate-token.js`
  and `private.key` from disk; orphaned `internal-approve`/`internal-reject`, `/mydrafts`,
  `/viewpdf`, `DEV` plan in billing UI.
- ☐ **T-033** [low] [Claude] Purge test data on development: E2E user/company/NDAs and
  `claude-verify+clerk_test@example.com` / "Claude Verify".
- ☐ **T-094** [low] [You] Clarify two OneNote to-dos before they become work: "add 'More' on the
  shrunk toolbar" and "invite new members suggestions" (which screen, what behavior).
- ☐ **T-093** [high] [Both] Emails for an NDA sent by a team member. **Before starting: ask Gilad
  the question below, don't assume an answer; he wants to see how things go first and consult
  Nir.** Today Party A emails (receiver suggested changes, ready to sign) go to the Party A email
  typed in the form, often the company signer, not to the teammate who sent the NDA.
  Question to ask: "When a teammate sends an NDA, should (a) round updates go to the teammate who
  sent it with the signer copied, (b) 'ready to sign' go only to the signer, and (c) the send step
  warn if the Party A signatory isn't a team member with the signer toggle on? Or something
  else?" Touches the negotiation emails; after T-049–T-054.

## Open decisions

- ☐ **T-036** [You] Where the business is based (leaning single-member US LLC) — confirm with a
  CPA before Stripe. [README](launch/README.md#open-decisions-2026-10-08)
- ☐ **T-037** [You] Keep the Beta pill off receiver pages (`/fillndahtml-public`, `/sign-nda-public`)?
- ☐ **T-028** [You] Landing: stand behind the "< 5 min" stat? Real fill-page screenshot in the
  hero? Rethink the stock SaaS section order?
- ☐ **T-035** [You] Run the e2e suite in CI (needs dev Clerk keys + dev DB as GitHub secrets) or
  keep it local?
- ☐ **T-091** [normal] [Both] Fill-page fields the NDA never uses (checked 2026-11-21; Nir reviews
  2026-11-22, decide after). Step 3 shows IP ownership, non-solicitation and exclusivity inputs,
  and step 2 a required "Confidentiality period (months)", but the NDA template has no place for
  any of them, so what a user types never reaches the NDA or the PDF. Strategy says one open
  clause. Suggested: remove all four inputs, keep `additional_terms`. Every other field is used.
- ☐ **T-092** [You] Notice information (Nir: "TBD if same as contact"): clause 11 (Notices) uses
  each party's address, phone and email from the contact fields. Decided 2026-11-21: keep it that
  way (no separate notice fields); Nir to confirm, then close.
- ☐ Exports: `origin/claude/ecstatic-gauss-yhmjky` adds the NDA v1.0 PDF to `exports/`. Keep it
  out of git (suggested) or merge? (cleanup after T-001)

## Deferred

- ⊘ **T-043** [high] [You] Stripe live mode (0.3), incl. webhook at
  `https://formalizeit.com/api/webhooks/stripe` — after the free-beta launch.
- ⊘ **T-006** [high] [Both] Stripe live-mode checkout test (4.2) — with T-043.
- ⊘ **T-011** [high] [Both] Turn paid plans on (30-day notice, `FREE_ALLOWANCE_COUNTS_FROM`) —
  with T-043.
- ⊘ By decision (no IDs until picked up): link-open tracking, term-expiry alerts, onboarding
  "review the standard NDA" step, Enterprise tier, custom NDA upload with AI, audit-log export UI,
  webhooks/Zapier, public API, advanced analytics, trust/network-effects repositioning.

## Done (most recent first; keep about 30, git has the rest)

- ☑ **T-096** [low] Vercel recovery codes regenerated (the old ones were lost) (2026-11-21, PR #31).
- ☑ **T-079** [low] OneNote notebook (strategy, messages, Q&A, legal, disclaimer, decisions, to-dos)
  saved to `docs/import/` and compared with the product; gaps filed as T-080–T-095 (2026-11-21, PR #29).

- ☑ **T-077** [high] Next.js 15.5.9 → 15.5.29 + `sharp` override ≥0.35.5: clears 32 advisories incl. CVE-2026-96889 image-optimizer RCE and middleware bypasses (2026-11-17, PR #28).
- ☑ **T-061** [normal] App shell: top bar restyled, same links, Schibsted Grotesk site-wide, no marketing footer on app pages (2026-11-15, PR #25).
- ☑ **T-062** [normal] Home + marketing pages, hero sheet whose blanks fill in (2026-11-15, PR #25).
- ☑ **T-063** [normal] Fill wizard restyle + compact disclaimer; variable highlight split to T-073 (2026-11-15, PR #25).
- ☑ **T-064** [normal] Send share sheet: brand logos, Gmail/Outlook/WhatsApp/email/SMS/copy + Telegram/LinkedIn, no pre-written message box (2026-11-15, PR #25).
- ☑ **T-065** [high] Receiver review/sign pages restyled, consent + disclaimer text unchanged; seal/evidence on executed view split to T-074 (2026-11-15, PR #25).
- ☑ **T-066** [normal] Dashboard: filter tabs replace the 7 tiles (1:1 filters), search row under tabs (2026-11-15, PR #25).
- ☑ **T-067** [normal] Settings, team, billing, onboarding, accept-terms, coming-soon, sign-in, errors restyled (2026-11-15, PR #25).
- ☑ **T-068** [high] Legal pages restyled, visible text byte-identical on all 10 (2026-11-15, PR #25).
- ☑ **T-060** [normal] Ink & Seal tokens, Schibsted Grotesk, opt-in crisp variants, Sheet / EvidenceBlock /
  Seal / ShareSheet, `/dev/design-system` preview; additive, no page changes (2026-11-15, PR #24).
- ☑ **T-048** [high] Open redirect on `/accept-terms ?next=` fixed with `safeInternalPath()` (2026-11-15, PR #20).
- ☑ **T-001** [low] Work rules, `docs/TICKETS.md`, T-IDs, session hook (2026-11-15, PR #19).
- ☑ **T-003** [normal] Site-wide Hallmark design audit (2026-11-15, PR #19).
- ☑ **T-002** [normal] Playwright e2e suite that signs in past Clerk (2026-11-15, PR #19).
- Earlier launch work (no IDs): see the ☑ items in [docs/launch/README.md](launch/README.md).
