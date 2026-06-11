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

**All UI work must follow the Stitch design system.** Read `.claude/skills/stitch-design.md` at the start of every UI task before writing or editing any component, page, or layout.

Key rules to always apply:
- Primary buttons: `bg-teal-800 hover:bg-teal-700` (never teal-600)
- Accent labels: `text-teal-700 text-xs font-bold uppercase tracking-widest`
- Icon backgrounds: `bg-teal-50` (feature cards), `bg-teal-800` (step rows / toasts)
- Cards: `bg-white border border-gray-200 rounded-xl`
- Alternate section backgrounds: `bg-gray-50`
- Body text: `text-gray-900` headings, `text-gray-500` descriptions

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
  - companyId, userId, role (owner | approver | contributor)

Document
  - companyId (not userId — this is the key shift)
  - status: draft | pending_approval | approved | rejected | sent | signed

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
- Can do everything an Approver can do

### Approver
- Creates and edits documents
- Reviews and accepts/rejects contributor suggestions
- Sends, finalizes, and signs NDAs

### Contributor
- Creates and edits **draft** NDAs
- Adds comments and suggests changes
- Submits documents for approval
- **Cannot** sign, send, finalize, or directly approve their own changes

**Important:** Contributors are active draft collaborators, not passive viewers. Permission gating happens at the action level (buttons, API routes), not by showing separate pages per role.

---

## Document workflow

```
draft → pending_approval → approved → sent → signed
                        ↘ rejected → (back to draft)
```

---

## App structure philosophy

- **One shared app shell** for all roles — no separate role-based apps
- Role differences show up in **what actions are available**, not in separate pages
- Keep the existing site structure intact — do not restructure pages unless needed
- Add company logic with minimal UI churn

---

## Key product rules to keep in mind

1. **Documents belong to a company**, not a user directly
2. **Contributors need approval before sending** — never let a contributor finalize
3. **Billing is company-level** — one plan per company, users inherit access
4. **Template reuse is core** — the product is not a freeform doc editor
5. **MVP first** — do not overbuild; avoid complex permission engines or separate role UIs

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
