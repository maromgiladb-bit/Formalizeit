# Phase 1 — Finish the negotiation loop

**Owner: Claude.** The one genuine code blocker. Commit `a6efe30` shipped a server implemented
against clients that were only half-converted.

> **CODE COMPLETE 2026-09-22.** All seven sub-tasks implemented. `tsc --noEmit` clean,
> `vitest run` 123/123 (up from 100), `npm run build` succeeds with the TypeScript gate on.
> **Manual browser verification is still outstanding** — see the matrix at the bottom. Nothing
> here is proven until that is done.

## The design decision underneath it

**`draft.content` is the *agreed* document.** Only accepted values and requested fills land
there. Counters and fresh suggestions live only in the revision's `suggestedChanges`, and enter the
document when the other side accepts. The pending set for a reviewer is therefore exactly the
newest revision's `suggestedChanges` (see 1.7) — no value-diffing against content, which used to
hide a counter that happened to equal the agreed value.

The rejected alternative was writing counters into content and replacing the differ with revision
provenance. Larger blast radius, changes what both parties see in the live preview mid-negotiation,
and lets an unaccepted counter sit in the signed document if a round is abandoned.

---

## 1.1 ☑ Pure logic — `src/lib/negotiation.ts`

- [x] `normalizeResponses()` — downgrade `{action:'countered', counterValue: ''|undefined|blank}`
      to `rejected`. Both UIs can produce one; neither checks for emptiness.
- [x] `applyNegotiationRound(input)` → `{ newContent, appliedFilledFields, outgoingSuggestions,
      hasFreshSuggestions, hasOpenItems, summary, fullyAccepted }`.

Rules, applied in this order:

1. Start from `currentContent`.
2. Apply `filledFields`, **skipping any field the reviewer rejected or countered.** Responses are
   authoritative: the client sweeps dirtied values into `filledFields` regardless of the response.
3. `accepted` → take the server-known incoming suggestion first, then the client value, then the
   current value. Preferring the server value stops a tampered client accepting a value that was
   never offered.
4. `rejected` → revert to the pre-round value.
5. `countered` → leave content at the pre-round value; the counter is an offer, not an edit.
6. Build `outgoingSuggestions` from counters, merge fresh `suggestedChanges` over them, then delete
   every rejected key **last**, so rejection wins over everything.
7. `hasFreshSuggestions` comes from `suggestedChanges` only and picks the email template.
   `hasOpenItems` comes from `outgoingSuggestions` and drives the state machine. **Do not collapse
   them** — a counter-only round would then get the wrong email.

No Prisma import in this file; it stays unit-testable in the node-env suite.

## 1.2 ☑ Shared persistence — `src/lib/negotiationRound.ts` (new)

- [x] `persistNegotiationRound()` — everything `submit-input/route.ts:127-182` does today,
      parameterised by an actor that is either a signer or an authenticated user, because audit
      attribution differs (`signerId` vs `userId`).
- [x] Writes the revision, updates draft and sign request, writes the audit event, refreshes
      sign-link expiry.
- [x] **Do not rename revision content keys.** Both reviewer UIs read `suggestedChanges`,
      `filledFields` and `submittedBy`. Store `appliedFilledFields` under the existing
      `filledFields` key, so rejected fields cannot resurface as suggestions via
      `fillndahtml-public/page.tsx:163-166`.
- [x] Emails stay in the routes; they differ per caller and direction.

## 1.3 ☑ Public endpoint — `src/app/api/ndas/submit-input/route.ts`

- [x] Include the latest revision in the signer query.
- [x] Derive incoming suggestions from it only when `submittedBy !== signer.email`.
- [x] Replace the merge block (62-76) and state block (84-125) with one `applyNegotiationRound()`.
- [x] Keep the `_ask_receiver` flag clearing, but apply it to the applied fields, not the raw ones.
- [x] Switch the email-template choice at line 266 to `hasFreshSuggestions`.
- [x] Response shape must keep `newWorkflowState`, `revisionId`, `redirectUrl`.

## 1.4 ☑ Wire the authenticated sender page

**Server** — `src/app/api/ndas/approve-changes/route.ts`:

- [x] Accept `suggestionResponses`, `counterValues`, `filledFields`; call the shared service.
- [x] Relax the guard from `canSignNDA` to `canContributeToDrafts`. `CLAUDE.md` is explicit that
      the only thing a contributor cannot do is apply the signature, and accepting or countering
      terms is not signing. Signing stays gated at `sign-public/route.ts:108` and on the sign page.
      Relax `request-changes/route.ts:42` the same way.
- [x] When not fully accepted: reset the Party B signer to `PENDING` and send
      `negotiationReviewEmailHtml` with their `fillndahtml-public` link.
- [x] Audit `CHANGES_ACCEPTED` when fully accepted, `CHANGES_REQUESTED` otherwise. Confirm both
      exist in the Prisma enum first.

**Do not** instead ship the Party A signer token into the dashboard page. That token is a permanent
bearer credential currently confined to one inbox; routing an authed action through the public
endpoint would bypass org-membership authorization and misattribute every audit event.

**Client** — `src/app/fillndahtml/page.tsx`:

- [x] Rename `approveChanges()` (line 1187) to `submitReviewResponse()`; build the payload the way
      `FillNDAPublicClient.tsx:344-351` does.
- [x] Block submission while `getPendingSuggestionsCount() > 0` (helper exists at line 752).
      Without this, "Accept Changes" still accepts nothing.
- [x] Take the new state from the response instead of hardcoding `AWAITING_PARTY_A_SIGNATURE`;
      clear responses and counters, then reload the draft.
