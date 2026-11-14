# Phase 3 — Cleanup and doc reconciliation

**Owner: Claude.** Small, low-risk, worth doing before strangers see the product.

---

## 3.1 ☑ Reconcile the stale strategy documents

Done 2026-09-20. Both `docs/strategy-implementation-roadmap.md` and
`docs/strategy-gap-checklist.md` were reporting shipped features as open work, which is actively
misleading for anyone picking the project back up. Each now carries a dated reconciliation header
and ticks what is genuinely built. See `docs/launch/README.md` for the live worklist.

## 3.2 ☑ Comments route authorization — deleted 2026-09-25 (no callers; any signed-in user could read/write any revision's content)

- [ ] `src/app/api/revisions/[revisionId]/comments/route.ts:46` carries
      `// Verify authorization (TODO: add proper token-based auth for recipient)` on a
      recipient-facing route. Close it properly or delete the route if nothing uses it.

## 3.3 ☑ Dead API call — removed the fetch and its unused suggestion state 2026-09-25 (no UI rendered it)

- [ ] `src/app/fillndahtml/page.tsx:438` fetches `/api/ndas/email-suggestions`, which does not
      exist. It 404s on every keystroke, swallowed by a `catch`, so the autocomplete dropdown never
      populates. Either build the route or remove the call and its UI.

## 3.4 ☑ Orphaned viewpdf route — deleted `src/app/viewpdf/page.tsx` and `POST /api/ndas/send` 2026-09-25

- [ ] `src/app/viewpdf/page.tsx` sits at a non-dynamic route but reads `useParams().id`, so it can
      never load a draft. Nothing links to it; `/mydrafts` links `/viewpdf/{id}`, which is a
      different, working page. It is also the only caller of `POST /api/ndas/send`.
- [ ] Delete both, or fix the route. **Do not touch `/viewpdf/[id]` or `/api/ndas/viewpdf`** —
      those are live and used by the dashboard and by completion emails.

## 3.5 ☑ Formi sync — done 2026-09-25 (status flow clarified, "14 days", 2FA marked not available)

The keep-Formi-in-sync rule makes an out-of-date Formi answer a bug in the change that caused it.
The negotiation work in Phase 1 triggers it.

- [ ] `src/ai/prompts/formi_systemPrompt.ts:69` still states the flat `draft → sent → signed` model
      with "there is no internal approval step", three lines above a section describing the
      accept/reject/counter loop. The prompt contradicts itself.
- [ ] Its "Signing & evidence" section says signing links expire after "2 weeks"; the code and all
      email copy now say "14 days".
- [ ] After editing, re-read the prompt and confirm roles, routes, workflow and feature copy match
      reality.

## 3.6 ⊘ Duplicate template managers — checked 2026-09-25: BOTH are live (`template-manager` ← fill-template, template-config; `templateManager` ← templates API, changelog, renderNdaHtml, signatureEvidence). Merge post-launch.

- [ ] `src/lib/template-manager.ts` and `src/lib/templateManager.ts` both exist. Identify which is
      live, add a comment on the dead one. **Defer the actual merge** — not launch work.

## 3.7 ☑ Minor copy leftovers — dev link removed; non-functional Settings "Preferences" card removed 2026-09-25 (templates copy left as-is by your July call)

Cosmetic, ship-blocking for nobody, but each is visible to a first customer.

- [ ] `src/app/settings/page.tsx:132` — "(Coming Soon)" on an org-managed setting.
- [ ] `src/app/templates/page.tsx:192` — "More Templates Coming Soon". Per `CLAUDE.md`, one
      standard NDA *is* the MVP product; the page reads marketplace-y. Left as-is by your call in
      July. Revisit only if it confuses early users.
- [ ] `src/components/PrivateToolbar.tsx` devLinks still reference `design_mutual_nda_v1`, a
      template that does not exist in `template-config.json`. Dev-gated, harmless.
