# Legal and compliance readiness plan (2026-10-23)

Source: five parallel research reviews (e-signature regulation, data breach and privacy, platform
liability, site and copy audit, other launch items). Raw reports are not committed; findings are
summarised here. **None of this is legal advice.** Items tagged [counsel] need a lawyer or
accountant; items tagged [VERIFY] came from model background knowledge, not a source, and must be
checked before relying on them.

Facts: the company is in Israel (Terms s.13: Israeli law, Tel Aviv courts). Infrastructure is in
Frankfurt (`fra1`); US processors are Clerk, Stripe and Resend. FormalizeIt supplies a system and a
fixed NDA text; the NDA is between the two companies.

## Where we stand

Holds up: all 7 legal pages exist and are linked everywhere; "not legal advice" is on the fill,
receiver-fill and sign pages; no SOC 2, "guaranteed" or "legally binding" claims; retention,
reminder and signature-evidence claims match the code; private S3 with 5-minute presigned URLs;
122-bit expiring link tokens; default-protect middleware. A simple e-signature is valid in the US
(ESIGN/UETA), EU (eIDAS Art. 25), UK and Israel, and the B2B flow avoids ESIGN consumer rules.

Not covered: provable acceptance of the Terms, the legal entity, a breach plan, a DPA, liability
wording, tax, and receiver-facing disclosures.

## Tier 1 - launch blockers

### Code and copy (Claude can do)

1. **Terms and Privacy acceptance, recorded.** Sign-up only embeds Clerk `<SignUp>`
   (`src/app/signup/page.tsx`). Turn on Clerk legal acceptance and store accepted version and
   timestamp in the DB. Add a Terms/Privacy checkbox for receivers on the public fill and sign pages,
   stored with the signature evidence.
2. **E-signature consent at the signing action.** Add a recorded "I consent to sign electronically"
   line linking the E-Signature Consent, Standard NDA and Terms, placed above the Submit button. Move
   the disclaimer above Submit. Add the same disclaimer to `view-nda`.
3. **Strengthen the disclaimer** (`legal-disclaimer.tsx`): FormalizeIt is not a party, does not verify
   signers or authority, does not monitor or enforce the NDA, no attorney-client relationship, and
   "consider a lawyer" without the "high-stakes" qualifier. Add a receiver-facing "not a party" line.
4. **Fix the Terms** (`src/app/terms/page.tsx`), drafts are in the liability report for counsel:
   - add a retention section (E-Sign Consent s.5 points at one that does not exist);
   - add: no attorney-client relationship, we never select terms, user responsibility for who they
     send to, no monitoring or enforcement, disputes between users, force majeure, business-only use,
     acceptable use and abuse contact, 18+, sanctions, shutdown/data-return, legal-process requests;
   - state it is a simple electronic signature (not eIDAS qualified/advanced, not an Israeli
     "secure" signature) and name ESIGN, UETA, eIDAS and the Israeli Electronic Signature Law 2001;
   - liability: carve out fraud, intent, gross negligence and confidentiality breach; fix the cap for
     free users; make the indemnity mutual and narrower [counsel: Standard Contracts Law 1982];
   - refunds: replace "no refunds" with wording that respects consumer cancellation rights
     [counsel];
   - guidance that users choose governing law with counsel's input;
   - bring the Terms date (June 11) in line with Privacy (Oct 8).
5. **Fix Privacy** (`src/app/privacy/page.tsx`): name the controller/processor roles, receiver data,
   legal bases, transfer mechanism (replace "you consent" with DPF/SCCs once confirmed), Google as a
   sub-processor, cookies by name (Stripe, `active-org-id`, Clerk), incident contact.
6. **Emails** (`src/lib/email.ts:112`): footer with entity, address, disclaimer, Terms/Privacy links;
   "stop reminders" link on reminder emails to non-users; keep them strictly transactional.
7. **NDA template v1.1** (`templates/professional_mutual_nda_v1.hbs`, log in
   `src/lib/ndaChangelog.ts`, mirror on `/standard-nda`) [counsel first]: make "Mutual" truly mutual,
   add a remedies/injunctive-relief clause, a survival clause, fix the compelled-disclosure carve-out,
   separate governing law from forum, add an authority representation. Existing signed NDAs keep
   their snapshot.
8. **Contradictions and bugs from the site audit:** settings copy says signed NDAs are kept 30 days
   while Privacy says 5 years; last-administrator deletion bug (tracker H4); `sign-public` logs
   recipient emails and signing links, so remove them.
