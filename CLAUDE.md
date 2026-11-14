# FormalizeIt — Claude Code Context

## What this project is

FormalizeIt is a **company-based NDA workflow SaaS** in production. Its mission (per the product
strategy) is to let teams send a legally-ready **NDA in minutes** by standardizing on a **single,
fixed mutual NDA** whose legal text stays identical across every transaction. Users review the
standard NDA once, then only fill in the deal-specific variables that differ per agreement. The
goal is to reduce legal friction, accelerate business conversations, and build a **trusted
standard** for confidential discussions. The workflow is `draft → sent → signed` — there is no
internal approval step.

The site is at an **advanced stage**. Most of the core product flow already exists. Avoid unnecessary rewrites or refactors unless explicitly asked.

> **One standard NDA (MVP):** the product centers on a single standard mutual NDA. A template
> selection UI still exists (`src/app/templates`, `/api/templates`) and can technically list more
> than one template — for MVP, treat the one standard NDA as *the* product. Additional templates
> are a deliberate **post-MVP** possibility, not the current model; revisit this framing when/if
> more templates ship.

---

## Tech stack

- **Framework:** Next.js v15 (App Router)
- **UI:** React v19, Tailwind CSS v4, Radix UI primitives, Framer Motion, Lucide React
- **Language:** TypeScript (strict — use types everywhere, avoid `any`)
- **ORM / DB:** Prisma + PostgreSQL
- **Auth:** Clerk (`@clerk/nextjs`) — handles sessions, user identity, and middleware
- **Email:** Resend — for transactional emails (invites, notifications)
- **File storage:** AWS S3 (`@aws-sdk/client-s3`) — stores signed NDA PDFs and documents
- **PDF generation:** Puppeteer via `@sparticuz/chromium` (server/serverless); `pdf-lib` only in dev scripts
- **Document templating:** Handlebars for HTML template rendering
- **Testing:** Vitest (unit) · Playwright + `@clerk/testing` (browser e2e, see "Browser testing")
- **Payments:** Stripe — subscription billing, embedded checkout, webhooks, billing portal

---

## Design System

**All UI work must follow the Calm Precision design system.** Read `.claude/skills/stitch-design.md` at the start of every UI task before writing or editing any component, page, or layout.

Key rules to always apply:
- Color discipline: teal-800 for CTAs/links ONLY, amber exclusively for "action needed" moments, no blue/purple/green/yellow utility colors
- Primary buttons: use `@/components/ui/button` (never hand-roll; never teal-600)
- No eyebrows above headings; labels are sentence case, untracked, never `uppercase` (panel title `text-sm font-semibold text-gray-700`, form label `text-xs font-semibold text-gray-500`) — changed Nov 2026 per the Hallmark audit
- Cards: `bg-white border border-gray-100 rounded-2xl shadow-card`
- Alternate section backgrounds: `bg-gray-50`
- Body text: `text-ink` headings (not gray-900), `text-gray-500` descriptions
- Status badges: `@/components/ui/status-pill` (neutral/progress/action/done tones)
- Scroll animations: `@/components/ui/reveal` only (visible by default, hidden only when scripted); no framer `initial` opacity-0 on page content; respect prefers-reduced-motion
- Never `transition-all`; never animate width/height/top/left; decorative icons `aria-hidden`, icon-only buttons `aria-label`; no emoji icons; gray text on white is `text-gray-500` or darker, smallest text 12px
- Hallmark (`/hallmark audit`) is the design checker: its stamp and waivers sit at the top of `src/app/globals.css`; records in `.hallmark/` (git-ignored)

---

## Current development focus

**Company/workspace model** — the top priority right now.

The product is shifting from user-centric to company-centric. Key things being built:

- A `Company` owns documents, not individual users
- Users belong to a company via `CompanyMember`
- Billing is at the company level
- The user who creates the company becomes the Owner
- Owners can invite users by email and assign roles

---

## Data model direction

Core entities being built toward:

```
Company
  - id, name, createdAt, ...

CompanyMember
  - companyId, userId, role (owner | signer | contributor)

Document
  - companyId (not userId — this is the key shift)
  - status: draft | sent | signed

Billing
  - companyId
  - plan, status, provider (PayMe / Tranzila)

Comment / Suggestion
  - documentId, authorId
  - for contributor collaboration without final authority
```

---

## Roles and permissions

Three roles. Keep permission logic consistent with this model.

