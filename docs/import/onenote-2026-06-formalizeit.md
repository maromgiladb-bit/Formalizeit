# OneNote notebook "260620 Formalizeit" (imported 2026-11-21)

Founders' early notes (Gilad and Nir), copied from OneNote for the web, section "Quick Notes".
Pages started around 19 June 2026. Kept as-is for reference; some points were later decided
differently (see `docs/strategy-gap-checklist.md` and CLAUDE.md). The gap review against the
code is T-079 in `docs/TICKETS.md`, which links the follow-up tickets.

Pages: [Strategy](#page-1-strategy) · [Website messages](#page-2-website-messages) ·
[Q&A](#page-3-qa) · [Legalities](#page-4-legalities) · [Website disclaimer](#page-5-website-disclaimer) ·
[Website user agreement](#page-6-website-user-agreement) · [Decisions](#page-7-decisions) ·
[To Dos](#page-8-to-dos)

---

## Page 1: Strategy

Standard NDA Platform

Product Concept & Launch Plan

### Executive Summary

The Standard NDA Platform is a SaaS service that simplifies the creation, execution, and management of Non-Disclosure Agreements (NDAs) by using a single standardized mutual NDA that remains legally identical across all transactions.

Rather than negotiating or reviewing a new NDA for every business relationship, users review and approve the Standard NDA once and then only provide deal-specific information for future agreements.

The platform's objective is to reduce legal friction, accelerate business conversations, and create a trusted standard for confidential business discussions.

### Problem

NDAs are among the most common legal documents used in business.

Despite their simplicity, organizations repeatedly spend time:

- Sending NDA templates
- Reviewing unfamiliar legal language
- Negotiating minor wording changes
- Managing signatures
- Tracking executed agreements
- Storing and retrieving documents

For startups, investors, consultants, agencies, advisors, and business development teams, the administrative burden often exceeds the actual value of the legal review. The average NDA takes days to execute.

### Solution

The platform provides a single standardized Mutual NDA.

The legal text remains fixed and cannot be modified through the platform.

For each new agreement, users only complete deal-specific variables such as:

- Party names
- Contact information
- Effective date
- Purpose of disclosure
- Term of NDA
- Governing law
- Notice information (Nir: TBD if same as contact)

All other legal language remains unchanged.

This creates a repeatable and predictable process for both parties.

### Core Product Principles

**1. One NDA Standard**

- The platform maintains a single Standard Mutual NDA.
- Users cannot edit legal clauses (but one open clause can be filled in)
- Users may only complete approved variables. (but one open clause can be filled in)

**2. Transparency**

- The complete NDA text is viewable for signed users and NDA acceptors.
- Version history is available.
- Users can review the legal language before accepting.

**3. No Legal Advice**

- The platform is not a law firm.
- The platform does not provide legal advice.
- The platform provides workflow and document management tools.
- Ensure this language appears prominently in the UI itself (not just in Terms of Service)

**4. Simplicity**

- No redlining.
- No clause negotiation.
- No contract drafting.
- If parties require custom legal terms, they must execute a separate agreement outside the platform. (in the future, we may allow them to upload such NDAs to be managed by the platform)
- One open clause for additions. we should say this is not the general use and should be added only where really needed.

### User Experience

**First-Time User**

1. Create account
2. Can review Standard NDA
3. Accept platform terms
4. Begin sending or receiving NDAs

**Sending an NDA**

1. Enter/review and edit your information
2. Enter counterparty information
3. Enter deal-specific variables
4. Send NDA request
5. Counterparty reviews and accepts or sends revisions
6. Review loop until all is accepted
7. Agreement is executed and stored
8. platform provides status 'pending / opened / signed' in real time

Platform allows NDA management - see all, alerts etc

**Receiving an NDA**

1. Receive invitation
2. Review NDA
3. Allow free account signup
4. Accept or decline or make changes NDA
5. Download and Access (if signed up) executed copy
6. Platform sends automatic reminders after 48h and 5 days

Above can be done with sign-in or as guest (Allow email-based one-click acceptance for receivers, with optional account creation afterward.)

### User Roles

**Receiver (Free)**

Features:

- Receive NDA requests
- Review NDA
- Accept or decline NDAs
- Access signed agreements
- Download executed agreements

No payment required.

**Sender (Free Tier)**

Features:

- Generate a limited number of NDAs (see pricing)
- Manage counterparties
- Basic dashboard
- Basic document storage

Purpose: Allow users to experience the platform before upgrading.

**Sender (Paid)**

Features:

- Unlimited NDA generation
- Advanced dashboard
- Search
- Reminders
- Expiry tracking
- Team collaboration
- API access
- Extended document retention

Future TBD:

> Reviewer note: Good feature set for paid tier. Two additions worth considering: (1) Audit log export — enterprise buyers require this for legal discovery and compliance; (2) Webhook/Zapier integration — power users will want NDAs to trigger actions in their CRM (e.g., HubSpot deal creation). These are relatively low-effort features with high perceived value for the B2B segment.

### Signature Model

The platform uses electronic acceptance.

Users confirm:

- Their identity
- Their authority to bind themselves or their organization (Genuine checkbox) Need to add to Terms of service
- Their acceptance of the agreement

The platform records:

- Email address
- Timestamp
- IP address
- Document version
- Agreement hash

These records provide evidence of execution and document integrity.

### Jurisdiction Model

Users select the governing law applicable to their agreement.

The platform does not recommend, validate, or guarantee the suitability of any jurisdiction selected by the parties.

Responsibility for legal appropriateness remains with the users.

### User tiers

- Guest: No sign up at all - except email (does this make sense? We need his email anyway for him to get a copy?)
- Free account
- Paid account: Different plans see pricing section

### User roles

- Contributor: Can only fill and send
- Signer: The person signing
- Administrator: Account owner in multi signer accounts
- Legal approver/filler of details: TBD, maybe future - corporate legal

### Data Retention

**Guest Users**

Executed agreements sent by email. Retained for five (5) years (based on his email) from execution date if the guest wants to sign up.

**Free Users**

Executed agreements retained for five (5) years from execution date.

Users receive advance notice before any deletion.

**Paid Users**

Executed agreements retained indefinitely while subscription remains active.

Following subscription termination, agreements become subject to the free user (5 year) grace period.

### Security requirements

- Two factor authorization for sign in
- How do we protect data on our servers?
- How do we protect the website

### Revenue Model & Pricing

**Paid Productivity Layer**

Organizations pay for:

The business monetizes productivity rather than document access.

**Pricing**

**Free**

Receiver (can be without account) unlimited

Anyone can receive, review, and accept NDAs without payment. This minimizes friction and encourages adoption.

- Receive NDA requests
- Review NDA
- Sign NDA
- Access signed NDAs (only with account)
- Download copies

Sender

- Create account
- Send up to 3 NDAs total
- Basic dashboard
- Basic counterparty management

The goal is to let someone experience the "send NDA in 30 seconds" magic before asking for money.

**Pro ($9/month)**

- One user
- Unlimited NDA generation
- NDA dashboard
- Search
- Counterparty directory
- Reminders
- Expiry tracking
- Custom branding
- Export history
- Audit trail
- Workflow management
- Search
- Team features
- Analytics
- API access
- Long-term storage
- Can add custom NDAs created outside the platform to help them manage it. With AI support to notifications and other data for the dashboard. Non MVP

Target:

- Consultants
- Freelancers
- Agencies
- Startup founders
- Advisors

**Team ($50/month)**

Same as Pro. Plus:

- Multiple users (up to 10)
- Shared workspace
- Team dashboard
- Centralized NDA repository
- Role-based permissions
- Analytics
- API access
- Multiple roles (Signer, Admin & legal - TBD if here or in enterprise)

Target:

- VC firms
- Accelerators
- SMBs
- Corporate innovation teams

**Enterprise (not for now)**

- SSO
- Legal approval workflow
- Private NDA standard
- Compliance requirements
- CRM integrations
- Custom API

### Competitive Advantages

- **Standardization:** One legal text across all transactions.
- **Speed:** Agreements can be created and executed within minutes.
- **Lower Legal Friction:** Reduced need for repeated legal review.
- **Centralized Management:** All NDAs stored and searchable in one location.
- **Network Effects:** As more organizations become familiar with the Standard NDA, acceptance rates may increase and execution times may decrease.

### Legal Framework Required Before Launch

1. Website Disclaimer
2. Terms of Service
3. Privacy Policy
4. Electronic Signature Consent
5. Standard NDA
6. NDA Governance Policy
7. NDA Changelog' page - a human-readable summary of any changes made to the Standard NDA over time (even if the full version history is already available). This builds trust with repeat users and legal reviewers who want to quickly understand what, if anything, has changed since they last reviewed the document.

All documents should be reviewed by qualified legal counsel before launch.

### Recommended Next Steps

**Phase 1 – Legal Foundation**

- Engage legal counsel
- Draft Standard NDA
- Draft platform legal documents
- Define NDA versioning process

> Reviewer note: Before engaging legal counsel, consider conducting 10 interviews with startup lawyers and in-house counsel at VC-backed companies. Their objections to the Standard NDA text will be the most valuable product feedback you can gather at this stage — and addressing those objections in the NDA itself will dramatically improve adoption rates at launch.

**Phase 2 – Product Design**

- User onboarding
- NDA creation flow
- Acceptance workflow
- Dashboard design
- Retention and storage policies

> Reviewer note: Add 'Receiver frictionless sign flow' and 'Reminder/notification system' explicitly to this phase. Both are high-impact UX items that are easy to deprioritize during design but costly to retrofit after launch.

**Phase 3 – MVP Development**

- Authentication
- NDA generation
- Acceptance flow
- Audit logging
- Document storage
- Basic dashboard

> Reviewer note: Add 2FA and email-based signing (no-account-required for receivers) to the MVP scope. These are not nice-to-haves — they directly affect conversion rates and legal defensibility from day one.

**Phase 4 – Beta Launch**

Collect feedback on:

- Founders
- Investors
- Consultants
- Agencies
- Startup operators

Collect feedback on:

- Acceptance rates
- Time-to-sign
- Objections
- Feature requests

> Reviewer note: Excellent target list. One addition: YC/Techstars alumni networks and law firm startup practices (e.g., Cooley, Orrick) are high-leverage beta channels. A single endorsement from a recognizable startup law firm would have outsized impact on adoption.

**Phase 5 – Commercial Launch**

- Paid sender plans
- Team accounts
- API access
- Growth partnerships
- Legal and compliance expansion

> Reviewer note: Define success metrics for commercial launch before beginning Phase 3. Suggested KPIs: time-to-sign (target: under 10 minutes), counterparty acceptance rate (target: >80%), monthly active senders, and free-to-paid conversion rate (benchmark: 2–5% for B2B freemium). Without pre-defined targets, it is difficult to know when the product is ready to scale.

---

## Page 2: Website messages

### Rational/Top explanations

Option 1: NDAs are repetitive, low-value-to-negotiate, but still create friction and waste time.

Option 2: Stop re-reading NDAs. Approve one fair NDA once, then reuse it safely for every deal

### Other Marketing messages

- One NDA. One legal text. Infinite deals
- Review once, reuse forever
- Trust infrastructure (when a counterparty recognizes this platform's NDA, they sign faster because they already trust the standard)
- when someone sends you an NDA from this platform, you know exactly what you're signing.
- A basis for a frictionless relationship instead of legalities
- 5 min per NDA. No legal fees, no back and forth
- Work on what is important not on the standard legalities
- A standard, fair, pre-vetted NDA workflow.
- A single balanced mutual NDA that both sides can trust
- Balanced for both sides
- Template is fair, lawyer-vetted, and widely acceptable. (important for people to believe)
- Website is secure
- No one has to read a new NDA every time

### High level Explanation

Option 1:

- Read the trusted template once
- From now on - Fill in only deal specific details
- Collaborate sign and share easily

Option 2:

- Read and approve one balanced NDA standard once.
- After that, generate, send, sign, and manage deal-specific NDAs without re-reviewing the legal boilerplate.

### Detailed features

Key features that make it compelling:

- **One-time legal review:** Users or their lawyers approve the standard template once.
- **Locked boilerplate:** The legal terms stay fixed, so users only fill in variable fields: parties, purpose, term, jurisdiction, effective date, etc.
- **Fair by design:** Not "pro-discloser" or "pro-recipient," but balanced.
- **Fast counterparty acceptance:** The other side sees it is standard, short, balanced, and not customized to sneak in weird terms.
- **NDA dashboard:** Track sent, signed, expired, pending, counterparties, deal purpose, renewal dates.
- **Audit trail and e-signing:** This matters a lot if you want it to feel serious.

### Tagline

- Option 1: Review once, Reuse forever
- Option 2: One NDA. One legal text. Infinite deals

---

## Page 3: Q&A

**Q: Do I need Legal advice**

A: We suggest you get one. But by using our platform it should make it easier for your advisor as well

**Q: Why only mutual**

A: Discussions often evolve. What starts as "I'll tell you about my company." quickly becomes "We'll tell each other about our products, roadmap, pricing, customers, technology, and business plans."

At that point, both parties are disclosing confidential information.

As a result, mutual NDAs are often:

- Easier to negotiate
- Viewed as fairer
- Accepted faster
- More future-proof

**Q: What should I do if I need to make changes?**

A: The Standard NDA is designed to be fair to both sides. If this NDA does not meet your needs, you are free to use a separate agreement.

(The 'no custom terms' rule is the right product decision, but it will generate the most friction from users).

---

## Page 4: Legalities

Legalities thoughts:

- LLC/c-corp vs not. (pass through tax, limited liability)
- Israel vs us (and us as US citizens)
- Easy to open a delawre LLC. But can be double tax. Especially as Gilad is in Israel
- Stripe can help build LLC
- Stripe Atlas LLC

Needed documents on website:

**1. Website Legal Disclaimer (see separate page)**

A concise disclaimer displayed:

- In the footer
- On the NDA creation page
- During signup

Purpose:

- Not legal advice
- No attorney-client relationship
- User responsibility
- Recommendation to seek legal counsel

**2. Terms of Service (see separate page)**

The contract between you and users.

Sections typically include:

- Eligibility
- Account creation
- Use of the platform
- Document generation
- No legal advice
- Electronic signatures
- Limitation of liability
- Indemnification
- Governing law
- Termination

**3. Privacy Policy**

Especially important because you'll be storing:

- Company names
- Contact information
- NDA contents
- Signature records

**4. Product Positioning Language**

This is surprisingly important.

Bad: Generate legally compliant NDAs instantly.

Better: Create NDAs using a standardized, attorney-reviewed template designed to be fair to both parties.

Bad: Our NDA protects your business.

Better: Our platform helps parties use a standardized NDA format and manage execution workflows.

**5. NDA Template Governance Policy**

This is an internal document that answers:

- Who updates the template?
- How often?
- Which jurisdictions are supported?
- What happens when laws change?
- How are users notified of revisions?

Investors and enterprise customers often ask these questions.

**6. Click-Through Acceptance Flow**

I'd recommend requiring users to explicitly accept:

> I understand that the platform does not provide legal advice and that I am responsible for determining whether the NDA is appropriate for my use.

during signup and before sending the first NDA.

---

## Page 5: Website disclaimer

WEBSITE LEGAL DISCLAIMER

Last Updated: [DATE]

Formalizeit helps you generate and manage NDAs but is not a law firm and does not provide legal advice

The information, documents, forms, and services provided through [Formalizeit] (the "Platform") are offered for general informational and administrative purposes only.

### No Legal Advice

[Formalizeit], its affiliates, owners, employees, contractors, and representatives are not a law firm and do not provide legal advice, legal representation, legal opinions, or legal services.

Nothing on the Platform, including the Standard Mutual Non-Disclosure Agreement ("Standard NDA"), explanatory materials, FAQs, guides, workflows, recommendations, templates, automated suggestions, interface prompts, and pre-filled fields or communications, should be interpreted as legal advice or a recommendation regarding any specific legal matter.

Users are solely responsible for determining whether the Standard NDA and any selected terms, including governing law and jurisdiction, are appropriate for their circumstances.

Users should consult qualified legal counsel regarding their specific legal needs.

### No Attorney-Client Relationship

Use of the Platform does not create an attorney-client relationship between any user and [Formalizeit], its affiliates, owners, employees, contractors, or representatives. This applies regardless of the nature of any question submitted through the Platform.

No communication with the Platform shall be deemed privileged attorney-client communication.

### Standardized Agreement

The Platform provides access to a standardized mutual non-disclosure agreement intended to facilitate confidential business discussions and information exchanges for general commercial confidentiality purposes.

The Platform does not negotiate, customize, review, or provide legal guidance regarding the suitability of the Standard NDA for any particular transaction, relationship, jurisdiction, industry, or legal requirement.

Parties remain responsible for reviewing the agreement and deciding whether to enter into it.

> Reviewer note: Good. The phrase "intended to facilitate confidential business discussions" accurately scopes the NDA's purpose but may be too narrow. Many NDAs also cover IP protection, employment pre-discussions, M&A due diligence, and investor conversations. Consider broadening to "intended to facilitate confidential business discussions and information exchanges" or simply "general commercial confidentiality purposes." This avoids a scenario where a party argues the NDA was unsuitable because their use case was not covered by the stated intent.

### Jurisdiction Selection

Where the Platform permits users to specify governing law, jurisdiction, or dispute resolution provisions, such selections are made solely by the users.

The Platform does not verify, validate, recommend, or warrant the suitability, enforceability, or legal effect of any jurisdiction selected by the parties. Users are solely responsible for ensuring that their selected jurisdiction is legally permissible and appropriate under applicable law, including any mandatory consumer protection or local law requirements that may override a contractual choice of law.

> Reviewer note: This section is legally sound but could go further to protect the platform. Consider adding: "Users are solely responsible for ensuring that their selected jurisdiction is legally permissible and appropriate under applicable law, including any mandatory consumer protection or local law requirements that may override a contractual choice of law." This is particularly relevant for Israeli users (where the platform is based) contracting with EU counterparties, where GDPR and local mandatory law may override a chosen jurisdiction regardless of what the parties select.

### No Warranty

THE PLATFORM, THE STANDARD NDA, AND ALL RELATED SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE."

TO THE MAXIMUM EXTENT PERMITTED BY LAW, [FORMALIZEIT] DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, LEGAL VALIDITY, ENFORCEABILITY, OR LEGAL SUITABILITY.

> Reviewer note: Standard and appropriate. The all-caps formatting is the legally conventional way to ensure warranty disclaimers are "conspicuous" under US law (particularly UCC standards), so this is correct. Two notes: (1) "TO THE MAXIMUM EXTENT PERMITTED BY LAW" is crucial phrasing — some jurisdictions (including Israel under the Standard Contracts Law, 1982) restrict blanket warranty exclusions in standard-form consumer contracts. If the platform targets businesses only (B2B), this risk is lower, but if individual users are anticipated, local legal counsel should review this clause specifically. (2) Consider adding "LEGAL VALIDITY" alongside "ENFORCEABILITY" as a disclaimed warranty, as these are legally distinct concepts.

### Limitation of Responsibility

Users acknowledge that the creation, execution, storage, and management of agreements involve legal and business risks.

[Formalizeit] shall not be responsible for any loss, claim, dispute, liability, damage, or expense arising from:

- Use of the Platform;
- Reliance on the Standard NDA;
- Selection of governing law or jurisdiction;
- Failure of a party to comply with an agreement;
- Enforceability of any agreement;
- Data breaches or unauthorized access to stored agreements;
- Third-party service failures;
- Business decisions made by users.

In no event shall [Formalizeit]'s total liability exceed the fees paid by the user in the preceding 12 months

> Reviewer note: The exclusion list is solid but has two notable gaps: (1) "Data breaches or unauthorized access to stored agreements" — the platform will hold sensitive executed legal documents, and liability for data security incidents should be explicitly addressed here or in a separate Security section; (2) "Third-party service failures" — if the platform relies on external services for e-signature, storage, or delivery, outages or failures by those providers should be carved out. Both omissions are common sources of user claims against SaaS legal platforms. Additionally, consider whether a monetary liability cap clause belongs here (e.g., "In no event shall [PLATFORM NAME]'s total liability exceed the fees paid by the user in the preceding 12 months") — this is standard in SaaS Terms of Service and provides a quantified ceiling that courts are more likely to uphold than blanket "no liability" language.

### Acceptance

By accessing or using the Platform, users acknowledge that they have read, understood, and accepted this Disclaimer.

> Reviewer note: The "by accessing or using" acceptance model (browsewrap) is weaker than a clickwrap acceptance and may not be enforceable in all jurisdictions. Courts in the US, EU, and Israel have increasingly required affirmative consent — a checkbox or explicit "I agree" button — for online legal terms to be binding, particularly in B2B SaaS. Strong recommendation: require users to actively check a box confirming they have read this Disclaimer during account creation, and separately at the point of executing each NDA. Record the timestamp and document version at each acceptance event. This transforms browsewrap into clickwrap and substantially strengthens enforceability.

### Overall Assessment

> Overall Reviewer Note: This is a well-structured disclaimer that covers the essential bases for a legal-adjacent SaaS platform. The main areas for strengthening are: (1) moving from browsewrap to clickwrap acceptance; (2) explicitly addressing data security liability; (3) adding a monetary liability cap; (4) reviewing the warranty disclaimer under Israeli Standard Contracts Law if individual consumers are anticipated; and (5) ensuring a qualified Israeli/international technology lawyer reviews the final version before launch, particularly given the platform's cross-jurisdictional nature. The disclaimer should also be cross-referenced with the Terms of Service and Privacy Policy to ensure consistency — contradictions between these documents are a common source of legal exposure for SaaS platforms.

---

## Page 6: Website user agreement

Need to add:

- Their authority to bind themselves or their organization (Genuine checkbox) Need to add to Terms of service

---

## Page 7: Decisions

Add here

- Cancelation options?
- Team member sent an nda- still admin gets the email – right now must sign for party a for good signer catch
- Nda expired in 2 weeks- any action resets? (current) or only status changes?

### If I were building the MVP

I'd do:

- One standard mutual NDA.
- Fixed legal text.
- Deal-specific variables only.
- Free-text governing law field.
- Click-to-accept rather than handwritten signatures.
- Store audit data (timestamp, email, IP, document hash).
- 5-year retention for free users.
- Indefinite retention for paid users while subscribed.

### 4. Own signature flow

Fine, but then you'll need:

- Signature audit logs
- IP address capture
- Timestamping
- Consent records
- Document hash/version tracking

You'll want explicit Electronic Signature Consent language.

### On signatures: do you really need audit logs?

Legally, not necessarily.

Practically, yes.

Think about what happens if there's ever a dispute.

With paper, you have:

- Original document
- Wet signature
- Physical possession
- Sometimes witnesses

With digital signatures, somebody eventually says: "I never signed this."

Now what?

You want to be able to show:

- Email invitation sent to X
- Email opened by X
- User authenticated as X
- Signature performed at timestamp Y
- Document version Z was signed
- Document has not changed since signing

You don't need enterprise-grade infrastructure on day one.

For an MVP, I'd store:

- Email address
- Timestamp
- IP address
- User agent/browser
- NDA version ID
- Document hash

That's probably 90% of the value for 10% of the complexity.

### Another thought

You may not even need a "signature" at first.

Many SaaS agreements are formed by: "I Agree" or "Accept NDA" with a click.

Depending on how the workflow is structured and the jurisdictions involved, a clickwrap acceptance can be easier to implement and often easier to prove than drawing a squiggly signature on a screen.

For your product, I'd seriously consider:

1. User reviews NDA.
2. User checks:
   - I have authority to bind the entity.
   - I agree to the NDA.
3. User clicks "Accept".

Then store:

- identity
- timestamp
- document version
- IP

That's cleaner than trying to imitate pen-and-paper signatures.

### #3 — the claim-cookie binding, explained

**The normal, intended flow**

You send an NDA to a counterparty at email X. The DB creates a Signer row: `{ id: <uuid>, email: X, userId: null }`. `userId: null` means "no account owns this yet."

The counterparty gets an email linking to `/sign-nda-public/<signerId>` and signs.

Afterward they want an account to keep accessing the doc. The page offers a link to `/api/claim?signerId=...`.

`/api/claim` drops the signer id into an httpOnly cookie `pending-claim-signer` and sends them to `/signup`.

They create an account — possibly with a different email Y (e.g. invited at john@work.com, signs up with john@gmail.com).

On first login, `ensureDbUser` → `claimSignerByCookie` runs:

```ts
await prisma.signer.updateMany({
  where: { id: signerId, userId: null },
  data: { userId },
})
```

This binds that Signer (and the NDA access it carries) to the new account — and crucially, it does not check that the signup email matches X.

**Why that last part is deliberate**

That "no email check" is the whole feature. CLAUDE.md explicitly wants: claim-by-token cookie (`/api/claim`) for a different signup email.

So a person whose login email differs from the address you invited can still claim their document. If you required email == X, this feature wouldn't exist.

**So where's the risk?**

The binding is gated on only two things: knowing the signerId, and the signer still being unclaimed. There's no separate secret — the signer id itself is the key. This is called a bearer-token model: whoever holds the token gets access, no identity check.

That means: anyone who obtains a signer id for an unclaimed NDA can bind that NDA into their own account. How might someone other than the intended recipient get the id?

- The original email gets forwarded to someone else.
- The id leaks via a referrer header, browser history, server logs, or analytics (it travels in a URL).
- Someone shoulder-surfs or screenshots the link.

If they then visit `/api/claim?signerId=<that id>` and sign up, the NDA is now in their account.

**The big mitigation (just confirmed)**

The signer id is a `gen_random_uuid()` UUID (schema.prisma:329) — 122 bits of randomness. So it cannot be guessed or enumerated. An attacker can't iterate signerId=1,2,3… to harvest strangers' NDAs. The only way to abuse it is to already possess a specific valid id — which is the same exposure the public signing link already has (anyone holding `/sign-nda-public/<id>` can already sign that NDA). So claim doesn't widen the attack surface beyond what signing already assumes.

**Bottom line**

This is not a separate vulnerability — it's the existing "the link is the credential" model, applied consistently. The realistic action isn't to break the feature; it's to:

- Accept it explicitly as a documented bearer-token design, and
- Make sure the id doesn't leak unnecessarily — e.g. avoid putting it where a third-party referrer would capture it, and keep the 7-day cookie TTL bounded (already done).

So my recommendation for #3: downgrade from blocker to accepted risk, add a short comment in the claim route documenting the bearer-token model, and move on. The UUID is what makes it safe enough.

Want me to (a) add that documenting comment for #3, and (b) implement the login-OR-signer-token fix you chose for #2?

---

## Page 8: To Dos

### Nir

- Accessibility law
- Share onenote
- Add pricing to strategy paper
- "Accept terms" where and what to accept

### Add to strategy

- Can paid customers add custom NDAs created outside the platform to help them manage it - Yes. With AI support to notifications and other data for the dashboard. Non MVP
- Governing law - open text (not drop down, as it looks like we approve/support legal structure of all these countries)
- 5-year retention for free users.
- Notice information (Nir: TBD if same as contact)

### Add to Terms of Service

- Their authority to bind themselves or their organization (Genuine checkbox) Need to add to Terms of service

### Gilad

- Add to MD- In progress
- Review strategy paper- with claude
- Review pricing – changed as in Pricing page
- "Accept terms" (but wait for Nir to check where it is needed - in signup and maybe each NDA)
- Governing law - open text (not drop down, as it looks like we approve/support legal structure of all these countries)
- 5-year retention for free users.
- Received 5 NDAs from different senders then created an account. Where will the NDAs show? How to manage receiver moves to be subscriber---- going towards- "want easy access? Create a free user to view all your NDA's" as I cant figure a way.
- Read signature thing in decisions
- Team invite pending- show as a pop up
- Team member sent an nda- still admin gets the email – right now must sign for party a for good signer catch
- PDF view from dashboard
- Cancel option- no but make expired after 2 weeks –for each status change add hard experation- 30 days- make sure renew works
- Company email for contact and support
- Version updates and updates on changes
- "not a legal firm" disclaimers
- (in the future, we may allow them to upload such NDAs to be managed by the platform)
- Change owner to administrator
- During sign up, add a feature that sends template to legal advisor for his approval (from dashboard)– as a site link
- \+ add viewer link to share (Team only?) Post MVP
- Future - referral program, and specific referral program for lawyers
- Security
- Cancelation of a plan- UI improve
- Add- invite new members suggestions
- Database- finalize and check tables with audit
- Add "more" on the shrunk toolbar
- Cron check on vercel
- About pages rephrase
- Homepage content
- FAQ
- Stripe invoices- add formalizeIt logo?
- Data saved correctly + NDAs accessible
- Security
- Audit log
- Agent - legal
