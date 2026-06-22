# FormalizeIt — Claude Code Context

## What this project is

FormalizeIt is a **company-based NDA workflow SaaS** in production. It helps teams create, review, approve, and finalize NDAs faster by reusing known templates and focusing review only on the terms that actually change.

The site is at an **advanced stage**. Most of the core product flow already exists. Avoid unnecessary rewrites or refactors unless explicitly asked.

---

## Tech stack

- **Framework:** Next.js v15 (App Router)
- **UI:** React v19, Tailwind CSS v4, Radix UI primitives, Framer Motion, Lucide React
- **Language:** TypeScript (strict — use types everywhere, avoid `any`)
- **ORM / DB:** Prisma + PostgreSQL
- **Auth:** Clerk (`@clerk/nextjs`) — handles sessions, user identity, and middleware
- **Email:** Resend — for transactional emails (invites, notifications)
- **File storage:** AWS S3 (`@aws-sdk/client-s3`) — stores signed NDA PDFs and documents
- **PDF generation:** Puppeteer via `@sparticuz/chromium` (server/serverless), `pdf-lib`, `pdfjs-dist`
- **Document templating:** `docxtemplater` + `mammoth` for `.docx` templates, Handlebars for HTML template rendering
- **Testing:** Vitest
- **Payments:** Stripe — subscription billing, embedded checkout, webhooks, billing portal

---

## Design System

**All UI work must follow the Calm Precision design system.** Read `.claude/skills/stitch-design.md` at the start of every UI task before writing or editing any component, page, or layout.

Key rules to always apply:
- Color discipline: teal-800 for CTAs/links ONLY, amber exclusively for "action needed" moments, no blue/purple/green/yellow utility colors
- Primary buttons: use `@/components/ui/button` (never hand-roll; never teal-600)
- Accent labels: `text-teal-700 text-xs font-bold uppercase tracking-widest`
- Cards: `bg-white border border-gray-100 rounded-2xl shadow-card`
- Alternate section backgrounds: `bg-gray-50`
- Body text: `text-ink` headings (not gray-900), `text-gray-500` descriptions
- Status badges: `@/components/ui/status-pill` (neutral/progress/action/done tones)
- Scroll animations: `@/components/ui/reveal` only; respect prefers-reduced-motion

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

### Owner
- Manages company settings, billing, members
- Can do everything a Signer can do (signing requires the signer toggle, `isApprover`)

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
only signers/owners apply the company signature at the `signed` step.

---

## App structure philosophy

- **One shared app shell** for all roles — no separate role-based apps
- Role differences show up in **what actions are available**, not in separate pages
- Keep the existing site structure intact — do not restructure pages unless needed
- Add company logic with minimal UI churn

---

## Key product rules to keep in mind

1. **Documents belong to a company**, not a user directly
2. **Only signers/owners can sign on behalf of the company** — contributors can do everything else (create, edit, send for review/input/signature)
3. **Billing is company-level** — one plan per company, users inherit access
4. **Template reuse is core** — the product is not a freeform doc editor
5. **MVP first** — do not overbuild; avoid complex permission engines or separate role UIs

### Plan limits & retention (decided June 2026 — see `docs/strategy-gap-checklist.md` §1, §2)
- **Plans** (`BillingPlan`): **FREE** = 3 NDAs total, 1 user · **PRO** ($19/mo, $15 annual) =
  unlimited NDAs, 1 user · **TEAM** ($75/mo, $60 annual) = unlimited NDAs, up to 10 users ·
  **ENTERPRISE** = contact sales. Limits in `src/billing/planLimits.ts` (`PLAN_LIMITS`); send gate
  `assertCanSendNda` in `src/organizations/limits.ts`. Stripe price→plan map in
  `src/lib/stripe-price-ids.ts` (`priceIdFor`/`planFromPriceId`); checkout takes a `plan` arg and the
  webhook maps the subscription price → plan. Receivers are always free/no-account.
- **Retention**: signed NDAs kept **5 years from execution** (free included); advance notice before
  any deletion. Enforced by `src/app/api/cron/retention-cleanup` (notice at 5y−30d, delete at 5y
  keeping the draft row + a `RETENTION_DELETED` audit stub) using `NdaDraft.completedAt` /
  `retentionNoticeSentAt`. PRO/ENTERPRISE retained while subscription active.
- **Counterparty access**: counterparty receives the signed PDF by email on execution and can access
  it after creating an account. Linkage: `ensureDbUser` → `claimPendingSigners` (case-insensitive,
  all verified Clerk emails) + claim-by-token cookie (`/api/claim`) for a different signup email.

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

*"Pick a template, fill in what's different, send — in minutes. No lawyer required."*

---

## Notes for Claude Code

- This is a **production site** — be conservative with structural changes
- Prefer **editing existing files** over creating new ones when possible
- When adding company/member logic, check Prisma schema first before assuming table structure
- Ask before adding new dependencies
- Keep API routes consistent with existing patterns in the project
- If something is unclear about the existing structure, ask rather than guess