> **Renamed June 2026 (strategy terminology):** the role is now `ADMINISTRATOR` (was `OWNER`) and
> the signer toggle field is `isSigner` (was `isApprover`). This rename is **applied** — code +
> schema use the new names and migration
> `20260629000001_rename_owner_to_administrator_and_signer_flag` is committed. The strategy's
> future "Legal approver/filler" role is deferred (today covered by an administrator with the
> signer toggle on).

### Administrator (role `ADMINISTRATOR`; formerly "Owner")
- Manages company settings, billing, members
- Can do everything a Signer can do (signing requires the signer toggle, `isSigner`)

### Signer (role `SIGNER`; formerly "Approver")
- Creates and edits documents
- Reviews and accepts/rejects contributor suggestions
- Sends NDAs and **signs on behalf of the company**

### Contributor
- Creates and edits draft NDAs
- Adds comments and suggests changes
- Sends NDAs for review, input, and signature
- **Can do everything except sign on behalf of the company**

**Important:** Contributors are full collaborators, not passive viewers — the *only*
action they cannot take is applying the company's signature. Permission gating happens
at the action level (buttons, API routes), not by showing separate pages per role. The
single signing guard is `canSignNDA()` in `src/lib/organizationRoles.ts`.

---

## Document workflow

```
draft → sent → signed
```

There is no internal approval step — any role can take a draft through to `sent`;
only signers/administrators apply the company signature at the `signed` step.

---

## App structure philosophy

- **One shared app shell** for all roles — no separate role-based apps
- Role differences show up in **what actions are available**, not in separate pages
- Keep the existing site structure intact — do not restructure pages unless needed
- Add company logic with minimal UI churn

---

## Key product rules to keep in mind

1. **Documents belong to a company**, not a user directly
2. **Only signers/administrators can sign on behalf of the company** — contributors can do everything else (create, edit, send for review/input/signature)
3. **Billing is company-level** — one plan per company, users inherit access
4. **Template reuse is core** — the product is not a freeform doc editor. The legal text of the
   standard NDA is **not user-editable**; users only complete approved deal variables (party
   names, contact info, effective date, purpose, term, governing law, notice info) plus the
   single optional open clause (`additional_terms`)
5. **MVP first** — do not overbuild; avoid complex permission engines or separate role UIs
6. **Not legal advice** — the "FormalizeIt is not a law firm / does not provide legal advice"
   disclaimer must appear **prominently in the product UI** (fill, review, sign pages), not only
   in Terms/FAQ
7. **Signature evidence** — every executed NDA must record signer email, timestamp, **IP address,
   the exact template version actually signed (snapshot — never re-derive from the current active
   template), and an agreement hash** (SHA-256 of the rendered PDF). An **authority-to-sign
   checkbox** (signer affirms authority to sign in the company's name — the company's
   responsibility) is required before signing
8. **Receiver reminders** fire automatically at **48h and 5 days** for unsigned NDAs; **2FA
   sign-in** (Clerk) is in MVP scope
9. **Initial send is links-only (decided Sept 2026)** — the platform does **not** email the first
   invite (cold mail from an unknown domain lands in spam). `send-for-review` returns the secure
   link + a pre-written subject/body; the sender sends it from their own inbox via the share menu
   (Gmail / Outlook / mailto / WhatsApp / copy). Platform emails are reserved for follow-ups the
   receiver already expects: round notifications, 48h/5d reminders, and the signed copy

### Plan limits & retention (decided June 2026 — see `docs/strategy-gap-checklist.md` §1, §2)
- **Plans** (`BillingPlan`): **FREE** = 3 NDAs total, 1 user · **PRO** ($9/mo, $7.65/mo annual) =
  unlimited NDAs, 1 user · **TEAM** ($50/mo, $42.50/mo annual) = unlimited NDAs, up to 10 users ·
  **ENTERPRISE** = contact sales (deferred, not launched now). Annual = **15% off** monthly. Limits
  in `src/billing/planLimits.ts` (`PLAN_LIMITS`); send gate
  `assertCanSendNda` in `src/organizations/limits.ts`. Stripe price→plan map in
  `src/lib/stripe-price-ids.ts` (`priceIdFor`/`planFromPriceId`); checkout takes a `plan` arg and the
  webhook maps the subscription price → plan. Receivers are always free/no-account.
- **Free beta (current, Oct 2026):** while paid plans are switched off (see "Launch switches"),
  `effectivePlanLimits()` gives FREE unlimited NDAs and up to 10 users. `PLAN_LIMITS` above still
  holds the paid-launch numbers and is never edited for the beta.
