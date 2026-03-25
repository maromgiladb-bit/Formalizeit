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
- **Payments:** Israeli payment provider — PayMe or Tranzila (not Stripe)

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

- Colors: **teal** and **dark navy**
- Tone: friendly but professional, clear, trustworthy, not overly legalistic
- Core message: *"You don't reinvent the NDA each time. You reuse a trusted structure and review only the important changes."*

---

## Notes for Claude Code

- This is a **production site** — be conservative with structural changes
- Prefer **editing existing files** over creating new ones when possible
- When adding company/member logic, check Prisma schema first before assuming table structure
- Ask before adding new dependencies
- Keep API routes consistent with existing patterns in the project
- If something is unclear about the existing structure, ask rather than guess
