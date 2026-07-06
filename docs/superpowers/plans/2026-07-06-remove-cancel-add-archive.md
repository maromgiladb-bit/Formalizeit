# Remove NDA Cancellation → Expire-Delete + Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove NDA cancellation entirely; let expired NDAs be hard-deleted (with an explicit confirmation) and let finalized NDAs be archived/unarchived into a separate dashboard list.

**Architecture:** Deletion/archive eligibility lives as pure functions in `src/lib` (tested directly, matching the repo's test convention). The `DELETE /api/ndas/drafts/[id]` route and a new archive route call those functions as authoritative guards. The dashboard uses the same functions to decide which buttons to render. A nullable `archivedAt` column on `NdaDraft` backs archiving.

**Tech Stack:** Next.js 15 App Router, TypeScript (strict), Prisma + PostgreSQL, Clerk, Vitest, Tailwind v4, lucide-react.

## Global Constraints

- TypeScript strict — types everywhere, no `any`. (CLAUDE.md)
- Design system "Calm Precision": neutral action buttons use `border border-gray-200 text-gray-500 bg-white`; destructive hover uses `hover:border-red-200 hover:bg-red-50 hover:text-red-600`; teal-800 for primary only. (CLAUDE.md / stitch-design)
- Keep API routes consistent with existing patterns: `auth()` → `prisma.user.findUnique({ where: { externalId: userId } })` → `getActiveOrganization()` → permission guard → org-scoped query. (existing routes)
- Do NOT remove the `NdaStatus.CANCELLED` or `NdaEventType.CANCELLED` enum values — legacy prod rows depend on them.
- Archive UI/logic applies to `type === 'created'` finalized NDAs only. Received NDAs are excluded.
- After any user-facing behavior change, keep Formi's knowledge (`src/ai/prompts/formi_systemPrompt.ts`) in sync. (CLAUDE.md standing rule)
- Run tests with `npx vitest run <path>`; typecheck with `npx tsc --noEmit`.

---

### Task 1: Add `archivedAt` column to `NdaDraft`

**Files:**
- Modify: `prisma/schema.prisma:276` (inside `model NdaDraft`, near the other timestamp columns)
- Create: `prisma/migrations/20260706000000_add_nda_archived_at/migration.sql`

**Interfaces:**
- Produces: `NdaDraft.archivedAt: Date | null` (Prisma field `archivedAt`, DB column `archived_at`).

- [ ] **Step 1: Add the schema field**

In `prisma/schema.prisma`, inside `model NdaDraft`, add after the `updatedAt` line (line 277):

```prisma
  archivedAt      DateTime? @map("archived_at") // Finalized NDA moved to the dashboard Archived list
```

- [ ] **Step 2: Create the migration SQL**

Create `prisma/migrations/20260706000000_add_nda_archived_at/migration.sql`:

```sql
-- Add archive marker for finalized NDAs (dashboard Archived list)
ALTER TABLE "nda_drafts" ADD COLUMN "archived_at" TIMESTAMP(3);
```

- [ ] **Step 3: Regenerate the Prisma client**

Stop the dev server first if it is running (it holds a lock on the generated client DLL on Windows), then run:

```bash
npx prisma generate
```

Expected: "Generated Prisma Client" success message. `archivedAt` is now available on the typed client.

- [ ] **Step 4: Apply the migration**

```bash
npx prisma migrate deploy
```

Expected: migration `20260706000000_add_nda_archived_at` applied with no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260706000000_add_nda_archived_at
git commit -m "feat: add archivedAt column to NdaDraft"
```

---

### Task 2: Shared signer-expiry predicate

**Files:**
- Modify: `src/lib/signLink.ts` (append new exports)
- Test: `src/lib/__tests__/signLink.test.ts` (add cases)

**Interfaces:**
- Produces:
  - `type SignerExpiryInput = { status: string; expiresAt: Date | null }`
  - `isSignerExpired(signer: SignerExpiryInput, now?: number): boolean`
  - `isDraftExpired(signers: SignerExpiryInput[] | null | undefined, now?: number): boolean`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/signLink.test.ts`:

```ts
import { isSignerExpired, isDraftExpired } from '@/lib/signLink'

describe('isSignerExpired', () => {
  const now = new Date('2026-07-06T12:00:00.000Z').getTime()
  const past = new Date('2026-07-01T00:00:00.000Z')
  const future = new Date('2026-08-01T00:00:00.000Z')

  it('is false for a signed signer even if past expiresAt', () => {
    expect(isSignerExpired({ status: 'SIGNED', expiresAt: past }, now)).toBe(false)
  })

  it('is false for a declined signer', () => {
    expect(isSignerExpired({ status: 'DECLINED', expiresAt: past }, now)).toBe(false)
  })

  it('is true when status is EXPIRED', () => {
    expect(isSignerExpired({ status: 'EXPIRED', expiresAt: future }, now)).toBe(true)
  })

  it('is true when an open signer is past its expiresAt', () => {
    expect(isSignerExpired({ status: 'SENT', expiresAt: past }, now)).toBe(true)
  })

  it('is false when an open signer is still within expiresAt', () => {
    expect(isSignerExpired({ status: 'SENT', expiresAt: future }, now)).toBe(false)
  })

  it('is false when an open signer has no expiresAt', () => {
    expect(isSignerExpired({ status: 'PENDING', expiresAt: null }, now)).toBe(false)
  })
})

describe('isDraftExpired', () => {
  const now = new Date('2026-07-06T12:00:00.000Z').getTime()
  const past = new Date('2026-07-01T00:00:00.000Z')

  it('is false for null/empty signer lists', () => {
    expect(isDraftExpired(null, now)).toBe(false)
    expect(isDraftExpired([], now)).toBe(false)
  })

  it('is true when any signer is expired', () => {
    expect(isDraftExpired(
      [{ status: 'SIGNED', expiresAt: past }, { status: 'SENT', expiresAt: past }],
      now,
    )).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/signLink.test.ts`
Expected: FAIL — `isSignerExpired`/`isDraftExpired` are not exported.

- [ ] **Step 3: Implement the predicates**

Append to `src/lib/signLink.ts`:

```ts
/** Minimal shape needed to judge whether a signer's link has lapsed. */
export type SignerExpiryInput = { status: string; expiresAt: Date | null }

/**
 * Whether a single signer represents a lapsed signing link: not terminal
 * (SIGNED/DECLINED), and either explicitly EXPIRED or past its inactivity
 * `expiresAt`. This is the one definition of "expired" used by the dashboard
 * and the delete guard.
 */
export function isSignerExpired(signer: SignerExpiryInput, now: number = Date.now()): boolean {
  if (signer.status === 'SIGNED' || signer.status === 'DECLINED') return false
  if (signer.status === 'EXPIRED') return true
  return signer.expiresAt != null && signer.expiresAt.getTime() < now
}

/** Whether any signer on a draft has a lapsed link. */
export function isDraftExpired(
  signers: SignerExpiryInput[] | null | undefined,
  now: number = Date.now(),
): boolean {
  return !!signers?.some((s) => isSignerExpired(s, now))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/signLink.test.ts`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add src/lib/signLink.ts src/lib/__tests__/signLink.test.ts
git commit -m "feat: add shared signer-expiry predicate"
```

---

### Task 3: NDA lifecycle eligibility helpers

**Files:**
- Create: `src/lib/ndaLifecycle.ts`
- Test: `src/lib/__tests__/ndaLifecycle.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type NdaLifecycleInput = { status: string; workflowState?: string | null; expired?: boolean }`
  - `isNdaFinalized(nda: NdaLifecycleInput): boolean`
  - `canHardDeleteNda(nda: NdaLifecycleInput): boolean`
  - `canArchiveNda(nda: NdaLifecycleInput): boolean`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/ndaLifecycle.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isNdaFinalized, canHardDeleteNda, canArchiveNda } from '@/lib/ndaLifecycle'

describe('isNdaFinalized', () => {
  it('is true for SIGNED status (any case)', () => {
    expect(isNdaFinalized({ status: 'SIGNED' })).toBe(true)
    expect(isNdaFinalized({ status: 'signed' })).toBe(true)
  })
  it('is true for COMPLETE / SIGNING_COMPLETE workflow state', () => {
    expect(isNdaFinalized({ status: 'sent', workflowState: 'COMPLETE' })).toBe(true)
    expect(isNdaFinalized({ status: 'sent', workflowState: 'SIGNING_COMPLETE' })).toBe(true)
  })
  it('is false for an in-flight NDA', () => {
    expect(isNdaFinalized({ status: 'sent', workflowState: 'AWAITING_PARTY_B_SIGNATURE' })).toBe(false)
  })
})

describe('canHardDeleteNda', () => {
  it('allows unsent drafts', () => {
    expect(canHardDeleteNda({ status: 'draft', workflowState: 'DRAFT' })).toBe(true)
  })
  it('allows legacy cancelled rows', () => {
    expect(canHardDeleteNda({ status: 'cancelled' })).toBe(true)
  })
  it('allows expired in-flight NDAs', () => {
    expect(canHardDeleteNda({ status: 'sent', workflowState: 'AWAITING_PARTY_B_SIGNATURE', expired: true })).toBe(true)
  })
  it('refuses active (non-expired) in-flight NDAs', () => {
    expect(canHardDeleteNda({ status: 'sent', workflowState: 'AWAITING_PARTY_B_SIGNATURE', expired: false })).toBe(false)
  })
  it('refuses finalized NDAs even if flagged expired', () => {
    expect(canHardDeleteNda({ status: 'signed', workflowState: 'COMPLETE', expired: true })).toBe(false)
  })
})

describe('canArchiveNda', () => {
  it('allows finalized NDAs', () => {
    expect(canArchiveNda({ status: 'signed', workflowState: 'COMPLETE' })).toBe(true)
  })
  it('refuses non-finalized NDAs', () => {
    expect(canArchiveNda({ status: 'draft' })).toBe(false)
    expect(canArchiveNda({ status: 'sent', workflowState: 'AWAITING_PARTY_B_SIGNATURE' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/ndaLifecycle.test.ts`
Expected: FAIL — module `@/lib/ndaLifecycle` not found.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/ndaLifecycle.ts`:

```ts
/**
 * Deletion / archive eligibility for an NDA row. Pure decision logic shared by
 * the dashboard UI and the API route guards so they agree on what can be
 * removed or archived.
 *
 * Status/workflow strings are compared case-insensitively so both the DB enum
 * values ("SIGNED", "CANCELLED", "COMPLETE") and the lowercased dashboard
 * values ("signed", "cancelled") work with the same call.
 */
export type NdaLifecycleInput = {
  status: string
  workflowState?: string | null
  expired?: boolean
}

const norm = (s: string | null | undefined): string => (s ?? '').toUpperCase()

/** A finalized NDA is fully signed / complete and must never be deleted. */
export function isNdaFinalized(nda: NdaLifecycleInput): boolean {
  return (
    norm(nda.status) === 'SIGNED' ||
    norm(nda.workflowState) === 'COMPLETE' ||
    norm(nda.workflowState) === 'SIGNING_COMPLETE'
  )
}

/**
 * A row may be hard-deleted only when it is an unsent draft, a legacy cancelled
 * row, or an expired (lapsed-link) NDA. Finalized and active in-flight NDAs
 * cannot be deleted.
 */
export function canHardDeleteNda(nda: NdaLifecycleInput): boolean {
  if (isNdaFinalized(nda)) return false
  const status = norm(nda.status)
  if (status === 'DRAFT') return true
  if (status === 'CANCELLED') return true
  return !!nda.expired
}

/** Only finalized NDAs may be archived or unarchived. */
export function canArchiveNda(nda: NdaLifecycleInput): boolean {
  return isNdaFinalized(nda)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/ndaLifecycle.test.ts`
Expected: PASS (all three suites).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ndaLifecycle.ts src/lib/__tests__/ndaLifecycle.test.ts
git commit -m "feat: add NDA delete/archive eligibility helpers"
```

---

### Task 4: Harden the DELETE route guard

**Files:**
- Modify: `src/app/api/ndas/drafts/[id]/route.ts:124-183` (the `DELETE` handler)

**Interfaces:**
- Consumes: `isDraftExpired` from `@/lib/signLink`; `canHardDeleteNda` from `@/lib/ndaLifecycle`.

- [ ] **Step 1: Add imports**

At the top of `src/app/api/ndas/drafts/[id]/route.ts`, after the existing imports (line 5), add:

```ts
import { isDraftExpired } from '@/lib/signLink'
import { canHardDeleteNda } from '@/lib/ndaLifecycle'
```

- [ ] **Step 2: Load signers and add the eligibility guard**

In the `DELETE` handler, replace the `existingDraft` lookup (lines 152-161) so it includes signers:

```ts
    const existingDraft = await prisma.ndaDraft.findFirst({
      where: {
        id,
        organizationId: activeMembership.organizationId
      },
      include: {
        signRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { signers: true },
        },
      },
    })

    if (!existingDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }
```

Then, immediately after the existing `canDelete` permission block (after line 170, before `await prisma.ndaDraft.delete`), add the lifecycle guard:

```ts
    const expired = isDraftExpired(existingDraft.signRequests[0]?.signers)
    if (!canHardDeleteNda({
      status: existingDraft.status,
      workflowState: existingDraft.workflowState,
      expired,
    })) {
      return NextResponse.json(
        { error: 'Only draft, expired, or cancelled NDAs can be deleted. Finalized NDAs are kept.' },
        { status: 409 },
      )
    }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Confirm the eligibility unit tests still pass**

Run: `npx vitest run src/lib/__tests__/ndaLifecycle.test.ts src/lib/__tests__/signLink.test.ts`
Expected: PASS (route logic is covered by these pure helpers).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ndas/drafts/[id]/route.ts
git commit -m "feat: gate NDA deletion to draft/expired/cancelled rows"
```

---

### Task 5: Archive/unarchive API route

**Files:**
- Create: `src/app/api/ndas/[draftId]/archive/route.ts`

**Interfaces:**
- Consumes: `canArchiveNda` from `@/lib/ndaLifecycle`; `getActiveOrganization`, `canSendNDA`.
- Produces: `POST /api/ndas/[draftId]/archive` accepting `{ archived: boolean }`, returns `{ success: true, archivedAt: string | null }`.

- [ ] **Step 1: Write the route**

Create `src/app/api/ndas/[draftId]/archive/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { canSendNDA } from '@/lib/organizationRoles'
import { canArchiveNda } from '@/lib/ndaLifecycle'

/**
 * POST /api/ndas/[draftId]/archive
 * Body: { archived: boolean }
 * Moves a finalized (signed/complete) NDA into — or out of — the dashboard
 * Archived list by toggling `archivedAt`. Archiving is non-destructive, so any
 * member who can send (all roles) may do it. Only finalized NDAs are eligible.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = await params

    const user = await prisma.user.findUnique({ where: { externalId: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) {
      return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
    }
    if (!canSendNDA(activeMembership)) {
      return NextResponse.json({ error: 'You do not have permission to archive NDAs.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const archived = body?.archived === true

    const draft = await prisma.ndaDraft.findFirst({
      where: { id: draftId, organizationId: activeMembership.organizationId },
    })
    if (!draft) {
      return NextResponse.json({ error: 'NDA not found or unauthorized' }, { status: 404 })
    }

    if (!canArchiveNda({ status: draft.status, workflowState: draft.workflowState })) {
      return NextResponse.json({ error: 'Only finalized NDAs can be archived.' }, { status: 409 })
    }

    const archivedAt = archived ? new Date() : null
    await prisma.ndaDraft.update({
      where: { id: draftId, organizationId: activeMembership.organizationId },
      data: { archivedAt },
    })

    return NextResponse.json({ success: true, archivedAt: archivedAt?.toISOString() ?? null })
  } catch (error) {
    console.error('Archive NDA error:', error)
    return NextResponse.json({ error: 'Failed to archive NDA' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ndas/[draftId]/archive/route.ts
git commit -m "feat: add NDA archive/unarchive route"
```

---

### Task 6: Surface `archivedAt` from the dashboard loader

**Files:**
- Modify: `src/app/dashboard/page.tsx:88-122` (the `createdNdas` map)

**Interfaces:**
- Consumes: `isDraftExpired` from `@/lib/signLink`.
- Produces: each created NDA object gains `archivedAt: Date | null`; `expired` now computed via the shared helper.

- [ ] **Step 1: Add the import**

In `src/app/dashboard/page.tsx`, after the existing imports (line 6), add:

```ts
import { isDraftExpired } from '@/lib/signLink';
```

- [ ] **Step 2: Use the shared expiry helper**

In the `createdNdas` map, replace the inline `expired` computation (lines 97-105) with:

```ts
    // A sent NDA whose signing link has lapsed — the sender can resend or delete it.
    const expired = isDraftExpired(latestSignRequest?.signers);
```

- [ ] **Step 3: Return `archivedAt`**

In the same `return { ... }` object (after the `expired,` line at 120), add:

```ts
      archivedAt: draft.archivedAt ?? null,
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: pass archivedAt to dashboard and use shared expiry helper"
```

---

### Task 7: Dashboard UI — remove Cancel, add Delete/Archive/Archived list

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx`

**Interfaces:**
- Consumes: `canArchiveNda` from `@/lib/ndaLifecycle`; `archivedAt` on the `NDA` interface; `POST /api/ndas/[draftId]/archive`; `DELETE /api/ndas/drafts/[id]`.

- [ ] **Step 1: Update imports and the NDA interface**

Change the lucide import (line 5) — drop `X`, add `Archive` and `ArchiveRestore`:

```ts
import { Eye, Plus, FileText, Edit, Trash2, FileDown, CheckCircle, Search, RotateCw, Archive, ArchiveRestore } from 'lucide-react';
```

After the `canSignNDA` import (line 8), add:

```ts
import { canArchiveNda } from '@/lib/ndaLifecycle';
```

Add `archivedAt` to the `NDA` interface (after `expired?: boolean;`, line 31):

```ts
  archivedAt?: Date | string | null;
```

- [ ] **Step 2: Replace cancel state with archive state**

Change the filter state union (line 89) to include `'archived'`:

```ts
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'received' | 'signed' | 'action' | 'archived'>('all');
```

Replace the `cancellingId` state line (line 93) with:

```ts
  const [archivingId, setArchivingId] = useState<string | null>(null);
```

- [ ] **Step 3: Update `handleDelete` to take a hard-delete flag**

Replace the `handleDelete` signature and confirm block (lines 181-182) with:

```ts
  const handleDelete = async (id: string, name: string, hardDelete: boolean) => {
    const confirmMsg = hardDelete
      ? `Permanently delete "${name}"?\n\nThis removes the NDA and its audit trail from the database. This cannot be undone.`
      : `Are you sure you want to delete "${name}"? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;
```

(The rest of `handleDelete` — the `fetch(\`/api/ndas/drafts/${id}\`, { method: 'DELETE' })` body — stays unchanged.)

- [ ] **Step 4: Replace `handleCancel` with `handleArchive`**

Delete the entire `handleCancel` function (lines 209-235) and replace it with:

```ts
  const handleArchive = async (id: string, archived: boolean) => {
    setArchivingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/ndas/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update archive');
      }

      setLocalNdas(prev => prev.map(nda => (nda.id === id ? { ...nda, archivedAt: archived ? new Date().toISOString() : null } : nda)));
      setMessage({ type: 'success', text: archived ? 'NDA archived' : 'NDA moved back to your list' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Archive error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update archive',
      });
    } finally {
      setArchivingId(null);
    }
  };
```

- [ ] **Step 5: Remove `isCancellable`**

Delete the `isCancellable` function (lines 267-272).

- [ ] **Step 6: Exclude archived rows from filters and add the Archived filter**

In `filteredNdas`, immediately after the search-query block (after line 282, before `if (filter === 'all')`), add:

```ts
      const isArchived = nda.archivedAt != null;
      if (filter === 'archived') return isArchived;
      if (isArchived) return false; // archived rows are hidden from every other view
```

- [ ] **Step 7: Base stats on non-archived rows and add an archived count**

Replace the `stats` object (lines 305-312) with:

```ts
  const active = localNdas.filter((n) => n.archivedAt == null);
  const stats = {
    total: active.length,
    draft: active.filter((n) => n.status === 'draft' && n.type === 'created' && !actionRequired(n) && !isSigned(n)).length,
    sent: active.filter((n) => n.type === 'created' && (n.status === 'sent' || n.status === 'pending') && !actionRequired(n) && !isSigned(n)).length,
    received: active.filter((n) => n.type === 'received').length,
    signed: active.filter((n) => isSigned(n) && !actionRequired(n)).length,
    action: active.filter((n) => actionRequired(n)).length,
    archived: localNdas.filter((n) => n.archivedAt != null).length,
  };
```

- [ ] **Step 8: Add the Archived stat card**

Append to the `statCards` array (after the `signed` entry, line 327):

```ts
    { key: 'archived', label: 'Archived', count: stats.archived, iconColor: 'text-gray-500 bg-gray-100', countColor: 'text-ink' },
```

Add an entry to `statIcons` (after the `signed:` icon entry, line 352):

```ts
    archived: <Archive className="w-5 h-5" />,
```

Widen the stat-card grid (line 538) so seven cards fit:

```tsx
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 py-6">
```

- [ ] **Step 9: Wire the draft Delete button to the new signature**

In `renderActions`, the draft-block Delete button `onClick` (line 380) becomes:

```tsx
            onClick={() => handleDelete(nda.id, nda.partyName, false)}
```

- [ ] **Step 10: Replace the Cancel button block with Delete + Archive actions**

Delete the entire `{/* In-flight: Cancel */}` block (lines 485-495) and replace it with:

```tsx
      {/* Expired or legacy-cancelled created NDA: hard delete (dashboard + DB) */}
      {nda.type === 'created' && (nda.expired || nda.status === 'cancelled') && (
        <button
          onClick={() => handleDelete(nda.id, nda.partyName, true)}
          disabled={deletingId === nda.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 bg-white hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deletingId === nda.id ? 'Deleting...' : 'Delete'}
        </button>
      )}

      {/* Finalized created NDA: archive / unarchive */}
      {nda.type === 'created' && canArchiveNda({ status: nda.status, workflowState: nda.workflowState }) && (
        nda.archivedAt ? (
          <button
            onClick={() => handleArchive(nda.id, false)}
            disabled={archivingId === nda.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArchiveRestore className="w-3.5 h-3.5" />
            {archivingId === nda.id ? 'Restoring...' : 'Unarchive'}
          </button>
        ) : (
          <button
            onClick={() => handleArchive(nda.id, true)}
            disabled={archivingId === nda.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Archive className="w-3.5 h-3.5" />
            {archivingId === nda.id ? 'Archiving...' : 'Archive'}
          </button>
        )
      )}
```

- [ ] **Step 11: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. In particular, no remaining references to `X`, `cancellingId`, `handleCancel`, or `isCancellable`.

- [ ] **Step 12: Manual smoke check**

Start the dev server (`npm run dev`) and open `/dashboard`. Verify:
- An in-flight NDA shows no Cancel button.
- An expired NDA shows Resend and Delete; Delete pops the permanent-deletion confirm.
- A signed NDA shows View PDF and Archive; clicking Archive removes it from the main list.
- The Archived stat card shows the archived NDA with View PDF and Unarchive; Unarchive returns it.

- [ ] **Step 13: Commit**

```bash
git add src/components/dashboard/DashboardClient.tsx
git commit -m "feat: replace NDA cancel with expire-delete and archive on dashboard"
```

---

### Task 8: Remove the cancel route and sync Formi

**Files:**
- Delete: `src/app/api/ndas/[draftId]/cancel/route.ts` (and the now-empty `cancel` folder)
- Modify: `src/ai/prompts/formi_systemPrompt.ts`

**Interfaces:**
- Consumes: nothing.

- [ ] **Step 1: Confirm nothing still references the cancel endpoint**

Run: `git grep -n "ndas/.*cancel\|/cancel'" -- src` and `git grep -n "isCancellable\|handleCancel" -- src`
Expected: no matches (Task 7 removed the client usage). Billing routes under `src/app/api/billing/cancel` are unrelated and should NOT appear from the first pattern.

- [ ] **Step 2: Delete the cancel route**

```bash
git rm src/app/api/ndas/[draftId]/cancel/route.ts
```

- [ ] **Step 3: Add the delete/archive facts to Formi**

In `src/ai/prompts/formi_systemPrompt.ts`, after the `# Document status flow` section (after line 65), insert:

```ts

# Managing NDAs on the dashboard
There is no "cancel". An in-progress NDA simply runs until its signing link lapses (2 weeks of inactivity). Once a link has expired, the sender can either resend a fresh link or delete the NDA from the dashboard — deleting removes it permanently, including its audit trail. Finalized (signed) NDAs are always kept: they can't be deleted, but they can be archived into an "Archived" list on the dashboard and unarchived back at any time. Drafts (never sent) can be deleted at any time.
```

- [ ] **Step 4: Re-read Formi's prompt and verify accuracy**

Read `src/ai/prompts/formi_systemPrompt.ts` and confirm the new section matches the shipped behavior (no cancel; expired→resend/delete; finalized→archive/unarchive; drafts deletable) and does not contradict the existing "# Signing & evidence" note about resending expired links.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (no dangling import of the deleted route).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ndas src/ai/prompts/formi_systemPrompt.ts
git commit -m "feat: remove NDA cancel route and sync Formi knowledge"
```

---

### Task 9: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: PASS, including the new `ndaLifecycle` and expanded `signLink` suites.

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint (if the project lints in CI)**

Run: `npm run lint`
Expected: no new errors in touched files.

- [ ] **Step 4: Final commit (if lint auto-fixed anything)**

```bash
git add -A
git commit -m "chore: lint pass for cancel-removal/archive feature" || echo "nothing to commit"
```

---

## Self-Review notes

- **Spec coverage:** cancellation removal (Tasks 7, 8), expired-only delete with confirm (Tasks 3, 4, 7 step 3/10), drafts still deletable (Task 7 step 9), finalized kept + archive/unarchive (Tasks 1, 5, 7), Archived list/filter (Task 7 steps 6-8, 10), legacy CANCELLED kept + deletable (Task 3 test + Task 7 step 10), shared expiry predicate (Task 2, used in Tasks 4 & 6), received-NDA archive excluded (`type === 'created'` guards in Task 7), Formi sync (Task 8), enum values retained (Global Constraints, never touched). Covered.
- **Type consistency:** `canArchiveNda`/`canHardDeleteNda`/`isNdaFinalized` signatures match between definition (Task 3) and use (Tasks 4, 5, 7). `isDraftExpired` signature matches between definition (Task 2) and use (Tasks 4, 6). `handleDelete(id, name, hardDelete)` and `handleArchive(id, archived)` are called with matching arity in Task 7.
- **Placeholder scan:** no TBD/TODO; every code step shows full code.
