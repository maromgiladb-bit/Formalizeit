# Formalize It - NDA SaaS Platform

A multi-tenant SaaS platform for creating, managing, and signing Non-Disclosure Agreements (NDAs) with built-in e-signatures, real-time HTML previews, and PDF generation.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Key Modules](#key-modules)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [NDA Workflow States](#nda-workflow-states)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
- [Build Process](#build-process)

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Next.js | 15.x |
| **Runtime** | Node.js | 20.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Database** | PostgreSQL (Neon) | - |
| **ORM** | Prisma | 5.22 |
| **Authentication** | Clerk | 6.x |
| **Email** | Resend | 4.x |
| **PDF Generation** | Puppeteer + Chromium | 23.x / 131 |
| **Object Storage** | AWS S3 | SDK v3 |
| **Template Engine** | Handlebars | 4.7 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Next.js 15 App Router (React 19 Server Components + Client)    │
│                                                                 │
│  Pages:                                                         │
│  ├── /dashboard          → NDA list, workflow status            │
│  ├── /fillndahtml        → Party A fills NDA form               │
│  ├── /fillndahtml-public → Party B fills requested fields       │
│  ├── /sign-nda-public    → Public signing page                  │
│  └── /templates          → Template selection                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                │
│  Next.js Route Handlers (src/app/api/*)                         │
│                                                                 │
│  Key Routes:                                                    │
│  ├── /api/ndas/drafts        → CRUD for NDA drafts              │
│  ├── /api/ndas/preview-html  → Live HTML preview generation     │
│  ├── /api/ndas/send          → Send for signature               │
│  ├── /api/ndas/send-for-input→ Send for Party B input           │
│  └── /api/ndas/submit-input  → Party B submits filled data      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CORE LIBRARIES                             │
│  src/lib/                                                       │
│                                                                 │
│  ├── templateManager.ts   → Template loading & rendering        │
│  ├── bundledTemplates.generated.ts → Bundled HBS templates      │
│  ├── renderNdaHtml.ts     → Handlebars → HTML rendering         │
│  ├── htmlToPdf.ts         → Puppeteer PDF generation            │
│  ├── email.ts             → Resend email dispatch               │
│  ├── prisma.ts            → Database client singleton           │
│  └── s3.ts                → AWS S3 file operations              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│                                                                 │
│  PostgreSQL (Neon)          AWS S3                              │
│  ├── users                  ├── nda-pdfs/                       │
│  ├── organizations          └── {orgId}/{filename}.pdf          │
│  ├── nda_drafts                                                 │
│  ├── nda_revisions                                              │
│  ├── sign_requests                                              │
│  ├── signers                                                    │
│  └── audit_events                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
nda-saas/
├── prisma/
│   ├── schema.prisma          # Database schema with enums
│   └── migrations/            # Prisma migration files
├── scripts/
│   └── generate-bundled-templates.mjs  # Build-time template bundler
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── ndas/          # NDA-related endpoints
│   │   │       ├── drafts/
│   │   │       ├── preview-html/
│   │   │       ├── send/
│   │   │       ├── send-for-input/
│   │   │       └── submit-input/
│   │   ├── dashboard/
│   │   ├── fillndahtml/
│   │   ├── fillndahtml-public/[token]/
│   │   └── sign-nda-public/[token]/
│   ├── components/
│   │   └── dashboard/
│   │       └── DashboardClient.tsx
│   ├── hooks/
│   │   └── useDebouncedPreview.ts
│   └── lib/
│       ├── bundledTemplates.generated.ts  # Auto-generated
│       ├── templateManager.ts
│       ├── renderNdaHtml.ts
│       ├── htmlToPdf.ts
│       ├── email.ts
│       ├── prisma.ts
│       └── s3.ts
├── templates/                 # Handlebars template files
│   ├── template-config.json
│   ├── professional_mutual_nda_v1.hbs
│   ├── mutual_nda_v1.hbs
│   └── design_mutual_nda_v1.hbs
└── package.json
```

---

## Key Modules

### Template System

| File | Purpose |
|------|---------|
| `templates/*.hbs` | Handlebars template files with HTML/CSS |
| `templates/template-config.json` | Template metadata, required fields, defaults |
| `scripts/generate-bundled-templates.mjs` | Bundles templates into TS at build time |
| `src/lib/bundledTemplates.generated.ts` | Auto-generated file containing all templates |
| `src/lib/templateManager.ts` | Template loading, caching, and rendering |
| `src/lib/renderNdaHtml.ts` | High-level template rendering function |

**Build Flow:**
```bash
npm run prebuild  # Runs generate-bundled-templates.mjs
                  # Creates bundledTemplates.generated.ts
                  # Templates are embedded as string constants
                  # No filesystem access needed at runtime (serverless-compatible)
```

### PDF Generation

| File | Purpose |
|------|---------|
| `src/lib/htmlToPdf.ts` | Puppeteer-based HTML to PDF conversion |
| `@sparticuz/chromium` | Serverless-compatible Chromium binary |

**Key Functions:**
- `htmlToPdf(html: string): Promise<Buffer>` - Converts HTML to PDF buffer

### Email System

| File | Purpose |
|------|---------|
| `src/lib/email.ts` | Email dispatch via Resend API |

**Email Templates:**
- `recipientEditEmailHtml()` - Party B edit request
- `ownerReviewEmailHtml()` - Owner review notification with changes
- `recipientSignRequestEmailHtml()` - Signature request
- `finalSignedEmailHtml()` - Completion notification

---

## Database Schema

### Core Enums

```prisma
enum NdaWorkflowState {
  FILLING           // Party A is filling
  AWAITING_INPUT    // Waiting for Party B input
  REVIEWING_CHANGES // Party A reviewing changes
  READY_TO_SIGN     // All fields filled
  AWAITING_SIGNATURE// Waiting for signatures
  SIGNING_COMPLETE  // Both signed
}

enum NdaStatus {
  DRAFT
  READY_TO_SEND
  SENT
  SIGNED
  CANCELLED
}
```

### Key Models

| Model | Description |
|-------|-------------|
| `User` | Clerk-synced user accounts |
| `Organization` | Multi-tenant org with billing |
| `NdaDraft` | NDA drafts with workflow state |
| `NdaRevision` | Draft revision history |
| `SignRequest` | Signature request tracking |
| `Signer` | Individual signer records |
| `NdaPdf` | S3-stored PDF references |
| `AuditEvent` | Audit trail for compliance |

---

## API Routes

### NDA Management

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ndas/drafts` | GET/POST | List/create drafts |
| `/api/ndas/drafts/[id]` | GET/PATCH/DELETE | CRUD single draft |
| `/api/ndas/preview-html` | POST | Generate live HTML preview |
| `/api/ndas/send` | POST | Send NDA for signature |
| `/api/ndas/send-for-input` | POST | Send for Party B input |
| `/api/ndas/submit-input` | POST | Party B submits filled data |

---

## NDA Workflow States

```
FILLING ──────────────────────────────────────────┐
    │                                             │
    ▼ (has "ask receiver" fields)                 │ (no "ask receiver")
┌───────────────┐                                 │
│ AWAITING_INPUT │◄────────────────────────┐      │
└───────┬───────┘                          │      │
        │ (Party B submits)                │      │
        ▼                                  │      │
┌─────────────────────┐  (request changes) │      │
│ REVIEWING_CHANGES   │────────────────────┘      │
└─────────┬───────────┘                           │
          │ (approve)                             │
          ▼                                       ▼
    ┌──────────────────┐◄─────────────────────────┘
    │ READY_TO_SIGN    │
    └────────┬─────────┘
             │ (send for signature)
             ▼
    ┌────────────────────┐
    │ AWAITING_SIGNATURE │
    └────────┬───────────┘
             │ (both sign)
             ▼
    ┌──────────────────┐
    │ SIGNING_COMPLETE │
    └──────────────────┘
```

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Email (Resend)
RESEND_API_KEY="re_..."
MAIL_FROM="noreply@yourdomain.com"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="your-bucket-name"

# App URL
APP_URL="https://app.yourdomain.com"
```

---

## Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev

# 5. Start development server
npm run dev
```

### Useful Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build (runs prebuild first)
npm run lint             # ESLint
npm run db:studio        # Open Prisma Studio
npm run generate-templates  # Manually regenerate bundled templates
```

---

## Deployment

### Vercel (Recommended)

The project is configured for Vercel deployment:

1. **Connect Repository** - Link GitHub repo to Vercel
2. **Environment Variables** - Set all required env vars in Vercel dashboard
3. **Auto Deploy** - Push to `main` triggers automatic deployment

### Build Process

```bash
# Automatic build sequence:
1. npm run prebuild        # Generate bundledTemplates.generated.ts
2. prisma generate         # Generate Prisma client (postinstall)
3. next build              # Next.js production build
```

### Serverless Considerations

- Templates are bundled at build time (no filesystem access needed)
- Uses `@sparticuz/chromium` for PDF generation on AWS Lambda
- Prisma uses `engineType = "library"` for serverless

---

## Monitoring & Debugging

### Debug Endpoints (Development only)

| Route | Purpose |
|-------|---------|
| `/api/debug-templates` | Verify template loading |
| `/api/debug-preview` | Test renderNdaHtml without auth |

### Logs

All API routes include console logging with emoji prefixes:
- 📧 Email operations
- 📄 PDF/document operations
- ✅ Success
- ❌ Errors

---

## License

Private - All rights reserved.
