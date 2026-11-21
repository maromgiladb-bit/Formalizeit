# Landing page copy deck (merged home + About)

Date: 2026-11-21. Audience: logged-out visitors with no account. Sign-up is closed (free beta), so every primary CTA goes through `SignupButton` (request access). Tone: friendly, direct, energetic, zero jargon. Time win first, trust second. No prices, no stats beyond "< 5 min", no customers.

Source checks: share-message template in `src/app/api/ndas/send-for-review/route.ts`; status labels from `getWorkflowStatusInfo()`; evidence from `src/lib/signatureEvidence.ts`; fields from `templates/professional_mutual_nda_v1.hbs`.

---

## 1. Narrative (9 sections, one job each)

| # | Section | Job | Comes from |
|---|---|---|---|
| 1 | Hero | Promise the time win; show the doc filling in | home hero (keep `HeroSheet`) |
| 2 | The problem | Name the pain: same NDA, same loop, every deal | About #2 (OldWayDemo), trimmed |
| 3 | The idea | One standard, only the deal details change | About #3 + #1 (FanOutDemo / locked doc) |
| 4 | How it works | Fill, send link, they sign (no account) | home STEPS + About timeline 02/03 merged |
| 5 | Trust and evidence | Show what is recorded when it is signed | About timeline 04 + trust cards + home "Signature evidence" |
| 6 | Teams | Everyone moves the deal, a signer signs | About #6 |
| 7 | Pricing | Existing `PricingSection` (placeholder) | component |
| 8 | FAQ | Kill the last 4 objections | `faqs` indexes 1, 6, 9, 12 |
| 9 | Final CTA + disclaimer | One more ask, one disclaimer line | About #7 |

Cut entirely: the home 6-card Features grid (every card repeats sections 4-6); the 3-stat strip (fold "< 5 min" and "0 recipient accounts" into section 4 microcopy); About's "Known standard" card as standalone (folded into section 3); the "Review only the changes" step (not part of the core flow; redlining is covered in section 2); "signed in hours, not days" (unprovable); "Encrypted storage" as a headline claim (stays only in the FAQ answer).

Why FAQ 1, 6, 9, 12: 1 = how the receiver gets it (biggest worry: spam, accounts; also covers reminders); 6 = what is fixed vs fillable (the heart of the idea); 9 = what the signer confirms (honest evidence story); 12 = law firm (legal safety). Skipped 0 (hero does it), 2 (covered in section 4), 5 (covered in section 3), 13 (low value pre-signup). Current teaser uses 0, 2, 5, 13; replace.

---

## 2. Section copy

### 1. Hero (pick an alternate from section 3; default A)
- Hero visual alt: "The standard mutual NDA with party names, purpose and dates filling in while the legal text stays locked."
- Microcopy under CTAs: "Free beta. The other side never needs an account."
- Badge on doc: "Legal text locked" (existing)