- [x] Label the button "Send Response" when any response is not an acceptance.
- [x] Leave `requestChanges()` alone. It is an orthogonal free-text channel.

## 1.5 ☑ Align the sign gate — must ship with its companion fix

- [x] `src/app/sign-nda-public/[token]/page.tsx:166-172` — narrow `canSign` to the two signature
      states only, matching the 409 blocklist already in `sign-public/route.ts:123`.
- [x] Extend the fallback at 174-210 with a call-to-action back to
      `/fillndahtml-public/{signer.id}` so neither party is dead-ended.
- [x] **Companion, same change:** `FillNDAPublicClient.tsx:327-397`. `handleProceedToSign` posts
      first on the Party A branch, but Party B falls through to a bare router push with no post.
      Give Party B the same post-then-follow-`redirectUrl` path.

That companion is also a **live data-loss bug today**: a Party B who only accepts counters trips
`hasPartyBMadeChanges()` returning false, the button enables, and their acceptances are silently
discarded on the way to signing.

## 1.7 ☑ The newest counter is always what the other party sees (added 2026-09-22)

Product requirement stated by the founder: **the receiving party must see the latest counter,
never a stale one, and never nothing.** Three things violated that:

- [x] **Public review page value-diffed proposals against `draft.content`.** A counter that
      re-proposed the agreed value ("no, keep 12 months") was filtered out, so the other party saw
      no pending item and could sign without ever learning their request was refused. Replaced
      with `pendingSuggestionsFromRevision()` in `src/lib/negotiation.ts`: the pending set is
      exactly the newest revision's `suggestedChanges`, minus your own submission. No diff.
- [x] **"Send Back with Changes" did not require every incoming counter to be answered.** A round
      only carries forward what was countered, so answering one of three and sending back silently
      dropped the other two from the negotiation for good. The public client now blocks send-back
      until every incoming item has a response, mirroring the dashboard.
- [x] **Dashboard kept the previous round on screen after Party A responded.** `loadDraft` only
      assigned `incomingSuggestions` when the latest revision was Party B's, so after A's own
      response the old proposals stayed visible with their buttons reset. Now always reassigned.

Also: both routes now derive `incomingSuggestions` from the same helper the review page uses, so
what is shown equals what the server will resolve an acceptance against. `approve-changes` keys off
`lastEditedBy === 'party_b'` like the dashboard does, rather than the viewer's email, so a teammate
accepting on the owner's behalf resolves correctly. The public client shows a "latest response"
banner with the submission time and how many items still need an answer.

Tests: 7 new cases, including a four-round B→A→B→A walk asserting that each side is shown exactly
the newest number and never their own.

## 1.6 ☑ Phone validation

- [x] Wire the already-written, already-tested `isValidPhone()` on blur and in `validate()` for
      both phone fields in `src/app/fillndahtml/page.tsx`.
- [x] Use the existing `validationErrors` Set and `getFieldClass()` pattern; the current inputs
      hardcode their className so the error state cannot render.
- [x] The empty string is valid, so the field stays optional. Keep format errors out of the
      "required field(s)" message.

---

## Tests

New cases in `src/lib/negotiation.test.ts` (pure, node env, no React testing library needed):

- [x] countered with blank/missing counter normalizes to rejected
- [x] accepted prefers the server's incoming suggestion over a disagreeing client value
- [x] rejected reverts content **and** is absent from outgoing suggestions
- [x] rejected wins over a same-field entry in `filledFields` and in `suggestedChanges`
- [x] countered leaves content unchanged and puts the trimmed counter in outgoing suggestions
- [x] a fresh suggestion overrides a counter on the same field
- [x] `appliedFilledFields` excludes every rejected and countered field
- [x] counter-only round: `hasFreshSuggestions` false, `hasOpenItems` true, `fullyAccepted` false
- [x] unrelated keys in `currentContent` survive untouched

## Manual verification

- [ ] **Happy-path regression, guard this hardest:** send → counterparty fills only the requested
      fields → auto-advance to their signature → both sign → PDF generated and emailed.
- [ ] B suggests → A's emailed link actually shows the suggestion (today it shows nothing when
      combined with filled fields).
- [ ] A counters → B sees it as pending with the right old value, preview still shows the original
      → B accepts → document now shows the countered value → signs.
- [ ] A rejects one and accepts another → B sees no suggestion for the rejected field.
- [ ] Dashboard path: A accepts all from `/fillndahtml?draftId=…` → content really updated,
      revision written, B emailed, state advanced.
- [ ] Same as a CONTRIBUTOR: accept/counter works, but the sign page still refuses them.
- [ ] Sign gate in each review state, as each party → correct message and a working way back.
- [ ] Two full round trips (A counters → B counters back → A accepts) with no party ever shown
      their own prior suggestions, and each side's page showing the **newest** number in the
      "latest response" banner.
- [ ] A counters with the value already in the document ("keep 12") → B still sees it as pending.
- [ ] A proposes three, B answers one and clicks Send Back → blocked with the two field names.
- [ ] A responds on the dashboard → after reload, no stale Party B proposals remain on screen.
- [ ] Phone: `123` + blur → inline error and red border; correcting it clears; send is blocked.

## Risks

- 1.5 and its companion must land together or Party B is dead-ended.
- The guard relaxation in 1.4 widens permissions. It matches the documented role model but is a
  deliberate product call.
- Counters stop appearing in the sender's own live preview until accepted. Correct, but visible.
- Leave the dead `'AWAITING_INPUT'` comparisons alone. If any production row still carries that
  value, removing them would start rejecting live NDAs.
- `fillndahtml/page.tsx` is ~2,880 lines and `FillNDAPublicClient.tsx` ~1,319. Every edit here is
  surgical. Do not refactor either file as part of this work.
