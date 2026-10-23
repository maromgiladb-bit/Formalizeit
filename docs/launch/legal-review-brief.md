# Legal review brief: FormalizeIt

## What the product is
FormalizeIt (formalizeit.com) is a web service that lets a company send a **single, fixed mutual NDA** to a counterparty in minutes. The legal text is identical for every deal and is not editable by users. Users only fill in deal variables (party names and contact details, effective date, purpose, term, governing law, notice details) plus one optional open clause. The counterparty reviews, can suggest changes to the variables, and both sides sign electronically. No account is needed for the receiver.

The operator is an individual founder based in Israel (the Terms choose Israeli law and the Tel Aviv courts). Customers and counterparties may be anywhere. We are launching as a beta.

Workflow: draft, sent, signed. Each executed NDA records signer email, timestamp, IP address, the exact version of the standard NDA signed, and a SHA-256 fingerprint of the signed PDF. Before signing, the signer ticks an "authority to sign" checkbox stating they may sign in the company's name.

## What we need reviewed
All seven pages are founder-drafted and need review before we scale or remove the beta framing. Each is live on the site at the path shown.

| Page | Path | Main concern |
|---|---|---|
| Standard NDA | /standard-nda | The contract itself: enforceability, balance, clarity, the governing-law clause |
| Terms of Service | /terms | Liability limits, subscription and refund terms, governing law and venue |
| Privacy Policy | /privacy | Accuracy and completeness: providers, EU hosting, retention, deletion |
| Electronic Signature Consent | /esignature-consent | Validity of the electronic signature approach |
| NDA Governance Policy | /nda-governance | How the standard NDA is maintained and changed |
| NDA Changelog | /nda-changelog | Whether version history is presented properly |
| Compliance and Security | /compliance, /security | We removed unsupported claims (SOC 2, ISO 27001); please check what remains is safe to say |

## Questions we most want answered
1. **Electronic signatures.** Is our signing flow (typed or drawn signature, authority checkbox, recorded evidence) likely to be treated as a valid electronic signature for commercial NDAs in Israel, the US and the EU? Is the consent page enough, or do we need more?
2. **Governing law in the NDA.** The NDA template inserts a "governing law" variable written as "the laws of the State of ...", which reads US-style, while our own Terms use Israeli law. Is the wording right for a product used internationally? Should the user choose from a fixed list of options?
3. **Unauthorized practice of law.** We state on the fill, review and sign pages that FormalizeIt is not a law firm and gives no legal advice. Is that wording and placement enough for a tool that supplies the contract text?
4. **Authority to sign.** The signer affirms authority to sign for their company. Does this adequately put responsibility on the company, and is the wording ("legally binds that company") correct?
5. **Privacy.** We process personal data of users and counterparties. Core infrastructure is in the EU (Frankfurt); some providers process in the US. What do we need beyond the policy: for example registration of databases in Israel, data processing agreements with providers, or a cookie notice? Is a data protection representative needed for EU users?
6. **Retention.** Signed NDAs are kept at least five years from execution, with advance notice before deletion, and account profiles are anonymized 30 days after deletion. Is that consistent with the policy wording and with deletion rights?
7. **Terms.** Are the limitation of liability, disclaimer, subscription and cancellation terms enforceable and fair for consumers and businesses, in particular for automatic renewal?
8. **Beta launch.** What disclaimers or framing do we need while in beta, and what must change before we drop it?

## Service providers (also listed in the Privacy Policy)
Clerk (sign-in), Stripe (payments, not yet live), AWS S3 (signed PDFs, Frankfurt), Neon (database, Frankfurt), Vercel (hosting and cookie-free analytics, Frankfurt), Resend (transactional email), Sentry (error monitoring, EU, IP storage disabled), ImprovMX (forwarding of support email).

## Plans
Free (3 NDAs), Pro and Team (paid, not yet on sale). Receivers are always free.

## What we are asking for
A written review of the seven pages with suggested edits, answers to the questions above, and an estimate of time and cost. Please flag anything that should block a public beta launch separately from improvements that can follow.
