# NDA Communication Flow — Party A ↔ Party B

Read this file at the start of any task touching email sending, workflow state transitions, or the Party A / Party B review-and-sign experience.

---

## 1. Overview

Party A (the org member who created the NDA) drives the flow. Party B (the external counterparty) receives emails with tokenized links. The `Signer.id` UUID is the token embedded in all public URLs. No auth is required for Party B — the token is the credential.

The system supports a full back-and-forth negotiation loop: B can suggest changes, A can accept, reject, or counter, and so on until both parties agree on the final text. Then both sign.

---

## 2. Party A Roles — Who Can Send vs Sign?

All org members (Owner, Signer, Contributor) can create, edit, and **send** NDAs to Party B — for review, input, or signature. There is **no** internal approval step.

**Signer, or Owner with isApprover=true** — can additionally **sign on behalf of the org**.

**Contributor, or Owner with isApprover=false** — can do everything **except** apply the company's signature.

Guard functions in `src/lib/organizationRoles.ts`: `canSendNDA(membership)` (true for all roles) and `canSignNDA(membership)` (signers / owner-with-isApprover only).

---

## 3. Full State Machine

```
DRAFT
  │
  ├─ [Any role] send to Party B for review:
  │   • send-for-review → AWAITING_PARTY_B_REVIEW
  │   • send-for-input  → AWAITING_PARTY_B_REVIEW  (specific pending fields only)
  │
  ↓
AWAITING_PARTY_B_REVIEW
  │  Party B visits /fillndahtml-public/{signerId}
  │  Submits via POST /api/ndas/submit-input
  │
  ├─ B has suggestions → AWAITING_PARTY_A_REVIEW
  │       │  Party A visits /fillndahtml-public/{partyA_signerId}
  │       │  Reviews each suggestion: accept / reject / counter
  │       │
  │       ├─ A has counters → AWAITING_PARTY_B_REVIEW  (loop continues)
  │       └─ A approves all → AWAITING_PARTY_A_SIGNATURE
  │                               ↓  Party A signs (dashboard /sign-nda or public link)
  │                          AWAITING_PARTY_B_SIGNATURE
  │                               ↓  Party B signs (/sign-nda-public/{signerId})
  │                             COMPLETE ✓
  │
  └─ B submits with no suggestions → AWAITING_PARTY_B_SIGNATURE
              ↓  Party B signs
         AWAITING_PARTY_A_SIGNATURE
              ↓  Party A signs
           COMPLETE ✓

[Alternative — Party A signs first, sends B the sign link in one action]
  send-for-signature (requires Party A's signatureImage in request body)
  → AWAITING_PARTY_B_SIGNATURE
  Party B gets sign link → signs → COMPLETE ✓
  ⚠ Only valid after review is complete. Party A's signature is embedded in formData
    as part of this single request; it is not a "skip review" shortcut.
```

---

## 4. Email Sent at Each Transition

| Trigger | API Route | Email Template | Recipient |
|---------|-----------|----------------|-----------|
| Send for review | `send-for-review` | `recipientEditEmailHtml` | Party B |
| Send for input (fields) | `send-for-input` | `inputRequestEmailHtml` | Party B |
| Party A signs + sends | `send-for-signature` | `recipientSignRequestEmailHtml` | Party B |
| Party B suggests changes | `submit-input` (B, has suggestions) | `partyBSuggestionsEmailHtml` | Party A |
| Party B submits, no changes | `submit-input` (B, no suggestions) | `recipientInputSubmittedEmailHtml` | Party A |
| Party A counters B | `submit-input` (A, has counters) | `ownerReviewEmailHtml` | Party B |
| Party A requests changes | `request-changes` | `partyARequestChangesEmailHtml` | Party B |
| One party signs, other pending | `sign` / `sign-public` | `timeToSignEmailHtml` | Other party |
| Both parties signed | `sign` / `sign-public` | `congratulationsEmailHtml` + PDF attachment | Both parties |

All email functions live in `src/lib/email.ts`. Sender address is `MAIL_FROM` env var. Service: Resend.

---

## 5. Public Links

| Purpose | URL pattern | Sent when |
|---------|-------------|-----------|
| Review, fill fields, suggest changes | `/fillndahtml-public/{signerId}` | send-for-review, send-for-input, request-changes |
| Sign only | `/sign-nda-public/{signerId}` | send-for-signature, timeToSign email |

Party A also receives a `/fillndahtml-public/{partyA_signerId}` link (via `partyBSuggestionsEmailHtml`) when Party B submits suggestions — so A can review without opening the dashboard.

`signerId` is the `Signer.id` UUID. `role=SIGNER` → Party B. `role=SENDER` → Party A.

---

## 6. Key Files

| File | What it does |
|------|--------------|
| `src/lib/email.ts` | All email template functions + `sendEmail()` |
| `src/app/api/ndas/submit-input/route.ts` | Core bilateral state machine (B submits → A reviews → loop) |
| `src/app/api/ndas/send-for-review/route.ts` | Creates Signer token, transitions to AWAITING_PARTY_B_REVIEW |
| `src/app/api/ndas/send-for-input/route.ts` | Same as above but sets `pendingInputFields` |
| `src/app/api/ndas/send-for-signature/route.ts` | Party A signs + sends B the sign link in one action |
| `src/app/api/ndas/sign/route.ts` | Authenticated Party A signs from dashboard |
| `src/app/api/ndas/sign-public/route.ts` | Public signature submission, PDF generation, COMPLETE transition |
| `src/app/api/ndas/approve-changes/route.ts` | A approves B suggestions → AWAITING_PARTY_A_SIGNATURE |
| `src/app/api/ndas/request-changes/route.ts` | A sends B back for revision → AWAITING_PARTY_B_REVIEW |
| `src/app/fillndahtml-public/[token]/page.tsx` | Party B (and A) review/fill/suggest UI |
| `src/app/sign-nda-public/[token]/page.tsx` | Signature capture (type, draw, or upload) |
| `src/lib/linkSignerToUser.ts` | Associates Party B's Signer record to a registered User account post-signing |
| `prisma/schema.prisma` | NdaDraft, Signer, NdaRevision, SignRequest, AuditEvent models |

---

## 7. Data Model Quick Reference

- **`NdaDraft.workflowState`** — the primary state machine field (enum `NdaWorkflowState`)
- **`Signer.id`** — UUID used as the token in all public URLs
- **`Signer.role`** — `SIGNER` = Party B, `SENDER` = Party A
- **`NdaRevision.content`** — stores `filledFields`, `suggestedChanges`, `suggestionResponses` per negotiation round
- **`NdaDraft.pendingInputFields`** — JSON array of field names Party A asked B to fill
- **`NdaDraft.lastEditedBy`** — `"party_a"` or `"party_b"`, tracks who last touched the draft

Suggestion responses per field:
```json
{ "action": "accepted" | "rejected" | "countered", "counterValue": "..." }
```