- **Retention**: signed NDAs kept **5 years from execution** (free included); advance notice before
  any deletion. Enforced by `src/app/api/cron/retention-cleanup` (notice at 5y−30d, delete at 5y
  keeping the draft row + a `RETENTION_DELETED` audit stub) using `NdaDraft.completedAt` /
  `retentionNoticeSentAt`. PRO/ENTERPRISE retained while subscription active.
- **Counterparty access**: counterparty receives the signed PDF by email on execution and can access
  it after creating an account. Linkage: `ensureDbUser` → `claimPendingSigners` (case-insensitive,
  all verified Clerk emails) + claim-by-token cookie (`/api/claim`) for a different signup email.

### Required legal documents (before launch)
Website Disclaimer · Terms of Service · Privacy Policy · Electronic Signature Consent · viewable
Standard NDA · NDA Governance Policy · NDA Changelog (human-readable summary of standard-NDA
changes). All seven routes are now scaffolded and linked in nav: Terms (`src/app/terms`),
Privacy (`src/app/privacy`), Compliance (`src/app/compliance`), Standard NDA
(`src/app/standard-nda`), NDA Governance Policy (`src/app/nda-governance`), E-Signature Consent
(`src/app/esignature-consent`), NDA Changelog (`src/app/nda-changelog`). The Changelog is
content-complete (driven by `src/lib/ndaChangelog.ts`). Standard NDA, Governance Policy, and
E-Signature Consent are now **content-complete with founder-drafted text** (launched with a
prominent "not legal advice" disclaimer; Standard NDA mirrors `templates/professional_mutual_nda_v1.hbs`
v1.0, E-Signature Consent mirrors `src/lib/signatureEvidence.ts`).

**LEGAL READINESS (standing obligation):** all seven legal docs launch with founder-drafted text
and a prominent disclaimer. They **must still be reviewed by qualified legal counsel** — do this
in parallel with launch and before scaling / removing any beta framing. Keep each page in sync
with the behavior it describes when the underlying code changes.

---

## Launch switches — flip these to open the site

The MVP launches as a **free beta with sign-up closed**. Every switch lives in
`src/lib/featureFlags.ts`. `NEXT_PUBLIC_` values are baked in at build time, so after changing one in
Vercel (Production scope) you must **redeploy**. The order to flip them is tracked in
`docs/launch/README.md` → "Go-live switches".

| Switch | Now | What it does | To turn it on / open |
|---|---|---|---|
| `NEXT_PUBLIC_PRIVATE_BETA` (env) | `on` (unset = closed in production) | Sign-up closed: `/signup` and every "Get started" button go to the `/coming-soon` request-access form. Sign-in, receiver links, webhooks and crons are unaffected. | Set `off`, redeploy. That opens sign-ups. |
| `NEXT_PUBLIC_PAID_PLANS_ENABLED` (env) | unset = free beta | Off: Pro/Team show "Coming soon", checkout/upgrade/downgrade return 403, FREE is unlimited. | Only once Stripe is live. Email users 30 days ahead (Terms §7), set `FREE_ALLOWANCE_COUNTS_FROM` in `src/billing/planLimits.ts` to the launch date (free companies get a fresh 3 NDAs), then set `true` and redeploy. |
| `BETA_LABEL` (code) | `true` | "Beta" pill next to the logo. | Set `false` only after legal counsel has reviewed the legal pages. |
| `FORMI_ENABLED` (code) | `false` | AI assistant hidden (see Formi section). | Set `true` after its prerequisites. |

Known gap while sign-up is closed: a brand-new user signing in with Google on `/sign-in` can still
get a Clerk account. If that becomes a problem, set Clerk → Restrictions → sign-up mode to
"Restricted" until launch.

---

## Formi (AI assistant) — keep its knowledge in sync

Formi is the in-app AI assistant. It answers questions about the whole product — what the site
does, where things are, roles, plans, workflow, and NDA help.

> **Currently switched off (decided Sept 2026)** — held back from the MVP launch over cost,
> response quality, and legal review. The flag is `FORMI_ENABLED` in `src/lib/featureFlags.ts`;
> it hides the chat widget and the "Ask Formi" tooltip buttons, and makes `/api/ai/chat` return
> 503. All Formi code stays in place. **The sync rule below still applies while it's off**, so
> turning it back on is a one-line change. Before re-enabling: confirm `GEMINI_API_KEY` is set
> in Vercel (Production), review the prompt, and check the model name in `/api/ai/chat`.