### 2. The problem
(Revised 2026-11-21 by the founder: the platform still has back-and-forth; the win is that the
standard is reviewed once, not every deal. Don't claim "no redlines" or "no back-and-forth".)
- H2: No need to spend hours on NDAs.
- Sub: Today every NDA is a new document to read line by line, even when it says almost the same thing.
- Callout: With FormalizeIt you review the standard NDA once. After that, you only read what matters: the parties, dates and terms.
- Old way items (struck through on scroll): "their_NDA_v1.docx" / "read it all again" / "send it to legal" / "waiting on legal review" / "still not signed..."
- Visual alt: "Each new NDA read again from scratch and sent to legal, while it waits unsigned."

### 3. The idea
- H2: One standard NDA. Fill in only what's different.
- Sub: A balanced mutual NDA with the same legal text every time, so there is nothing new to read.
- Body items:
  1. **Same text, every deal.** Fixed wording; it only changes with a new published version.
  2. **Fair to both sides.** One mutual NDA, not pro-sender or pro-receiver.
  3. **You fill in the deal.** Parties, purpose, effective date, term, governing law, contacts, and one optional extra clause.
- Link label: "Read the standard NDA" (-> /standard-nda)
- Visual caption: "One text, many deals"
- Visual alt: "The same locked NDA text fanning out to three deals, each with its own company name and date."
- Fan-out sample rows (fictional): "Halden Bio, Jul 12, 2026" / "Globex GmbH, Aug 3, 2026" / "Initech Ltd., Sep 9, 2026"

### 4. How it works
- H2: Three steps. A few minutes.
- Sub: Fill in the deal, send a link, they sign. No account for the other side.
- Steps:
  1. **Fill in the deal.** Add the parties, purpose, dates and term. The legal text is already done.
  2. **Send the link.** You get a secure link and a ready-written message. Send it from your own inbox: Gmail, Outlook, WhatsApp, or copy it.
  3. **They review and sign.** The other side opens the link in their browser, reviews, and signs. We nudge them at 48 hours and 5 days if needed.
- Closing line: "When both have signed, you each get the signed PDF."
- Microcopy chips: "< 5 min from template to sent" / "0 recipient accounts"
- Step visual alts: (1) "Form fields for party names, purpose and effective date beside a live NDA preview." (2) "A share menu with Gmail, Outlook, WhatsApp and copy-link options over a pre-written message." (3) "The receiver's browser showing the NDA with a Sign button and no login screen."
- Aria label for the steps list: "How FormalizeIt works, three steps"
- Framing: sending from your own inbox is a benefit ("it arrives from someone they know"), not a limitation.

### 5. Trust and evidence
- H2: Signed, with the proof attached.
- Sub: Every signed NDA keeps a record of who signed, when, and exactly what they signed.
- Evidence list:
  - Who: the signer's email
  - When: date and time of signing
  - Where: the signer's IP address
  - What: the exact NDA version signed
  - Fingerprint: a SHA-256 hash of the signed PDF
- Support line: "Signers also confirm they're authorized to sign for their company before the Sign button unlocks."
- Storage line: "Signed NDAs are kept for 5 years from signing, with notice before anything is deleted."
- Visual alt: "An evidence record listing signer email, timestamp, IP address, NDA version v1.0 and a short agreement hash."
- Aria label for the evidence block: "Signature evidence recorded for this NDA"
- Compact disclaimer sits under this block.

### 6. Teams
- H2: Everyone moves the deal. One person signs.
- Sub: Teammates draft and send from one shared workspace. Only signers sign for the company.
- Role cards:
  - **Contributor.** Drafts, edits, and sends. Everything except signing.
  - **Signer.** Does all of that, and signs for the company.
  - **Administrator.** Manages the workspace and members. Can also be a signer.
- Closing line: "NDAs belong to the company, not one inbox."
- Aria label for the roles group: "Team roles"

### 7. Pricing
- Render `<PricingSection />` unchanged. Anchor id `pricing`. No copy changes; in beta it already shows "Coming soon" for paid plans.

### 8. FAQ
- H2: Quick answers
- Sub: The full list is on the FAQ page.
- Items: `faqs[1]`, `faqs[6]`, `faqs[9]`, `faqs[12]`, in that order.
- Link label: "See all questions" (-> /faq)
- None of these four have beta overrides.

### 9. Final CTA
- H2: Your next NDA can be done before the meeting ends.
- Sub: Fill in the deal, send the link, get it signed.
- Primary CTA: "Send your NDA now" (SignupButton; routes to request access while sign-up is closed)
- Secondary CTA: "Read the standard NDA"
- Microcopy: "Free during the beta. The other side never needs an account."
- Disclaimer line directly below (section 5).

---

## 3. Hero alternates

### A. Speed (default)
- H1: NDA in minutes. (3 words, tagline verbatim)
- Sub: Start from the standard NDA, fill in what's different, and send.
- Primary CTA: Send your NDA now
- Secondary CTA: Read the standard NDA

### B. The standard
- H1: One fair NDA everyone recognizes. (6 words)
- Sub: Same balanced text every deal. Fill in the details, send it, and skip the redlines. NDA in minutes.
- Primary CTA: Send your NDA now
- Secondary CTA: Read the standard NDA

### C. Story
- H1: From draft to signed, in minutes. (6 words)
- Sub: Fill in the deal, send a link, and watch it turn Signed. No account for the other side.
- Primary CTA: Send your NDA now
- Secondary CTA: See how it works (anchors to section 4)
- Visual: the demo script below, the status pill going Draft, Sent, Signed.

---

## 4. Demo script (all fictional)

**Deal values** (match template fields):
- Party A (sender): Northwind Robotics, 410 Harbor Street, Rotterdam
- Party A signatory: Dana Whitfield, Head of Partnerships
- Party B (receiver): Halden Bio, 22 Quay Road, Dublin
- Party B signatory: Ola Brandt, COO
- Purpose: "Evaluating a joint pilot for lab automation"
- Effective date: "July 12, 2026"
- Term: "2 years"
- Governing law: "Delaware"
- Receiver email: ola@haldenbio.example (`.example` is a reserved domain)
- NDA title: "Northwind Robotics x Halden Bio NDA"
- Typing order for the fill animation: Party A, Party B, Purpose, Effective date, Term, Governing law.

**Share message** (mirrors `send-for-review`; link shortened):
- Subject: `Northwind Robotics sent you an NDA to review — Northwind Robotics x Halden Bio NDA`
- Body:

```
Hi,

Northwind Robotics has sent you a Non-Disclosure Agreement to review and sign.

You can open and review the document here:
formalizeit.com/fillndahtml-public/...

The link stays active while the NDA is in progress and expires after 14 days of inactivity. No account is needed.

Best regards,
Northwind Robotics
```

- Optional note shown above "Best regards" when the sender adds one: "Note from Northwind Robotics: Happy to start whenever you're ready."
- Share menu labels: Gmail, Outlook, Email app, WhatsApp, Copy link

**Status labels** (as `getWorkflowStatusInfo` returns them):
- Sender view: `Draft` (neutral) -> `Sent` (progress) -> `Waiting on them` (progress) -> `Complete` (done). The dashboard also shows `Signed` (done) for status signed; either works as the last beat.
- Receiver view beats: `Your turn: review` (action) -> `Your turn: sign` (action).
- Simplest 3-beat loop for hero C: `Draft` -> `Sent` -> `Complete`.
- Mockup-only toast (not an app label): "Reminder sent to Halden Bio" at the 48-hour mark.

**Evidence block** (Geist Mono values, Ink & Seal EvidenceBlock):

```
Signer       ola@haldenbio.example
Signed       2026-07-14 09:32 UTC
IP address   203.0.113.24
NDA version  Standard Mutual NDA v1.0
Hash         SHA-256  9f2c4e1a...b7d03a
Authority    Confirmed: authorized to sign for Halden Bio
```

- Always shorten the hash with an ellipsis; never show a full fake hash.
- Label the mockup "Sample" in its caption so it is not read as a real record.

**Old-way items**: keep the existing five.

---

## 5. Disclaimer line

Compact, under the final CTA and under the evidence block (`LegalDisclaimer variant="compact"`):

> FormalizeIt is not a law firm and does not provide legal advice.

Optional second sentence, final-CTA placement only:

> For unusual or high-stakes deals, talk to a qualified lawyer.

---

## 6. Wording rules for implementers
- Allowed: "legally ready", "signature evidence", "recorded", "fingerprint". Banned: "legally binding", "enforceable", "lawyer-approved", "court-proof", "tamper-proof", "bank-grade".
- "Secure link" is fine (unique tokenized link). Do not claim "encrypted" in landing body copy; the FAQ answer carries it.
- Sentence case, no eyebrows, no emoji, no uppercase labels. Mono only for dates, hashes, version, IP.
- No prices outside `PricingSection`.
- Beta microcopy ("Free beta") appears in sections 1, 4 and 9; revisit when `PRIVATE_BETA` or `PAID_PLANS_ENABLED` flips.
- Formi sync: no new feature or route. If Formi's "where things are" mentions the About page, update it for the /about redirect.