9. **Overclaims:** "100% audit-trailed" (`src/app/page.tsx:305`), "Secure by default", "that review
   holds forever" (`src/app/about/page.tsx:28`), Pro "Full audit trail", "legally ready" in taglines
   (keep the brand line "NDA in minutes", soften the sufficiency claims), NDA Governance's
   version-acknowledgement claim for receivers.
10. **Missing pages:** accessibility statement (Israel IS 5568; also add a skip link), sub-processor
    list, `security.txt` plus a vulnerability-disclosure note.

### You (not code)

11. **Legal entity.** Confirm the business runs through an Israeli Ltd. (or register one) and put its
    name, registration number, address and contact on Terms, Privacy, footer, contact page, emails
    and Stripe. Stripe activation needs it. [counsel/accountant]
12. **Tax and invoicing** before Stripe goes live: Israeli VAT 18%, B2B reverse charge, 0% on exports
    of services, and Israeli tax invoices (Stripe invoices alone are not enough). Decide on Stripe Tax
    and tax-ID collection. Show "USD, excl. VAT" on prices. [accountant] [VERIFY thresholds]
13. **Auto-renewal and cancellation:** consent line in the checkout modal, a real refund policy,
    renewal reminder, easy cancel. [counsel]
14. **Counsel review** of the 7 legal pages and the NDA template, using
    `docs/launch/legal-review-brief.md`. Add to the brief: Israeli Bar Association Law (is a fixed
    template service the practice of law?), Standard Contracts Law 1982, Amendment 13, indemnity and
    liability cap, receiver data bases. If review will not finish before launch, launch with the
    softened claims in item 9 and the beta framing kept.
15. **Cyber and tech E&O insurance** quote.
16. **Breach-response plan** (short runbook): who decides, how to contain, the Privacy Protection
    Authority notice ("immediately" for a severe incident under the 2017 regulations), GDPR Art. 33
    (72 hours) where it applies, customer notice template, contact address. Draft by Claude, you
    approve.
17. **Vendor settings to verify and record:** S3 Block Public Access, default encryption (or set
    ServerSideEncryption in `src/lib/s3.ts`), versioning, access logs, CloudTrail, IAM scope; signed
    DPAs with Vercel, AWS, Clerk, Resend, Stripe, Neon; Sentry region and IP scrubbing.
18. **Backups:** Neon is on the Free plan. Upgrade, confirm point-in-time restore, turn on S3
    versioning, run one restore drill.

## Tier 2 - first month

- DPA template for business customers (we are likely the processor for NDA contents) and a
  data-protection section in the Terms.
- 2FA: the project notes say it is in MVP scope, but the breach review found it deferred (needs Clerk
  Pro). Account takeover is the most realistic leak path, so upgrade Clerk and enable it, or confirm
  the current status. Restore the 2FA copy once on.
- CSP and explicit HSTS headers; replace the in-memory rate limiter with a Vercel Firewall rule
  (already tracked).
- Retention bug M3 (`NdaRevision` content left behind after deletion); add a legal-hold flag to the
  retention cron; "download all my data" export; legal-process (subpoena) policy.
- Israeli database registration and DPO question after Amendment 13 [counsel] [VERIFY]; GDPR Art. 27
  EU-representative question [counsel] [VERIFY].
- Status page, support process (the 24h reply promise on the Support page must be real), trademark
  search, `/plans` removed from the sitemap, 404/error pages that work signed-out, "FormalizeIt"
  spelling in emails and the sign-in heading.

## Before re-enabling Formi

Add Google to the sub-processor list, add an AI notice (EU AI Act Art. 50 applies from Aug 2026),
review Gemini data terms, and have counsel review the prompt. Sending confidential NDA content to a
third-party model needs explicit disclosure.

## No action needed

- Google OAuth: sign-in uses basic scopes only, no restricted-scope review. The share menu uses
  mailto and compose links.
- Cookie banner: not needed while only strictly necessary cookies are set. Add the cookie paragraph
  to Privacy (item 5).

## What the platform cannot be made risk-free from

If a party breaches an NDA, or a court finds the NDA inadequate, the strongest protection is the
combination of: provable Terms acceptance by both senders and receivers, clear not-a-party and
no-legal-advice wording, an enforceable (carved-out) liability cap, a sound entity, and insurance.
No wording eliminates the risk.

## Suggested order

1. This week: items 1-3, 8, 9 (small, high impact); start 11, 12 and 14 (long lead times).
2. Next: items 4-7 and 10 once counsel has returned comments, so the wording is edited once.
3. In parallel: 15-18.
4. Re-run the site audit, then the Phase 4 flow test, then merge PR #18.