**Whenever you add or change
anything users could ask Formi about** (features, pages/routes, roles, permissions, pricing,
workflow steps, legal/disclaimer behavior, plan limits), you MUST also update what Formi knows so
it stays accurate. This is a standing rule, not optional.

- Formi's knowledge lives in `src/ai/prompts/formi_systemPrompt.ts` — `PRODUCT_KNOWLEDGE` (about,
  "where things are", roles, status flow) and `planFacts()` (derives plan limits from
  `PLAN_LIMITS` so they stay correct automatically — don't hardcode plan numbers there).
- Prefer teaching Formi the way it already learns: edit `PRODUCT_KNOWLEDGE`/instructions, or wire
  a derived fact (like `planFacts()`) so it can't drift. Keep prices out of the prompt — Formi
  points users to the Plans page rather than quoting prices.
- After any change above, re-read the prompt and confirm roles, routes, workflow, and feature copy
  match reality. Out-of-date Formi answers are treated as a bug in the change that caused them.

---

## What already exists (do not rebuild)

- NDA creation flow
- Template-based workflow
- Edit/review flow
- Signing/send flow
- Dashboard
- Document pages
- FAQ and Help pages
- Billing foundations

When working on new features, check what already exists before adding new files or flows.

---

## Brand and tone (relevant for any copy/UI text)

- Colors: **teal**, **dark navy**, and **amber** (accent/highlight — Tailwind amber-500 `#f59e0b`)
- Tone: friendly, direct, and energetic — zero friction, zero jargon, zero delay

### #1 message — Time saving. Easy. Accessible. NDA in minutes.

**Every word on the site exists to prove one thing: you can send a legally ready NDA faster than you think.**

- The tagline is: **"NDA in minutes"** — use verbatim in hero sections, page titles, and CTAs
- Open every headline with the time win: "NDA in minutes", "Done before the meeting ends", "No back-and-forth, no delays"
- The user's job is to pick a template and fill in what's different — surface that path immediately, never bury it
- CTAs are action-first and feel instant: "Send your NDA now", "Start in seconds", "Get started free"
- Accessibility means: no legal knowledge required, no setup friction, works for anyone on any device
- Never lead with team setup, configuration, or process language — that signals effort, not speed
- If a sentence doesn't make the product feel faster or easier, cut it

### Secondary message — Trusted and Collaborative

Confidence signals come after the speed hook, never before:

- Teammates can review and contribute without slowing the sender down
- Documents are stored securely with a clear audit trail and e-signature
- Frame these as "and it's safe" not "it's safe so use it"

### Core message (use as a copywriting anchor)

*"Pick a template, fill in what's different, send — in minutes."*

---

## Work rules (this repo)

General rules for tickets, branches, commits, checks and merges are in the user's global
`~/.claude/CLAUDE.md`. This section adds what is specific to this repo. If that file isn't loaded
(another machine or another person), the short version: one branch per ticket off `main`;
conventional commits ending `(T-0NN)`; checks by risk tier; PR, then squash-merge only when the
user says "merge".

**Tickets**
- The ticket list is **`docs/TICKETS.md`**: Resume here, Now, Next, Waiting on you, Later, Open
  decisions, Deferred, Done. `docs/launch/` keeps the launch plan and phase detail and refers to
  tickets by ID. Specs for planned features live in `docs/superpowers/specs/`.
- IDs are `T-NNN`. "Next ID" sits at the top of TICKETS.md; a new ticket takes it and bumps it in
  the same edit. Each line: `☐ **T-0NN** [tier] [owner] one-line summary` + a link to detail.
- **New task → write it down immediately.** Whenever the user or any agent comes up with a task
  (a "do this later", follow-up work from a decision, a bug found but not fixed now), add it to
  TICKETS.md in the same session, even if no code changed, and say "Added T-0NN". Tasks that live
  only in chat are lost.
- **Done → tick it** `☑ **T-0NN** … (YYYY-MM-DD, PR #N)` and move it to Done, in the ticket's own
  PR; or `⊘` with the reason. **Next step changed → refresh "Resume here".** A finished change that
  leaves TICKETS.md stale is incomplete.
- Read TICKETS.md at the start of any planning conversation.

**Branches and sessions**
- Branch per ticket from an up-to-date `main`: `feat|fix|chore|docs|refactor|test/T-0NN-slug`.
- One editing session at a time works in the main folder. If the main folder is on another ticket
  branch or has uncommitted work this session didn't make, a second session moves to its own git
  worktree under `.claude/worktrees/` (git-ignored). Never commit, stash or switch away the other
  session's work. A new worktree needs `.env.local` copied from the main folder and `npm install`.
- While an agent worktree exists, run `vitest` with `--exclude ".claude/**"` so it doesn't also
  test that copy.

**Risk tiers here**
- **high:** signing and signature evidence, Clerk/auth, Stripe/billing, Prisma migrations, the
  retention cron, legal page text, security headers and rate limits.
- Commands: `npm run typecheck` · `npm run lint` (82 pre-existing errors, T-031: judge only new
  ones) · `npm test` · `npm run build` · `npm run e2e` (see "Browser testing" below).
- A PR with a Prisma migration lists it, and the migration runs on production **before** the
  merge (as done for PR #18).

## Browser testing (Playwright e2e) — agents can sign in

A Playwright suite in `e2e/` lets an agent drive the real app **signed in**, past Clerk's sign-in
and 2FA. Use it to test flows, take screenshots for UI review, or check a change end to end.

- **Run:** `npm run e2e` (all) · `npx playwright test e2e/smoke.spec.ts` (one file) ·
  `npm run e2e:ui` (interactive) · `npm run e2e:report` (last HTML report).
- **Server:** by default it builds production into `.next-e2e` and serves it on **port 3100**
  (`NEXT_DIST_DIR`, set only by the suite), so it never touches `npm run dev` on 3000. The build
  takes a few minutes; pages then load in about a second. `E2E_DEV=1` uses `next dev` instead. That
  skips the build but takes minutes per route on a cold start and is flaky. `E2E_BASE_URL` points it
  at an existing server.
- **How sign-in works** (`e2e/global.setup.ts`): it creates the test admin in the Clerk dev
  instance if missing, signs in with a one-time Clerk ticket (no password, no 2FA), clicks through
  accept-terms and onboarding on a fresh user, and saves the session to `e2e/.auth/admin.json`
  (git-ignored). Every test in the `chromium` project starts signed in. A signed-out context
  (`test.use({ storageState: { cookies: [], origins: [] } })`) plays the receiver.
- **Test data:** user `e2e-admin+clerk_test@example.com` in company **"E2E Test Co"** on the
  **development** database; receiver email `delivered+e2e@resend.dev` (Resend's test inbox, so
  nothing bounces). Each flow run adds an NDA titled `E2E NDA <id>`.
- **Safety guard** (`e2e/env.ts` → `assertSafeTarget`): refuses to run unless the Clerk keys are
  `sk_test_`/`pk_test_`, `DATABASE_URL` is not the production Neon host (`ep-wild-sea-…`) and the
  URL is not formalizeit.com. Never weaken it; never point the suite at production.
- **Specs:** `smoke.spec.ts` (every signed-in and public page loads with no console errors;
  screenshots in `e2e/.results/screens/`) · `nda-flow.spec.ts` (fill all wizard steps → "Send NDA"
  → secure link from the `send-for-review` response → receiver opens it signed out).
- **New specs:** import `test`/`expect` from `./fixtures` (not `@playwright/test`). It stubs
  `/_vercel/insights/script.js`, which only exists on Vercel and otherwise 500s locally.
- **Selectors:** fill-page labels aren't linked to their inputs, so the specs use placeholders and
  button names. If you change a placeholder or button label on `/fillndahtml` or `/templates`,
  update `e2e/nda-flow.spec.ts`. With one template, `/templates` redirects straight to the fill page.
- Signing as the company needs the test admin's signer toggle (`isSigner`) on; it is off by
  default for a new workspace. Planned extensions are in the tracker ("Browser e2e suite").
- **Windows quirk (unit tests too):** if Vitest fails *every* file with "Cannot read properties
  of undefined (reading 'config')", the shell's working directory has a lowercase drive letter
  (`c:\…`). `cd C:/Users/marom/Projects/nda-saas` and rerun.

## Notes for Claude Code

- This is a **production site** — be conservative with structural changes
- Prefer **editing existing files** over creating new ones when possible
- When adding company/member logic, check Prisma schema first before assuming table structure
- Ask before adding new dependencies
- Keep API routes consistent with existing patterns in the project
- If something is unclear about the existing structure, ask rather than guess
