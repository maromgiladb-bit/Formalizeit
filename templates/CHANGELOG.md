# Template Changelog

This file tracks all changes made to NDA templates.

## Format
```
## [Template ID] Version X.Y - YYYY-MM-DD
### Added
- New features or sections
### Changed
- Modifications to existing content
### Removed
- Deleted content or sections
### Fixed
- Bug fixes or corrections
```

> **Note:** The plain-language changelog shown to users lives in
> `src/lib/ndaChangelog.ts` (`NDA_CHANGELOG`) and powers both the public
> `/nda-changelog` page and the in-app "review the updated NDA" popup. Keep that
> file, `templates/template-config.json` (the shipped version), and this file in
> sync whenever the standard NDA changes.

---

## [professional_mutual_nda_v1] Version 1.0 - 2025-11-10

The current shipped standard NDA (see `templates/template-config.json`).

### Added
- Mutual confidentiality obligations for both parties
- Definition of and exclusions from confidential information
- Term, return-of-materials, and post-termination survival clauses
- Governing law, notices, and dual signature blocks
- Professional design: bold underlined headings, numbered section badges, modern typography

---

## [mutual-nda-v1] Version 1.0 - 2025-10-25

### Added
- Classic mutual NDA format - Original DOCX template conversion
- 15 essential sections covering core NDA requirements
- Definition of Confidential Information
- Exclusions from Confidential Information (5 standard exceptions)
- Obligations of Receiving Party
- Return of Materials clause
- No Obligation provision
- No Warranty disclaimer
- Ownership of information
- Term and Termination (with post-termination survival)
- Remedies including equitable relief
- Governing Law provisions
- Entire Agreement and Amendment clauses
- Notices section with contact table
- Severability and Counterparts
- Signature blocks for both parties

### Features
- Clean, straightforward language
- Standard business NDA structure
- Professional Calibri font styling
- A4 page size with 2.54cm margins
- Justified text alignment
- Contact information table in Notices section
- Conditional display for optional fields (email, phone, title)
- 3-year confidentiality survival period

### Field Support
- Required: effective_date, party_a_name, party_a_address, party_a_title, party_b_name, party_b_address, party_b_email, party_b_title, docName, term_months, governing_law
- Optional: party_a_email, party_a_phone, party_b_phone, party_a_signatory_name, party_b_signatory_name

---

## [mutual-nda-v3] Version 3.0 - 2025-10-30

### Added
- Complete 15-section professional mutual NDA
- Comprehensive confidentiality provisions
- Detailed exclusions section
- Ownership of rights clause
- Liability and counterparts sections
- Contact information table with phone/email fields
- Professional signature blocks for both parties
- Governing law and jurisdiction provisions
- Notice requirements section
- Term and non-third party rights sections

### Features
- Conditional phone number fields (displays blank if not provided)
- Conditional email fields for Party A
- Support for `{{docName}}` in Section 1
- Professional table-based layout for contact information
- Numbered sections (1-15)
- Calibri font with justified text alignment
- A4 page size with 2.54cm margins

### Field Support
- Required: effective_date, party_a_name, party_a_address, party_a_title, party_b_name, party_b_address, party_b_email, party_b_title, docName, term_months, governing_law
- Optional: party_a_email, party_a_phone, party_b_phone, party_a_signatory_name, party_b_signatory_name, confidentiality_period_months, ip_ownership, non_solicit, exclusivity

---

## [one-way-nda-v1] Version 1.0 - 2025-10-30

### Added
- Simple one-way NDA template
- Clear disclosing party vs receiving party distinction
- Purpose-focused language
- Simplified 5-section structure
- Modern visual design with party info boxes
- Professional signature section

### Features
- Background color boxes for party information
- Left border accent on party info sections
- Conditional email display for Party A
- Arial font for clean, modern look
- Increased line spacing (1.6) for readability

### Field Support
- Required: effective_date, party_a_name, party_a_address, party_b_name, party_b_address, party_b_email, docName, term_months, governing_law
- Optional: party_a_email, party_a_title, party_b_title, party_a_signatory_name, party_b_signatory_name

---

## Template Version History

### Version Numbering Scheme
- **Major version (X.0)**: Significant structural changes, new sections, legal content changes
- **Minor version (X.Y)**: Styling updates, field additions, formatting improvements
- **Patch version (X.Y.Z)**: Bug fixes, typo corrections, minor tweaks

### Upcoming Changes
- [ ] Add party_a_phone and party_b_phone to all templates
- [ ] Create abbreviated "quick NDA" version
- [ ] Add multilingual support
- [ ] Create industry-specific templates (tech, healthcare, finance)

---

## Notes for Template Editors

### When to Create a New Version
- **New major version**: When changing legal language, adding/removing sections, changing agreement structure
- **New minor version**: When adding optional fields, improving styling, updating layouts
- **Keep old version**: Always keep previous versions with `isActive: true` for existing drafts

### How to Document Changes
1. Add entry to this CHANGELOG.md
2. Update version in template-config.json
3. Update templateFile name if creating new version (e.g., mutual-nda-v4.hbs)
4. Note any breaking changes clearly
5. List all new fields added

### Testing Checklist
- [ ] Template renders without errors
- [ ] All placeholders replaced correctly
- [ ] PDF generation works
- [ ] Signature blocks display properly
- [ ] Tables and formatting look correct
- [ ] Conditional sections work as expected
- [ ] Email delivery includes correct attachment

---

## Breaking Changes Log

### None yet
All current templates are initial versions.

---

## Field Name Standards

To maintain consistency across templates, use these standard field names:

**Party Information:**
- `party_a_name`, `party_b_name` - Full legal names
- `party_a_address`, `party_b_address` - Complete addresses
- `party_a_email`, `party_b_email` - Contact emails
- `party_a_phone`, `party_b_phone` - Contact phone numbers
- `party_a_title`, `party_b_title` - Titles or company names
- `party_a_signatory_name`, `party_b_signatory_name` - Names of signers

**Agreement Details:**
- `effective_date` - When agreement becomes effective
- `docName` - Purpose/topic of the NDA
- `term_months` - Duration of agreement
- `confidentiality_period_months` - How long info stays confidential
- `governing_law` - Jurisdiction

**Optional Clauses:**
- `ip_ownership` - Intellectual property terms
- `non_solicit` - Non-solicitation provisions
- `exclusivity` - Exclusivity terms

**Flags:**
- `party_a_ask_receiver_fill` - Party A details to be filled by receiver
- `party_b_ask_receiver_fill` - Party B details to be filled by receiver
